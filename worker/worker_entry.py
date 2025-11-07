from __future__ import annotations

import os

from app.celery_app import celery_app


def main() -> None:
    log_level = os.getenv("CELERY_LOG_LEVEL", "info")
    concurrency = os.getenv("CELERY_CONCURRENCY")
    queue_name = os.getenv("CELERY_QUEUE", "celery")

    argv = [
        "worker",
        "--loglevel",
        log_level,
        "--queues",
        queue_name,
        "--hostname",
        os.getenv("CELERY_HOSTNAME", "worker@%h"),
        "--pool",
        "solo",  # Use single-process mode for Railway
    ]

    if concurrency:
        argv.extend(["--concurrency", concurrency])

    celery_app.worker_main(argv)


if __name__ == "__main__":
    main()
