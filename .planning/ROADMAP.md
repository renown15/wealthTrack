# Roadmap: WealthTrack v1

**Created:** 2026-02-03
**Phases:** 7
**Requirements:** 30

## Overview

WealthTrack v1 delivers a complete personal wealth management application where users can track accounts across financial institutions, store encrypted credentials, and share visibility with household members. The roadmap builds from database foundation through UI shell, then layers in account management, balance tracking, dashboard aggregation, credential vault, and finally household sharing.

## Phases

### Phase 1: Database Foundation

**Goal:** Establish PostgreSQL schema with extensible reference data system

**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md - Initialize Alembic with async template
- [ ] 01-02-PLAN.md - Create models (single ReferenceData table, UserProfile) per Data Model spec
- [ ] 01-03-PLAN.md - Create migrations and seed reference data

**Requirements:**
- DB-01: PostgreSQL database with full schema (migrate from SQLite)
- DB-02: ReferenceData table for extensible types (account_type, account_status, event_type, credential_type)
- DB-03: Seed ReferenceData with UK account types (Savings, Current, Cash ISA, Stocks & Shares ISA, Lifetime ISA, SIPP, Premium Bonds)

**Success Criteria:**
1. Application starts with PostgreSQL and all tables created via migrations
2. ReferenceData query returns UK account types with correct sort order
3. Existing user authentication works against new PostgreSQL schema
4. Database enforces DECIMAL(19,4) for monetary values (no floating point)

**Outputs:**
- Alembic migrations for all tables
- ReferenceData seed script
- PostgreSQL Docker service configuration
- Updated database connection layer

---

### Phase 2: SPA Shell

**Goal:** Users navigate the application through a consistent layout with sidebar navigation

**Requirements:**
- UI-01: Application has consistent layout (title bar, sidebar, main view)
- UI-02: Sidebar navigation between Dashboard, Accounts, Credentials, Household

**Success Criteria:**
1. User sees title bar with app name on every page after login
2. User sees sidebar with four navigation items (Dashboard, Accounts, Credentials, Household)
3. User can click any sidebar item and the main view updates without full page reload
4. Layout remains consistent when navigating between views

**Outputs:**
- AppLayout component with title bar and sidebar
- Router configuration for all main views
- Placeholder views for Dashboard, Accounts, Credentials, Household
- Navigation state management

---

### Phase 3: Institution & Account Management

**Goal:** Users can manage their financial institutions and accounts with full CRUD operations

**Requirements:**
- INST-01: User can add a financial institution (name)
- INST-02: User can edit institution details
- INST-03: User can delete institution (if no linked accounts)
- ACCT-01: User can add account linked to an institution
- ACCT-02: User can set account type from ReferenceData options
- ACCT-03: User can edit account details (name, type)
- ACCT-04: User can close account (soft delete, preserves history)
- ACCT-05: User can set initial balance when creating account

**Success Criteria:**
1. User can add an institution named "Nationwide" and see it in the Accounts view
2. User can add a "Cash ISA" account under Nationwide with initial balance of 5000
3. User can edit the account name from "Cash ISA" to "Cash ISA 2024"
4. User can close an account and it no longer appears in active account lists
5. User cannot delete an institution that has linked accounts (error shown)

**Outputs:**
- Institution API endpoints (CRUD)
- Account API endpoints (CRUD with soft delete)
- Accounts view with institution grouping
- Institution/Account forms with ReferenceData dropdown for account types

---

### Phase 4: Balance History

**Goal:** Users can update account balances and view history of all changes

**Requirements:**
- BAL-01: User can update balance for any account (manual entry)
- BAL-02: Balance updates stored as immutable events with timestamp
- BAL-03: User can view balance history for any account
- BAL-04: User can add note when updating balance

**Success Criteria:**
1. User can enter a new balance for any account with optional note
2. User can view a list of all balance updates for an account showing date, amount, and note
3. Balance history shows entries in reverse chronological order (newest first)
4. Previous balance entries cannot be edited or deleted (immutable)

**Outputs:**
- AccountEvent table and API endpoints
- Balance update form with note field
- Balance history view per account
- Event sourcing pattern for balance changes

---

### Phase 5: Dashboard

**Goal:** Users see a unified view of all accounts with current balances and net worth

**Requirements:**
- DASH-01: User sees all accounts grouped by institution
- DASH-02: User sees current balance for each account
- DASH-03: User sees total net worth across all accounts
- DASH-04: User sees when each account was last updated

**Success Criteria:**
1. Dashboard shows accounts organized under their institution headers
2. Each account row displays current balance (latest balance event)
3. Total net worth is displayed prominently, summing all account balances
4. Each account shows "Last updated: [date]" reflecting most recent balance entry

**Outputs:**
- Dashboard view with institution grouping
- Net worth calculation service
- Account summary cards with last-updated timestamps
- Aggregation queries for current balances

---

### Phase 6: Credential Vault

**Goal:** Users can securely store and retrieve login credentials for their financial institutions

**Requirements:**
- CRED-01: User can store credentials for an institution (username, password, security questions)
- CRED-02: Credentials encrypted at rest (Fernet symmetric encryption)
- CRED-03: User can view stored credentials (decrypted on demand)
- CRED-04: User can update stored credentials
- CRED-05: User can delete stored credentials

**Success Criteria:**
1. User can add credentials (username, password, security answers) for an institution
2. Credentials are stored encrypted (database column contains ciphertext, not plaintext)
3. User can view their stored credentials and see decrypted values
4. User can update existing credentials (e.g., after password change)
5. User can delete credentials for an institution they no longer use

**Outputs:**
- InstitutionSecurityCredentials API endpoints
- Fernet encryption service
- Credentials view with reveal/hide functionality
- Credential form for add/edit operations

---

## Phase Summary

| # | Phase | Goal | Requirements | Outputs |
|---|-------|------|--------------|---------|
| 1 | Database Foundation | PostgreSQL schema with extensible reference data | DB-01, DB-02, DB-03 | Migrations, seed data, Docker config |
| 2 | SPA Shell | Consistent navigation framework | UI-01, UI-02 | Layout, router, placeholder views |
| 3 | Institution & Account Management | Full CRUD for institutions and accounts | INST-01, INST-02, INST-03, ACCT-01, ACCT-02, ACCT-03, ACCT-04, ACCT-05 | APIs, forms, Accounts view |
| 4 | Balance History | Event-sourced balance tracking | BAL-01, BAL-02, BAL-03, BAL-04 | Events API, history view |
| 5 | Dashboard | Unified account overview with net worth | DASH-01, DASH-02, DASH-03, DASH-04 | Dashboard view, aggregations |
| 6 | Credential Vault | Encrypted credential storage | CRED-01, CRED-02, CRED-03, CRED-04, CRED-05 | Encryption service, Credentials view |

## Dependencies

```
Phase 1 (Database)
    |
    v
Phase 2 (SPA Shell) ---> Phase 3 (Accounts) ---> Phase 4 (Balance) ---> Phase 5 (Dashboard)
                              |                        |
                              v                        v
                         Phase 6 (Credentials)
```

- Phase 2 depends on Phase 1 (needs database for auth)
- Phase 3 depends on Phase 2 (needs navigation shell)
- Phase 4 depends on Phase 3 (needs accounts to track)
- Phase 5 depends on Phase 4 (needs balance history for current values)
- Phase 6 depends on Phase 3 (needs institutions to attach credentials)

## Coverage

All 30 v1 requirements mapped:

| Category | Count | Phase |
|----------|-------|-------|
| Database Foundation | 3 | Phase 1 |
| SPA Shell | 2 | Phase 2 |
| Institution Management | 3 | Phase 3 |
| Account Management | 5 | Phase 3 |
| Balance History | 4 | Phase 4 |
| Dashboard | 4 | Phase 5 |
| Credential Vault | 5 | Phase 6 |

**Total:** 30 requirements mapped, 0 orphaned

---
*Roadmap created: 2026-02-03*
