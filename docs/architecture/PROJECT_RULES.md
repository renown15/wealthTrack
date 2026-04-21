# WealthTrack Project Rules

WealthTrack is a self-hosted personal wealth tracker — a single dashboard for tracking balances across all your financial institutions without connecting to any bank APIs. Users manually log balance updates and the app maintains the full history over time.

This document covers the rules and conventions for working on the codebase. The gate for all contributions is `make pr-check` — it must pass before any PR is opened.

## Non-Negotiable Rules

### 1. Test Coverage

| Layer | Threshold | Enforced via |
|-------|-----------|--------------|
| Backend | ≥80% overall | `pytest --cov-fail-under=80` |
| Frontend statements | ≥70% | `vitest.config.ts` thresholds |
| Frontend branches | ≥70% | `vitest.config.ts` thresholds |
| Frontend lines | ≥70% | `vitest.config.ts` thresholds |
| Frontend functions | ≥55% | `vitest.config.ts` thresholds |

All thresholds are hard failures in `make pr-check`. Do not lower them.

### 2. File Preservation

No files may be deleted without explicit user approval in chat.
Applies to test files, source code, config, documentation — everything.

### 3. Maximum File Size

No Python or TypeScript/JavaScript file may exceed 200 lines.
Enforced by `backend/tests/test_file_constraints.py`.
Split long files into smaller modules.

### 4. No Scoped CSS Blocks

Vue components must not contain `<style scoped>` blocks.
All styles use UnoCSS utilities or shortcuts.
Enforced by `frontend/tests/no-scoped-styles.test.ts`.

## Development Workflow

### First-Time Setup

```bash
cp .env.dev.example .env.dev   # create local env config
make setup                      # install deps, create backend/.env, migrate, seed
```

### Daily Development

```bash
make dev        # start DB + backend (port 8000) + frontend (port 3001) in background
make dev-down   # stop all background services
```

Or start services individually:
```bash
make backend-dev   # FastAPI with hot-reload at http://localhost:8000
make frontend-dev  # Vite dev server at http://localhost:3001
```

### Before Every PR

```bash
make pr-check
```

This runs 6 steps against an isolated test database (port 5434):
1. Start test DB container
2. Run migrations + seed reference data
3. Lint and type-check (ruff + pylint + mypy + ESLint + tsc)
4. Backend tests with coverage (≥80%)
5. Frontend tests with coverage (all thresholds)
6. Frontend production build

All 6 steps must pass. This is the gate.

### Other Commands

```bash
make lint          # ruff + pylint + ESLint
make type-check    # mypy + tsc
make format        # ruff + prettier
make lint-fix      # auto-fix lint issues
make migrate       # apply Alembic migrations
make seed-db       # seed reference data
make test-backend  # backend tests only
make test-frontend # frontend tests only
make test-watch    # frontend watch mode
```

## Current Test Counts (approximate)

- Backend: ~360 tests across all features
- Frontend: ~650 tests across ~66 test files

## Code Conventions

### Frontend Debug Logging

All debug/diagnostic logging must use the centralized utility at `frontend/src/utils/debug.ts`.

```typescript
import { debug } from '@utils/debug';

debug.log('[Category] Message', data);
debug.error('[Category] Error', error);
debug.warn('[Category] Warning', data);
```

Direct `console.debug/warn/error` calls in source code are forbidden (ESLint `no-console` rule).

- Dev mode: debug enabled by default via `import.meta.env.DEV`
- Production: debug disabled by default
- Runtime override: `localStorage.setItem('debugMode', 'true')`

### Frontend Composables

Business logic lives in composables under `frontend/src/composables/`.
Components should be thin wrappers around composable state and handlers.
Never put complex logic directly in `<script setup>` blocks.

### Backend Services

Services in `backend/app/services/` contain business logic.
Controllers/handlers in `backend/app/controllers/` are thin wrappers.
Repositories in `backend/app/repositories/` handle DB access.

## Config: `.env.dev` as Single Source of Truth

All dev config (ports, credentials) lives in `.env.dev`.
Scripts read from it via `${VAR:-default}` — no hardcoded values in `.sh` files.

Key variables:
```
BACKEND_PORT=8000
FRONTEND_PORT=3001
DB_PORT=5433
DB_USER=wealthtrack
DB_PASSWORD=wealthtrack_dev_password
DB_NAME=wealthtrack
```

`.env.dev` is gitignored. `.env.dev.example` holds the template.

## Project Status

See `.planning/STATE.md` for current phase and progress.

Current state: v1 complete — all 6 phases shipped.
