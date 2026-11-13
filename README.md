# Distributed Background Computation

A full-stack system for running long computations as background jobs. A FastAPI service splits each job into chunks, Celery workers process the chunks in parallel through Redis, and a Next.js dashboard shows live progress as the results are combined.

The example workload is a large sum, but the same pattern applies to report generation, media processing, batch inference and any task that would time out inside a normal HTTP request.

## How it works

```
Next.js UI ──HTTP / SSE / WebSocket──> FastAPI (/v1)
                                          │
                                          ├──> Redis (broker, results, job state)
                                          │
                                          └──> Celery workers (parallel chunks)
```

1. A client submits a job, for example the sum of 1 to 10,000 split into 8 chunks.
2. The API validates the request, stores the job in Redis and dispatches one Celery task per chunk.
3. Workers compute their ranges in parallel and report progress.
4. The partial results are aggregated, and the client follows progress through polling, Server-Sent Events or a WebSocket.

## Features

- **Parallel processing.** Jobs are split across any number of Celery workers.
- **Live progress.** Job state is streamed to the UI over Server-Sent Events and WebSockets.
- **Public demo endpoints.** Smaller jobs can run without an account, with tighter limits.
- **Authentication.** Supabase Auth with JWT tokens, user profiles and per-user job history and statistics.
- **Rate limiting.** A per-IP token bucket: 10 requests per minute for authenticated endpoints and 5 for demo endpoints, with `Retry-After` on 429 responses.
- **Idempotency.** An `Idempotency-Key` header returns the original response for 24 hours instead of creating a duplicate job.
- **Task time limits.** Soft and hard limits of 5 and 6 minutes stop stuck jobs.
- **Monitoring.** Health, readiness, Prometheus metrics, Celery status and queue statistics endpoints.
- **Automatic cleanup.** Jobs are kept for 24 hours.
- **Cold-start handling.** The UI shows a warming banner and retries while the API and workers start.

## Tech stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| API        | Python 3.11, FastAPI, Pydantic                          |
| Workers    | Celery 5                                                |
| Broker     | Redis 7                                                 |
| Frontend   | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui         |
| Auth       | Supabase                                                |
| Tests      | Pytest, Celery eager mode, fakeredis                    |
| Deployment | Docker Compose locally, Railway configuration included  |

## Project structure

```
backend/
  app/
    main.py              API routes (/v1), SSE and WebSocket endpoints
    tasks.py             Celery task definitions
    celery_app.py        Celery configuration
    rate_limiter.py      Token bucket rate limiter
    monitoring.py        Health, readiness, metrics and statistics
    cleanup.py           Expired job cleanup
    auth.py              Supabase JWT verification
    tests/               Pytest suite
worker/                  Celery worker image and entry point
frontend/                Next.js dashboard, login, registration and API docs pages
scripts/                 API endpoint validation script
docker-compose.yml       Redis, API, worker and frontend
railway.toml             Railway configuration for the API
railway.worker.toml      Railway configuration for the worker
```

## Getting started

### Prerequisites

- Docker Desktop

### Run locally

```bash
git clone https://github.com/erdilatifi/Distributed-Background-Computation.git
cd Distributed-Background-Computation
cp .env.example .env
docker compose up --build
```

This starts Redis on port 6379, the API on port 8000, a Celery worker and the frontend on port 3000. Open http://localhost:3000 for the dashboard and http://localhost:8000/docs for the interactive API documentation.

Supabase settings are optional. Without them the app runs without authentication, and only the demo endpoints are available.

### Environment variables

All services read a single `.env` file in the project root. See [`.env.example`](.env.example) for the full list.

| Variable                                                    | Description                                   |
| ----------------------------------------------------------- | --------------------------------------------- |
| `REDIS_URL`                                                 | Redis connection string                       |
| `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`                | Celery broker and result storage              |
| `BACKEND_CORS_ORIGINS`                                      | Comma-separated list of allowed origins       |
| `MAX_JOB_N`, `MAX_CHUNKS`                                   | Upper limits for authenticated jobs           |
| `NEXT_PUBLIC_API_URL`                                       | API URL used by the frontend                  |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` | Supabase project (optional)                   |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase settings for the frontend (optional) |

### Tests

```bash
docker compose run --rm api pytest
```

The suite runs Celery in eager mode against fakeredis, so it needs no broker. It covers job creation, status and results, rate limiting, idempotency, validation and the health and metrics endpoints.

## API

All job endpoints are under `/v1`. Authenticated endpoints expect `Authorization: Bearer <token>`.

| Method   | Endpoint                   | Description                                                           |
| -------- | -------------------------- | --------------------------------------------------------------------- |
| `POST`   | `/v1/jobs`                 | Create a job: `{ "n": 10000, "chunks": 8 }`                           |
| `GET`    | `/v1/jobs`                 | List your jobs                                                        |
| `GET`    | `/v1/jobs/{job_id}`        | Job status, progress and result                                       |
| `DELETE` | `/v1/jobs/{job_id}`        | Cancel a job                                                          |
| `GET`    | `/v1/jobs/{job_id}/events` | Stream job events (Server-Sent Events)                                |
| `WS`     | `/v1/ws/{job_id}`          | Stream job events over a WebSocket                                    |
| `POST`   | `/v1/jobs/demo`            | Create a demo job without an account (n up to 10,000, up to 8 chunks) |
| `GET`    | `/v1/jobs/demo/{job_id}`   | Demo job status                                                       |
| `GET`    | `/v1/me`, `/v1/me/stats`   | Current user and job statistics                                       |
| `GET`    | `/healthz`, `/metrics`     | Liveness and Prometheus metrics                                       |
| `GET`    | `/monitoring/*`            | Health, readiness, Celery status and queue statistics                 |

Example:

```bash
curl -X POST http://localhost:8000/v1/jobs/demo \
  -H "Content-Type: application/json" \
  -d '{"n": 1000, "chunks": 4}'

curl http://localhost:8000/v1/jobs/demo/<job_id>
```

## Deployment

The app needs container hosting with a managed Redis instance, so static hosts such as Vercel are not enough on their own. On Railway, create four services: Redis, the API (`backend/Dockerfile` with `railway.toml`), the worker (`worker/Dockerfile` with `railway.worker.toml`) and the frontend (`frontend/Dockerfile`), then set the environment variables above on each service.

## License

Copyright (c) 2025 Erdi Latifi.

This project is source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE). You may use, study and modify it for personal, educational and other noncommercial purposes. Commercial use is not permitted without written permission from the author.
