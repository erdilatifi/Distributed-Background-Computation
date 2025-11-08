"""
Health checks, monitoring, and metrics endpoints
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, Response
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
import time
import psutil
from .config import get_settings
from .supabase_client import get_supabase_service_client
from .auth import get_current_user

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

# Prometheus metrics
job_created_counter = Counter('jobs_created_total', 'Total number of jobs created')
job_completed_counter = Counter('jobs_completed_total', 'Total number of jobs completed')
job_failed_counter = Counter('jobs_failed_total', 'Total number of jobs failed')
job_duration_histogram = Histogram('job_duration_seconds', 'Job execution duration')
active_jobs_gauge = Gauge('active_jobs', 'Number of currently active jobs')
websocket_connections_gauge = Gauge('websocket_connections', 'Number of active WebSocket connections')


@router.get("/health")
async def health_check():
    """
    P2: Comprehensive health check endpoint.
    Returns detailed status of API, worker, and Redis.
    """
    checks = {"api": "up", "worker": "unknown", "redis": "unknown"}
    all_healthy = True
    
    # Check Redis
    try:
        from .config import get_sync_redis_client
        redis = get_sync_redis_client()
        redis.ping()
        checks["redis"] = "up"
    except Exception as e:
        checks["redis"] = "down"
        all_healthy = False
    
    # Check Celery workers
    try:
        from .celery_app import celery_app
        inspect = celery_app.control.inspect()
        stats = inspect.stats()
        if stats and len(stats) > 0:
            checks["worker"] = "up"
            checks["worker_count"] = len(stats)
        else:
            checks["worker"] = "down"
            all_healthy = False
    except Exception as e:
        checks["worker"] = "down"
        all_healthy = False
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "service": "fastapi-celery-demo",
        "version": "2.0.0",
        "checks": checks,
        "timestamp": time.time()
    }


@router.get("/ready")
async def readiness_check():
    """
    Readiness check - verifies all dependencies are available.
    Returns 200 if ready to serve traffic, 503 otherwise.
    """
    checks = {}
    is_ready = True
    
    # Check Redis
    try:
        from .config import get_sync_redis_client
        redis = get_sync_redis_client()
        redis.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {str(e)}"
        is_ready = False
    
    # Check Supabase
    try:
        supabase = get_supabase_service_client()
        # Try a simple query
        supabase.table("jobs").select("id").limit(1).execute()
        checks["supabase"] = "ok"
    except Exception as e:
        checks["supabase"] = f"error: {str(e)}"
        is_ready = False
    
    # Check Celery
    try:
        from .celery_app import celery_app
        inspect = celery_app.control.inspect()
        stats = inspect.stats()
        if stats:
            checks["celery"] = "ok"
        else:
            checks["celery"] = "no workers available"
            is_ready = False
    except Exception as e:
        checks["celery"] = f"error: {str(e)}"
        is_ready = False
    
    status_code = 200 if is_ready else 503
    
    return Response(
        content={
            "status": "ready" if is_ready else "not_ready",
            "checks": checks,
            "timestamp": time.time()
        },
        status_code=status_code
    )


@router.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint.
    Returns metrics in Prometheus format.
    """
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


@router.get("/metrics-lite")
async def metrics_lite():
    """
    P2: Lightweight metrics endpoint (public, no auth).
    Returns recent job statistics and performance metrics.
    """
    from .config import get_async_redis_client
    redis = get_async_redis_client()
    
    # Get last 10 jobs from Redis (without Supabase dependency)
    try:
        # Scan for recent job keys
        job_keys = []
        async for key in redis.scan_iter(match="progress:*", count=50):
            job_keys.append(key)
            if len(job_keys) >= 10:
                break
        
        jobs_data = []
        for key in job_keys[:10]:
            job_data = await redis.hgetall(key)
            if job_data:
                jobs_data.append({
                    "status": job_data.get("status", "unknown"),
                    "progress": float(job_data.get("progress", 0) or 0),
                    "total_chunks": int(job_data.get("total_chunks", 0) or 0),
                    "completed_chunks": int(job_data.get("completed_chunks", 0) or 0)
                })
        
        # Calculate metrics
        total_jobs = len(jobs_data)
        completed = sum(1 for j in jobs_data if j["status"] == "completed")
        failed = sum(1 for j in jobs_data if j["status"] == "failed")
        running = sum(1 for j in jobs_data if j["status"] == "running")
        
        return {
            "timestamp": time.time(),
            "last_10_jobs": {
                "total": total_jobs,
                "completed": completed,
                "failed": failed,
                "running": running,
                "success_rate": round(completed / total_jobs * 100, 1) if total_jobs > 0 else 0
            },
            "prometheus_metrics": {
                "jobs_created_total": job_created_counter._value.get(),
                "jobs_completed_total": job_completed_counter._value.get(),
                "jobs_failed_total": job_failed_counter._value.get(),
                "active_jobs": active_jobs_gauge._value.get()
            }
        }
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": time.time(),
            "prometheus_metrics": {
                "jobs_created_total": job_created_counter._value.get(),
                "jobs_completed_total": job_completed_counter._value.get(),
                "jobs_failed_total": job_failed_counter._value.get(),
                "active_jobs": active_jobs_gauge._value.get()
            }
        }


@router.get("/stats")
async def system_stats(current_user: dict = Depends(get_current_user)):
    """
    Get system statistics (authenticated users only).
    Returns various system metrics.
    """
    supabase = get_supabase_service_client()
    
    # Get job statistics
    try:
        result = supabase.from_("system_health").select("*").execute()
        job_stats = result.data[0] if result.data else {}
    except Exception:
        job_stats = {}
    
    # Get system resources
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Get Celery worker stats
    try:
        from .celery_app import celery_app
        inspect = celery_app.control.inspect()
        active_tasks = inspect.active()
        worker_stats = {
            "workers": len(active_tasks) if active_tasks else 0,
            "active_tasks": sum(len(tasks) for tasks in active_tasks.values()) if active_tasks else 0
        }
    except Exception:
        worker_stats = {"workers": 0, "active_tasks": 0}
    
    return {
        "timestamp": time.time(),
        "jobs": job_stats,
        "workers": worker_stats,
        "system": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_mb": memory.available / (1024 * 1024),
            "disk_percent": disk.percent,
            "disk_free_gb": disk.free / (1024 * 1024 * 1024)
        }
    }


@router.get("/user-stats")
async def user_stats(current_user: dict = Depends(get_current_user)):
    """
    Get statistics for the current user.
    """
    supabase = get_supabase_service_client()
    user_id = current_user["id"]
    
    try:
        # Get user's job statistics
        result = supabase.from_("user_stats")\
            .select("*")\
            .eq("id", user_id)\
            .single()\
            .execute()
        
        stats = result.data if result.data else {}
        
        # Get user profile with quota info
        profile_result = supabase.table("user_profiles")\
            .select("job_quota, jobs_today, is_premium")\
            .eq("id", user_id)\
            .single()\
            .execute()
        
        profile = profile_result.data if profile_result.data else {}
        
        return {
            "user_id": user_id,
            "email": current_user.get("email"),
            "statistics": stats,
            "quota": {
                "daily_limit": profile.get("job_quota", 100),
                "used_today": profile.get("jobs_today", 0),
                "remaining": profile.get("job_quota", 100) - profile.get("jobs_today", 0),
                "is_premium": profile.get("is_premium", False)
            }
        }
    except Exception as e:
        return {
            "error": str(e),
            "user_id": user_id
        }


@router.get("/celery-status")
async def celery_status(current_user: dict = Depends(get_current_user)):
    """
    Get detailed Celery worker status.
    """
    try:
        from .celery_app import celery_app
        inspect = celery_app.control.inspect()
        
        return {
            "active": inspect.active(),
            "scheduled": inspect.scheduled(),
            "reserved": inspect.reserved(),
            "stats": inspect.stats(),
            "registered": inspect.registered()
        }
    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to get Celery status"
        }


# Helper functions to update metrics
def record_job_created():
    """Record a job creation event"""
    job_created_counter.inc()
    active_jobs_gauge.inc()


def record_job_completed(duration_seconds: float):
    """Record a job completion event"""
    job_completed_counter.inc()
    active_jobs_gauge.dec()
    job_duration_histogram.observe(duration_seconds)


def record_job_failed():
    """Record a job failure event"""
    job_failed_counter.inc()
    active_jobs_gauge.dec()


def update_websocket_connections(count: int):
    """Update WebSocket connection count"""
    websocket_connections_gauge.set(count)


@router.post("/cleanup")
async def trigger_cleanup(
    retention_hours: int = 24,
    current_user: dict = Depends(get_current_user)
):
    """
    P2: Manually trigger job data cleanup.
    Removes job data older than retention period from Redis.
    """
    from .cleanup import cleanup_old_jobs_async
    result = await cleanup_old_jobs_async(retention_hours)
    return result
