from __future__ import annotations

import uuid
from typing import Any, Dict

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from . import schemas, tasks
from .config import Settings, get_async_redis_client, get_settings

app = FastAPI(title="FastAPI + Celery Demo")

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_client = get_async_redis_client()


def get_settings_dependency() -> Settings:
    return settings


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await redis_client.aclose()


@app.post(
    "/jobs",
    response_model=schemas.JobCreated,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create a distributed computation job.",
)
async def create_job(
    payload: schemas.JobRequest, _: Settings = Depends(get_settings_dependency)
) -> schemas.JobCreated:
    job_id = str(uuid.uuid4())
    actual_chunks = tasks.start_job(job_id, payload.n, payload.chunks)
    await redis_client.hset(
        f"progress:{job_id}",
        mapping={
            "detail": f"Job queued with {actual_chunks} chunks.",
        },
    )
    return schemas.JobCreated(job_id=job_id, status="pending")


@app.get(
    "/jobs/{job_id}",
    response_model=schemas.JobStatus,
    summary="Poll for current job status.",
)
async def get_job_status(job_id: str) -> schemas.JobStatus:
    progress_key = f"progress:{job_id}"
    exists = await redis_client.exists(progress_key)
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    progress_raw: Dict[str, Any] = await redis_client.hgetall(progress_key)
    total_chunks = int(progress_raw.get("total_chunks", 1))
    completed_chunks = int(progress_raw.get("completed_chunks", 0))
    progress_value = progress_raw.get("progress", "0") or "0"
    try:
        progress_float = float(progress_value)
    except (TypeError, ValueError):
        progress_float = 0.0

    result_key = f"result:{job_id}"
    result_raw = await redis_client.get(result_key)
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
        detail=detail_value,
    )
