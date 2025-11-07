# 🚀 Distributed Background Computation Demo

> **FastAPI + Celery + Redis + Next.js** - A production-ready template for building scalable background job processing systems

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Celery](https://img.shields.io/badge/Celery-5.3.6-37814A?logo=celery)](https://docs.celeryq.dev/)

---

## 📖 What Is This?

A **full-stack distributed computing system** that demonstrates how to build scalable, asynchronous task processing with real-time progress tracking. Perfect for learning or as a starter template for production applications.

### 🎯 Real-World Use Cases

This architecture pattern is used for:
- 📊 **Data Processing** - ETL pipelines, report generation, analytics
- 🎬 **Media Processing** - Video transcoding, image optimization, thumbnail generation
- 🤖 **ML/AI Workloads** - Model inference, batch predictions, training jobs
- 📧 **Bulk Operations** - Email campaigns, batch notifications, data exports
- 🔄 **Long-Running Tasks** - Any operation that would timeout in a normal HTTP request

### ⚡ How It Works

```
User submits job → FastAPI splits into chunks → Celery workers process in parallel → Results aggregated → Real-time UI updates
```

**Example**: Calculate sum of 1 to 10,000
1. Split into 8 chunks (1-1,250, 1,251-2,500, etc.)
2. 8 workers compute simultaneously
3. Results combined: **50,005,000**
4. Progress bar updates in real-time

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔄 **Distributed Computing** | Split heavy tasks across multiple workers for parallel processing |
| 📊 **Real-Time Progress** | Live progress tracking with animated UI updates |
| 🎨 **Modern UI** | Next.js + shadcn/ui + Tailwind CSS with beautiful dark theme |
| 🐳 **Fully Containerized** | One command to run everything: `docker compose up` |
| 🧪 **Tested** | Pytest suite with 90%+ coverage using Celery eager mode |
| 📦 **Production Ready** | Redis for state, FastAPI for API, Celery for workers |
| 🔌 **API First** | RESTful API with OpenAPI docs at `/docs` |
| ♿ **Accessible** | WCAG compliant UI components from shadcn/ui |

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js UI    │ ← User Interface (Port 3000)
│  (TypeScript)   │
└────────┬────────┘
         │ HTTP Polling
         ↓
┌─────────────────┐
│   FastAPI API   │ ← REST API (Port 8000)
│   (Python 3.11) │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────────┐
│ Redis  │ │ Celery Worker│ ← Task Processing
│ Broker │ │  (Python)    │
└────────┘ └──────────────┘
```

### 📁 Project Structure

```
.
├── backend/                 # FastAPI + Celery
│   ├── app/
│   │   ├── main.py         # API routes & endpoints
│   │   ├── tasks.py        # Celery task definitions
│   │   ├── celery_app.py   # Celery configuration
│   │   ├── config.py       # Settings & environment
│   │   ├── schemas.py      # Pydantic models
│   │   └── tests/          # Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── worker/                  # Celery worker service
│   ├── Dockerfile
│   └── worker_entry.py
├── frontend/                # Next.js application
│   ├── pages/              # React pages
│   ├── components/         # shadcn/ui components
│   ├── styles/             # Tailwind CSS
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml       # Multi-service orchestration
├── .env.example            # Environment template
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (includes Docker Engine + Compose)
- That's it! No Python or Node.js installation needed

### 1️⃣ Clone & Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd python-project

# Copy environment configuration
cp .env.example .env
```

### 2️⃣ Launch the Stack

```bash
docker compose up --build
```

This starts 4 services:
- 🔴 **Redis** (Port 6379) - Message broker & result storage
- 🟢 **API** (Port 8000) - FastAPI backend
- 🔵 **Worker** - Celery task processor
- 🟣 **Frontend** (Port 3000) - Next.js UI

### 3️⃣ Open the Application

Visit **[http://localhost:3000](http://localhost:3000)**

1. Enter a number (e.g., `10000`)
2. Choose parallel chunks (e.g., `8`)
3. Click **Submit**
4. Watch real-time progress! 🎉

---

## 🔧 API Reference

### Create a Job

```bash
curl -X POST http://localhost:8000/jobs \
  -H "Content-Type: application/json" \
  -d '{"n": 10000, "chunks": 8}'
```

**Response:**
```json
{
  "job_id": "3c50e7d3-5c6f-4f74-9c77-b0b28c6b948b",
  "status": "pending"
}
```

### Check Job Status

```bash
curl http://localhost:8000/jobs/3c50e7d3-5c6f-4f74-9c77-b0b28c6b948b
```

**Response:**
```json
{
  "job_id": "3c50e7d3-5c6f-4f74-9c77-b0b28c6b948b",
  "status": "completed",
  "progress": 1.0,
  "completed_chunks": 8,
  "total_chunks": 8,
  "result": 50005000,
  "detail": "Computation finished successfully."
}
```

### API Documentation

Interactive API docs available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Testing

Run the test suite inside the API container:

```bash
docker compose run --rm api pytest
```

**Features:**
- ✅ Celery eager mode (no broker needed)
- ✅ FakeRedis for fast in-memory testing
- ✅ 90%+ code coverage
- ✅ Unit + integration tests

**Run with coverage:**
```bash
docker compose run --rm api pytest --cov=app --cov-report=html
```

---

## 🎨 Frontend Features

### UI Components
- **Progress Bar** - Animated real-time progress
- **Status Badges** - Color-coded job states (pending, running, completed, failed)
- **Chunk Metrics** - Live count of completed/total chunks
- **Error Handling** - User-friendly error messages
- **Dark Theme** - Beautiful dark mode by default
- **Responsive** - Works on mobile, tablet, and desktop

### Tech Stack
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **State**: React hooks with polling

---

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check service status
docker compose ps

# View logs
docker compose logs api
docker compose logs worker

# Restart services
docker compose restart
```

### Connection Refused Errors

**Problem**: Frontend can't reach API

**Solution**:
1. Verify API is running: `curl http://localhost:8000/docs`
2. Check `.env` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
3. Rebuild frontend: `docker compose up --build frontend`

### Worker Not Processing Jobs

**Problem**: Jobs stuck in "pending"

**Solution**:
1. Check worker logs: `docker compose logs -f worker`
2. Verify Redis connection: `docker compose exec redis redis-cli ping`
3. Ensure `CELERY_QUEUE` matches in API and worker (default: `celery`)

### Build Failures

```bash
# Clean rebuild
docker compose down -v
docker compose build --no-cache
docker compose up
```

---

## 🔐 Environment Variables

### Quick Setup

**You only need ONE `.env` file** in the project root. Docker Compose uses it for all services.

```bash
cp .env.example .env
# Edit .env with your values
```

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PROJECT_NAME` | Application name | `FastAPI Celery Next.js Demo` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379/0` |
| `CELERY_BROKER_URL` | Celery broker URL | `redis://redis:6379/0` |
| `CELERY_RESULT_BACKEND` | Result storage URL | `redis://redis:6379/0` |
| `BACKEND_CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `http://localhost:8000` |
| `LOG_LEVEL` | Logging verbosity | `info` |

### Supabase Configuration (Optional)

For authentication and database features:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (keep secret!) |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as SUPABASE_URL (for frontend) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as SUPABASE_ANON_KEY (for frontend) |

**Note:** Frontend variables MUST have `NEXT_PUBLIC_` prefix to be exposed to the browser.

---

## 🚢 Deployment

> **Note:** This app requires Docker container hosting (not Vercel/Netlify) because it needs backend services, workers, and Redis.

### 🎯 Recommended: Railway (Easiest)

**One-click deployment with managed services:**

1. Push to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Add Redis database
5. Set environment variables
6. Deploy! 🚀

**Cost:** Free tier available, ~$5-20/month for production

### 🐳 Alternative: Render

**Blueprint deployment included:**

1. Push to GitHub
2. Go to [render.com](https://render.com)
3. Click "New" → "Blueprint"
4. Connect repo (uses `render.yaml`)
5. Deploy automatically

**Cost:** Free tier available, ~$7-15/month for production

### 📚 Full Deployment Guide

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions on:
- Railway (recommended)
- Render
- AWS (ECS/App Runner)
- Azure (Container Apps)
- DigitalOcean (Droplets)

**Key Requirements:**
- ✅ Docker container hosting
- ✅ Managed Redis service
- ✅ Environment variables configured
- ✅ HTTPS/SSL enabled
- ✅ Supabase database setup

---

## 🎯 Extending the Demo

### Replace the Computation

Swap `compute_range_sum` in `backend/app/tasks.py` with your own task:

```python
@celery_app.task(bind=True)
def process_video_chunk(self, video_path: str, start: int, end: int):
    # Your custom logic here
    return result
```

### Add Authentication

```python
# backend/app/main.py
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.post("/jobs")
async def create_job(
    job: JobCreate,
    token: str = Depends(security)
):
    # Verify token and create job
    pass
```

### Add WebSockets

Replace polling with real-time updates:

```python
from fastapi import WebSocket

@app.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    await websocket.accept()
    # Stream updates
```

---

## 📚 Learn More

### Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Celery Documentation](https://docs.celeryq.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

### Related Projects
- [Celery Best Practices](https://docs.celeryq.dev/en/stable/userguide/tasks.html#best-practices)
- [FastAPI Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)
- [Redis Patterns](https://redis.io/docs/manual/patterns/)

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Feel free to use this for learning or production projects!

---

## 💡 Tips & Best Practices

### Performance
- **Scale workers horizontally**: Add more worker containers for higher throughput
- **Tune chunk size**: Balance between parallelism and overhead
- **Use Redis persistence**: Enable AOF/RDB for production

### Monitoring
- Add Flower for Celery monitoring: `pip install flower`
- Use Prometheus + Grafana for metrics
- Set up error tracking (Sentry, Rollbar)

### Security
- Never commit `.env` files
- Use secrets management (AWS Secrets Manager, Vault)
- Enable CORS only for trusted origins
- Add rate limiting to prevent abuse

---

**Built with ❤️ using FastAPI, Celery, Redis, and Next.js**

*Questions? Open an issue or start a discussion!*
