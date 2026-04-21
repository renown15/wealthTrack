# WealthTrack State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** One place to see all your wealth with secure credential storage
**Current focus:** Post-v1 enhancements — account type expansion, asset class, event types

## Current Position

Phase: 6 of 6 complete — v1 feature complete
Status: Active development — ongoing feature additions and quality improvements
Last activity: 2026-04-12 — Tax Hub feature complete, share sales with capital gains, stock price tracking

## Progress

Progress: [██████████] 100%

Phases: 6/6 complete
Requirements: ~26/26 complete

| Phase | Status | Notes |
|-------|--------|-------|
| 1 - Database Foundation | ✅ Complete | PostgreSQL, Alembic migrations (031), reference data seeded |
| 2 - SPA Shell | ✅ Complete | Vue 3 router, AppHeader, navigation |
| 3 - Institution & Account Management | ✅ Complete | Full CRUD, account types, groups |
| 4 - Balance History | ✅ Complete | Event-sourced immutable balance events |
| 5 - Dashboard | ✅ Complete | AccountHub with portfolio table and stats |
| 6 - Credential Vault | ✅ Complete | Fernet encryption, credential management UI |

## Accumulated Context

### Tech Stack (Actual)

- **Backend**: FastAPI, SQLAlchemy (async), PostgreSQL 15, Alembic, Pydantic v2
- **Frontend**: Vue 3, TypeScript, Vite, UnoCSS, Vue Router, vue-toastification
- **Testing**: pytest + pytest-asyncio (backend), Vitest + happy-dom (frontend)
- **Quality**: ruff + pylint + mypy (backend), ESLint + tsc (frontend)

### Key Architecture Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Single ReferenceData table with 'class' column | Per spec, simpler schema | 2026-02-04 |
| Composite index on (class, key) | Optimizes most common query pattern | 2026-02-04 |
| Vue 3 + UnoCSS frontend | Component-based, no scoped CSS blocks enforced | 2026-02 |
| Composables over controllers | Vue 3 composition API pattern | 2026-02 |
| No scoped CSS blocks (enforced by test) | All styles via UnoCSS shortcuts/utilities | 2026-03 |
| Frontend thresholds: lines/stmts/branches ≥70%, functions ≥55% | Balanced for Vue composables complexity | 2026-03 |
| Backend coverage threshold: ≥80% | Appropriate for codebase maturity | 2026-03 |
| Separate Docker volumes for dev/test DBs | Prevents test runs from wiping dev data | 2026-03 |
| ISA account type removed (plain ISA) | Covered by Cash ISA and Stocks ISA specifically | 2026-03-30 |
| reference_data_items.py extracted from reference_data.py | 200-line file size limit enforcement | 2026-04 |

### Blockers/Concerns

(None)

## Recent Changes (since 2026-03-04)

- Migration 027: asset_class field added to Account model
- Migration 028: Savings Provider institution type added
- Migration 029: Shares account type + Shares Balance attribute type added
- Migration 030: Plain ISA account type removed (redundant — Cash ISA and Stocks ISA remain)
- Migration 031: Deposit, Withdrawal, Fee, Tax event types added
- New service: `SharesBalanceService` (shares_balance_service.py)
- `reference_data_items.py` extracted from `reference_data.py` (file size limit)
- Docs cleanup: removed stale planning/research/progress docs
- Branch: merged to master (was feature/ui-improvements)
- **[2026-04-12] Tax Hub feature** — full implementation complete:
  - New TaxHub view with tax period selection and capital gains tracking
  - Share sale recording with sensible defaults (shares count from account balance)
  - Capital gains and tax liability calculations from share sale events
  - Tax return preparation UI with tax year eligibility
  - Capital gain and tax taken off loading from AccountEventAttributeGroup
  - Test database deduplication (migration 040) for reference data integrity
- **[2026-04-12] Stock price update tracking** — last price update timestamp now visible in portfolio:
  - Added `last_price_update` field to Portfolio schema
  - Portfolio endpoint tracks and returns most recent account `updatedAt` timestamp
  - AccountHub summary panel displays relative time (e.g., "2 hours ago")
  - Frontend `formatLastPriceUpdate()` helper for user-friendly time display
- **[2026-04-12] Portfolio consistency fixes**:
  - Tax Liability accounts now correctly treated as negative (liabilities) in portfolio totals
  - Negation logic applied in both portfolio controller and analytics repository
  - All portfolio calculations now consistent across views

## Session Continuity

Last session: 2026-04-19
Completed: Phase 7 (Household Sharing) removed from scope — docs updated across all planning files
Status: All `make pr-check` steps passing (81.0% backend coverage, 79.8% frontend statements/lines)

---
*State updated: 2026-04-19*
