# WealthTrack — Agent Context

## What This Is

A personal wealth management app: one place to see all your accounts and balances across financial institutions, with encrypted credential storage and tax tracking.

**Status:** v1 complete — all 6 phases shipped. Post-v1 additions: Tax Hub depth (briefing PDF, SA schedule, commentary/UTR), Outgoings Hub, Scenario Hub (risk scenarios).
**Last Updated:** 2026-07-05 — docs refreshed: migrations at 060, test counts updated, post-v1 hubs listed.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy (async), PostgreSQL 15, Alembic, Pydantic v2 |
| Frontend | Vue 3, TypeScript, Vite, UnoCSS, Vue Router, vue-toastification |
| Backend testing | pytest, pytest-asyncio |
| Frontend testing | Vitest, happy-dom |
| Backend quality | ruff, pylint, mypy |
| Frontend quality | ESLint (`.ts` + `.vue`), vue-tsc (Vue template type checking) |

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
│   ├── alembic/            # DB migrations (060 as of 2026-07-05)
│   └── tests/              # 86 backend test files
├── frontend/
│   ├── src/
│   │   ├── composables/    # Vue 3 composition API business logic
│   │   ├── views/          # Page components (thin wrappers)
│   │   ├── services/       # API client services
│   │   ├── models/         # TypeScript data models
│   │   └── utils/          # Shared utilities (debug.ts etc.)
│   └── tests/              # 162 frontend test files
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
3. Lint + type-check:
   - Backend: `ruff` + `pylint app/` + `mypy app/` (strict) + `mypy tests/` (relaxed — ORM constructor and mock-assignment false positives suppressed)
   - Frontend: `eslint src --ext .ts,.vue` + `vue-tsc --noEmit --project tsconfig.app.json` (checks Vue templates, not just .ts files)
4. Backend tests with ≥80% coverage
5. Frontend tests with coverage thresholds
6. Frontend production build (`vue-tsc` + `vite build`)

All 6 must pass. **This is the only PR gate.**

> **Why vue-tsc matters:** plain `tsc` skips Vue template expressions entirely. `vue-tsc` catches type errors in `@event-handler` argument counts, `:prop` type mismatches, and template-level bugs that unit tests don't exercise.

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
make lint                   # ruff + pylint + ESLint (covers .ts + .vue)
make type-check             # mypy (app/ + tests/) + vue-tsc
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

2. **File size limit** — max 200 lines per `.py` / `.ts` / `.js` / `.vue` file (blank lines excluded). Enforced by `backend/tests/test_file_constraints.py`. Split long files.

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

### AccountEventAttributeGroup Pattern

`AccountEventAttributeGroup` links related `AccountEvent` and `AccountAttribute` records that belong to a single logical transaction. Two features use this:

**Dividends** (`POST /accounts/{id}/dividends`): Creates a "Dividend" group containing:
- `Dividend` event — the payment amount
- `Dividend Payment Date` event — ISO date string stored as the event value (NOT a DB column)
- `Dividend Tax` event — 40% provision, written to the Tax Liability account for the period
- `Balance Update` event — running total on the Tax Liability account

The matching Tax Liability account is found by: querying `TaxPeriod` whose date range covers the payment date → matching `Account.name.contains(period.name)` for a Tax Liability type account.

**Share Sales** (`POST /accounts/{id}/share-sale`): Creates a "Share Sale" group containing events (Share Sale, Balance Updates, Deposit, Capital Gains Tax) and attributes (sale price, purchase price, capital gain, CGT rate).

**Gifts** (`POST /accounts/{id}/gifts`): Creates a "Gift" group for IHT taper exposure tracking, containing:
- `Gift` event — the gift value in GBP
- `Gift Date` event — ISO date string stored as the event value
- `Gift Donor` event — donor name stored as the event value
- `Balance Update` event — running total on the receiving account

`Gift Date`, `Gift Donor`, and `Gift Shares` are internal event types (excluded from the account timeline via `_GIFT_INTERNAL_TYPES` in `gift_service.py`). Deleting a gift reverses the balance by deleting the entire group and its events.

**DB column naming with table aliases** — SQLAlchemy's `__table__.alias()` exposes DB column names, not Python attribute names. Always use DB names in raw alias queries:
```python
m = AccountEventAttributeGroupMember.__table__.alias("m")
# m.c.groupid  ✓   (not m.c.group_id)
# m.c.account_event_id  ✓   (not m.c.accounteventid — this one matches)
ae = AccountEvent.__table__.alias("ae")
# ae.c.accountid  ✓   ae.c.typeid  ✓   ae.c.userid  ✓
```

**Filtering internal events from timeline** — `Dividend Payment Date` events are implementation details, not user-visible. They are excluded in `backend/app/controllers/account_events.py` via `_INTERNAL_EVENT_TYPES`. Dividend events in the timeline are enriched with their payment date by joining through the group.

### Tax Hub — Tax Liability Accounts

Tax Liability accounts appear automatically in the Tax Hub for their matching period (matched by `TaxPeriod.name` contained in account name, e.g. "Tax Liability - 2026/27"):
- **Non-zero balance** → shown in **In Scope** section
- **Zero balance** → shown in **Eligible** section

The account balance is always synced to the `tax_taken_off` field of the TaxReturn on each load (via `TaxReturnRepository.upsert`). Dividend income for Shares accounts is similarly kept in sync on each load via `TaxReturnRepository.sync_income` — this updates only the `income` field, preserving user-entered `capital_gain` and `tax_taken_off`.

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

### Vue Event Handler Argument Count

When a component emits multiple args, the parent handler **must** capture all of them. Capturing only the first silently drops the rest — vue-tsc will catch this, plain tsc will not.

```html
<!-- WRONG — emits (accountId, value) but only accountId is captured -->
@update-balance="(p) => handleUpdateBalance(p)"

<!-- CORRECT -->
@update-balance="(id, val) => handleUpdateBalance(id, val)"
```

This caused a runtime bug where balance updates silently failed (value was `undefined` → `parseFloat(undefined)` → NaN).

## Config: `.env.dev` as Single Source of Truth

All dev ports/credentials live in `.env.dev`. Scripts use `${VAR:-default}` — no hardcoded values in shell scripts.

```
BACKEND_PORT=8000
FRONTEND_PORT=3001
DB_PORT=5433        # dev DB
# test DB uses port 5434 (separate Docker volume, no collision)
```

## What's Not Built Yet

- Mobile native apps (currently web-only, responsive design)
- Bank API integration (currently manual balance entry)
- Spending/transaction-level analysis
- Budget planning and tracking
- Automated tax reports and filing

## Key Docs

- [docs/setup/QUICKSTART.md](docs/setup/QUICKSTART.md) — getting started guide
- [docs/architecture/PROJECT_RULES.md](docs/architecture/PROJECT_RULES.md) — rules and conventions (detailed)
- [docs/testing/COVERAGE_ACHIEVEMENT.md](docs/testing/COVERAGE_ACHIEVEMENT.md) — coverage strategy and history
- [.planning/STATE.md](.planning/STATE.md) — current project phase and progress
