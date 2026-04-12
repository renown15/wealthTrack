# WealthTrack Development Guide

Comprehensive guide to the current codebase architecture and development practices for WealthTrack Phase 6.

---

## Project Summary

**WealthTrack** is a self-hosted personal wealth management application. Users can track balances across multiple financial institutions, record share sales for capital gains tracking, prepare tax returns, and view comprehensive portfolio analytics.

**Current Phase:** 6 of 7 (v1 feature-complete)  
**Status:** Active development with ongoing enhancements  
**Last Major Update:** 2026-04-12 (Tax Hub implementation complete)

---

## Architecture Overview

### Layered Architecture

```
Frontend (Vue 3, TypeScript)
    ↓
API Layer (FastAPI)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Database Queries)
    ↓
Database (PostgreSQL 15)
```

### Data Flow

1. **Frontend Components** (Vue 3 SFCs)
   - Thin wrapper components that delegate to composables
   - Template-only display logic
   - No business logic in components

2. **Composables** (Composition API)
   - Business logic and state management
   - API orchestration
   - Event handling
   - Located in `frontend/src/composables/`

3. **API Services** (TypeScript services)
   - HTTP client abstraction
   - Request/response typing
   - Error handling
   - Located in `frontend/src/services/`

4. **FastAPI Endpoints** (Python controllers)
   - HTTP route handling
   - Request validation via Pydantic
   - Auth middleware checks
   - Thin - delegates to services
   - Located in `backend/app/controllers/`

5. **Service Layer** (Python services)
   - Domain business logic
   - Validation and calculations
   - Orchestration across repositories
   - Located in `backend/app/services/`

6. **Repository Layer** (Python repositories)
   - SQL query encapsulation
   - Data access patterns
   - Located in `backend/app/repositories/`

7. **ORM Models** (SQLAlchemy)
   - Database schema definition
   - Relationship definitions
   - Located in `backend/app/models/`

---

## Frontend Architecture

### Technology Stack

- **Framework:** Vue 3 (Composition API)
- **Language:** TypeScript (strict mode)
- **Build Tool:** Vite
- **HTTP Client:** axios (wrapped in services)
- **Styling:** UnoCSS (utilities only, no scoped CSS)
- **State Management:** Vue reactive() (no external store needed)
- **Testing:** Vitest + happy-dom

### Composables Pattern

All business logic lives in composables. Components are thin wrappers.

**Correct Pattern:**
```typescript
// ❌ Wrong: Logic in component
export default {
  setup() {
    const data = ref(null)
    async function loadData() {
      data.value = await api.getData()
    }
    return { data, loadData }
  }
}

// ✅ Correct: Logic in composable
export function useMyData() {
  const data = ref(null)
  async function loadData() {
    data.value = await api.getData()
  }
  return { data, loadData }
}

// Component uses the composable
export default {
  setup() {
    const { data, loadData } = useMyData()
    return { data, loadData }
  }
}
```

### Composable Instantiation

**Important:** Each call to a composable creates a NEW state instance. This is intentional:

```typescript
// ❌ Problem: Both composables same state
function ComponentA() {
  const { state } = usePortfolio()  // instance A
}

function ComponentB() {
  const { state } = usePortfolio()  // same as A if called from A
}

// ✅ Solution: Pass functions or state down
function ComponentA() {
  const { state, loadPortfolio } = usePortfolio()
  return {
    state,
    onEvent: () => loadPortfolio()  // pass function to B
  }
}
```

### Services vs Composables

**Services** - HTTP abstraction layer (reusable across composables)
```typescript
// frontend/src/services/PortfolioFetchService.ts
class PortfolioFetchService extends BaseApiClient {
  async getPortfolio(): Promise<Portfolio> {
    return (await this.client.get<Portfolio>('/api/v1/portfolio')).data
  }
}
```

**Composables** - Business logic orchestration
```typescript
// frontend/src/composables/usePortfolio.ts
export function usePortfolio() {
  const state = reactive({ items: [], loading: false })
  
  const load = async () => {
    state.loading = true
    try {
      const data = await portfolioFetchService.getPortfolio()
      state.items = data.items
    } finally {
      state.loading = false
    }
  }
  
  return { state, load }
}
```

### Testing Patterns

**Testing Services (with mocked HTTP):**
```typescript
const clientStub = { 
  get: vi.fn().mockResolvedValue({ data: { items: [] } }) 
}
myService.client = clientStub as never
const result = await myService.getPortfolio()
expect(result.items).toEqual([])
```

**Testing Composables (reactive state):**
```typescript
const { state, load } = useMyComposable()
await load()
// Use toStrictEqual for proxy-wrapped objects
expect(state.items).toStrictEqual([expected])
```

**Note:** `vi.clearAllMocks()` clears `mockResolvedValue`. Re-setup in `beforeEach`.

---

## Backend Architecture

### Technology Stack

- **Framework:** FastAPI
- **ORM:** SQLAlchemy (async)
- **Database:** PostgreSQL 15
- **Migrations:** Alembic
- **Validation:** Pydantic v2
- **Auth:** JWT + bcrypt
- **Testing:** pytest + pytest-asyncio

### File Organization

```
backend/app/
├── controllers/     # FastAPI route handlers (thin)
│   ├── portfolio.py
│   ├── accounts.py
│   ├── tax.py
│   └── ...
├── services/        # Business logic
│   ├── portfolio_service.py
│   ├── tax_service.py
│   └── ...
├── repositories/    # Database queries
│   ├── portfolio_repository.py
│   ├── analytics_repository.py
│   └── ...
├── models/          # SQLAlchemy ORM
│   ├── account.py
│   ├── account_event.py
│   └── ...
├── schemas/         # Pydantic request/response
│   ├── portfolio.py
│   └── ...
├── main.py          # APP + middleware setup
└── database.py      # Session creation
```

### Request Flow Example

```
1. POST /api/v1/accounts (FastAPI controller)
2. Creates account with validation (Pydantic schema)
3. Delegates to account_service.create_account()
4. Service validates business rules
5. Service calls account_repository.create()
6. Repository executes SQL query via SQLAlchemy
7. Returns created Account model
8. Service transforms to response schema
9. Controller returns JSON response
```

### Service Layer Pattern

Services handle business logic:
- Validation beyond Pydantic (domain rules)
- Multi-step operations
- Coordinating repositories
- Calculations and derivations

```python
class PortfolioService:
    def __init__(self, session: AsyncSession):
        self.portfolio_repo = PortfolioRepository(session)
        self.analytics_repo = AnalyticsRepository(session)
    
    async def get_portfolio_summary(self, user_id: int) -> dict:
        items = await self.portfolio_repo.get_user_portfolio(user_id)
        total = self.calculate_total(items)  # Business logic
        breakdown = await self.analytics_repo.get_breakdown(user_id)
        return {
            "items": items,
            "total": total,
            "breakdown": breakdown
        }
    
    def calculate_total(self, items) -> float:
        # Negate Tax Liability accounts
        total = 0.0
        for item in items:
            balance = item.get("latestBalance", {}).get("value", 0)
            if item.get("accountType") == "Tax Liability":
                total -= float(balance)
            else:
                total += float(balance)
        return total
```

### Repository Layer Pattern

Repositories encapsulate SQL queries:

```python
class PortfolioRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_user_portfolio(self, user_id: int) -> list[dict]:
        stmt = (
            select(Account)
            .where(Account.user_id == user_id)
            .options(
                joinedload(Account.institution),
                joinedload(Account.latestBalance),
            )
        )
        accounts = await self.session.execute(stmt)
        return [self.serialize_account(a) for a in accounts.scalars()]
    
    def serialize_account(self, account: Account) -> dict:
        return {
            "id": account.id,
            "name": account.name,
            # ... map all fields
        }
```

### Database Migrations

Located in `backend/alembic/versions/`

Migrations are numbered sequentially (001, 002, ..., 041+):
- Create tables
- Add columns
- Create indexes
- Seed data
- Backfill columns

```bash
make migrate           # Apply all pending migrations
make seed-db           # Populate reference data
```

**Current migration count:** 41+

### Key Features Implementation

#### 1. Portfolio Management

**Files:**
- `controllers/portfolio.py` - Get portfolio endpoint
- `services/portfolio_service.py` - Portfolio calculations
- `repositories/portfolio_repository.py` - Account queries
- `schemas/portfolio.py` - PortfolioResponse schema

**Key Logic:**
- Loads all user's accounts with latest balances
- Calculates total net worth (negates Tax Liability)
- Tracks last_price_update (most recent account.updatedAt)
- Returns structured portfolio response

#### 2. Share Sales & Capital Gains (Tax Hub)

**Files:**
- `controllers/tax.py` - Tax endpoints
- `services/tax_service.py` - Tax calculations
- `repositories/tax_repository.py` - Tax queries
- `models/tax_*.py` - Tax ORM models
- `schemas/tax.py` - Tax request/response schemas

**Key Logic:**
- Records share sales as events with attributes
- Calculates capital gains (proceeds - cost)
- Filters Shares accounts by share sale events in period
- Loads tax data into TaxReturn records
- Prepares tax return documents

**Attribute Types Used:**
- `capital_gain` - calculated gain amount
- `Capital Gains Tax` - tax paid/owed
- `shares_sold` - quantity of shares

#### 3. Analytics & Breakdowns

**Files:**
- `services/analytics_service.py`
- `repositories/analytics_repository.py`

**Key Calculations:**
- Portfolio breakdown by account type
- Portfolio breakdown by institution
- Portfolio breakdown by asset class
- Historical balance trends
- Tax Liability negation in totals

#### 4. Credential Vault

**Files:**
- `repositories/credentials_repository.py`
- `services/credentials_service.py`
- `controllers/credentials.py`

**Key Logic:**
- Fernet symmetric encryption
- Decrypt only on access
- Per-credential encryption keys
- Supports multiple credential types

---

## Recent Features (April 12, 2026)

### Tax Hub Implementation

**Components:**
- Full UI for tax return preparation
- Share sale recording modal
- Tax return view with capital gains display
- Tax period selection

**Backend:**
- `TaxReturn` ORM model
- `TaxService` for tax calculations
- TaxHub API endpoints
- Capital gains calculation from share sales

**Frontend:**
- `TaxHub.vue` main view
- `TaxHubStats.vue` summary display
- Share sale modal with defaults
- Tax return modal for preparation

### Stock Price Update Tracking

**Implementation:**
- `last_price_update` field in Portfolio schema
- Portfolio controller tracks max account.updatedAt
- Frontend displays relative time (e.g., "2 hours ago")
- `formatLastPriceUpdate()` helper for time formatting

**Storage:**
- Timestamp stored in account.updatedAt (via price update mechanism)
- Returned in portfolio response
- No separate column needed

### Portfolio Consistency Fixes

**Issue:** Tax Liability accounts were being added as positive instead of negative

**Solution:** 
- Negation logic in `portfolio_controller.py`:
  ```python
  if item.get("accountType") == "Tax Liability":
      val = -val
  ```
- Same logic in `analytics_repository.py` for breakdown calculations
- Applied BEFORE adding to totals

**Impact:**
- Both portfolio view and analytics view now consistent
- Portfolio totals match across all views

---

## Testing Strategy

### Backend Tests

- **Framework:** pytest + pytest-asyncio
- **Location:** `backend/tests/`
- **Coverage Target:** ≥80% overall (enforced)
- **Count:** ~360+ tests

**Patterns:**
- Async test functions with `@pytest.mark.asyncio`
- Fixtures for database setup
- Test database separate from dev DB (port 5434)
- Comprehensive fixtures for authenticated requests

### Frontend Tests

- **Framework:** Vitest + happy-dom
- **Location:** `frontend/tests/`
- **Coverage Targets:**
  - Statements: ≥70%
  - Branches: ≥70%
  - Lines: ≥70%
  - Functions: ≥55%
- **Count:** ~900 tests across ~90 files

**Patterns:**
- Component unit tests
- Composable unit tests
- Service unit tests
- Mock API responses with `clientStub`
- Use `toStrictEqual` for proxy-wrapped objects

### E2E Tests

- **Framework:** Playwright
- **Location:** `frontend/tests/e2e/`
- **Run:** `make test-e2e` (spins up isolated containers)
- **Count:** 5+ test suites

---

## Quality Gates

### Pre-PR Checklist

```bash
make pr-check  # Must pass all 6 steps:
```

1. **Start test DB** — isolated PostgreSQL container
2. **Migrations + seed** — apply all migrations, seed reference data
3. **Lint + type-check** — ruff, pylint, ESLint, mypy, tsc
4. **Backend tests** — ≥80% coverage required
5. **Frontend tests** — coverage thresholds enforced
6. **Production build** — frontend webpack/vite build must succeed

### Code Quality Tools

| Tool | Purpose | Trigger |
|------|---------|---------|
| ruff | Python linter/formatter | `make lint`, `make format` |
| pylint | Python detailed linting | `make lint` |
| mypy | Python type checking | `make type-check` |
| ESLint | JavaScript/TypeScript linting | `make lint` |
| tsc | TypeScript type checking | `make type-check` |
| prettier | Code formatting | `make format` |
| pytest | Backend tests | `make test-backend` |
| Vitest | Frontend tests | `make test-frontend` |

---

## Development Workflow

### First-Time Setup

```bash
git clone <repo>
cd wealthTrack
cp .env.dev.example .env.dev
make setup
```

### Daily Development

```bash
make dev  # Starts DB + backend + frontend in background
```

View logs:
```bash
tail -f /tmp/backend.log
tail -f /tmp/frontend.log
```

### Common Tasks

```bash
# Development
make backend-dev        # Backend with hot reload
make frontend-dev       # Frontend with hot reload
make dev                # Both together

# Testing
make test-backend       # Backend tests only
make test-frontend      # Frontend tests only
make test-watch         # Frontend watch mode
make pr-check          # Full pre-PR gate

# Quality
make lint              # Lint all code
make type-check        # Type-check backend & frontend
make format            # Auto-format code

# Database
make migrate           # Apply Alembic migrations
make seed-db           # Seed reference data

# Utility
make docker-up         # Start database container
make docker-down       # Stop database container
```

---

## File Size Constraints

**Maximum: 200 lines per file**

Enforced by `backend/tests/test_file_constraints.py`

If a file exceeds 200 lines:
1. Break it into smaller, focused modules
2. e.g., split `reference_data.py` into `reference_data.py` + `reference_data_items.py`
3. Update imports and ensure tests pass

---

## Non-Negotiable Rules

1. **No scoped CSS** — all styles via UnoCSS utilities
2. **No `console.*` calls** — use `debug` utility instead
3. **No allowlist entries** — refactor instead of adding to allowlists
4. **No direct file deletions** — require user approval
5. **Max 200 lines** per file — split long files
6. **Coverage thresholds** — backend ≥80%, frontend statements/lines ≥70%, functions ≥55%

---

## Future Work (Phase 7)

- **Household Sharing** — multiple users sharing account views
- **Mobile Apps** — native iOS/Android
- **Bank Integration** — Plaid or Open Banking API
- **Spending Analysis** — transaction-level tracking
- **Budget Planning** — goals and alerts
- **Tax Filing** — automated report generation

---

## References

- **User Setup Guide:** [docs/setup/QUICKSTART.md](../setup/QUICKSTART.md)
- **Project Rules:** [docs/architecture/PROJECT_RULES.md](./PROJECT_RULES.md)
- **Features Guide:** [docs/FEATURES.md](../FEATURES.md)
- **State & Progress:** [.planning/STATE.md](../../.planning/STATE.md)
- **API Docs** (runtime): http://localhost:8000/docs (FastAPI Swagger)
