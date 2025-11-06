from __future__ import annotations

from typing import Generator

import fakeredis
from fakeredis import aioredis as fakeredis_async
import pytest
from fastapi.testclient import TestClient

from app import tasks
from app.celery_app import celery_app
from app.main import app


@pytest.fixture(autouse=True)
def configure_test_environment(monkeypatch: pytest.MonkeyPatch) -> Generator[None, None, None]:
    fake_async = fakeredis_async.FakeRedis()
    fake_sync = fakeredis.FakeRedis(decode_responses=True)

    monkeypatch.setattr(tasks, "get_sync_redis_client", lambda: fake_sync)
    monkeypatch.setattr("app.main.redis_client", fake_async, raising=False)

    original_always_eager = celery_app.conf.task_always_eager
    original_eager_propagates = celery_app.conf.task_eager_propagates
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True

    yield

    celery_app.conf.task_always_eager = original_always_eager
    celery_app.conf.task_eager_propagates = original_eager_propagates


def test_create_and_complete_job() -> None:
    client = TestClient(app)

    response = client.post("/jobs", json={"n": 10, "chunks": 3})
    assert response.status_code == 202

    payload = response.json()
    assert "job_id" in payload
    job_id = payload["job_id"]

    status_response = client.get(f"/jobs/{job_id}")
    assert status_response.status_code == 200

    status_payload = status_response.json()
    assert status_payload["status"] == "completed"
    assert status_payload["result"] == sum(range(1, 11))
    assert status_payload["progress"] == 1.0
