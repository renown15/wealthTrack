# Docker Compose Architecture - Unified Multi-Environment Setup

## Overview

WealthTrack uses a **single `docker-compose.yml` file** configured for multiple environments using:
- **Environment variables** (`.env` files)
- **Docker profiles** (selective service startup)

This approach follows Docker best practices and avoids file duplication.

## File Structure

```
wealthTrack/
├── docker-compose.yml       # Single source of truth (parametrized)
├── .env.dev                 # Development environment
├── .env.test                # Test environment (E2E)
├── .env.prod                # Production environment
└── ... (other files)
```

## Environments

### Development (Default)

**File**: `.env.dev`

```bash
# Start development environment
docker-compose --env-file .env.dev --profile dev up -d

# Services:
# - db (PostgreSQL on port 5433)
# - backend (API on port 8000, with reload)
# - frontend (Web UI on port 3000)

# Use this for:
- Local development
- Testing changes locally
- Using `make dev` or `make docker-up`
```

**Configuration**:
- Database: localhost:5433 (dev)
- Backend: localhost:8000
- Frontend: localhost:3000
- Auto-reload enabled
- Hot module reloading enabled

### Test (E2E)

**File**: `.env.test`

```bash
# Start test environment
docker-compose --env-file .env.test --profile test up -d

# Services:
# - db (PostgreSQL on port 5434, isolated from dev!)
# - backend (API on port 8001)
# - frontend (NOT started - E2E uses Vite dev server)

# Use this for:
- Running E2E tests with `make test-e2e`
- Isolating test data from development
- CI/CD pipelines
```

**Configuration**:
- Database: localhost:5434 (isolated!)
- Backend: localhost:8001 (isolated!)
- Frontend: Uses Vite dev server (localhost:5173)
- No auto-reload
- Clean state for each test run

### Production

**File**: `.env.prod`

```bash
# Start production environment
docker-compose --env-file .env.prod --profile prod up -d

# Services:
# - db (PostgreSQL on standard port 5432)
# - backend (API on port 8000)
# - frontend (Web UI on port 80)

# Use this for:
- Production deployment
- Final testing before deployment
```

**Configuration**:
- Database: Creates persistent volumes
- Backend: No reload, optimized image
- Frontend: Optimized production build
- Environment: `production`
- Secret management from CI/CD secrets

## Parameter Explanation

The `docker-compose.yml` uses environment variable substitution:

```yaml
# Example from docker-compose.yml
container_name: ${DB_CONTAINER:-wealthtrack-db}
ports:
  - "${DB_PORT:-5432}:5432"
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres_password}
```

Syntax:
- `${VAR}` - Use environment variable VAR
- `${VAR:-default}` - Use VAR, or "default" if not set

### Key Variables

| Variable | Dev | Test | Prod | Purpose |
|----------|-----|------|------|---------|
| `DB_PORT` | 5433 | 5434 | 5432 | Host port (container always 5432) |
| `BACKEND_PORT` | 8000 | 8001 | 8000 | Backend API port |
| `FRONTEND_PORT` | 3000 | - | 80 | Frontend UI port |
| `DB_CONTAINER` | wealthtrack-db-dev | wealthtrack-db-test | wealthtrack-db-prod | Container name |
| `DB_VOLUME` | pgdata | wealthtrack-db-test-volume | wealthtrack-db-prod-volume | Volume name |
| `ENVIRONMENT` | development | test | production | App environment |

## Docker Profiles

The `docker-compose.yml` uses `profiles` to control which services start:

```yaml
db:
  profiles: [ "dev", "test", "prod" ]  # All environments

backend:
  profiles: [ "dev", "test", "prod" ]  # All environments

frontend:
  profiles: [ "dev", "prod" ]          # Only dev and prod (not test)
```

Why no frontend in test?
- E2E tests use Playwright + Vite dev server (localhost:5173)
- Don't need Docker frontend service
- Faster startup for tests

## Commands

### Development Setup

```bash
# Start all services
docker-compose --env-file .env.dev --profile dev up -d

# Or use make
make docker-up

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

### Test Setup

```bash
# Start test environment
docker-compose --env-file .env.test --profile test up -d

# Or use make (automatic via E2E test setup)
make test-e2e

# Clean up
docker-compose --env-file .env.test --profile test down -v
```

### Production Setup

```bash
# Start all services with production config
docker-compose --env-file .env.prod --profile prod up -d

# Note: In CI/CD, secrets would be set via environment
# export SECRET_KEY="<strong-secret>"
# export POSTGRES_PASSWORD="<strong-password>"
# then: docker-compose --env-file .env.prod up -d
```

## Port Conflict Prevention

```
Development:     db:5433   backend:8000   frontend:3000
Test:            db:5434   backend:8001   frontend:(none)
Production:      db:5432   backend:8000   frontend:80
```

Each environment uses different ports to prevent conflicts when running multiple simultaneously (e.g., dev + test side-by-side).

## Volume Management

Volumes are environment-specific:

```yaml
Development:   pgdata                          # Default named volume
Test:          wealthtrack-db-test-volume      # Test-specific volume
Production:    wealthtrack-db-prod-volume      # Prod-specific volume
```

Each `docker-compose down -v` only removes that environment's volumes.

## Secrets Management

### Development

Defaults to simple passwords in `.env.dev` (OK for local dev):
```bash
POSTGRES_PASSWORD=postgres_password
SECRET_KEY=dev-secret-key-change-in-production
```

### Production

Secrets injected at deployment time (from CI/CD, Vault, etc.):

```bash
# In Dockerfile or CI/CD
export SECRET_KEY=$(get-secret SECRET_KEY)
export POSTGRES_PASSWORD=$(get-secret DB_PASSWORD)

docker-compose --env-file .env.prod up -d
```

Or with `.env.prod` containing placeholders:
```bash
SECRET_KEY=${SECRET_KEY}        # CI/CD sets this
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}  # CI/CD sets this
```

## E2E Testing Architecture

The E2E setup uses docker-compose for isolated containers:

```
make test-e2e
  ↓
global-setup.ts
  ↓
docker-compose --env-file .env.test --profile test up -d
  ↓
Database (port 5434) + Backend API (port 8001) start
  ↓
Playwright connects to Frontend (Vite, port 5173)
  ↓
Frontend makes requests to Backend (port 8001)
  ↓
Backend queries Database (port 5434)
  ↓
Tests execute and verify in UI + database
  ↓
global-teardown.ts
  ↓
docker-compose --env-file .env.test --profile test down -v
```

## Migration Path

If you have an existing separate `test-docker-compose.yml`:

1. The changes to `docker-compose.yml` are backward compatible
2. You can use either approach temporarily
3. Eventually remove separate compose files in favor of profiles + `.env` files

## Advantages of This Approach

✅ **Single Source of Truth**: One docker-compose.yml for all environments
✅ **DRY**: No duplication of service definitions
✅ **Clear Separation**: Different .env files make configuration explicit
✅ **Scalable**: Easy to add new environments (e.g., staging, qa)
✅ **CI/CD Friendly**: Environment variables from CI/CD secrets
✅ **Docker Best Practice**: Standard Docker Compose patterns
✅ **Conflict Prevention**: Different ports for different environments
✅ **Easy Testing**: Full isolation for E2E tests

## Example: Adding a Staging Environment

```bash
# 1. Create .env.staging
cp .env.prod .env.staging
# Edit with staging-specific values (ports, URLs, etc.)

# 2. Add staging profile to docker-compose.yml services
profiles: [ "dev", "test", "staging", "prod" ]

# 3. Run staging
docker-compose --env-file .env.staging --profile staging up -d
```

## Troubleshooting

### Port already in use

Different environments use different ports. If conflict:
```bash
# Check what's running
docker ps | grep wealthtrack

# Stop specific environment
docker-compose --env-file .env.dev down

# Or clean everything
docker-compose --env-file .env.dev down -v
docker-compose --env-file .env.test down -v
```

### Wrong environment running

Always verify which compose file and profile:
```bash
# Show what would be used
docker-compose --env-file .env.dev config | grep container_name

# Or just check running containers
docker ps | grep wealthtrack
```

### Database won't connect

Ensure correct port is specified:
```bash
# Dev
psql -h localhost -p 5433 -U wealthtrack -d wealthtrack

# Test
psql -h localhost -p 5434 -U wealthtrack_test -d wealthtrack_test

# Prod
psql -h localhost -p 5432 -U wealthtrack_prod -d wealthtrack_prod
```

## Summary

**Old approach**: Separate `docker-compose.yml` and `test-docker-compose.yml` files
  - Duplication ❌
  - Hard to maintain ❌
  - Redundant configuration ❌

**New approach**: Single `docker-compose.yml` with `.env.*` files and profiles
  - DRY principle ✅
  - Easy to maintain ✅
  - Standard Docker best practices ✅
  - Clear environment separation ✅
  - Perfect for CI/CD ✅

Use the environment-specific `.env.*` file and appropriate profile for your use case.
