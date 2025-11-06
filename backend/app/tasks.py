from __future__ import annotations

import math
from typing import List

from celery import chord
from celery.utils.log import get_task_logger

from .celery_app import celery_app
from .config import get_sync_redis_client

logger = get_task_logger(__name__)


def _progress_key(job_id: str) -> str:
    return f"progress:{job_id}"


def _result_key(job_id: str) -> str:
    return f"result:{job_id}"


def _mark_failed(job_id: str, detail: str) -> None:
    redis = get_sync_redis_client()
    redis.hset(
        _progress_key(job_id),
        mapping={
            "status": "failed",
            "detail": detail,
        },
    )
    redis.delete(_result_key(job_id))


def start_job(job_id: str, n: int, requested_chunks: int) -> int:
    total_chunks = max(1, min(requested_chunks, n))
    redis = get_sync_redis_client()

    redis.hset(
        _progress_key(job_id),
        mapping={
            "status": "pending",
            "total_chunks": total_chunks,
            "completed_chunks": 0,
            "progress": "0.0",
            "detail": "Job accepted and waiting for workers.",
        },
    )
    redis.delete(_result_key(job_id))

    chunk_size = math.ceil(n / total_chunks)
    subtasks = []
    start_value = 1
    for index in range(total_chunks):
        end_value = min(n, start_value + chunk_size - 1)
        signature = compute_chunk.s(job_id, index, start_value, end_value)
        subtasks.append(signature)
        start_value = end_value + 1
        if start_value > n:
            break

    callback = finalize_job.s(job_id)
    chord(subtasks)(callback)
    logger.info("Scheduled %s chunks for job %s (n=%s)", len(subtasks), job_id, n)
    return len(subtasks)


@celery_app.task(bind=True, name="app.tasks.compute_chunk")
def compute_chunk(self, job_id: str, chunk_index: int, start: int, end: int) -> int:
    redis = get_sync_redis_client()
    try:
        subtotal = sum(range(start, end + 1))
        completed = redis.hincrby(_progress_key(job_id), "completed_chunks", 1)
        total_chunks_raw = redis.hget(_progress_key(job_id), "total_chunks") or "1"
        total_chunks = max(int(total_chunks_raw), 1)
        progress = min(1.0, completed / total_chunks)
        redis.hset(
            _progress_key(job_id),
            mapping={
                "status": "running",
                "progress": f"{progress:.4f}",
                "detail": f"Processed chunk {chunk_index + 1} of {total_chunks}.",
            },
        )
        logger.debug(
            "Completed chunk %s (%s-%s) for job %s: subtotal=%s",
            chunk_index,
            start,
            end,
            job_id,
            subtotal,
        )
        return subtotal
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Chunk %s for job %s failed: %s", chunk_index, job_id, exc)
        _mark_failed(job_id, f"Chunk {chunk_index + 1} failed: {exc}")
        raise


@celery_app.task(bind=True, name="app.tasks.finalize_job")
def finalize_job(self, results: List[int], job_id: str) -> int:
    redis = get_sync_redis_client()
    try:
        total = int(sum(results))
        progress_key = _progress_key(job_id)
        total_chunks_raw = redis.hget(progress_key, "total_chunks") or str(len(results))
        redis.hset(
            progress_key,
            mapping={
                "status": "completed",
                "progress": "1.0",
                "completed_chunks": total_chunks_raw,
                "detail": "Computation finished successfully.",
            },
        )
        redis.set(_result_key(job_id), str(total))
        logger.info("Job %s finished with result %s", job_id, total)
        return total
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Finalizer for job %s failed: %s", job_id, exc)
        _mark_failed(job_id, f"Aggregation step failed: {exc}")
        raise
