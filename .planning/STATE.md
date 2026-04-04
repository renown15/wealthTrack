# WealthTrack State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** One place to see all your wealth with secure credential storage
**Current focus:** Post-v1 enhancements — account type expansion, asset class, event types

## Current Position

Phase: 6 of 7 complete — v1 feature complete (Phase 7 Household Sharing not yet built)
Status: Active development — ongoing feature additions and quality improvements
Last activity: 2026-04-04 — Shares account type, asset class field, new event types, `make pr-check` passing

## Progress

Progress: [█████████-] 90%

Phases: 6/7 complete
Requirements: ~28/30 complete

| Phase | Status | Notes |
|-------|--------|-------|
| 1 - Database Foundation | ✅ Complete | PostgreSQL, Alembic migrations (031), reference data seeded |
| 2 - SPA Shell | ✅ Complete | Vue 3 router, AppHeader, navigation |
| 3 - Institution & Account Management | ✅ Complete | Full CRUD, account types, groups |
| 4 - Balance History | ✅ Complete | Event-sourced immutable balance events |
| 5 - Dashboard | ✅ Complete | AccountHub with portfolio table and stats |
| 6 - Credential Vault | ✅ Complete | Fernet encryption, credential management UI |
| 7 - Household Sharing | ⏳ Pending | Not yet implemented |

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

## Session Continuity

Last session: 2026-04-04
Stopped at: Documentation update — all 6 `make pr-check` steps passing

---
*State updated: 2026-04-04*
