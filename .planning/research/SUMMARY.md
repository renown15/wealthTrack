# Research Summary: WealthTrack

**Synthesized:** 2026-02-03
**Confidence:** MEDIUM-HIGH (based on established patterns, versions need verification)

## Executive Summary

WealthTrack is a personal wealth management application for tracking accounts across financial institutions, with secure credential storage and household sharing. Research indicates a clear path forward with well-established patterns for each component.

## Key Findings

### Stack Recommendations

| Layer | Technology | Why |
|-------|------------|-----|
| **Encryption** | cryptography (Fernet) | Industry standard, authenticated encryption, key rotation support |
| **Database** | PostgreSQL + asyncpg | ACID compliance for financial data, Row-Level Security for households |
| **API** | FastAPI (existing) | Async support, Pydantic validation, OpenAPI docs |
| **Data Tables** | TanStack Table | Headless, TypeScript-first, virtualization for large datasets |
| **Charts** | Recharts | Simple API, composable, good for balance history |
| **State** | TanStack Query | Server state caching, optimistic updates |

### Table Stakes (Must Have for v1)

1. Account Dashboard — central view of all accounts
2. Manual Balance Entry — input/update balances
3. Balance History — track changes over time
4. Net Worth Calculation — sum across accounts
5. Account CRUD — add/edit/close accounts
6. Account Organization — by type (savings, ISA, stocks)
7. Basic Auth — login required for financial data
8. Data Export — CSV/JSON export

### Differentiators (WealthTrack's Edge)

1. **Secure Credential Vault** — encrypted storage for bank logins (core feature)
2. **Household Sharing** — multi-user with household-level access
3. **Extensible Account Types** — via ReferenceData system

### Anti-Features (Explicitly Out of Scope)

- Budget tracking (different product)
- Transaction history (requires bank integration)
- Investment analysis (needs real-time data)
- Tax preparation (regulatory complexity)
- Bank API integration (v1 is manual entry)

## Architecture Overview

```
Frontend (TypeScript MVC)
  → ApiService (HTTP + JWT)
  → Backend (FastAPI)
    → Service Layer (multi-tenant filtering)
    → Encryption Service (Fernet)
    → PostgreSQL (RLS for isolation)
```

### Critical Patterns

1. **Multi-Tenancy**: User owns accounts → Users join Households → Household sees all member accounts
2. **Event Sourcing**: Balance changes stored as immutable events (never update, always insert)
3. **Transparent Encryption**: Service layer encrypts/decrypts credentials, controllers unaware
4. **Reference Data**: Single lookup table for all extensible types (account_type, event_type, etc.)

## Build Order

| Phase | Focus | Dependencies |
|-------|-------|--------------|
| 1 | Database + Reference Data | None |
| 2 | Multi-Tenancy (Household) | Phase 1 |
| 3 | Account/Institution CRUD | Phase 1, 2 |
| 4 | Balance History | Phase 3 |
| 5 | Credential Vault | Phase 3 |
| 6 | Dashboard | Phase 3, 4 |
| 7 | Household Sharing UI | Phase 2, 6 |

**Parallel opportunities:** Phase 4 (Balance History) and Phase 5 (Credential Vault) can run in parallel after Phase 3.

## Critical Pitfalls to Avoid

| Pitfall | Prevention | Phase |
|---------|------------|-------|
| **Weak encryption** | Envelope encryption with user-derived keys, never store keys with data | Phase 1 |
| **Missing audit trail** | Event sourcing for all balance changes, append-only | Phase 1 |
| **Cross-tenant leakage** | PostgreSQL Row-Level Security, centralized permission checks | Phase 2 |
| **Floating point money** | Use DECIMAL(19,4) or integer cents, never float | Phase 1 |
| **N+1 queries** | Pre-computed aggregations, batch queries with JOINs | Phase 3+ |

## Constraint Alignment

| Constraint | How Research Addresses It |
|------------|---------------------------|
| **200-line files** | Headless libraries (Radix UI, TanStack Table), extract services (CryptoService, PermissionService, AuditService) |
| **90% coverage** | Negative tests for security (User A can't access User B), edge cases (timezone, concurrent updates) |
| **Type safety** | Branded types (AccountId, HouseholdId), Money type (cents + currency), TypeScript strict mode |

## UK-Specific Considerations

- ISA account types (Cash ISA, Stocks & Shares ISA, Lifetime ISA, SIPP)
- ISA allowance tracking (£20k annual limit)
- GBP as default currency with EUR/USD support
- Date format localization (DD/MM/YYYY vs MM/DD/YYYY)

## Open Questions

1. **Key Management**: HSM/KMS for production, or environment variables sufficient for personal use?
2. **TimescaleDB**: Needed only if >100K balance snapshots expected
3. **Chart Library**: Recharts recommended, AG Charts alternative if more features needed
4. **Real-time Sync**: WebSockets for household updates, or poll-based sufficient?

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| STACK.md | 400 | Technology recommendations with rationale |
| FEATURES.md | 307 | Feature landscape: table stakes, differentiators, anti-features |
| ARCHITECTURE.md | 1185 | Component boundaries, data flow, build order |
| PITFALLS.md | 538 | Domain-specific mistakes and prevention |

## Ready For

- **Requirements Definition**: Use FEATURES.md categories to scope v1
- **Roadmap Creation**: Use ARCHITECTURE.md build order for phases
- **Implementation**: Use STACK.md for dependencies, PITFALLS.md for guardrails

---
*Research synthesis complete: 2026-02-03*
