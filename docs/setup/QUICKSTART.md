# WealthTrack Quick Start

## Prerequisites

- Docker & Docker Compose
- Node.js v18+
- Python 3.12 (via pyenv: `pyenv local 3.12.12`)

---

## 1. Start the Dev Database

```bash
cd /Users/marklewis/dev/wealthTrack
make docker-up
```

This starts PostgreSQL on port 5432 (dev) using Docker Compose.

---

## 2. Apply Migrations

```bash
make migrate
```

Runs all Alembic migrations (currently through migration 025).

---

## 3. Seed Reference Data

```bash
make seed-db
```

Seeds canonical reference data (account types, statuses, credential types, etc.).

---

## 4. Backend Development Server

```bash
make backend-dev
```

Starts FastAPI with hot-reload at http://localhost:8000.
- Swagger UI: http://localhost:8000/docs

---

## 5. Frontend Development Server

```bash
make frontend-dev
```

Starts Vite dev server at http://localhost:5173.

---

## 6. Full Stack

```bash
make dev
```

Runs backend + frontend concurrently.

---

## Running Tests

```bash
# All tests (isolated test DB, full coverage check)
make pr-check

# Backend tests only
make test-backend

# Frontend tests only (runs backend lint/type-check first)
make test-frontend

# Watch mode
make test-watch
```

---

## Code Quality

```bash
make lint          # Run all linters (ruff + pylint + ESLint)
make type-check    # mypy + tsc
make format        # Auto-format (ruff + prettier)
make lint-fix      # Auto-fix lint issues
```

---

## PR Readiness Check

Before opening a PR, run:

```bash
make pr-check
```

This runs in an isolated test environment:
1. Starts a separate test database (port 5434)
2. Runs migrations + seeds
3. Lints and type-checks (backend + frontend)
4. Runs backend tests with ≥80% coverage
5. Runs frontend tests with coverage thresholds
6. Builds frontend for production

All 6 steps must pass.

---

## Application Features

The app is fully built (v1 minus household sharing):

- **Account Hub** — manage institutions, accounts, balance events
- **Portfolio Table** — grouped view of all accounts and balances
- **Analytics** — charts for portfolio breakdown and history
- **Credential Vault** — encrypted storage of institution credentials
- **Reference Data Admin** — manage account types, statuses, etc.

---

## Troubleshooting

### Database connection refused
```bash
make docker-up
# Wait ~5 seconds, then retry
```

### Port 8000 in use
```bash
lsof -ti:8000 | xargs kill -9
```

### Frontend build errors
```bash
cd frontend
rm -rf node_modules
npm install
npm run build
```

### Python module not found
```bash
# Ensure correct Python version
pyenv local 3.12.12
cd backend && pip install -r requirements.txt
```
