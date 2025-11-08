from __future__ import annotations

from celery import Celery

from .config import get_settings

settings = get_settings()

celery_app = Celery(
    "fastapi_celery_demo",
    broker=settings.broker_url,
    backend=settings.result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    result_expires=6 * 60 * 60,  # 6 hours
    worker_prefetch_multiplier=1,
    # P0: Task time limits to prevent stuck jobs
    task_soft_time_limit=300,  # 5 minutes soft limit (raises SoftTimeLimitExceeded)
    task_time_limit=360,  # 6 minutes hard limit (kills the worker process)
    # P0: Retry policy for failed tasks
    task_acks_late=True,  # Acknowledge task after completion (allows retry on worker crash)
    task_reject_on_worker_lost=True,  # Reject task if worker is lost
    task_default_retry_delay=10,  # 10 seconds between retries
    task_max_retries=2,  # Max 2 retries per task
)

# Ensure Celery can find task definitions inside the app package.
celery_app.autodiscover_tasks(["app"])
