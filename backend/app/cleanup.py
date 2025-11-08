"""
P2: Job retention and cleanup utilities.

Automatically prunes old job data from Redis to prevent memory bloat.
Runs as a background task or can be triggered manually.
"""
from __future__ import annotations

import asyncio
import time
from datetime import datetime, timedelta
from celery import shared_task
from celery.utils.log import get_task_logger

from .config import get_async_redis_client, get_sync_redis_client
from .celery_app import celery_app

logger = get_task_logger(__name__)


async def cleanup_old_jobs_async(retention_hours: int = 24) -> dict:
    """
    Clean up job data older than retention period from Redis.
    
    Args:
        retention_hours: Hours to retain job data (default 24)
        
    Returns:
        Dictionary with cleanup statistics
    """
    redis = get_async_redis_client()
    cutoff_time = time.time() - (retention_hours * 3600)
    
    deleted_progress = 0
    deleted_results = 0
    deleted_idempotency = 0
    errors = 0
    
    try:
        # Clean up progress keys
        async for key in redis.scan_iter(match="progress:*", count=100):
            try:
                # Get the job's last update time from detail or status
                job_data = await redis.hgetall(key)
                if job_data:
                    status = job_data.get("status", "")
                    # Only delete completed or failed jobs
                    if status in ["completed", "failed", "cancelled"]:
                        # Delete if older than retention period
                        # Note: We don't have timestamp in Redis, so we'll use a TTL approach instead
                        ttl = await redis.ttl(key)
                        if ttl == -1:  # No expiry set
                            # Set expiry for cleanup
                            await redis.expire(key, retention_hours * 3600)
                        deleted_progress += 1
            except Exception as e:
                logger.warning(f"Error processing key {key}: {e}")
                errors += 1
        
        # Clean up result keys for completed jobs
        async for key in redis.scan_iter(match="result:*", count=100):
            try:
                ttl = await redis.ttl(key)
                if ttl == -1:  # No expiry set
                    await redis.expire(key, retention_hours * 3600)
                deleted_results += 1
            except Exception as e:
                logger.warning(f"Error processing key {key}: {e}")
                errors += 1
        
        # Clean up old idempotency keys (already have 24h TTL, but double-check)
        async for key in redis.scan_iter(match="idempotency:*", count=100):
            try:
                ttl = await redis.ttl(key)
                if ttl == -1:  # No expiry set
                    await redis.expire(key, 24 * 3600)  # 24 hours
                deleted_idempotency += 1
            except Exception as e:
                logger.warning(f"Error processing key {key}: {e}")
                errors += 1
        
        logger.info(
            f"Cleanup complete: {deleted_progress} progress, "
            f"{deleted_results} results, {deleted_idempotency} idempotency keys set to expire"
        )
        
        return {
            "status": "completed",
            "retention_hours": retention_hours,
            "progress_keys_updated": deleted_progress,
            "result_keys_updated": deleted_results,
            "idempotency_keys_updated": deleted_idempotency,
            "errors": errors,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.exception(f"Cleanup failed: {e}")
        return {
            "status": "failed",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


def cleanup_old_jobs_sync(retention_hours: int = 24) -> dict:
    """Synchronous wrapper for cleanup function."""
    return asyncio.run(cleanup_old_jobs_async(retention_hours))


@celery_app.task(name="app.cleanup.nightly_cleanup")
def nightly_cleanup_task():
    """
    P2: Celery task for nightly job cleanup.
    
    Can be scheduled using Celery Beat:
    ```
    celery -A app.celery_app beat --loglevel=info
    ```
    
    With schedule in celeryconfig.py:
    ```
    beat_schedule = {
        'nightly-cleanup': {
            'task': 'app.cleanup.nightly_cleanup',
            'schedule': crontab(hour=3, minute=0),  # 3 AM daily
        },
    }
    ```
    """
    logger.info("Starting nightly cleanup task")
    result = cleanup_old_jobs_sync(retention_hours=24)
    logger.info(f"Nightly cleanup result: {result}")
    return result
