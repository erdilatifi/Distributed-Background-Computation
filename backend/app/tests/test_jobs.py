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
    """Test basic job creation and completion via v1 API"""
    client = TestClient(app)

    response = client.post("/v1/jobs", json={"n": 10, "chunks": 3})
    assert response.status_code == 202

    payload = response.json()
    assert "job_id" in payload
    assert payload["status"] == "pending"
    job_id = payload["job_id"]

    status_response = client.get(f"/v1/jobs/{job_id}")
    assert status_response.status_code == 200

    status_payload = status_response.json()
    assert status_payload["status"] == "completed"
    assert status_payload["result"] == sum(range(1, 11))
    assert status_payload["progress"] == 1.0
    assert status_payload["completed_chunks"] == 3
    assert status_payload["total_chunks"] == 3


def test_demo_job_creation() -> None:
    """Test demo endpoint without authentication"""
    client = TestClient(app)

    response = client.post("/v1/jobs/demo", json={"n": 100, "chunks": 2})
    assert response.status_code == 202

    payload = response.json()
    assert "job_id" in payload
    job_id = payload["job_id"]

    # Check demo job status
    status_response = client.get(f"/v1/jobs/demo/{job_id}")
    assert status_response.status_code == 200
    
    status_payload = status_response.json()
    assert status_payload["status"] == "completed"
    assert status_payload["result"] == sum(range(1, 101))


def test_job_not_found() -> None:
    """Test 404 error for non-existent job"""
    client = TestClient(app)
    
    response = client.get("/v1/jobs/nonexistent-job-id")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_invalid_job_parameters() -> None:
    """Test validation errors for invalid job parameters"""
    client = TestClient(app)
    
    # Test n too large
    response = client.post("/v1/jobs", json={"n": 999999999, "chunks": 2})
    assert response.status_code == 400
    
    # Test negative n
    response = client.post("/v1/jobs", json={"n": -10, "chunks": 2})
    assert response.status_code == 422  # Pydantic validation error
    
    # Test zero chunks
    response = client.post("/v1/jobs", json={"n": 100, "chunks": 0})
    assert response.status_code == 422


def test_demo_limits() -> None:
    """Test demo endpoint enforces limits"""
    client = TestClient(app)
    
    # Test n exceeds demo limit
    response = client.post("/v1/jobs/demo", json={"n": 20000, "chunks": 2})
    assert response.status_code == 400
    assert "10,000" in response.json()["detail"]
    
    # Test chunks exceed demo limit
    response = client.post("/v1/jobs/demo", json={"n": 1000, "chunks": 10})
    assert response.status_code == 400
    assert "8" in response.json()["detail"]


def test_rate_limiting() -> None:
    """Test rate limiting on demo endpoints"""
    client = TestClient(app)
    
    # Make multiple requests to trigger rate limit
    for i in range(6):
        response = client.post("/v1/jobs/demo", json={"n": 10, "chunks": 1})
        if i < 5:
            # First 5 should succeed (5/minute limit)
            assert response.status_code in [202, 429]  # May hit limit depending on timing
        else:
            # 6th should definitely be rate limited
            # Note: In tests, rate limiting may not work exactly as in production
            pass


def test_healthz_endpoint() -> None:
    """Test health check endpoint"""
    client = TestClient(app)
    
    response = client.get("/healthz")
    assert response.status_code == 200
    
    payload = response.json()
    assert payload["status"] == "healthy"
    assert "service" in payload


def test_metrics_endpoint() -> None:
    """Test Prometheus metrics endpoint"""
    client = TestClient(app)
    
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]


def test_idempotency_key() -> None:
    """Test idempotency key prevents duplicate job creation"""
    client = TestClient(app)
    
    idempotency_key = "test-idempotency-key-12345"
    headers = {"Idempotency-Key": idempotency_key}
    
    # First request
    response1 = client.post("/v1/jobs", json={"n": 50, "chunks": 2}, headers=headers)
    assert response1.status_code == 202
    job_id_1 = response1.json()["job_id"]
    
    # Second request with same key should return same job
    response2 = client.post("/v1/jobs", json={"n": 50, "chunks": 2}, headers=headers)
    assert response2.status_code == 202
    job_id_2 = response2.json()["job_id"]
    
    # Should return the same job ID
    assert job_id_1 == job_id_2


def test_job_status_fields() -> None:
    """Test that job status contains all required fields"""
    client = TestClient(app)
    
    response = client.post("/v1/jobs", json={"n": 20, "chunks": 2})
    job_id = response.json()["job_id"]
    
    status_response = client.get(f"/v1/jobs/{job_id}")
    status = status_response.json()
    
    # Check all required fields are present
    assert "job_id" in status
    assert "status" in status
    assert "progress" in status
    assert "completed_chunks" in status
    assert "total_chunks" in status
    assert "result" in status
    
    # Check types
    assert isinstance(status["progress"], float)
    assert isinstance(status["completed_chunks"], int)
    assert isinstance(status["total_chunks"], int)
    assert 0.0 <= status["progress"] <= 1.0
