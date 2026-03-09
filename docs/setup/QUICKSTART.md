# WealthTrack Quick Start

WealthTrack is a self-hosted personal finance tracker. You run it locally or on your own server — your data stays with you, and nothing connects to your bank.

The app lets you track balances across all your financial institutions (banks, ISAs, pensions, investment accounts) in one place. You manually update balances whenever you like, and the app keeps the full history.

---

## Prerequisites

- Docker & Docker Compose
- Node.js v18+
- Python 3.12 (via pyenv: `pyenv local 3.12.12`)

---

## First-Time Setup

```bash
cp .env.dev.example .env.dev   # create your local config (gitignored)
make setup                      # install deps, run migrations, seed reference data
```

`make setup` handles everything in one step: Python deps, Node deps, database migrations, and seeding the reference data (account types, credential types, etc.).

---

## Starting the App

```bash
make dev
```

This starts the database, backend, and frontend together in the background.

- Frontend: http://localhost:3001
- Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

To start services individually:

```bash
make backend-dev    # FastAPI with hot-reload at http://localhost:8000
make frontend-dev   # Vite dev server at http://localhost:3001
```

---

## Running Tests

```bash
# Full check — run this before every PR
make pr-check

# Individual suites
make test-backend   # backend tests only
make test-frontend  # frontend tests only
make test-watch     # frontend watch mode
```

`make pr-check` runs against a completely separate test database (port 5434) so it never touches your dev data.

---

## Code Quality

```bash
make lint          # ruff + pylint + ESLint
make type-check    # mypy + tsc
make format        # auto-format (ruff + prettier)
make lint-fix      # auto-fix lint issues
```

---

## Before Opening a PR

```bash
make pr-check
```

Six steps must all pass:
1. Start isolated test database (port 5434)
2. Run migrations and seed reference data
3. Lint and type-check (backend + frontend)
4. Backend tests with ≥80% coverage
5. Frontend tests with coverage thresholds
6. Frontend production build

---

## What's in the App

- **Account Hub** — manage institutions and accounts, log balance updates, view history
- **Portfolio Table** — all accounts and balances grouped by institution, with total net worth
- **Analytics** — portfolio breakdown by type/institution/asset class, balance history charts
- **Credential Vault** — encrypted storage of institution login credentials
- **Reference Data Admin** — manage account types, statuses, and other lookup values

Household sharing (multiple users sharing a combined view) is planned for a future release.

---

## Troubleshooting

**Database connection refused**
```bash
make docker-up
# Wait a few seconds for the container to be ready, then retry
```

**Port 8000 in use**
```bash
lsof -ti:8000 | xargs kill -9
```

**Frontend build errors**
```bash
cd frontend
rm -rf node_modules
npm install
```

**Python module not found**
```bash
pyenv local 3.12.12
cd backend && pip install -r requirements.txt
```
