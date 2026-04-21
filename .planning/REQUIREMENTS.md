# Requirements: WealthTrack

**Defined:** 2026-02-03
**Core Value:** One place to see all your wealth with secure credential storage

## v1 Requirements

### Database Foundation

- [ ] **DB-01**: PostgreSQL database with full schema (migrate from SQLite)
- [ ] **DB-02**: ReferenceData table for extensible types (account_type, account_status, event_type, credential_type)
- [ ] **DB-03**: Seed ReferenceData with UK account types (Savings, Current, Cash ISA, Stocks & Shares ISA, Lifetime ISA, SIPP, Premium Bonds)

### Institution Management

- [ ] **INST-01**: User can add a financial institution (name)
- [ ] **INST-02**: User can edit institution details
- [ ] **INST-03**: User can delete institution (if no linked accounts)

### Account Management

- [ ] **ACCT-01**: User can add account linked to an institution
- [ ] **ACCT-02**: User can set account type from ReferenceData options
- [ ] **ACCT-03**: User can edit account details (name, type)
- [ ] **ACCT-04**: User can close account (soft delete, preserves history)
- [ ] **ACCT-05**: User can set initial balance when creating account

### Balance History

- [ ] **BAL-01**: User can update balance for any account (manual entry)
- [ ] **BAL-02**: Balance updates stored as immutable events with timestamp
- [ ] **BAL-03**: User can view balance history for any account
- [ ] **BAL-04**: User can add note when updating balance

### Account Hub (Dashboard)

- [ ] **DASH-01**: User sees all accounts grouped by institution
- [ ] **DASH-02**: User sees current balance for each account
- [ ] **DASH-03**: User sees total net worth across all accounts
- [ ] **DASH-04**: User sees when each account was last updated

### Credential Vault

- [ ] **CRED-01**: User can store credentials for an institution (username, password, security questions)
- [ ] **CRED-02**: Credentials encrypted at rest (Fernet symmetric encryption)
- [ ] **CRED-03**: User can view stored credentials (decrypted on demand)
- [ ] **CRED-04**: User can update stored credentials
- [ ] **CRED-05**: User can delete stored credentials

### SPA Shell

- [ ] **UI-01**: Application has consistent layout (title bar, sidebar, main view)
- [ ] **UI-02**: Sidebar navigation between Dashboard, Accounts, Credentials

## v2 Requirements

Deferred to future release.

- **BAL-V2-01**: Balance history visualization (charts)
- **ACCT-V2-01**: Data export (CSV/JSON)
- **HOUSE-V2-01**: Household roles (owner, member permissions)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bank API integration | Manual entry for v1, extensible for future |
| Budget tracking | Different product category |
| Transaction history | Requires bank integration |
| Investment analysis | Needs real-time market data |
| Mobile native app | Web responsive only for v1 |
| Per-account sharing | Household-level sharing only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Pending |
| DB-02 | Phase 1 | Pending |
| DB-03 | Phase 1 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| INST-01 | Phase 3 | Pending |
| INST-02 | Phase 3 | Pending |
| INST-03 | Phase 3 | Pending |
| ACCT-01 | Phase 3 | Pending |
| ACCT-02 | Phase 3 | Pending |
| ACCT-03 | Phase 3 | Pending |
| ACCT-04 | Phase 3 | Pending |
| ACCT-05 | Phase 3 | Pending |
| BAL-01 | Phase 4 | Pending |
| BAL-02 | Phase 4 | Pending |
| BAL-03 | Phase 4 | Pending |
| BAL-04 | Phase 4 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| DASH-04 | Phase 5 | Pending |
| CRED-01 | Phase 6 | Pending |
| CRED-02 | Phase 6 | Pending |
| CRED-03 | Phase 6 | Pending |
| CRED-04 | Phase 6 | Pending |
| CRED-05 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-03 after roadmap creation*
