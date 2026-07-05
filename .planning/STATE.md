# WealthTrack State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** One place to see all your wealth with secure credential storage
**Current focus:** Post-v1 enhancements — Tax Hub depth (briefing PDF, SA schedule), Outgoings Hub, risk scenarios

## Current Position

Phase: 6 of 6 complete — v1 feature complete
Status: Active development — ongoing feature additions and quality improvements
Last activity: 2026-07-05 — Outgoings Hub UI polish, charity types, table header unification

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

## Recent Changes (since 2026-04-19)

- **[2026-04-19] Phase 7 (Household Sharing) removed from scope** — docs updated
- **[2026-05-28] Family portfolio sharing** — Family groups, member tabs, Family Hub view, ownership transfer, family CRUD (migration 045)
- **[2026-05-28] Gift / IHT tracking** — Record gifts with donor/date/value, 7-year taper calculation, gift summary, share gifts (migration 046)
- **[2026-05-28] Delete gift** — Reverse gift event group + balance; confirmation modal overlay
- **[2026-05-28] UI improvements** — Encumbrances stat card, force share price refresh button, JWT session expiry redirect
- **[2026-05-28] Test coverage improvements** — New: useShareSaleModal, useHubEventHandlers, useTaxHubModals, useAnalyticsEdit, AccountDocumentService, test_family_service, expanded family/portfolio controller tests
- Migrations now at 046 (up from 040)
- Backend: ~600 tests | Frontend: ~1100 tests across 114 files
- Coverage: backend ~81.7%, frontend stmts/lines ~82.8%, functions ~64.6%, branches ~81.9%

## Recent Changes (since 2026-05-31)

- **[2026-06] Risk scenarios feature (ScenarioHub)** — scenario tables (migration 047), code-split bundle
- **[2026-06] Tax Briefing Pack** — server-side PDF for a tax year; Tax Liability items, rules-excluded accounts grouped by wealth category; PDF supporting docs embedded as compressed images; consistent table formatting
- **[2026-06] Tax Hub depth** — out-of-scope override (050), tax due column with period-correct CGT (051), savings interest tax + ReferenceData tax rates (052), dividend tax rate (053), SA supporting schedule, per-return comment, period commentary + UTR (055), share-sale undo, shared edit modal, Tax Liability edit persistence fix
- **[2026-06] Tax documents** — description field (048), multi-photo combine into one PDF with per-photo rotate
- **[2026-06/07] Outgoings Hub** — new hub with providers, outgoings reference data (049), outgoings-only institutions scoped away from Account/Tax/Analytics views (054), renewal types (056), household/membership types + family member view (057), Tax outgoing type (058), data-driven outgoing type class keys (059), charity types (060), search + default sort, layout matched to Account Hub
- **[2026-07] UI unification** — all table headers on the institution style; tax deduction in Total Value tooltip; Encumbrances + Tax stat
- Migrations now at 060 (up from 046)
- Backend: 86 test files | Frontend: 162 test files (plus 5 Playwright E2E specs)

## Session Continuity

Last session: 2026-07-05
Status: lint + type-check verified green 2026-07-05; last full `make pr-check` passing as of most recent merge

---
*State updated: 2026-07-05*
