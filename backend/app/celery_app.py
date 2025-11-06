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
)

# Ensure Celery can find task definitions inside the app package.
celery_app.autodiscover_tasks(["app"])
