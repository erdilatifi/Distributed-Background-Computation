"""
FastAPI application with Supabase integration, authentication, and WebSocket support.
This is the updated main.py with all improvements integrated.
"""
import uuid
from typing import Optional, List
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, status, WebSocket, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from . import schemas, tasks
from .config import get_settings
from .auth import get_current_user, get_current_active_user, check_job_quota, optional_auth
from .supabase_client import (
    get_supabase_service_client,
    get_cached_result,
    save_to_cache,
    log_audit_event
)
from .websocket_manager import manager, handle_websocket_connection
from .monitoring import (
    router as monitoring_router,
    record_job_created,
    record_job_completed,
    record_job_failed
)

# Initialize FastAPI app
app = FastAPI(
    title="FastAPI + Celery + Supabase Demo",
    description="Distributed background computation with real-time updates",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

settings = get_settings()

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include monitoring routes
app.include_router(monitoring_router)


@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    print(f"🚀 Starting {settings.project_name}")
    print(f"📊 Environment: {settings.environment}")
    print(f"🔗 Supabase URL: {settings.supabase_url}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 Shutting down gracefully...")


@app.get("/", tags=["root"])
async def root():
    """Root endpoint"""
    return {
        "message": "FastAPI + Celery + Supabase Demo",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/monitoring/health"
    }


# ============================================
# JOB ENDPOINTS (WITH AUTHENTICATION)
# ============================================

@app.post(
    "/jobs",
    response_model=schemas.JobCreated,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create a distributed computation job",
    tags=["jobs"]
)
@limiter.limit("10/minute")
async def create_job(
    request: Request,
    payload: schemas.JobRequest,
    current_user: dict = Depends(optional_auth)
) -> schemas.JobCreated:
    """
    Create a new computation job.
    
    Optional authentication. If Supabase is configured, checks user quota and rate limits.
    Returns cached result if available.
    """
    # Validate input
    if payload.n <= 0 or payload.n > settings.max_job_n:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"n must be between 1 and {settings.max_job_n}"
        )
    
    if payload.chunks <= 0 or payload.chunks > settings.max_chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"chunks must be between 1 and {settings.max_chunks}"
        )
    
    # Create new job
    job_id = str(uuid.uuid4())
    
    # If Supabase is configured and user is authenticated, save to database
    if settings.supabase_url and current_user:
        try:
            supabase = get_supabase_service_client()
            user_id = current_user["id"]
            
            # Check cache first
            cached = await get_cached_result(payload.n, payload.chunks)
            if cached:
                # Create job record with cached result
                supabase.table("jobs").insert({
                    "id": job_id,
                    "user_id": user_id,
                    "n": payload.n,
                    "chunks": payload.chunks,
                    "total_chunks": payload.chunks,
                    "status": "completed",
                    "progress": 1.0,
                    "completed_chunks": payload.chunks,
                    "result": cached["result"],
                    "is_cached": True,
                    "duration_ms": cached.get("computation_time_ms", 0),
                    "started_at": "now()",
                    "completed_at": "now()"
                }).execute()
                
                return schemas.JobCreated(
                    job_id=job_id,
                    status="completed",
                    cached=True,
                    result=cached["result"]
                )
            
            # Insert job into Supabase
            supabase.table("jobs").insert({
                "id": job_id,
                "user_id": user_id,
                "n": payload.n,
                "chunks": payload.chunks,
                "total_chunks": payload.chunks,
                "status": "pending",
                "progress": 0.0,
                "completed_chunks": 0
            }).execute()
            
            # Create job chunks
            chunk_size = payload.n // payload.chunks
            for i in range(payload.chunks):
                start = i * chunk_size + 1
                end = (i + 1) * chunk_size if i < payload.chunks - 1 else payload.n
                
                supabase.table("job_chunks").insert({
                    "job_id": job_id,
                    "chunk_index": i,
                    "start_range": start,
                    "end_range": end,
                    "status": "pending"
                }).execute()
        except Exception as e:
            print(f"Warning: Supabase operation failed: {e}")
            # Continue with Redis-only approach
    
    # Record metric
    record_job_created()
    
    # Initialize Redis progress key BEFORE starting Celery task to avoid race condition
    from .config import get_async_redis_client
    redis = get_async_redis_client()
    await redis.hset(
        f"progress:{job_id}",
        mapping={
            "status": "pending",
            "total_chunks": payload.chunks,
            "completed_chunks": 0,
            "progress": "0.0",
            "detail": "Job queued and waiting for workers.",
        },
    )
    
    # Start Celery task
    tasks.orchestrate_range_sum.delay(job_id, payload.n, payload.chunks)
    
    return schemas.JobCreated(job_id=job_id, status="pending")


@app.get(
    "/jobs/{job_id}",
    response_model=schemas.JobStatus,
    summary="Get job status",
    tags=["jobs"]
)
async def get_job_status(
    job_id: str,
    current_user: dict = Depends(optional_auth)
) -> schemas.JobStatus:
    """
    Get the current status of a job.
    
    Optional authentication. Works without Supabase - uses Redis for job tracking.
    """
    # Always use Redis for job status (Supabase is optional)
    from .config import get_async_redis_client
    redis = get_async_redis_client()
    
    progress_key = f"progress:{job_id}"
    exists = await redis.exists(progress_key)
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    progress_raw = await redis.hgetall(progress_key)
    total_chunks = int(progress_raw.get("total_chunks", 1))
    completed_chunks = int(progress_raw.get("completed_chunks", 0))
    progress_value = progress_raw.get("progress", "0") or "0"
    try:
        progress_float = float(progress_value)
    except (TypeError, ValueError):
        progress_float = 0.0

    result_key = f"result:{job_id}"
    result_raw = await redis.get(result_key)
    result_value = int(result_raw) if result_raw is not None else None

    status_value = progress_raw.get("status", "unknown")
    detail_value = progress_raw.get("detail")

    return schemas.JobStatus(
        job_id=job_id,
        status=status_value,
        progress=min(max(progress_float, 0.0), 1.0),
        completed_chunks=completed_chunks,
        total_chunks=total_chunks if total_chunks > 0 else 1,
        result=result_value,
        detail=detail_value
    )


@app.get(
    "/jobs",
    response_model=List[schemas.JobStatus],
    summary="List user's jobs",
    tags=["jobs"]
)
async def list_jobs(
    limit: int = 50,
    offset: int = 0,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
) -> List[schemas.JobStatus]:
    """
    List all jobs for the current user.
    
    Supports pagination and filtering by status.
    """
    supabase = get_supabase_service_client()
    user_id = current_user["id"]
    
    query = supabase.table("jobs")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .range(offset, offset + limit - 1)
    
    if status_filter:
        query = query.eq("status", status_filter)
    
    result = query.execute()
    
    jobs = []
    for job in result.data:
        jobs.append(schemas.JobStatus(
            job_id=job["id"],
            status=job["status"],
            progress=job.get("progress", 0.0),
            completed_chunks=job.get("completed_chunks", 0),
            total_chunks=job.get("total_chunks", 1),
            result=job.get("result"),
            detail=job.get("error_message"),
            created_at=job.get("created_at"),
            started_at=job.get("started_at"),
            completed_at=job.get("completed_at"),
            duration_ms=job.get("duration_ms"),
            is_cached=job.get("is_cached", False)
        ))
    
    return jobs


@app.delete(
    "/jobs/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel/delete a job",
    tags=["jobs"]
)
async def cancel_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Cancel a running job or delete a completed job.
    
    Users can only cancel/delete their own jobs.
    """
    supabase = get_supabase_service_client()
    user_id = current_user["id"]
    
    # Get job
    result = supabase.table("jobs")\
        .select("*")\
        .eq("id", job_id)\
        .eq("user_id", user_id)\
        .single()\
        .execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    job = result.data
    
    # Update status to cancelled
    if job["status"] in ["pending", "running"]:
        supabase.table("jobs").update({
            "status": "cancelled",
            "cancelled_at": "now()"
        }).eq("id", job_id).execute()
        
        # Log audit event
        await log_audit_event(
            user_id=user_id,
            action="job_cancelled",
            resource_type="job",
            resource_id=job_id,
            job_id=job_id
        )
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ============================================
# WEBSOCKET ENDPOINT (REAL-TIME UPDATES)
# ============================================

@app.websocket("/ws/{job_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    job_id: str,
    token: Optional[str] = None
):
    """
    WebSocket endpoint for real-time job updates.
    
    Connect with: ws://api/ws/{job_id}?token=YOUR_JWT_TOKEN
    """
    # Verify authentication
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return
    
    from .supabase_client import verify_supabase_token
    user = await verify_supabase_token(token)
    
    if not user:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    # Verify user has access to this job
    supabase = get_supabase_service_client()
    result = supabase.table("jobs")\
        .select("id")\
        .eq("id", job_id)\
        .eq("user_id", user["id"])\
        .single()\
        .execute()
    
    if not result.data:
        await websocket.close(code=1008, reason="Job not found or access denied")
        return
    
    # Handle WebSocket connection
    await handle_websocket_connection(websocket, job_id, user["id"])


# ============================================
# USER ENDPOINTS
# ============================================

@app.get(
    "/me",
    summary="Get current user profile",
    tags=["user"]
)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_active_user)
):
    """Get the current authenticated user's profile"""
    return {
        "id": current_user["id"],
        "email": current_user.get("email"),
        "profile": current_user.get("profile", {})
    }


@app.get(
    "/me/stats",
    summary="Get user statistics",
    tags=["user"]
)
async def get_user_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get statistics for the current user"""
    supabase = get_supabase_service_client()
    user_id = current_user["id"]
    
    # Get user stats from view
    result = supabase.from_("user_stats")\
        .select("*")\
        .eq("id", user_id)\
        .single()\
        .execute()
    
    return result.data if result.data else {}


# ============================================
# DEMO ENDPOINTS (PUBLIC, NO AUTH REQUIRED)
# ============================================

@app.post(
    "/jobs/demo",
    response_model=schemas.JobCreated,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create a demo computation job (no auth required)",
    tags=["demo"]
)
@limiter.limit("5/minute")
async def create_demo_job(
    request: Request,
    payload: schemas.JobRequest
) -> schemas.JobCreated:
    """
    Create a demo computation job without authentication.
    
    Limited to smaller values for public demo:
    - n: max 10,000
    - chunks: max 8
    """
    if payload.n <= 0 or payload.n > 10000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Demo: n must be between 1 and 10,000"
        )
    
    if payload.chunks <= 0 or payload.chunks > 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Demo: chunks must be between 1 and 8"
        )
    
    job_id = str(uuid.uuid4())
    
    record_job_created()
    
    from .config import get_async_redis_client
    redis = get_async_redis_client()
    await redis.hset(
        f"progress:{job_id}",
        mapping={
            "status": "pending",
            "total_chunks": payload.chunks,
            "completed_chunks": 0,
            "progress": "0.0",
            "detail": "Demo job queued.",
        },
    )
    
    tasks.orchestrate_range_sum.delay(job_id, payload.n, payload.chunks)
    
    return schemas.JobCreated(job_id=job_id, status="pending")


@app.get(
    "/jobs/demo/{job_id}",
    response_model=schemas.JobStatus,
    summary="Get demo job status (no auth required)",
    tags=["demo"]
)
async def get_demo_job_status(job_id: str) -> schemas.JobStatus:
    """
    Get the current status of a demo job without authentication.
    """
    from .config import get_async_redis_client
    redis = get_async_redis_client()
    
    progress_key = f"progress:{job_id}"
    exists = await redis.exists(progress_key)
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo job not found.")

    progress_raw = await redis.hgetall(progress_key)
    total_chunks = int(progress_raw.get("total_chunks", 1))
    completed_chunks = int(progress_raw.get("completed_chunks", 0))
    progress_value = progress_raw.get("progress", "0") or "0"
    try:
        progress_float = float(progress_value)
    except (TypeError, ValueError):
        progress_float = 0.0

    result_key = f"result:{job_id}"
    result_raw = await redis.get(result_key)
    result_value = int(result_raw) if result_raw is not None else None

    status_value = progress_raw.get("status", "unknown")
    detail_value = progress_raw.get("detail")

    return schemas.JobStatus(
        job_id=job_id,
        status=status_value,
        progress=min(max(progress_float, 0.0), 1.0),
        completed_chunks=completed_chunks,
        total_chunks=total_chunks if total_chunks > 0 else 1,
        result=result_value,
        detail=detail_value
    )


# ============================================
# PUBLIC ENDPOINTS (NO AUTH REQUIRED)
# ============================================

@app.get(
    "/cache/stats",
    summary="Get cache statistics",
    tags=["cache"]
)
async def get_cache_stats():
    """Get cache hit statistics (public endpoint)"""
    supabase = get_supabase_service_client()
    
    result = supabase.table("job_cache")\
        .select("*")\
        .order("use_count", desc=True)\
        .limit(10)\
        .execute()
    
    return {
        "top_cached_jobs": result.data,
        "total_cached": len(result.data)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
