# Technology Stack

**Analysis Date:** 2026-02-03

## Languages

**Primary:**
- Python 3.11 - Backend API development (FastAPI framework)
- TypeScript 5.3.3 - Frontend development (Vite build tool)

**Secondary:**
- JavaScript - Frontend tooling (Node.js ecosystem)
- SQL - PostgreSQL database queries

## Runtime

**Environment:**
- Python 3.11 - Backend runtime
- Node.js 20 - Frontend development runtime
- Docker 20+ - Containerization for both services

**Package Manager:**
- pip - Python package manager
- npm - Node.js package manager
- Lockfile: `backend/requirements.txt`, `frontend/package-lock.json` present

## Frameworks

**Core:**
- FastAPI 0.109.0 - Python async web framework for REST API
- Vite 5.0.11 - Frontend build tool and dev server
- Uvicorn 0.27.0 - ASGI application server for FastAPI

**Testing:**
- pytest 7.4.4 - Python test runner (`backend/pytest.ini` config)
- pytest-asyncio 0.23.3 - Async test support for FastAPI
- vitest 1.1.1 - TypeScript/JavaScript test runner (`frontend/vitest.config.ts`)
- jsdom 23.2.0 - DOM implementation for browser-like testing

**Build/Dev:**
- TypeScript 5.3.3 - Type checking for frontend
- Vite 5.0.11 - Bundling and development server
- mypy 1.8.0 - Python static type checker
- ruff 0.1.14 - Python linter and formatter
- ESLint 8.56.0 - TypeScript/JavaScript linter

## Key Dependencies

**Critical:**

Backend:
- SQLAlchemy 2.0.25 - ORM for database operations
- asyncpg 0.29.0 - Async PostgreSQL driver for connection pooling
- Pydantic 2.5.3 - Data validation and serialization using Python type hints
- pydantic-settings 2.1.0 - Settings management from environment variables
- Alembic 1.13.1 - Database migration management

Frontend:
- axios 1.6.5 - HTTP client for API communication with backend
- @typescript-eslint/eslint-plugin 6.17.0 - TypeScript-aware ESLint rules
- @types/node 20.10.6 - Type definitions for Node.js APIs

**Infrastructure:**

Backend:
- passlib[bcrypt] 1.7.4 - Password hashing and verification
- python-jose[cryptography] 3.3.0 - JWT token creation and validation
- email-validator 2.1.0 - Email validation library
- python-dotenv 1.0.0 - Load environment variables from .env files
- python-multipart 0.0.6 - Form data parsing for FastAPI
- pytest-cov 4.1.0 - Test coverage reporting

Frontend:
- @vitest/coverage-v8 1.1.1 - Code coverage reporting for tests

## Configuration

**Environment:**

Backend configuration via `app/config.py` with Pydantic BaseSettings:
- DATABASE_URL - PostgreSQL connection string (async format with asyncpg)
- SECRET_KEY - JWT signing secret key
- ALGORITHM - JWT algorithm (HS256)
- ACCESS_TOKEN_EXPIRE_MINUTES - Token expiration time (30 minutes)
- ENVIRONMENT - deployment environment (development/production)
- API_V1_PREFIX - API route prefix (/api/v1)

Frontend configuration via environment variables:
- VITE_API_URL - Backend API base URL (http://localhost:8000)

Files:
- `backend/.env.example` - Backend environment template
- `frontend/.env.example` - Frontend environment template

**Build:**

Backend:
- `backend/ruff.toml` - Linting rules (line length 100, Python 3.11 target)
- `backend/mypy.ini` - Type checking configuration (strict mode, SQLAlchemy plugin)
- `backend/pytest.ini` - Test configuration (coverage ≥90% required, asyncio_mode=auto)

Frontend:
- `frontend/tsconfig.json` - TypeScript compiler options (strict mode, ES2020 target)
- `frontend/.eslintrc.json` - ESLint rules (strict TypeScript checking)
- `frontend/vite.config.ts` - Vite bundler configuration (port 3000, @ alias for src/)
- `frontend/vitest.config.ts` - Test runner configuration (jsdom environment, 90% coverage threshold)

## Platform Requirements

**Development:**

- Python 3.11+
- Node.js 20+
- Docker and Docker Compose (version 3.8+)
- PostgreSQL 15+ (via Docker)
- Git

Local setup requires:
- Python virtual environment: `python -m venv venv`
- Backend dependencies: `pip install -r backend/requirements.txt`
- Frontend dependencies: `npm install` in frontend directory

**Production:**

- Docker and Docker Compose
- PostgreSQL 15+ database
- Environment secrets configured (SECRET_KEY, DATABASE_URL)

Deployment targets:
- Docker containers orchestrated via docker-compose
- Backend exposed on port 8000
- Frontend exposed on port 3000
- PostgreSQL database on port 5432
- Images pushed to Docker Hub (via GitHub Actions CI/CD)

## CI/CD Pipeline

**GitHub Actions** workflow (`.github/workflows/ci.yml`):
- Triggered on push to main/develop branches and pull requests
- Backend job: Python 3.11 setup, Ruff linting, mypy type check, pytest with coverage
- Frontend job: Node.js 20 setup, ESLint linting, TypeScript type check, vitest with coverage
- Docker build job: Build and push images to Docker Hub on main branch
- Coverage reports: Upload to Codecov using codecov/codecov-action v3

---

*Stack analysis: 2026-02-03*
