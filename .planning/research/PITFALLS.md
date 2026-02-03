# Domain Pitfalls: Personal Wealth Tracking

**Domain:** Personal wealth/financial management applications
**Researched:** 2026-02-03
**Confidence:** MEDIUM (based on established patterns, limited external verification due to tool restrictions)

## Critical Pitfalls

Mistakes that cause security breaches, data loss, or major rewrites.

### Pitfall 1: Storing Credentials in Plaintext or with Reversible Encryption
**What goes wrong:** Credentials stored with weak encryption (e.g., Base64, simple XOR) or symmetric encryption where keys are stored alongside data. Database breach exposes all user credentials to their actual financial accounts.

**Why it happens:**
- Developers treat credentials like regular password storage (hashing), not realizing they need to be retrievable
- Misunderstanding of "encryption at rest" (database-level encryption doesn't protect against application-level compromise)
- Key management is hard, so keys end up in environment variables, config files, or database

**Consequences:**
- Catastrophic security breach with legal liability
- Loss of user trust and potential regulatory penalties
- Users' actual bank accounts compromised, not just the app

**Prevention:**
- Use envelope encryption: User-specific keys derived from user password/MFA, never stored
- Consider hardware security modules (HSM) or cloud KMS for master keys
- Implement key derivation (PBKDF2, Argon2) so credentials can't be decrypted without user password
- Zero-knowledge architecture: credentials decryptable only when user is authenticated
- Never log decrypted credentials, even in dev environments

**Detection:**
- Can you decrypt credentials without user providing their password?
- Are encryption keys stored in the same database as encrypted data?
- Can admin users access other users' credentials?
- Does server have permanent access to decrypted credentials?

**Phase mapping:** Security architecture must be established in Phase 1 (Credential Vault). Retrofitting is extremely difficult.

---

### Pitfall 2: Missing Audit Trail for Financial Data Mutations
**What goes wrong:** Balance history shows incorrect values, users report "my balance changed," but no way to determine what changed it, when, or why. No way to debug data integrity issues or prove correctness.

**Why it happens:**
- Treating financial data like regular CRUD operations
- Not anticipating the need to answer "why is this balance wrong?"
- Adding audit logging as an afterthought when it's too late

**Consequences:**
- Cannot debug user-reported discrepancies
- No proof of data integrity for disputes
- Cannot roll back erroneous changes
- Loss of user trust ("my money disappeared")
- Regulatory compliance issues if handling real financial data

**Prevention:**
- Event sourcing pattern: Store every mutation as an immutable event
- Every balance change has: timestamp, actor (user/system), reason, old value, new value
- Append-only ledger: never UPDATE, always INSERT new records
- Include correlation IDs to trace related operations
- Separate "current balance" (query optimization) from "balance history" (source of truth)

**Detection:**
- Can you answer "who changed this balance at 2pm yesterday?"
- Can you reconstruct balance at any point in time?
- Are UPDATEs used on financial records?
- Is there a delete operation for transactions?

**Phase mapping:** Must be designed into data model from Phase 1. Retrofitting requires migrating all existing data.

---

### Pitfall 3: Improper Multi-Tenancy Isolation (Cross-Household Data Leakage)
**What goes wrong:** User in Household A can see/modify data from Household B. SQL queries forget to filter by household_id. Permission checks have edge cases.

**Why it happens:**
- Relying on application-level filtering instead of database-level constraints
- Not using Row-Level Security (RLS) or equivalent
- Permission logic scattered across codebase instead of centralized
- Edge cases: What happens when user leaves household? Joins second household?

**Consequences:**
- Data breach, privacy violation
- Users see other families' financial data
- Potential fraud if modification is possible
- Legal liability, regulatory penalties

**Prevention:**
- Database Row-Level Security (PostgreSQL RLS, similar in other DBs)
- Every query automatically filtered by tenant context
- Centralized permission service, not scattered checks
- API tests that explicitly try to access other tenants' data
- Use user_id + household_id composite checks, not OR logic
- Handle household transitions atomically: user removal must revoke access immediately

**Detection:**
- Can you write a query that accidentally omits household_id filter?
- What happens if you delete WHERE clause in a query?
- Does every table have tenant isolation enforced at DB level?
- Test: Can User A from Household 1 pass User B's account ID from Household 2?

**Phase mapping:** Must be designed into database schema and API layer in Phase 2 (Multi-User). Extremely difficult to retrofit.

---

### Pitfall 4: N+1 Queries for Balance History/Aggregations
**What goes wrong:** Dashboard loads 10 accounts, makes 10 separate queries for balance history per account, 10 more for calculating net worth over time. Page takes 5+ seconds to load. Gets worse as users add accounts.

**Why it happens:**
- ORM default behavior (lazy loading)
- Not profiling queries during development with realistic data volumes
- Building aggregations in application code instead of database
- Fetching all history then filtering in memory

**Consequences:**
- Poor user experience (slow dashboards)
- Database overload with many concurrent users
- Expensive cloud database costs
- App becomes unusable as data grows

**Prevention:**
- Design aggregation tables from the start: pre-computed daily/monthly balances
- Use database window functions for time-series calculations
- Batch queries: single query for all accounts' history with JOINs
- Implement pagination for long histories
- Add database indexes on (household_id, account_id, date)
- Profile with realistic data: 5 users, 10 accounts each, 3 years of history

**Detection:**
- Run query profiler/explain plan on dashboard load
- Count database queries for a single page load (should be <10)
- Test with 100+ accounts and 1000+ balance records
- Monitor query time percentile P95, P99

**Phase mapping:** Design aggregation strategy in Phase 1. Add performance testing in Phase 2-3 before it's too late.

---

### Pitfall 5: Floating Point Arithmetic for Money
**What goes wrong:** Balances stored as FLOAT/DOUBLE. Rounding errors accumulate: $100.00 becomes $99.99999999. Aggregations are wrong. Cents disappear or appear.

**Why it happens:**
- Using language's default numeric types without considering precision
- Not understanding floating point representation
- Copying patterns from non-financial applications

**Consequences:**
- Balance calculations are incorrect
- User reports "my net worth is off by $0.03"
- Aggregations don't sum correctly
- Cannot reconcile with actual financial institutions
- Loss of trust in application accuracy

**Prevention:**
- Use DECIMAL/NUMERIC in database with fixed precision (e.g., DECIMAL(19,4) for most currencies)
- Use integer arithmetic (store cents, not dollars): $100.00 = 10000 cents
- Use money libraries (e.g., Dinero.js, money.js, Java BigDecimal)
- Never use floating point (float, double) for financial calculations
- Write tests that check sum(balances) == net_worth exactly

**Detection:**
- Are balance columns FLOAT/DOUBLE instead of DECIMAL?
- Does 0.1 + 0.2 == 0.3 in your code? (hint: it doesn't in floating point)
- Do aggregations have rounding errors?
- Test: Add $0.01 to balance 1000 times, is result exactly $10.00?

**Phase mapping:** Must be correct from Phase 1. Fixing requires data migration and recalculating all balances.

## Moderate Pitfalls

Mistakes that cause delays, bugs, or technical debt.

### Pitfall 6: No Soft Delete for Financial Records
**What goes wrong:** User accidentally deletes account or transaction. No undo. Data is gone forever. No way to restore or audit what was deleted.

**Why it happens:**
- Using database DELETE operations directly
- Not anticipating user mistakes or fraud investigation needs
- Treating financial records like regular application data

**Consequences:**
- User frustration (accidental deletions)
- Cannot investigate fraud or disputes
- Audit trail has gaps
- No recovery mechanism

**Prevention:**
- Implement soft delete: deleted_at timestamp, deleted_by user_id
- Queries filter WHERE deleted_at IS NULL by default
- Provide "restore" functionality for X days
- Hard delete only after retention period (e.g., 90 days)
- Log deletion events separately

**Detection:**
- Do you use DELETE FROM statements in application code?
- Is there a deleted_at column on financial tables?
- Can users recover accidentally deleted data?

**Phase mapping:** Add to data model in Phase 1. Easy to add early, painful to retrofit.

---

### Pitfall 7: Inadequate Time Zone Handling
**What goes wrong:** User enters balance on Jan 31 at 11:59pm PST, gets stored as Feb 1 in UTC. Balance history shows wrong dates. Monthly aggregations are off. Users in different time zones see different dates for same entry.

**Why it happens:**
- Storing dates without time zone context
- Converting to UTC too early in the pipeline
- Not storing user's time zone preference
- Displaying UTC times to users

**Consequences:**
- Balance history dates don't match user's expectation
- Monthly/yearly aggregations are wrong
- User confusion: "I entered this yesterday, why does it show today?"
- Cannot accurately reconstruct user's intended timeline

**Prevention:**
- Store timestamps with time zone (TIMESTAMPTZ) OR store user's time zone separately
- Store user's time zone preference on account/user record
- Display dates in user's local time zone, not UTC
- For daily balances: use date without time (DATE type), clarify it's "as of end of day"
- Test with users in multiple time zones (UTC, UTC-8, UTC+10)

**Detection:**
- Are timestamps stored without time zone information?
- What happens when user travels across time zones?
- Do dates match user's expectation in UI?
- Test: Enter balance at 11:59pm, verify date is correct

**Phase mapping:** Add to data model in Phase 1. Changing later requires data migration.

---

### Pitfall 8: Overly Granular Permissions Leading to Permission Explosion
**What goes wrong:** Initially create permissions like "can_view_account_123", "can_edit_account_123", "can_view_account_124"... Database fills with millions of permission records. Queries become slow. Permission UI is unusable.

**Why it happens:**
- Modeling permissions at instance level instead of role level
- Not using hierarchical permissions (household > account)
- Adding permissions without thinking about scale
- Copying enterprise RBAC patterns without understanding trade-offs

**Consequences:**
- Database bloat with permission records
- Slow permission checks
- Cannot list "all accounts user can access" efficiently
- Permission UI doesn't scale
- Adding/removing users from household is slow

**Prevention:**
- Use hierarchical permissions: household membership implies account access
- Role-based: "household_member" role, not per-account permissions
- Check permissions at query time using household context, not lookup table
- For exceptions: use deny list (explicit revocations) rather than allow list
- Design permission model: User -> Household -> Accounts (implicit access through hierarchy)

**Detection:**
- Do you have a permission record for every account?
- Does permission table grow linearly with accounts created?
- How many DB queries to determine if user can access account?
- Can you efficiently list all accounts user can access?

**Phase mapping:** Design permission model in Phase 2 (Multi-User). Changing permission model later is a major refactor.

---

### Pitfall 9: Not Handling Concurrent Balance Updates
**What goes wrong:** User opens app on phone and laptop simultaneously. Updates balance on both. Last write wins, one update is lost. No conflict detection.

**Why it happens:**
- Assuming single-device usage
- Not implementing optimistic locking
- No version tracking on records
- Standard REST PUT semantics without etags

**Consequences:**
- Data loss (silent overwrite)
- User confusion: "I updated that, why did it revert?"
- Cannot detect conflicts
- Undermines trust in data accuracy

**Prevention:**
- Add version column to mutable records (increment on update)
- Implement optimistic locking: UPDATE WHERE version = X
- Return 409 Conflict if version mismatch
- Use ETags in API responses
- Show conflict UI: "This was updated elsewhere, which version to keep?"
- Consider CRDT/operational transform for real-time sync

**Detection:**
- Open app in two browsers, update same balance, both succeed?
- Is there a version/updated_at check on UPDATE queries?
- What happens when two updates happen within 1 second?

**Phase mapping:** Add to data model in Phase 1, API layer in Phase 2. Retrofit is complex.

---

### Pitfall 10: Storing Sensitive Data in Client-Side Storage
**What goes wrong:** Storing decrypted credentials, full balance history, or API keys in localStorage, sessionStorage, or IndexedDB. XSS vulnerability exposes all data. Data persists after logout.

**Why it happens:**
- Convenience: faster access, offline support
- Not understanding browser security model
- Copying patterns from non-sensitive applications
- Assuming HTTPS means client storage is safe

**Consequences:**
- XSS vulnerability becomes data breach
- Data persists after user logs out
- Data accessible to browser extensions
- Cannot remotely revoke access

**Prevention:**
- Never store decrypted credentials in browser
- Use HTTP-only cookies for session tokens
- If caching needed: cache only aggregates, not raw sensitive data
- Implement auto-logout after inactivity
- Clear all storage on logout
- Use short-lived session tokens (15-30 minutes)

**Detection:**
- Open browser dev tools, check localStorage/sessionStorage
- Can you see credentials or full balances?
- Does data persist after logout?
- Is session token in localStorage (bad) or HTTP-only cookie (good)?

**Phase mapping:** Security architecture in Phase 1. Changing storage patterns later requires client code rewrite.

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 11: No Input Validation on Balance Amounts
**What goes wrong:** User enters "$1,234.56" or "1 million" or negative balances for assets. Application crashes or stores garbage data.

**Why it happens:**
- Assuming numeric input always parses
- Not validating business rules (e.g., assets > 0)
- Not handling currency formatting variations

**Consequences:**
- Application errors from unparseable input
- Garbage data in database
- User frustration with unclear error messages

**Prevention:**
- Parse currency input: strip $ , symbols
- Validate min/max ranges (e.g., -999,999,999 to 999,999,999)
- Validate business rules: assets >= 0, liabilities <= 0
- Show clear error messages: "Balance must be a number between X and Y"
- Use input masks to guide formatting

**Detection:**
- Try entering: "$1,234", "1million", "-1000" for asset account
- Does application handle gracefully?
- Are error messages clear?

**Phase mapping:** Add validation to forms in Phase 1. Easy to add anytime.

---

### Pitfall 12: Inconsistent Date Formats in UI
**What goes wrong:** Some screens show MM/DD/YYYY, others DD/MM/YYYY. User in UK sees wrong format. Dates are ambiguous (is 01/02/2023 January 2 or February 1?).

**Why it happens:**
- Using browser default formatting
- Not localizing date display
- Different developers using different date libraries

**Consequences:**
- User confusion
- Data entry errors (misinterpreting dates)
- Looks unprofessional

**Prevention:**
- Use date localization library (e.g., date-fns, Intl.DateTimeFormat)
- Consistent format site-wide (e.g., "MMM DD, YYYY" like "Jan 15, 2026")
- Detect user locale or provide preference setting
- Use ISO 8601 for disambiguation where needed

**Detection:**
- Check date format across all screens
- Test with browser locale set to different countries
- Are dates displayed consistently?

**Phase mapping:** Establish in UI guidelines, Phase 1. Easy to fix anytime with global constant.

---

### Pitfall 13: Not Truncating or Paginating Long Account Lists
**What goes wrong:** User with 50+ accounts sees massive scrolling list. Dashboard loads all 50 accounts' history. Performance degrades.

**Why it happens:**
- Testing only with 2-3 accounts
- Assuming users won't have many accounts
- Not implementing pagination

**Consequences:**
- Poor UX for power users
- Performance issues
- Database load increases

**Prevention:**
- Implement pagination or virtual scrolling for account lists
- Lazy load balance history (load on expand)
- Test with 50+ accounts during development
- Add "favorite" or "archived" account status to reduce active list

**Detection:**
- Create 50 test accounts, check performance
- Does page scroll endlessly?
- Can user find specific account easily?

**Phase mapping:** Add pagination in Phase 2-3. Easy to add before launch.

---

### Pitfall 14: No Loading States for Async Operations
**What goes wrong:** User clicks "Save", nothing happens for 2 seconds, user clicks again, duplicate save happens. No feedback during operations.

**Why it happens:**
- Not implementing loading indicators
- Not disabling buttons during submission
- Assuming operations are instant

**Consequences:**
- User frustration (app feels broken)
- Double-submission bugs
- User doesn't know if action succeeded

**Prevention:**
- Show loading spinner during async operations
- Disable submit buttons during submission
- Show success/error messages after completion
- Implement optimistic updates for perceived speed
- Use loading skeletons for data fetching

**Detection:**
- Click save button twice quickly, what happens?
- Is there visual feedback during operations?
- Does user know when operation completes?

**Phase mapping:** Add to UI components in Phase 2-3. Easy to add anytime.

---

### Pitfall 15: Hardcoding Currency Symbols and Formatting
**What goes wrong:** Application shows "$" for all users. User in Europe sees "$1.000,00" instead of "€1.000,00". Cannot support multiple currencies.

**Why it happens:**
- Assuming all users use USD
- Not planning for internationalization
- Hardcoding currency symbols in templates

**Consequences:**
- Poor UX for non-USD users
- Cannot expand to international users
- Looks US-centric

**Prevention:**
- Store currency code with each account (USD, EUR, GBP)
- Use Intl.NumberFormat for currency display
- Get currency symbol from account record, not hardcoded
- Plan for multi-currency from the start (even if not initially supported)

**Detection:**
- Search codebase for hardcoded "$"
- Create account with EUR currency, does it display correctly?
- Can system represent different currencies?

**Phase mapping:** Add currency field to account model in Phase 1. Easy to add early, harder later.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Credential Vault (Phase 1) | Weak encryption, key management | Use envelope encryption, HSM/KMS, user-derived keys. Never store keys alongside data. |
| Credential Vault (Phase 1) | Logging decrypted credentials | Configure logging to redact sensitive fields. Never log credentials even in dev. |
| Balance History (Phase 1) | Floating point arithmetic | Use DECIMAL type, integer cents, or money library from day 1. |
| Balance History (Phase 1) | No audit trail | Event sourcing pattern, append-only ledger for all balance changes. |
| Balance History (Phase 1) | Time zone issues | Store timezone-aware timestamps OR user's timezone. Test across timezones. |
| Multi-User (Phase 2) | Cross-tenant data leakage | Row-Level Security, centralized permission checks, extensive testing. |
| Multi-User (Phase 2) | Permission explosion | Hierarchical permissions (household membership), not per-account. |
| Multi-User (Phase 2) | Concurrent update conflicts | Optimistic locking with version column from start. |
| Dashboard (Phase 3) | N+1 queries for aggregations | Pre-computed aggregation tables, batch queries, database window functions. |
| Dashboard (Phase 3) | Slow loading with many accounts | Pagination, lazy loading, query optimization, proper indexes. |
| API Layer (All Phases) | Sensitive data in client storage | HTTP-only cookies, never cache decrypted credentials, auto-logout. |
| API Layer (All Phases) | No rate limiting | Add rate limiting to prevent abuse, especially on authentication endpoints. |

## Constraint-Specific Warnings

Given your firm constraints:

### 200-Line File Limit
**Risk:** Permission logic, encryption logic, and audit logging can easily bloat files.

**Mitigation:**
- Extract permission checking to dedicated service (PermissionService)
- Extract encryption/decryption to CryptoService
- Extract audit logging to AuditService
- Use composition, not giant controller methods

### 90% Test Coverage
**Risk:** Hard to test encryption key derivation, multi-tenancy isolation, time zone edge cases without good test infrastructure.

**Mitigation:**
- Test encryption with multiple users (keys must be different)
- Test multi-tenancy: User A cannot access User B's data (negative tests)
- Test time zone edge cases (midnight boundary, DST transitions)
- Test concurrent updates with race condition simulation
- Test floating point: 0.1 + 0.2 must equal 0.3 exactly

### Strict Type Safety
**Risk:** Financial amounts might be represented as number, losing precision. Time zones might be strings, not proper types.

**Mitigation:**
- Create Money type (amount: number in cents, currency: string)
- Create Timestamp type with timezone
- Use branded types for AccountId, HouseholdId to prevent mixing
- Use enums for account types, not strings

## Sources

**Confidence Note:** This research is based on established patterns and common pitfalls in financial application development as of my training data (January 2025). Due to tool restrictions, I could not verify with external sources. Recommendations follow industry best practices for financial applications, but specific implementation details should be verified with:

- OWASP guidelines for financial application security
- PCI DSS requirements for credential storage (if handling payment cards)
- Your chosen framework's security documentation
- Database documentation for Row-Level Security implementation

**Recommended verification:**
- PostgreSQL RLS documentation (for multi-tenancy isolation)
- NIST guidelines on key management and encryption
- Your cloud provider's KMS/HSM documentation
- Financial application security standards specific to your jurisdiction
