# WealthTrack Changelog

## Version 1.0.0 (Latest - 2026-04-12)

### 🎉 Tax Hub Feature Complete

**Share Sales Recording**
- Record share sales with automatic calculation of capital gains
- Defaults to account's current share count (user-friendly UX)
- Tracks sale date, quantity, sale price, purchase price, and fees
- Capital gains calculated as: (quantity × sale price) - (quantity × purchase price) - fees

**Tax Return Preparation**
- New Tax Hub view for managing tax returns by year
- Select tax period (e.g., 2024-2025)
- Automatic eligibility filtering - shows only Shares accounts with sales in the period
- Display capital gains and tax liability information
- Capital gains loaded from Share Sale events
- Tax taken off loaded from share sale events
- Full tax return record with totals

**Capital Gains Tracking**
- Capital gain amounts stored as event attributes
- Tax taken off tracked separately
- Share sale events tied to specific Shares accounts
- Historic record of all sales and gains

**API Endpoints**
- `GET /api/v1/tax/returns/{year}` - Get tax return for year
- `POST /api/v1/tax/returns/{year}` - Create/update tax return
- `GET /api/v1/tax/returns/{year}/share-sales` - List share sales for tax year

### 📌 Stock Price Update Tracking

- Added `last_price_update` field to Portfolio response
- Returns ISO timestamp of most recent account price update across all accounts
- Frontend displays in user-friendly relative time format (e.g., "2 hours ago", "3 days ago")
- AccountHub summary panel includes "Last Price Update" stat card with tooltip
- Helps users know when their portfolio data was last refreshed

### ⚖️ Portfolio Consistency Fixes

**Tax Liability Accounting**
- Tax Liability accounts now correctly treated as negative (liabilities reduce net worth)
- Negation applied BEFORE adding to portfolio totals
- Logic applied in both:
  - Portfolio controller (get_user_portfolio endpoint)
  - Analytics repository (breakdown calculations)
- Ensures portfolio totals match across all views (AccountHub, Analytics)

### 🐛 Bug Fixes

- Fixed reference data deduplication (migration 040) preventing "Multiple rows found" errors
- Made migration 037 idempotent to prevent future duplicate issues
- Fixed share sale API validation - numeric fields properly coerced to strings at Pydantic boundary
- Removed portfolio filtering that was excluding zero/negative balances - now consistent

### 📚 Documentation

- Created comprehensive FEATURES.md with all current capabilities
- Created DEVELOPMENT.md with architecture and development patterns
- Updated README.md with Tax Hub feature mention
- Updated QUICKSTART.md features list
- Updated STATE.md with recent changes and completion status
- Updated CLAUDE.md with latest activity timestamp

---

## Version 0.9.0 (2026-04-04)

### 📊 Shares Account Support

- Added Shares account type for tracking direct share holdings
- Number of shares field for balance tracking
- Underlying asset field (stock ticker, fund name, etc.)
- Current price tracking
- Purchase price tracking for capital gains calculations

### 🏦 Asset Class Field

- Added asset_class field to all accounts
- Proper categorization (Cash, Equities, Bonds, Property, etc.)
- Used in portfolio breakdown calculations

### 📋 Event Type Expansion

New event types for richer transaction recording:
- Balance (existing)
- Deposit
- Withdrawal
- Fee
- Tax
- Share Sale (new in this release)

### 🔧 Infrastructure

- Migration 027: asset_class field added
- Migration 028: Savings Provider institution type
- Migration 029: Shares account type support
- Migration 030: Cleaned up redundant Plain ISA type
- Migration 031: New event types added

### 📦 Code Organization

- Extracted reference_data_items.py from reference_data.py (200-line file size limit)
- New SharesBalanceService for share holdings calculations
- Improved test file constraints enforcement

---

## Version 0.8.0 (2026-02-03)

### 🏠 Credential Vault

- Secure encrypted storage for institution login credentials
- Fernet symmetric encryption (256-bit AES)
- Support for multiple credential types:
  - Username/Password
  - PIN-based
  - API Keys
  - Customer numbers
  - Custom fields
- Encrypted at rest, decrypted on access
- Easy CRUD interface in AccountHub

### 👥 Credential Management UI

- Add credentials per institution
- Edit existing credentials
- Delete with confirmation
- View masked credentials (password shown as dots)
- Support for security questions and notes

---

## Version 0.7.0 (2026-01-15)

### 📊 Analytics Dashboard

- Portfolio breakdown by account type
- Portfolio breakdown by institution
- Portfolio breakdown by asset class
- Historical balance trend charts
- Line charts showing net worth over time
- Hover tooltips with exact values
- Date range filtering

### 📈 Charts & Visualization

- Interactive charts (via Chart.js or similar)
- Balance history trends
- Multi-account comparison views
- Seasonal pattern identification

---

## Version 0.6.0 (2025-12-01)

### 🎯 Portfolio Dashboard

- Account Hub main view
- Summary stat cards:
  - Total net worth
  - Cash at hand
  - ISA savings
  - Illiquid assets
  - Trust assets
  - Pension value (calculated)
  - Projected annual yield
- Portfolio table with all accounts
- Grouped view by account group
- Filter closed accounts toggle

### 👥 Account Grouping

- Create account groups (e.g., "Emergency Fund", "Investments")
- Assign accounts to groups
- View group totals
- Create/edit/delete groups

### 📱 Responsive Design

- Mobile-first responsive layout
- Touch-friendly interface
- Optimized for phone/tablet/desktop

---

## Version 0.5.0 (2025-11-01)

### 💾 Balance History

- Event-sourced balance tracking (immutable history)
- Record balance updates at any time
- View complete history for any account
- Search and filter events by:
  - Event type
  - Date range
  - Amount
- Audit trail with timestamps
- No retroactive edits (append-only)

### 📊 Account Details

- Update account information
- Track interest rates and bonus rates
- Record bonus rate expiry dates
- Account number, sort code, ROLL reference
- Account status (Open, Closed, Suspended)

---

## Version 0.4.0 (2025-10-01)

### 🏦 Institution & Account Management

- Add financial institutions
- Track institution type (Bank, Building Society, Investment Platform, etc.)
- Group institutions by parent company
- Full CRUD for institutions

- Add accounts to institutions
- Support for account types:
  - Current Account
  - Savings Account
  - Cash ISA
  - Stocks & Shares ISA
  - Lifetime ISA
  - SIPP
  - Premium Bonds
  - Shares
- Full CRUD for accounts
- Account status tracking

---

## Version 0.3.0 (2025-09-01)

### 🔐 User Authentication

- User registration with email and password
- Login with JWT token generation
- Configurable token expiry
- Password hashing with bcrypt
- Session-based authorization
- User profile endpoints

---

## Version 0.2.0 (2025-08-01)

### 🗄️ Database Foundation

- PostgreSQL 15 database
- SQLAlchemy async ORM
- Alembic migrations
- Reference data (lookup tables)
- Account types
- Institution types
- Credential types
- Event types
- Attribute types (extensible)

---

## Version 0.1.0 (2025-07-01)

### 🚀 Initial Release

- Vue 3 frontend with TypeScript
- FastAPI backend with Pydantic validation
- Basic authentication (JWT + bcrypt)
- Docker Compose for dev environment
- Makefile for common tasks
- Test infrastructure (pytest, Vitest)
- Coverage reporting
- Linting and type checking
- CI/CD foundation

---

## Versioning Scheme

WealthTrack uses semantic versioning:
- **Major** (1.0.0) — significant feature releases or breaking changes
- **Minor** (1.1.0) — new features, backwards compatible
- **Patch** (1.0.1) — bug fixes only

The project is currently at v1.x (Phase 6/7 complete).
