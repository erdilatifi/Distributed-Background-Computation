"""Celery tasks for distributed background computation.

This module contains the core task definitions for processing distributed
computations using Celery workers. Tasks are orchestrated using Celery's
chord primitive for parallel execution and result aggregation.
"""
from __future__ import annotations

import math
from typing import List
from datetime import datetime

from celery import chord
from celery.utils.log import get_task_logger
from celery.exceptions import SoftTimeLimitExceeded, Retry

from .celery_app import celery_app
from .config import get_sync_redis_client
from .supabase_client import get_supabase_service_client

logger = get_task_logger(__name__)


def _progress_key(job_id: str) -> str:
    """Generate Redis key for job progress tracking.
    
    Args:
        job_id: Unique identifier for the job
        
    Returns:
        Redis key string for progress data
    """
    return f"progress:{job_id}"


def _result_key(job_id: str) -> str:
    """Generate Redis key for job result storage.
    
    Args:
        job_id: Unique identifier for the job
        
    Returns:
        Redis key string for result data
    """
    return f"result:{job_id}"


def _mark_failed(job_id: str, detail: str) -> None:
    """Mark a job as failed in Redis.
    
    Updates the job status to 'failed' and removes any partial results.
    
    Args:
        job_id: Unique identifier for the job
        detail: Error message describing the failure
    """
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
    """Initialize and schedule a distributed computation job.
    
    Creates chunk tasks for parallel processing using Celery's chord primitive.
    Each chunk computes a portion of the range sum, and results are aggregated
    in the finalize_job callback.
    
    Args:
        job_id: Unique identifier for the job
        n: Upper bound of the range (sum from 1 to n)
        requested_chunks: Number of parallel chunks to create
        
    Returns:
        Number of chunks actually created
    """
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


@celery_app.task(bind=True, name="app.tasks.orchestrate_range_sum")
def orchestrate_range_sum(self, job_id: str, n: int, chunks: int) -> None:
    """
    Orchestrate the distributed range sum computation.
    This is the main entry point called from the API.
    """
    logger.info("Starting orchestration for job %s (n=%s, chunks=%s)", job_id, n, chunks)
    start_job(job_id, n, chunks)


@celery_app.task(bind=True, name="app.tasks.compute_chunk", max_retries=2, autoretry_for=(Exception,), retry_backoff=True, retry_backoff_max=600, retry_jitter=True)
def compute_chunk(self, job_id: str, chunk_index: int, start: int, end: int) -> int:
    """Compute sum for a chunk with retry logic and time limit handling."""
    redis = get_sync_redis_client()
    
    try:
        # Compute the sum for this chunk's range
        subtotal = sum(range(start, end + 1))
        
        # Update progress tracking in Redis
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
        
        # Update Supabase if configured
        try:
            from .config import get_settings
            settings = get_settings()
            if settings.supabase_url:
                supabase = get_supabase_service_client()
                
                # Mark chunk as completed in database
                supabase.table("job_chunks").update({
                    "status": "completed",
                    "result": subtotal,
                    "completed_at": datetime.utcnow().isoformat()
                }).eq("job_id", job_id).eq("chunk_index", chunk_index).execute()
                
                # Update overall job progress in database
                supabase.table("jobs").update({
                    "status": "running",
                    "progress": progress,
                    "completed_chunks": completed
                }).eq("id", job_id).execute()
        except Exception as e:
            logger.warning(f"Supabase update failed (non-critical): {e}")
        
        logger.debug(
            "Completed chunk %s (%s-%s) for job %s: subtotal=%s",
            chunk_index,
            start,
            end,
            job_id,
            subtotal,
        )
        return subtotal
    except SoftTimeLimitExceeded:
        # P0: Handle soft time limit - mark chunk and job as failed
        error_msg = f"Chunk {chunk_index + 1} exceeded time limit (5 minutes)"
        logger.error(error_msg)
        _mark_failed(job_id, error_msg)
        # Don't retry on time limit
        raise
    except Exception as exc:
        # P0: Chunk failure = whole job failure
        retry_num = self.request.retries
        if retry_num < self.max_retries:
            logger.warning(
                "Chunk %s for job %s failed (attempt %s/%s): %s - retrying...",
                chunk_index, job_id, retry_num + 1, self.max_retries, exc
            )
            # Exponential backoff retry
            raise self.retry(exc=exc, countdown=2 ** retry_num * 10)
        else:
            # Max retries exceeded - fail the whole job
            error_msg = f"Chunk {chunk_index + 1} failed after {self.max_retries} retries: {str(exc)}"
            logger.exception("Chunk %s for job %s failed permanently: %s", chunk_index, job_id, exc)
            _mark_failed(job_id, error_msg)
            raise


@celery_app.task(bind=True, name="app.tasks.finalize_job")
def finalize_job(self, results: List[int], job_id: str) -> int:
    redis = get_sync_redis_client()
    
    try:
        total = int(sum(results))
        
        # Update job status and result in Redis
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
        
        # Persist final result to Supabase database (if configured)
        try:
            from .config import get_settings
            settings = get_settings()
            if settings.supabase_url:
                supabase = get_supabase_service_client()
                
                # Mark job as completed with final result
                supabase.table("jobs").update({
                    "status": "completed",
                    "progress": 1.0,
                    "completed_chunks": len(results),
                    "result": total,
                    "completed_at": datetime.utcnow().isoformat()
                }).eq("id", job_id).execute()
        except Exception as e:
            logger.warning(f"Supabase update failed (non-critical): {e}")
        
        logger.info("Job %s finished with result %s", job_id, total)
        return total
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Finalizer for job %s failed: %s", job_id, exc)
        _mark_failed(job_id, f"Aggregation step failed: {exc}")
        raise
