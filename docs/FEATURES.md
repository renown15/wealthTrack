# WealthTrack Features

A comprehensive guide to all features available in WealthTrack v1 (Phase 6).

---

## 1. Account Hub

### Core Capabilities

**Institution Management**
- Add, edit, and delete financial institutions
- Group institutions by parent company (e.g., NatWest group)
- Track institution type (bank, building society, investment platform, etc.)

**Account Management**
- Create accounts for each institution
- Support for diverse account types:
  - Current Account
  - Savings Account
  - Cash ISA
  - Stocks & Shares ISA
  - Lifetime ISA
  - SIPP (Self-Invested Personal Pension)
  - Premium Bonds
  - Shares Account (for direct share holdings)
- Track account status (Open, Closed, Suspended)
- Record interest rates and fixed bonus rates with expiry dates
- Store unique identifiers (account number, sort code, ROLL reference)
- Track share holdings (number of shares, underlying asset, current price, purchase price)
- Track pension account details (monthly payment for DB pensions, asset class)
- Record loan/mortgage encumbrances (e.g., outstanding mortgage amount)

**Balance Tracking**
- Record balance snapshots at any time
- View complete balance history over time
- Immutable event-based history (no retroactive edits)
- Support for multiple event types:
  - Balance updates
  - Deposits
  - Withdrawals
  - Fees
  - Tax events
  - Share sales

**Account Documents**
- Upload documents (statements, confirmations, tax documents)
- Delete documents
- Download for viewing
- Organize by account

**Account Grouping**
- Create account groups (e.g., "Emergency Fund", "Investment Portfolio")
- Assign multiple accounts to groups
- View grouped totals in portfolio table

**Data Export**
- Export accounts to Excel spreadsheet
- Export institutions and their credentials to Excel
- Includes all current information and account balances

### Performance Features

**Price Update Tracking**
- Timestamp of the most recent stock price or balance update displayed in the summary panel
- Relative time format (e.g., "2 hours ago", "3 days ago")
- Click for exact timestamp details

---

## 2. Portfolio View

### Dashboard Summary

**Key Metrics**
- **Total Net Worth** — sum of all account balances (accounts with negative balances like Tax Liability treated as liabilities)
- **Cash at Hand** — total of all current and savings accounts
- **ISA Savings** — combined value of all ISA accounts
- **Illiquid Assets** — Premium Bonds, SIPP, LISAs, and other less liquid holdings
- **Trust Assets** — accounts held in trust
- **Pension Value** — calculated value of DB and DC pensions using annuity formulas plus current DC balances
- **Projected Annual Yield** — estimated annual interest/dividends based on current rates and balances
- **Last Price Update** — timestamp of the most recent price update across all accounts

**Pension Calculation**
- DC Pensions: Current balance values
- DB Pensions: Capitalized value using monthly payment × 12 × annuity factor (configurable life expectancy and interest rate)
- Formula: monthly × 12 × (1 − (1+r)⁻ⁿ) / r (where r = annuity rate, n = life expectancy in years)

### Portfolio Table

**View Modes**
- **Ungrouped** — all accounts in flat list
- **Grouped** — accounts organized by groups
- **Hide Closed Accounts** — toggle to show/hide closed accounts

**Account Columns**
- Institution (with parent company if applicable)
- Account name
- Account type
- Current balance (formatted currency)
- Display balance (adjusted for account type and calculations)
- Event count (number of recorded balance updates/events)
- Last updated date

**Actions per Account**
- View full event history with details
- Update balance with new event
- Edit account details
- Delete account (with confirmation)
- View account documents
- Record share sale (for Shares accounts)
- View share sale history

---

## 3. Tax Hub

### Tax Year Management

**Tax Period Selection**
- Choose tax year to analyze (e.g., 2024-2025)
- View all Shares accounts that had sales in the selected period
- Automatic eligibility filtering based on transaction history

### Capital Gains Tracking

**Share Sales Recording**
- **Shares Account Selection** — choose which Shares account the sale occurred on
- **Shares to Sell** — defaults to the account's current share count
- **Sale Date** — when the shares were sold
- **Quantity Sold** — how many shares were sold (numeric input)
- **Sale Price** — price per share received
- **Purchase Price** — original purchase price per share (for capital gain calculation)
- **Commission/Fees** — any fees charged on the sale

**Capital Gain Calculation**
- Total sale proceeds: (shares sold) × (sale price)
- Cost basis: (shares sold) × (purchase price)
- Gross capital gain: proceeds − cost basis
- Net capital gain (if applicable): gross gain − fees

**Data Storage**
- All share sale details stored as events with attributes
- Capital gain automatically calculated and stored
- Searchable and reportable

### Tax Return Preparation

**Tax Return View**
- View all share sales for a given tax year
- Display:
  - Account name (Shares account where sale occurred)
  - Number of shares sold
  - Sale date
  - Capital gain amount
  - Tax taken off (if applicable)
- Summary totals for the tax year

**Tax Return Lifecycle**
- Create or draft tax returns per tax year
- Populate with capital gains from share sales
- Record tax taken off (e.g., withholding tax)
- View calculation summary
- Export tax year information

---

## 4. Analytics

### Portfolio Breakdown Charts

**By Account Type**
- Visual breakdown of total portfolio by account type
- See what percentage is in ISAs, SIPPs, current accounts, etc.
- Hover for exact amounts

**By Institution**
- Portfolio split across different banks/institutions
- Useful for deposit insurance planning (FSCS limits, etc.)
- See which institutions hold the most value

**By Asset Class**
- Breakdown by asset class (Cash, Equities, Bonds, Property, etc.)
- Helps visualize investment diversification
- Track asset allocation over time

### Balance History

**Trend Charts**
- Total portfolio value over time
- Line chart showing net worth progression
- Filter by date range
- See growth/decline trends

**Multi-Account Comparison**
- Compare balance histories across accounts
- See which accounts are growing fastest
- Identify seasonal patterns (bonus rates, dividend deposits, etc.)

---

## 5. Credential Vault

### Secure Storage

**Credential Management**
- Add login credentials for any institution
- Store username, password, security questions, and notes
- Credentials encrypted at rest using Fernet symmetric encryption
- Only decrypted when viewing (in transit, over HTTPS in production)

**Credential Types**
- Username/Password (for typical account login)
- PIN-based (for telephone banking)
- API Keys (for integration services)
- Customer numbers (for reference)
- Notes (for custom credential information)

### Security

**Encryption**
- Fernet symmetric encryption (256-bit AES)
- Each institution's credentials have their own encrypted secret
- Database stores only ciphertext, never plaintext

**Access Control**
- Login with username and password protected by bcrypt hash
- JWT session tokens with configurable expiry (default 8 hours in dev)
- Per-session authorization checks on all endpoints

---

## 6. Reference Data Administration

### Editable Lookup Values

**Account Types**
- Create, edit, delete account types
- Examples: Current Account, Savings, ISA, SIPP, Shares, Premium Bonds
- Used to categorize accounts and drive UI logic

**Account Statuses**
- Account states: Open, Closed, Suspended
- Manage allowed values in the system

**Credential Types**
- Types of credentials that can be stored: Username/Password, PIN, API Key, etc.
- Define options available for the credential vault

**Institution Types**
- Bank, Building Society, Investment Platform, Insurance Company, etc.
- Categorize institutions for filtering/reporting

**Event Types**
- Transaction types: Balance, Deposit, Withdrawal, Fee, Tax, Share Sale
- Control which event types are available for recording

**Attribute Types**
- For advanced event recording: Capital Gain, Tax Taken Off, Shares Sold, etc.
- Extensible for future features

---

## 7. Data Management

### Account Import/Export

**Export to Excel**
- One-click export of all accounts with current balances
- Useful for backup, analysis, or sharing with accountant
- Includes all account details and latest balance snapshots

### Event History

**Complete Audit Trail**
- Every balance update is immutable and timestamped
- View full history of all events for any account
- Search and filter events by type, date, amount

### Multi-Institution Consolidation

**Unified View**
- See accounts across all institutions in one table
- Total net worth includes all institutions
- Portfolio splits show cross-institution diversification

---

## 8. User Interface & UX

### Responsive Design

**Multi-Device Support**
- Mobile-responsive CSS (UnoCSS utilities)
- Touch-friendly buttons and inputs
- Optimized for phone, tablet, and desktop viewing

### Navigation

**Top Navigation Bar**
- Logo and app title
- Links to Account Hub, Analytics, Tax Hub, Credential Vault, Reference Data Admin
- User profile/logout

### Form Validation

**Input Validation**
- Real-time field validation
- Type coercion where sensible (e.g., numeric fields)
- Clear error messages
- Prevents invalid submissions

### Notifications

**Toast Notifications**
- Success messages on create/update/delete
- Error notifications with actionable messages
- Scheduled auto-dismiss
- User can manually close

---

## 9. Future Features (Phase 7+)

- **Household Sharing** — multiple users sharing a combined household view
- **Budget Planning** — set and track budget goals
- **Spending Analysis** — transaction-level tracking and categorization
- **Mobile App** — native iOS/Android apps
- **Bank Integration** — optional Plaid or Open Banking API integration
- **Report Generation** — automated tax reports, net worth statements
- **Goal Tracking** — financial goals with progress visualization

---

## 10. API Endpoints

All endpoints are RESTful with JSON request/response bodies.

### Authentication
- `POST /api/v1/auth/register` — create new user
- `POST /api/v1/auth/login` — obtain JWT token
- `GET /api/v1/auth/profile` — get current user profile

### Portfolio
- `GET /api/v1/portfolio` — get all accounts and portfolio totals

### Accounts
- `GET /api/v1/accounts` — list all accounts
- `POST /api/v1/accounts` — create account
- `GET /api/v1/accounts/{id}` — get account details
- `PUT /api/v1/accounts/{id}` — update account
- `DELETE /api/v1/accounts/{id}` — delete account

### Events (Balance Updates)
- `GET /api/v1/accounts/{id}/events` — list events for account
- `POST /api/v1/accounts/{id}/events` — record new event
- `DELETE /api/v1/events/{id}` — delete event

### Institutions
- `GET /api/v1/institutions` — list all institutions
- `POST /api/v1/institutions` — create institution
- `PUT /api/v1/institutions/{id}` — update institution
- `DELETE /api/v1/institutions/{id}` — delete institution

### Credentials
- `GET /api/v1/institutions/{id}/credentials` — list credentials
- `POST /api/v1/institutions/{id}/credentials` — add credential
- `PUT /api/v1/credentials/{id}` — update credential
- `DELETE /api/v1/credentials/{id}` — delete credential

### Tax
- `GET /api/v1/tax/returns/{year}` — get tax return for year
- `POST /api/v1/tax/returns/{year}` — create/update tax return
- `GET /api/v1/tax/returns/{year}/share-sales` — list share sales for year

### Reference Data
- `GET /api/v1/reference-data` — get all lookup values
- `POST /api/v1/reference-data` — create reference data item
- `PUT /api/v1/reference-data/{id}` — update
- `DELETE /api/v1/reference-data/{id}` — delete

### Analytics
- `GET /api/v1/analytics/portfolio-history` — historical net worth data
- `GET /api/v1/analytics/breakdown` — current portfolio breakdown

Full API documentation available at `/docs` when running the backend (FastAPI Swagger UI).
