# External Integrations

**Analysis Date:** 2026-02-03

## APIs & External Services

**Authentication & User Management:**
- Custom JWT-based authentication (no external auth provider)
  - Implementation: `backend/app/services/auth.py`
  - Token validation: Bearer token in Authorization header
  - No Cognito, Auth0, or Firebase Auth integration

## Data Storage

**Databases:**

Primary Data Store:
- PostgreSQL 15 (via Docker container `wealthtrack-db`)
  - Connection: `postgresql+asyncpg://wealthtrack:wealthtrack_dev_password@localhost:5432/wealthtrack`
  - Environment variable: `DATABASE_URL` in `.env`
  - Async driver: asyncpg (Python driver for PostgreSQL)
  - ORM: SQLAlchemy 2.0.25 (`backend/app/database.py`)
  - Async session factory: `async_sessionmaker` for connection pooling

Database Schema Management:
- Alembic 1.13.1 - Migration tool for schema version control
- Base ORM class: `Base` from `backend/app/database.py`
- Models location: `backend/app/models/user.py`

Test Database:
- Separate PostgreSQL instance: `wealthtrack_test` database
- Connection: `postgresql+asyncpg://wealthtrack:wealthtrack_dev_password@localhost:5432/wealthtrack_test`
- Configured in `backend/tests/conftest.py`

**File Storage:**
- Local filesystem only - No external cloud storage (S3, GCS, Azure Blob)
- No attachment/document upload features implemented

**Caching:**
- None detected - No Redis or Memcached integration
- Session state: browser localStorage for auth token
- Token stored via: `localStorage.getItem('accessToken')` in `frontend/src/index.ts`

## Authentication & Identity

**Auth Provider:**
- Custom implementation (not delegated to external provider)

**Implementation Details:**
- Location: `backend/app/services/auth.py`
- Strategy: JWT (JSON Web Tokens)
- Algorithm: HS256 (HMAC SHA-256)
- Token expiration: Configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (default 30 minutes)
- Secret key: Environment variable `SECRET_KEY`

**Password Security:**
- Hashing: passlib with bcrypt algorithm
- Validation: email-validator package for email format
- Storage: User passwords hashed in PostgreSQL
- User model: `backend/app/models/user.py`

**Frontend Token Management:**
- Storage: Browser localStorage
- Header injection: `Authorization: Bearer {token}` via axios interceptor
- Token setter: `apiService.setAuthToken(token)` in `frontend/src/services/ApiService.ts`
- Token getter: Loaded on app startup from localStorage

**API Endpoints:**
- Registration: `POST /api/v1/auth/register` (`backend/app/controllers/auth.py`)
- Login: `POST /api/v1/auth/login` (returns `AuthToken` with access_token field)

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, Rollbar, or similar integration

**Logs:**
- Standard logging approach:
  - Backend: Python logging via uvicorn/FastAPI
  - Frontend: Console logging (warn/error only, per ESLint config `.eslintrc.json`)
  - No structured logging or centralized log aggregation
  - Docker Compose logs: `docker-compose logs` command

**Health Checks:**
- Backend: `GET /health` endpoint in `app/main.py` returns `{"status": "healthy"}`
- Docker: HEALTHCHECK in `backend/Dockerfile` pings `/health` endpoint every 30s
- Frontend: wget check for HTTP 200 status in `frontend/Dockerfile`

## CI/CD & Deployment

**Hosting:**
- Docker Compose orchestration (local/development)
- Deployment: Manual placeholder in `.github/workflows/ci.yml` (deploy job)
- Target: Self-hosted or cloud VM running Docker

**CI Pipeline:**
- Provider: GitHub Actions (`.github/workflows/ci.yml`)
- Trigger: Push to main/develop branches, pull requests
- Jobs:
  1. Backend lint/test: Ruff, mypy, pytest with coverage
  2. Frontend lint/test: ESLint, tsc, vitest with coverage
  3. Docker build: Build and push to Docker Hub (main branch only)
  4. Deploy: Placeholder for production deployment

**Container Registry:**
- Docker Hub (credentials via GitHub Secrets)
  - Backend image: `{DOCKER_USERNAME}/wealthtrack-backend:latest`
  - Frontend image: `{DOCKER_USERNAME}/wealthtrack-frontend:latest`
- Tags: `latest` and commit SHA for version control

**Secrets Management:**
- GitHub Secrets (`.github/workflows/ci.yml`):
  - `DOCKER_USERNAME` - Docker Hub username
  - `DOCKER_PASSWORD` - Docker Hub authentication token
  - Test database credentials passed via environment variables

## Environment Configuration

**Required env vars:**

Backend (from `backend/.env.example`):
- `DATABASE_URL` - PostgreSQL async connection string
- `ENVIRONMENT` - Deployment environment (development/test/production)
- `SECRET_KEY` - JWT signing key (MUST change in production)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token lifetime (default 30)
- `ALGORITHM` - JWT algorithm (HS256)

Frontend (from `frontend/.env.example`):
- `VITE_API_URL` - Backend API base URL (default: http://localhost:8000)

**Secrets location:**
- Development: `.env` files (local only, not committed)
- Docker: Environment variables in `docker-compose.yml` (dev credentials hardcoded)
- Production: GitHub Secrets or environment passed to container runtime
- Never commit: `.env` files should use `.gitignore` (present in repo)

**Configuration Loading:**
- Backend: Pydantic BaseSettings from `app/config.py` (loads from .env via Config.env_file)
- Frontend: Vite environment variables via `import.meta.env` (prefixed with VITE_)

## Webhooks & Callbacks

**Incoming:**
- None detected - No webhook endpoints for external services
- No Stripe, PayPal, or third-party callbacks

**Outgoing:**
- None detected - No outgoing webhook calls to external systems
- No event notifications to external services

**API Documentation:**
- Auto-generated by FastAPI:
  - Swagger UI: `http://localhost:8000/docs`
  - ReDoc: `http://localhost:8000/redoc`
  - OpenAPI schema: `http://localhost:8000/openapi.json`

## CORS & API Access

**CORS Configuration:**
- Backend CORS middleware: `backend/app/main.py` (CORSMiddleware)
- Allowed origins: `http://localhost:3000`, `http://localhost:8080`
- Credentials: Enabled
- Methods: All HTTP methods
- Headers: All headers

**Frontend API Client:**
- Location: `frontend/src/services/ApiService.ts`
- Base URL: Environment variable `VITE_API_URL` or `http://localhost:8000`
- Headers: `Content-Type: application/json`
- Auth: Bearer token in Authorization header

---

*Integration audit: 2026-02-03*
