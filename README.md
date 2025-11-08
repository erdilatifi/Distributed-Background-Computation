# 🚀 Distributed Background Computation Demo

> **FastAPI + Celery + Redis + Next.js** - A production-ready template for building scalable background job processing systems

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Celery](https://img.shields.io/badge/Celery-5.3.6-37814A?logo=celery)](https://docs.celeryq.dev/)

## 🌐 Live Demo

**Try it now!** The application is deployed on Railway:

- 🎨 **Frontend**: [https://distributed-computation.up.railway.app](https://distributed-computation.up.railway.app)
- 🔌 **API**: [https://distributed-background-computation-production.up.railway.app](https://distributed-background-computation-production.up.railway.app)
- 📚 **API Docs**: [https://distributed-background-computation-production.up.railway.app/docs](https://distributed-background-computation-production.up.railway.app/docs)

> ⚠️ **Note**: The API may take 30-60 seconds to respond on first request (Railway free tier cold start). Please be patient!

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
| 📊 **Real-Time Progress** | Live progress tracking with animated UI updates and enhanced status messages |
| 🎮 **Try It Demo** | Public demo widget on homepage - no signup required |
| 🔐 **Authentication** | Supabase auth with JWT tokens and user profiles |
| 🎯 **Dashboard** | Personal dashboard with preset buttons, job history, and API token management |
| 🎨 **Modern UI** | Next.js + shadcn/ui + Tailwind CSS with beautiful dark theme |
| 🐳 **Fully Containerized** | One command to run everything: `docker compose up` |
| 🧪 **Tested** | Pytest suite with 90%+ coverage using Celery eager mode |
| 📦 **Production Ready** | Redis for state, FastAPI for API, Celery for workers |
| 🔌 **API First** | RESTful API with OpenAPI docs at `/docs` |
| ♿ **Accessible** | WCAG compliant UI components from shadcn/ui |
| 🛡️ **Rate Limiting** | Per-IP token bucket rate limiter (10 req/min for authenticated, 5 req/min for demo) |
| 🔁 **Auto-Retry** | Intelligent network error detection with automatic retry (10s delay) |
| ⚡ **Cold-Start Guard** | Warming banner with health status when API/workers are starting |
| 🎯 **Smart Presets** | Quick preset buttons (Small/Medium/Large) with collapsible advanced options |
| 🔒 **Idempotency** | Duplicate submission prevention using Idempotency-Key headers (24h cache) |
| ⏱️ **Task Time Limits** | Soft (5min) and hard (6min) limits prevent stuck jobs |
| 📈 **Enhanced Monitoring** | Comprehensive `/monitoring/health` and `/metrics-lite` endpoints |
| 🧹 **Auto-Cleanup** | 24-hour job retention with automatic cleanup |

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js UI    │ ← User Interface (Port 3000)
│  (TypeScript)   │
└────────┬────────┘
         │ HTTP Polling / SSE
         ↓
┌─────────────────┐
│   FastAPI API   │ ← REST API (Port 8000)
│   (Python 3.11) │    /v1 endpoints
│   + /healthz    │    /metrics
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────────┐
│ Redis  │ │ Celery Worker│ ← Task Processing
│ Broker │ │  (Python)    │    Scalable
└────────┘ └──────────────┘
```

> 📊 **Detailed Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md) for comprehensive diagrams, data flows, and scaling strategies.

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
├── frontend/                # Next.js 14 application
│   ├── app/                # App Router pages (Next.js 14)
│   │   ├── page.tsx       # Homepage with Try It demo
│   │   ├── dashboard/     # User dashboard
│   │   ├── login/         # Login page
│   │   ├── register/      # Registration page
│   │   └── docs/          # API documentation
│   ├── components/         # React components
│   │   ├── Navbar.tsx     # Navigation with auth state
│   │   ├── TryItDemo.tsx  # Public demo widget
│   │   └── ui/            # shadcn/ui components
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml       # Multi-service orchestration
├── .env.example            # Environment template
└── README.md
```

---

## 🚀 Quick Start

### ⚡ Try Demo Without Setup (30 seconds)

No installation needed! Test the public API instantly:

> ⚠️ **First Request**: API may take 30-60s to wake up (Railway free tier). Subsequent requests are fast!

```bash
# Create a demo job (no auth required)
curl -X POST https://distributed-background-computation-production.up.railway.app/v1/jobs/demo \
  -H "Content-Type: application/json" \
  -d '{"n": 1000, "chunks": 4}'

# Response: {"job_id": "abc-123...", "status": "pending"}

# Check status (replace JOB_ID with the one from above)
curl https://distributed-background-computation-production.up.railway.app/v1/jobs/demo/JOB_ID

# Response: {"job_id": "abc-123...", "status": "completed", "result": 500500, "progress": 1.0}
```

**Demo Limits:** Max n=10,000, Max chunks=8, Rate: 5 requests/minute per IP

### 🔒 Rate Limiting & Idempotency

**Rate Limits:**
- **Authenticated endpoints** (`/jobs`): 10 requests/minute per IP
- **Demo endpoints** (`/jobs/demo`): 5 requests/minute per IP
- **429 Response**: When rate limit exceeded, response includes `Retry-After` header (seconds until reset)

**Idempotency Keys:**
Prevent duplicate job creation on network retries by including an `Idempotency-Key` header:

```bash
curl -X POST https://distributed-background-computation-production.up.railway.app/v1/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Idempotency-Key: unique-request-id-12345" \
  -d '{"n": 10000, "chunks": 8}'
```

- Same key within 24 hours returns the original response (no duplicate job)
- Use UUID or timestamp-based keys for uniqueness
- Cached responses expire after 24 hours

---

### Prerequisites

- **Docker Desktop** (includes Docker Engine + Compose)
- That's it! No Python or Node.js installation needed

### 1️⃣ Clone & Setup

```bash
# Clone the repository
git clone https://github.com/erdilatifi/Distributed-Background-Computation.git
cd Distributed-Background-Computation

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

**Local Development:**
Visit **[http://localhost:3000](http://localhost:3000)**

**Production (Railway):**
Visit **[https://distributed-computation.up.railway.app](https://distributed-computation.up.railway.app)**

### Option 1: Try Without Signup (Quickest!)

1. Visit the homepage
2. Scroll to the **"Try It Now"** widget
3. Click **Run Demo** button
4. Watch real-time progress calculating sum(1..1000) = **500,500**! 🎉

### Option 2: Full Features (Requires Account)

1. Click **Get Started Free** to register
2. Login with your email
3. Access the **Dashboard** (visible in navbar)
4. Enter a number (e.g., `10000`)
5. Choose parallel chunks (e.g., `8`)
6. Click **Submit Job**
7. Track progress and view job history
8. Copy your **API Access Token** for programmatic access

---

## 🔧 API Reference

### Base URL

**All API endpoints are prefixed with `/v1`:**
- Local: `http://localhost:8000/v1`
- Production: `https://distributed-background-computation-production.up.railway.app/v1`

### Health & Monitoring

**Health Check:**
```bash
curl http://localhost:8000/healthz
# Response: {"status": "healthy", "service": "fastapi-celery-demo", "version": "2.0.0"}
```

**Prometheus Metrics:**
```bash
curl http://localhost:8000/metrics
# Returns Prometheus-format metrics for monitoring
```

### Authentication

Most endpoints require a JWT bearer token from Supabase authentication.

**Get your token:**
1. Register/Login at the frontend
2. Go to **Dashboard** (visible in navbar)
3. Copy your **API Access Token** from the prominent card
4. Use in Authorization header: `Bearer YOUR_TOKEN`

**Demo endpoints** (`/v1/jobs/demo`) don't require authentication - perfect for testing!

### Create a Job

**Endpoint:** `POST /v1/jobs`

**Local:**
```bash
curl -X POST http://localhost:8000/v1/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"n": 10000, "chunks": 8}'
```

**Production:**
```bash
curl -X POST https://distributed-background-computation-production.up.railway.app/v1/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"n": 10000, "chunks": 8}'
```

**Success Response (202 Accepted):**
```json
{
  "job_id": "3c50e7d3-5c6f-4f74-9c77-b0b28c6b948b",
  "status": "pending",
  "cached": false
}
```

**Error Responses:**

**400 Bad Request** - Invalid parameters:
```json
{
  "detail": "n must be between 1 and 1000000"
}
```

**422 Unprocessable Entity** - Validation error:
```json
{
  "detail": [
    {
      "loc": ["body", "n"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error.number.not_gt"
    }
  ]
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "detail": "Rate limit exceeded: 10 per 1 minute"
}
```
*Headers:* `Retry-After: 45` (seconds until reset)

### Check Job Status

**Endpoint:** `GET /v1/jobs/{job_id}`

**Local:**
```bash
curl http://localhost:8000/v1/jobs/3c50e7d3-5c6f-4f74-9c77-b0b28c6b948b \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Production:**
```bash
curl https://distributed-background-computation-production.up.railway.app/v1/jobs/3c50e7d3-5c6f-4f74-9c77-b0b28c6b948b \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200 OK):**
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

**Error Response:**

**404 Not Found** - Job doesn't exist:
```json
{
  "detail": "Job not found."
}
```

### Cancel a Job

**Endpoint:** `DELETE /v1/jobs/{job_id}`

```bash
curl -X DELETE http://localhost:8000/v1/jobs/3c50e7d3-5c6f-4f74-9c77-b0b28c6b948b \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response:** `204 No Content`

**Error Response:**

**404 Not Found** - Job doesn't exist or not owned by user:
```json
{
  "detail": "Job not found"
}
```

### Stream Job Events (SSE)

**Endpoint:** `GET /v1/jobs/{job_id}/events`

Receive real-time job updates via Server-Sent Events:

```bash
curl -N http://localhost:8000/v1/jobs/{job_id}/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Event Stream:**
```
event: status
data: {"job_id":"...","status":"running","progress":0.5,"completed_chunks":4,"total_chunks":8}

event: status
data: {"job_id":"...","status":"completed","progress":1.0,"completed_chunks":8,"total_chunks":8,"result":50005000}

event: done
data: {"status":"completed"}
```

### Demo Endpoints (No Authentication Required)

For quick testing without signup:

**Create Demo Job:** `POST /v1/jobs/demo`
```bash
curl -X POST http://localhost:8000/v1/jobs/demo \
  -H "Content-Type: application/json" \
  -d '{"n": 1000, "chunks": 4}'
```

**Response:**
```json
{
  "job_id": "abc-123-def-456",
  "status": "pending"
}
```

**Check Demo Job Status:** `GET /v1/jobs/demo/{job_id}`
```bash
curl http://localhost:8000/v1/jobs/demo/abc-123-def-456
```

**Demo Limits:**
- Rate: 5 requests/minute per IP
- Max n: 10,000
- Max chunks: 8

### API Documentation

**Local Development:**
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/healthz](http://localhost:8000/healthz)
- **Metrics**: [http://localhost:8000/metrics](http://localhost:8000/metrics)

**Production (Railway):**
- **Swagger UI**: [https://distributed-background-computation-production.up.railway.app/docs](https://distributed-background-computation-production.up.railway.app/docs)
- **ReDoc**: [https://distributed-background-computation-production.up.railway.app/redoc](https://distributed-background-computation-production.up.railway.app/redoc)
- **Health Check**: [https://distributed-background-computation-production.up.railway.app/healthz](https://distributed-background-computation-production.up.railway.app/healthz)
- **Metrics**: [https://distributed-background-computation-production.up.railway.app/metrics](https://distributed-background-computation-production.up.railway.app/metrics)

> ⚠️ **Note**: First request to production API may take 30-60s (cold start). Check `/healthz` first!

---

## 🧪 Testing

Run the test suite inside the API container:

```bash
docker compose run --rm api pytest
```

**Features:**
- ✅ Celery eager mode (no broker needed)
- ✅ FakeRedis for fast in-memory testing
- ✅ Comprehensive test coverage
- ✅ Tests for job create/status/result
- ✅ Rate limiting behavior tests
- ✅ Error handling and validation tests
- ✅ Idempotency key tests
- ✅ Health check and metrics tests

**Run with coverage:**
```bash
docker compose run --rm api pytest --cov=app --cov-report=html
```

**Run specific tests:**
```bash
# Test job operations
docker compose run --rm api pytest backend/app/tests/test_jobs.py::test_create_and_complete_job

# Test rate limiting
docker compose run --rm api pytest backend/app/tests/test_jobs.py::test_rate_limiting
```

---

## 🎨 Frontend Features

### UI Components
- **Progress Bar** - Animated real-time progress with percentage
- **Chunk Bars** - Visual bars showing individual chunk completion
- **Status Badges** - Color-coded job states (pending, running, completed, failed)
- **Chunk Metrics** - Live count of completed/total chunks (e.g., "3/4 chunks")
- **Warming Banner** - Alert when API is cold starting with real-time health status (API, worker, redis)
- **Preset Selector** - Quick preset buttons (Small/Medium/Large) with estimated completion times
- **Advanced Options** - Collapsible section for custom n and chunks values with explanatory text
- **Enhanced Progress Messages** - Emoji-based status updates (📋 Queued, 🚀 Starting, ⚙️ Running, 🔄 Merging, ✅ Complete)
- **Auto-Retry UI** - Friendly messages during automatic retry with countdown
- **Error Handling** - User-friendly error messages with emoji indicators
- **Dark Theme** - Beautiful dark mode by default
- **Responsive** - Works on mobile, tablet, and desktop

### Tech Stack
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **State**: React hooks with polling
- **Auth**: Supabase Authentication

### Page Features

#### Homepage
- **Hero Section** - Clear value proposition with "Get Started Free" CTA
- **Try It Demo Widget** - Interactive demo without signup
  - Pre-configured: n=1000, chunks=4
  - Real-time progress bar with percentage
  - Visual chunk bars showing individual chunk completion
  - Shows chunk completion count (e.g., "3/4 chunks")
  - Warming banner with retry logic for cold starts
  - Displays final result: 500,500
  - Rate limited: 5 requests/minute
  - Link to sign up for more features
- **Stats Cards** - High Availability, Fast Response Times, Production Ready, Enterprise Security
  - All cards clickable and link to documentation
- **Features Grid** - Detailed feature descriptions with icons
- **Tech Stack Showcase** - Visual display of technologies used

#### Dashboard (Authenticated Users)
- **Job Submission Form** - Quick preset buttons (Small/Medium/Large) or custom values via advanced options
  - **Presets**: Pre-configured values with estimated completion times
  - **Advanced Options**: Collapsible section for custom n and chunks with helpful explanatory text
- **User Statistics Cards** - Total jobs, completed, failed, average duration
- **API Access Token Card** - Prominent display with:
  - Full bearer token in monospace font
  - One-click copy button with visual feedback ("Copied!")
  - Example API request code snippet
  - Instructions on how to use the token
- **Job History Table** - Paginated list of all jobs with:
  - Status badges (pending, running, completed, failed)
  - Progress indicators and percentages
  - Timestamps (created, started, completed)
  - Results and error messages
  - Pagination controls

#### Navigation
- **Navbar** - Responsive navigation with:
  - Logo and branding
  - Links: Home | Dashboard | Docs (Dashboard visible to all, protected route)
  - Auth state: Sign In/Register buttons OR User dropdown menu
  - Consistent "Get Started Free" CTA
  - Mobile-friendly hamburger menu
  - Scroll effects and animations
- **Dashboard Link** - Visible to all users
  - Unauthenticated users → redirected to login page
  - Authenticated users → access dashboard directly

---

## ❓ Quick Troubleshooting FAQ

### API Returns 500 Error or /docs Not Loading
- **Railway cold start**: First request may take 30-60s to wake the server (free tier sleeps after inactivity)
- **Solution**: Wait 30-60 seconds and retry, or check `/healthz` endpoint first
- **Tip**: The Try-it widget shows a warming banner when API is cold starting

### CORS Errors in Browser
- **Cause**: Frontend URL not in `BACKEND_CORS_ORIGINS`
- **Solution**: Add your frontend URL to `.env`: `BACKEND_CORS_ORIGINS=http://localhost:3000,https://yourdomain.com`

### Jobs Stuck in "Pending"
- **Cause**: Celery workers not running or Redis connection issue
- **Solution**: Check worker logs: `docker compose logs -f worker`
- Verify Redis: `docker compose exec redis redis-cli ping` (should return PONG)

### "Job not found" Error
- **Cause**: Job expired from Redis (default TTL) or wrong job_id
- **Solution**: Jobs are stored for 24 hours; check the job_id is correct

### API Docs (/docs) Not Loading
- **Cause**: API service not running or Railway sleeping
- **Solution**: Check `/healthz` first, wait for cold start (~30s)

---

## 🐛 Detailed Troubleshooting

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

**This app is currently deployed on Railway!**

**Live URLs:**
- Frontend: [https://distributed-computation.up.railway.app](https://distributed-computation.up.railway.app)
- API: [https://distributed-background-computation-production.up.railway.app](https://distributed-background-computation-production.up.railway.app)

**Deploy your own:**

1. Push to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Create 4 services:
   - **Redis** (Database → Redis)
   - **API** (Dockerfile: `backend/Dockerfile`, Config: `railway.toml`)
   - **Worker** (Dockerfile: `worker/Dockerfile`, Config: `railway.worker.toml`)
   - **Frontend** (Root: `frontend`, Dockerfile: `frontend/Dockerfile`)
5. Set environment variables for each service
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
