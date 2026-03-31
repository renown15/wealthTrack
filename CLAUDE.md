# WealthTrack — Agent Context

## What This Is

A personal wealth management app: one place to see all your accounts and balances across financial institutions, with encrypted credential storage.

**Status:** Phase 6/7 complete — v1 feature-complete. Phase 7 (Household Sharing) not yet built.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy (async), PostgreSQL 15, Alembic, Pydantic v2 |
| Frontend | Vue 3, TypeScript, Vite, UnoCSS, Vue Router, vue-toastification |
| Backend testing | pytest, pytest-asyncio |
| Frontend testing | Vitest, happy-dom |
| Backend quality | ruff, pylint, mypy |
| Frontend quality | ESLint, tsc (strict) |

## Project Structure

```
wealthTrack/
├── backend/
│   ├── app/
│   │   ├── controllers/    # FastAPI route handlers (thin)
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # DB queries (SQLAlchemy)
│   │   ├── models/         # SQLAlchemy ORM models
│   │   └── schemas/        # Pydantic request/response schemas
│   ├── alembic/            # DB migrations (~26 versions)
│   └── tests/              # ~364 backend tests
├── frontend/
│   ├── src/
│   │   ├── composables/    # Vue 3 composition API business logic
│   │   ├── views/          # Page components (thin wrappers)
│   │   ├── services/       # API client services
│   │   ├── models/         # TypeScript data models
│   │   └── utils/          # Shared utilities (debug.ts etc.)
│   └── tests/              # ~889 frontend tests across 89 files
│       └── e2e/            # 5 Playwright E2E specs (run separately via make test-e2e)
├── scripts/                # setup-dev.sh, dev.sh, seed-db.py, e2e-teardown.sh
├── .env.dev.example        # Template for local dev config
├── .env.dev                # Local dev config (gitignored)
├── .env.test               # Test environment config (gitignored)
├── docker-compose.yml      # Dev (port 5433) + test (port 5434) DB containers
└── Makefile                # All developer commands
```

## The Gate: `make pr-check`

Run this before every PR. It uses an isolated test database (port 5434) and runs 6 steps:
1. Start test DB
2. Migrations + seed
3. Lint + type-check (backend and frontend)
4. Backend tests with ≥80% coverage
5. Frontend tests with coverage thresholds
6. Frontend production build

All 6 must pass. **This is the only PR gate.**

## Key Commands

```bash
# First-time setup
cp .env.dev.example .env.dev
make setup                  # install deps, create backend/.env, migrate, seed

# Daily dev
make dev                    # start DB + backend (8000) + frontend (3001) in background
make backend-dev            # backend only with hot-reload
make frontend-dev           # frontend only

# Testing
make pr-check               # full pre-PR check (isolated DB)
make test-backend           # backend tests only
make test-frontend          # frontend tests only
make test-watch             # frontend watch mode
make test-e2e               # Playwright E2E tests (spins up isolated containers)

# Quality
make lint                   # ruff + pylint + ESLint
make type-check             # mypy + tsc
make format                 # ruff + prettier
make lint-fix               # auto-fix

# DB
make migrate                # apply Alembic migrations
make seed-db                # seed reference data
```

## Dev Server Logs

When running `make dev`, logs write to:
- Backend: `/tmp/backend.log`
- Frontend: `/tmp/frontend.log`

Check these first when debugging runtime errors.

## Non-Negotiable Rules

1. **Coverage thresholds** — hard failures in `make pr-check`:
   - Backend: ≥80% overall
   - Frontend statements/branches/lines: ≥70%
   - Frontend functions: ≥55%

2. **File size limit** — max 200 lines per `.py` / `.ts` / `.js` file. Enforced by `backend/tests/test_file_constraints.py`. Split long files.

3. **No scoped CSS** — Vue components must not use `<style scoped>`. All styles via UnoCSS utilities/shortcuts. Enforced by `frontend/tests/no-scoped-styles.test.ts`.

4. **No direct console calls** — use `debug` utility from `frontend/src/utils/debug.ts` instead of `console.debug/warn/error`. Enforced by ESLint `no-console` rule.

5. **No file deletions without user approval** — always confirm before deleting any file.

6. **No allowlist entries** — `backend/tests/test_file_constraints.py` contains `test_no_allowlist_entries()` which asserts all 3 allowlist constants are empty frozensets. Never add files to allowlists — refactor instead.

## Code Conventions

### Frontend Composables Pattern

Business logic lives in `frontend/src/composables/`. Components are thin.
```typescript
// In component: delegate to composable
const { portfolioData, loadPortfolio } = usePortfolio()

// In composable: all logic here
export function usePortfolio() { ... }
```

### `usePortfolio()` is NOT a singleton

Every call to `usePortfolio()` creates a **new** reactive state instance. If multiple composables each call `usePortfolio()`, they get separate states — errors and loading flags set in one won't appear in another. Pass functions down rather than calling `usePortfolio()` inside nested composables.

### Backend Layer Pattern

```
Controller (route handler) → Service (business logic) → Repository (DB query)
```

Controllers validate HTTP context only. Services own business rules. Repositories own SQL.

### Backend Cascade Deletes

When deleting an entity, manually cascade-delete all related records before deleting the parent. SQLAlchemy ORM relationships with `cascade="all, delete-orphan"` handle this automatically only when loaded — for unloaded relations use explicit `DELETE` statements. See `account_service.py` for the pattern.

### Debug Logging (Frontend)

```typescript
import { debug } from '@utils/debug'
debug.log('[FeatureName] message', data)   // not console.log
debug.error('[FeatureName] error', err)    // not console.error
```

### Testing Services (Frontend)

Use the `clientStub` pattern to test API services without HTTP:
```typescript
const clientStub = { get: vi.fn().mockResolvedValue(data) }
myService.client = clientStub as never
```

### Testing Reactive Composables

Vue wraps reactive objects in `Proxy`. Use `toStrictEqual` (not `toBe`) when asserting object values from refs.

`vi.clearAllMocks()` wipes `mockResolvedValue` — always re-setup mocks in `beforeEach`.

### Vue Fragment Components in Tables

Multi-root components (fragments) inside `<tbody>` must NOT use double-nested `<template>`. The SFC root `<template>` should contain multiple root elements directly (e.g. `<tr>` + `<ComponentRow>`). Double-nesting causes happy-dom to fail rendering.

### v-model on Props (Vue 3)

`v-model` on component props is not allowed in Vue 3. Use `:value` + `@input="$emit('update:prop', ...)"` pattern instead.

## Config: `.env.dev` as Single Source of Truth

All dev ports/credentials live in `.env.dev`. Scripts use `${VAR:-default}` — no hardcoded values in shell scripts.

```
BACKEND_PORT=8000
FRONTEND_PORT=3001
DB_PORT=5433        # dev DB
# test DB uses port 5434 (separate Docker volume, no collision)
```

## What's Not Built Yet

- **Phase 7: Household Sharing** — multiple users sharing a household's accounts

## Key Docs

- [docs/setup/QUICKSTART.md](docs/setup/QUICKSTART.md) — getting started guide
- [docs/architecture/PROJECT_RULES.md](docs/architecture/PROJECT_RULES.md) — rules and conventions (detailed)
- [docs/testing/COVERAGE_ACHIEVEMENT.md](docs/testing/COVERAGE_ACHIEVEMENT.md) — coverage strategy and history
- [.planning/STATE.md](.planning/STATE.md) — current project phase and progress
