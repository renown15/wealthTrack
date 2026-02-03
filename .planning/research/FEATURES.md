# Feature Landscape: Personal Wealth Tracking Applications

**Domain:** Personal finance / net worth tracking
**Researched:** 2026-02-03
**Confidence:** MEDIUM (based on training knowledge through January 2025, not verified with current sources)

## Table Stakes

Features users expect. Missing these makes the product feel incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Account Dashboard | Core value prop - central view of all accounts | Medium | Layout complexity, aggregation logic |
| Manual Balance Entry | Users need to input/update balances | Low | Form + validation + timestamp |
| Balance History | Track changes over time | Medium | Time-series storage, charting |
| Account Organization | Categorize by type (savings, ISA, stocks, etc.) | Low | Basic taxonomy, UI grouping |
| Total Net Worth Calculation | Sum across all accounts | Low | Aggregation logic, currency handling |
| Account Add/Edit/Delete | Basic CRUD for accounts | Low | Standard form operations |
| Data Persistence | Accounts and balances saved securely | Medium | Database design, encryption at rest |
| Basic Security (Auth) | Login required to see financial data | Medium | Authentication flow, session management |
| Mobile-Responsive UI | Users check finances on phones | Medium | Responsive layouts, touch targets |
| Account Notes/Metadata | Remember account numbers, URLs, notes | Low | Text fields, optional metadata |
| Currency Support | Handle multiple currencies (£, $, €, etc.) | Medium | Currency codes, conversion (if needed) |
| Data Export | Users want to export their data (CSV/JSON) | Low | Export function, data formatting |

## Differentiators

Features that set products apart. Not expected by default, but provide competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Secure Credential Vault | Store bank login credentials safely | High | Encryption, key management, security audit requirements |
| Household/Multi-User Sharing | Multiple people see shared accounts | High | Permission model, access control, real-time sync |
| Balance History Visualization | Charts showing wealth over time | Medium | Charting library, date range selection, trend analysis |
| Financial Institution Database | Pre-populated list of banks/institutions | Medium | Database of institutions, logos, URLs, search functionality |
| Goal Tracking | Set savings/net worth goals | Medium | Goal definition, progress tracking, notifications |
| Custom Categories/Tags | Beyond standard types, user-defined tags | Low | Tag system, filtering, organization |
| Balance Change Notifications | Alert on significant changes | Medium | Notification system, threshold detection, delivery mechanism |
| Portfolio Breakdown | Asset allocation by type/category | Medium | Percentage calculations, pie charts, grouping logic |
| Account Grouping | Group accounts (e.g., "Retirement", "Emergency Fund") | Low | Grouping model, UI for management |
| Historical Data Import | Import past balance data from CSV | Medium | File upload, parsing, validation, date handling |
| Automated Balance Refresh | Connect to banks to auto-update (via Plaid, etc.) | Very High | Third-party API integration, OAuth flows, error handling, cost |
| Net Worth Timeline | Interactive timeline showing changes | Medium | Timeline UI, event markers, drill-down capability |
| Recurring Balance Tracking | Predict/track regular updates | Low | Schedule definition, reminder system |
| Account Archival | Archive old accounts without deleting | Low | Soft delete, filter archived accounts |
| Audit Log | Track who changed what, when | Medium | Event logging, display interface |
| Custom Dashboard Widgets | User configures dashboard layout | High | Widget system, drag-drop, persistence |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain or scope creep traps.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Budget Tracking | Different product category (expense management vs wealth tracking) | Focus on net worth visualization, not cash flow |
| Transaction History | Massive scope increase, requires bank integration | Link to institution websites, store credentials only |
| Investment Analysis | Requires real-time stock data, complex calculations | Show balances only, let specialized tools handle analysis |
| Tax Preparation | Completely different domain expertise | Export data for tax software if needed |
| Bill Payment | High regulatory burden, payment processing | Store account details, let banks handle payments |
| Financial Advice/Recommendations | Requires regulatory compliance, expertise | Provide data visualization only, no advice |
| Social Features | Privacy-sensitive domain, security risk | Keep data private within households |
| Cryptocurrency Portfolio Tracking (initially) | Fast-moving space, API complexity, real-time needs | Future consideration, not MVP |
| Loan/Debt Amortization Calculators | Feature creep, not core value prop | External calculators exist, focus on balance tracking |
| Document Storage | Large storage costs, not core to wealth tracking | Link to documents at institution sites |
| Automated Categorization (AI) | Complex, requires transaction data (anti-feature above) | Manual categorization sufficient for account-level tracking |

## Feature Dependencies

```
Authentication
  └─> Account Management
        ├─> Balance Entry
        │     └─> Balance History
        │           └─> History Visualization
        │           └─> Net Worth Timeline
        ├─> Account Organization
        │     └─> Custom Categories/Tags
        │     └─> Account Grouping
        └─> Account Metadata/Notes

Multi-User Support
  └─> Household Sharing
        └─> Access Control
        └─> Audit Log

Institution Database
  └─> Account Creation (pre-populated)

Credential Vault
  └─> Encryption Infrastructure
  └─> Master Password/Key Management

Automated Refresh (future)
  └─> Institution Database
  └─> OAuth Integration
  └─> Error Handling & Status Tracking
```

## MVP Recommendation

For MVP, prioritize these table stakes features:

1. **Authentication & Security** - Users won't trust financial app without it
2. **Account Dashboard** - Core value proposition
3. **Manual Balance Entry** - Essential data input
4. **Balance History** - Basic time-series tracking
5. **Account CRUD** - Add/edit/delete accounts
6. **Account Organization** - Categorize by type (savings, ISA, stocks, etc.)
7. **Net Worth Calculation** - Sum total across accounts

Add one differentiator for MVP:
- **Secure Credential Vault** - WealthTrack's stated core feature, key differentiator

Defer to post-MVP:
- **Multi-User/Household Sharing**: High complexity, can validate single-user first
- **Balance History Visualization**: Important but users can see raw history initially
- **Financial Institution Database**: Can start with freeform text entry
- **Automated Balance Refresh**: Very high complexity, manual entry validates concept first
- **Goal Tracking**: Nice-to-have, not core to MVP validation

## Feature Complexity Analysis

### Low Complexity (< 1 week)
- Account Notes/Metadata
- Account Archival
- Data Export
- Custom Categories/Tags
- Account Grouping
- Recurring Balance Tracking

### Medium Complexity (1-3 weeks)
- Account Dashboard (layout and aggregation)
- Balance History (storage and display)
- Currency Support
- Balance History Visualization (charting)
- Financial Institution Database
- Goal Tracking
- Historical Data Import
- Net Worth Timeline
- Audit Log

### High Complexity (3-6 weeks)
- Secure Credential Vault
- Household/Multi-User Sharing
- Custom Dashboard Widgets

### Very High Complexity (6+ weeks)
- Automated Balance Refresh (third-party API integration)

## Domain-Specific Patterns

### Credential Management
Personal finance apps handle credentials in several ways:

1. **No Credential Storage** - Link to institution websites only (lowest security risk)
2. **Encrypted Vault with Master Password** - Store encrypted, user manages master password
3. **Delegated to Third-Party** - Use Plaid/Yodlee, they handle credentials
4. **Zero-Knowledge Architecture** - Client-side encryption, server never sees plaintext

WealthTrack appears to choose option 2 (encrypted vault). Critical requirements:
- Strong encryption (AES-256 or better)
- Master password never stored server-side
- Key derivation function (PBKDF2, bcrypt, or Argon2)
- Consider hardware security module (HSM) for key management at scale
- Account recovery strategy (security questions, backup codes, etc.)

### Balance Tracking Patterns

Most apps use one of these approaches:

1. **Manual Entry Only** - User inputs each balance update
2. **Scheduled Reminders** - App reminds user to update balances
3. **Semi-Automated** - User initiates refresh, app fetches data
4. **Fully Automated** - App refreshes on schedule without user action

WealthTrack starts with option 1, explicitly "extensible for future automation" (option 3 or 4 later).

Pattern to follow:
- Store each balance entry as timestamped record (never update in place)
- Current balance = most recent entry per account
- History = all entries ordered by timestamp
- Support backdating entries for historical data correction

### Multi-User Patterns

Household finance apps typically implement one of:

1. **Single Account, Shared Login** - Simple but no individual access control
2. **Individual Accounts, Manual Sharing** - User initiates sharing per account
3. **Household Model** - First-class concept, accounts belong to household
4. **Granular Permissions** - Per-account, per-user permission matrix

WealthTrack appears to target option 3 (household model). Key decisions needed:
- Who can add members to household?
- Can individual accounts be marked private?
- What happens when member leaves household?
- Can accounts be transferred between households?

### Account Organization Patterns

Common approaches:

1. **Flat List** - All accounts in one list (simple, doesn't scale)
2. **Type-Based Categories** - Group by account type (checking, savings, investment)
3. **Institution-Based** - Group by financial institution
4. **Custom Groups** - User-defined grouping with tags/folders
5. **Multi-Dimensional** - Combination of above (type AND institution AND custom groups)

Best practice: Start with option 2 (type-based), add option 4 (custom groups) for flexibility.

## Competitive Landscape Insights

Based on training knowledge, common feature sets in this space:

**Basic Tier (Mint-like):**
- Automated balance sync via Plaid
- Transaction categorization
- Budget tracking
- Bill reminders

**Net Worth Focus (Personal Capital-like):**
- Investment portfolio analysis
- Retirement planning tools
- Asset allocation recommendations
- Fee analysis

**Privacy Focus (Moneydance-like):**
- Local-only or self-hosted
- No cloud sync
- Manual entry only
- Full data control

**WealthTrack's Positioning:**
- More feature-rich than privacy-only tools (credential vault, multi-user)
- Less complex than full investment analysis platforms
- Manual-first but extensible (validates without expensive API costs)
- Household-centric (many tools are individual-only)

## User Expectations by Region

UK-specific considerations (WealthTrack mentions ISAs):

### Expected Account Types (UK)
- Current Account (checking)
- Savings Account
- ISA (Individual Savings Account)
  - Cash ISA
  - Stocks & Shares ISA
  - Lifetime ISA
  - Innovative Finance ISA
- Pension
  - Personal Pension
  - Workplace Pension
  - SIPP (Self-Invested Personal Pension)
- Investment Account (non-ISA)
- Premium Bonds
- Help to Buy ISA (legacy)

### UK-Specific Features
- ISA allowance tracking (users care about £20k annual limit)
- Multiple currency support (GBP primary, but USD/EUR common)
- National Insurance number storage (optional, for pension consolidation)

## Privacy & Security Expectations

Users of financial apps expect:

1. **Data Encryption**
   - At rest: Database encryption
   - In transit: HTTPS/TLS only
   - Client-side: Local encryption for sensitive fields

2. **Access Control**
   - Multi-factor authentication (2FA)
   - Session timeout (auto-logout)
   - Login attempt limiting (rate limiting, account lockout)

3. **Audit Trail**
   - Who accessed what data
   - When balances were changed
   - IP address logging (for security review)

4. **Data Portability**
   - Export all data
   - Delete account completely (GDPR right to erasure)
   - Download history

5. **Transparency**
   - Clear privacy policy
   - No selling of financial data
   - Open about encryption methods

## Sources

**Confidence Note:** This research is based on training knowledge (through January 2025) without verification from current sources. WebSearch and Context7 tools were unavailable. Findings should be considered MEDIUM confidence and validated against:

1. Current competitive products (Mint, Personal Capital, YNAB, Moneydance, MoneyHub, Emma, Snoop - UK-focused)
2. User reviews and feature requests on product forums
3. Security best practices from OWASP and financial industry standards
4. Plaid/Yodlee documentation for understanding credential management patterns

**Recommended Validation:**
- Survey 5-10 popular personal finance apps (2026 versions)
- Review UK FCA guidance on credential storage
- Check current encryption standards (NIST recommendations)
- Verify GDPR requirements for financial data handling
