# WealthTrack

## What This Is

A personal wealth management application for individuals and households to track savings and investments across multiple financial institutions. Users can view all accounts in one dashboard, securely store bank login credentials, and maintain balance history over time.

## Core Value

One place to see all your wealth with secure credential storage — nothing lost, nothing scattered.

## Requirements

### Validated

- ✓ User registration with email/password — existing
- ✓ User authentication with JWT tokens — existing
- ✓ MVC frontend architecture (TypeScript/Vite) — existing
- ✓ FastAPI backend structure — existing
- ✓ Docker containerization — existing
- ✓ CI/CD pipeline — existing

### Active

- [ ] Account Hub dashboard — view all accounts with current balances across institutions
- [ ] Institution management — add/edit institutions where accounts are held
- [ ] Account management — add/edit/close accounts linked to institutions
- [ ] Balance updates — log new balances as events with timestamps
- [ ] Balance history — view historical balances for any account
- [ ] Credential vault — securely store login credentials per institution (encrypted)
- [ ] Household sharing — users join households, see all household accounts
- [ ] SPA shell — title bar, sidebar, main view layout
- [ ] Reference data system — extensible types for accounts, events, statuses
- [ ] Database migration — move from SQLite to PostgreSQL with full schema

### Out of Scope

- Bank API integration — manual entry only for v1, extensible for future
- Document parsing/upload — future enhancement
- Real-time market data — future enhancement
- Mobile native app — web responsive only for v1
- Per-account sharing permissions — household-level sharing only

## Context

**Existing codebase:**
- Frontend: TypeScript MVC with Vite, basic login/registration/home views
- Backend: Python FastAPI, user auth endpoints
- Database: SQLite (needs migration to PostgreSQL)
- Tests: Vitest (frontend), pytest (backend) — scaffolded but incomplete

**Design documents in Prompts/:**
- Application Specification — architecture and quality requirements
- Architecture and design hints — UI/UX direction, Account Hub spec
- Data model — full schema for Account, Institution, Events, Credentials, ReferenceData

**Data model (from spec):**
- Account (id, userid, institutionid, name, typeid, statusid)
- AccountEvent (id, userid, accountid, typeid, value) — balance history
- AccountAttribute (id, userid, accountid, typeid, value) — extensible metadata
- Institution (id, userid, name)
- InstitutionSecurityCredentials (id, userid, institutionid, typeid, key, value) — encrypted
- UserProfile (id, firstname, surname, email, profile JSON, typeid, password)
- ReferenceData (id, class, key, value, sortindex) — lookup tables
- Household (new) — for multi-user sharing

**User model:**
- Users own accounts (Account → User)
- Users join households (User → Household)
- Household members can view/manage all accounts in household

## Constraints

- **File size**: Max 200 lines per file — firm, enforced in CI
- **Test coverage**: ≥90% coverage — firm, enforced in CI
- **Type safety**: mypy strict (Python), TypeScript strict — firm, enforced in CI
- **Database**: PostgreSQL (not SQLite)
- **Multi-user**: Architecture must support multiple users from day 1
- **Extensibility**: Data model must support different account types without schema changes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Household-level sharing | Simpler than per-account permissions, fits family use case | — Pending |
| Manual balance entry for v1 | Keeps scope manageable, bank APIs are complex | — Pending |
| AccountEvent for balance history | Each update is an event, history comes free | — Pending |
| ReferenceData for types | Extensible without schema changes | — Pending |
| Users own accounts, not households | Preserves "my accounts vs your accounts" within household | — Pending |

---
*Last updated: 2026-02-03 after initialization*
