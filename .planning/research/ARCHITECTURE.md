# Architecture Patterns: Personal Finance/Wealth Management

**Domain:** Personal wealth tracking with multi-institution account management
**Researched:** 2026-02-03
**Confidence:** HIGH (based on established patterns for financial applications and existing codebase analysis)

## Executive Summary

Personal finance applications require specialized architecture patterns to handle:
- **Sensitive financial data** with encryption at rest and in transit
- **Multi-tenancy** for household sharing without compromising data isolation
- **Audit trails** for all balance changes and account events
- **Extensibility** for diverse account types without schema changes

The recommended architecture extends your existing TypeScript MVC + FastAPI stack with:
1. **Encryption Layer** - Transparent field-level encryption for credentials
2. **Multi-tenant Data Layer** - User/Household context enforcement at query level
3. **Event-Sourced Balance History** - Immutable event log for all balance updates
4. **Reference Data System** - Type-safe extensible enums without schema migrations

## Recommended Architecture

### High-Level Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (SPA)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │  Account     │  │  Credential  │          │
│  │  View        │  │  Management  │  │  Vault View  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│  ┌──────┴─────────────────┴──────────────────┴───────┐          │
│  │         Dashboard/Account/Vault Controllers       │          │
│  └──────┬─────────────────────────────────────┬──────┘          │
│         │                                      │                 │
│  ┌──────┴───────┐                    ┌────────┴─────────┐       │
│  │  ApiService  │                    │  EncryptionUtil  │       │
│  │  (axios)     │                    │  (client-side)   │       │
│  └──────┬───────┘                    └──────────────────┘       │
└─────────┼──────────────────────────────────────────────────────┘
          │ HTTPS (JWT in header)
          │
┌─────────┼──────────────────────────────────────────────────────┐
│         │              BACKEND (FastAPI)                        │
│  ┌──────┴───────┐                                               │
│  │  API Layer   │                                               │
│  │  Controllers │  /accounts, /institutions, /credentials       │
│  └──────┬───────┘  /households, /balance-history               │
│         │                                                        │
│  ┌──────┴────────────────────────────────────────────┐         │
│  │              Service Layer                        │         │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │         │
│  │  │ Account  │ │Credential│ │   Household      │ │         │
│  │  │ Service  │ │  Vault   │ │   Service        │ │         │
│  │  │          │ │ Service  │ │                  │ │         │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────────────┘ │         │
│  └───────┼────────────┼────────────┼───────────────┘         │
│          │            │            │                           │
│  ┌───────┴────────────┴────────────┴───────────────┐          │
│  │         Multi-Tenant Query Layer                │          │
│  │  (Automatic user/household context injection)   │          │
│  └───────┬──────────────────────────────┬───────────┘          │
│          │                              │                      │
│  ┌───────┴───────┐           ┌──────────┴──────────┐          │
│  │  Encryption   │           │   Reference Data    │          │
│  │  Middleware   │           │   Cache             │          │
│  │  (Fernet)     │           │                     │          │
│  └───────┬───────┘           └─────────────────────┘          │
└──────────┼──────────────────────────────────────────────────────┘
           │
┌──────────┴──────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                         │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐     │
│  │   users    │  │  households │  │  household_members   │     │
│  └────────────┘  └─────────────┘  └──────────────────────┘     │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐     │
│  │institutions│  │  accounts   │  │  account_events      │     │
│  └────────────┘  └─────────────┘  └──────────────────────┘     │
│  ┌─────────────────────────────┐  ┌──────────────────────┐     │
│  │ institution_credentials     │  │  reference_data      │     │
│  │ (encrypted values)          │  │                      │     │
│  └─────────────────────────────┘  └──────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | Data Scope |
|-----------|---------------|-------------------|------------|
| **Dashboard View** | Display aggregate wealth, account list | DashboardController | Read-only display |
| **Account Management View** | Add/edit/close accounts | AccountController | Account CRUD forms |
| **Credential Vault View** | Store/view institution credentials | VaultController | Credential display (masked) |
| **Household Settings View** | Manage household members | HouseholdController | Household membership |
| **Dashboard/Account/Vault Controllers** | Handle user interactions, orchestrate API calls | Views, ApiService | Stateless request/response |
| **ApiService** | HTTP client to backend, JWT management | All Controllers | No business logic |
| **Backend API Controllers** | Route handlers, request validation | Services, Database | HTTP layer only |
| **AccountService** | Account CRUD, balance operations | Database, HouseholdService | Enforces ownership |
| **CredentialVaultService** | Encrypt/decrypt credentials | EncryptionMiddleware, Database | Encryption/decryption |
| **HouseholdService** | Household membership, access control | Database | Multi-tenant filtering |
| **EncryptionMiddleware** | Transparent field encryption | Database | Encrypt on write, decrypt on read |
| **Multi-Tenant Query Layer** | Inject user/household context into queries | All Services | Filter by ownership |
| **Reference Data Cache** | In-memory type lookups | Services | Reduce DB queries |
| **Database** | Persistent storage | Services via SQLAlchemy | ACID guarantees |

## Data Layer Patterns

### 1. Multi-Tenancy via Ownership Model

**Pattern:** User-owned resources with household-based sharing

**Implementation:**

Every data table includes `user_id` (owner) foreign key. Household sharing uses junction table pattern:

```sql
-- Core ownership
accounts.user_id → users.id (owner)
institutions.user_id → users.id (owner)

-- Household sharing
household_members
  - household_id → households.id
  - user_id → users.id
  - role (owner, admin, member)
  - joined_at

-- Access rule:
-- User can access resource IF:
--   resource.user_id = current_user.id
--   OR current_user IN (SELECT user_id FROM household_members WHERE household_id = resource.owner.household_id)
```

**Key Decisions:**

- Users OWN accounts (not households) - preserves "my accounts vs your accounts" within household
- Household access is READ-WRITE for all members (v1 simplification, can add permissions later)
- Each user can belong to ONE household (simplifies queries)

**Query Pattern:**

```python
# Service layer enforces multi-tenancy
class AccountService:
    def __init__(self, db: AsyncSession, current_user: User):
        self.db = db
        self.current_user = current_user

    async def get_accounts(self) -> List[Account]:
        # Automatically filter by user OR household
        query = select(Account).where(
            or_(
                Account.user_id == self.current_user.id,
                Account.user_id.in_(
                    select(User.id)
                    .join(HouseholdMember)
                    .where(HouseholdMember.household_id == self.current_user.household_id)
                )
            )
        )
        return (await self.db.execute(query)).scalars().all()
```

**Anti-Pattern to Avoid:**

- Global queries without user context (security vulnerability)
- Household-owned accounts (loses individual ownership tracking)
- Per-account sharing permissions (too complex for v1)

### 2. Event-Sourced Balance History

**Pattern:** Immutable event log for all balance changes

**Implementation:**

```python
# account_events table
class AccountEvent(Base):
    __tablename__ = "account_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=False)
    event_type_id: Mapped[int]  # Reference to event_type in reference_data
    event_date: Mapped[datetime]  # When balance was recorded (not when event was created)
    value: Mapped[Decimal] = mapped_column(Numeric(precision=20, scale=2))
    note: Mapped[Optional[str]]
    created_at: Mapped[datetime]  # Audit timestamp

    # NEVER UPDATE - Insert only
    # Current balance = latest event with event_type = 'balance_update'
```

**Benefits:**

- Full audit trail (who changed what when)
- Time-travel queries ("what was my net worth on 2025-01-01?")
- Supports corrections without data loss (add new event, don't update old)
- Extensible event types via reference_data

**Event Types (reference_data):**

- `balance_update` - Manual balance entry
- `account_opened` - Initial account creation
- `account_closed` - Account closure
- `correction` - Fix erroneous balance (links to corrected event)

**Query Pattern:**

```python
# Get current balance
latest_balance = (
    select(AccountEvent.value)
    .where(
        AccountEvent.account_id == account_id,
        AccountEvent.event_type_id == balance_update_type_id
    )
    .order_by(AccountEvent.event_date.desc())
    .limit(1)
)

# Get balance history (for charts)
history = (
    select(AccountEvent.event_date, AccountEvent.value)
    .where(
        AccountEvent.account_id == account_id,
        AccountEvent.event_type_id == balance_update_type_id
    )
    .order_by(AccountEvent.event_date.asc())
)
```

**Anti-Pattern to Avoid:**

- Storing current_balance on Account table (denormalized, can drift out of sync)
- Updating existing events (loses audit trail)
- Using event_type as string enum (not extensible)

### 3. Encryption Architecture for Credentials

**Pattern:** Transparent field-level encryption with key management

**Implementation:**

```python
# Backend encryption service
from cryptography.fernet import Fernet
import os

class EncryptionService:
    """Handles encryption/decryption of sensitive fields."""

    def __init__(self):
        # Key from environment (stored in secrets manager in production)
        self._key = os.environ.get("ENCRYPTION_KEY").encode()
        self._fernet = Fernet(self._key)

    def encrypt(self, plaintext: str) -> str:
        """Encrypt string, return base64-encoded ciphertext."""
        return self._fernet.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        """Decrypt base64-encoded ciphertext, return plaintext."""
        return self._fernet.decrypt(ciphertext.encode()).decode()

# Database model with encrypted field
class InstitutionCredential(Base):
    __tablename__ = "institution_credentials"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    institution_id: Mapped[int] = mapped_column(ForeignKey("institutions.id"))
    credential_type_id: Mapped[int]  # Reference: 'username', 'password', 'security_question'
    key: Mapped[str]  # e.g., "login_username", "security_question_1"
    value_encrypted: Mapped[str]  # ENCRYPTED VALUE stored here
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]

# Service transparently encrypts/decrypts
class CredentialVaultService:
    def __init__(self, db: AsyncSession, current_user: User, encryption: EncryptionService):
        self.db = db
        self.current_user = current_user
        self.encryption = encryption

    async def store_credential(self, institution_id: int, key: str, value: str):
        """Store credential with automatic encryption."""
        credential = InstitutionCredential(
            user_id=self.current_user.id,
            institution_id=institution_id,
            key=key,
            value_encrypted=self.encryption.encrypt(value)  # Encrypt before storage
        )
        self.db.add(credential)
        await self.db.commit()

    async def get_credentials(self, institution_id: int) -> Dict[str, str]:
        """Retrieve credentials with automatic decryption."""
        query = select(InstitutionCredential).where(
            InstitutionCredential.user_id == self.current_user.id,
            InstitutionCredential.institution_id == institution_id
        )
        credentials = (await self.db.execute(query)).scalars().all()

        return {
            cred.key: self.encryption.decrypt(cred.value_encrypted)  # Decrypt on read
            for cred in credentials
        }
```

**Key Management:**

- **Development:** Store key in `.env` file (git-ignored)
- **Production:** Use secrets manager (AWS Secrets Manager, HashiCorp Vault)
- **Rotation:** Support key versioning (store key_version_id with each credential)

**Security Boundaries:**

1. **In Transit:** HTTPS for all API calls (JWT in Authorization header)
2. **At Rest:** Fernet symmetric encryption for credential values in database
3. **In Memory:** Decrypt only in service layer, never log plaintext
4. **Frontend:** Never store plaintext credentials in localStorage/cookies

**Anti-Pattern to Avoid:**

- Client-side encryption (key exposure in JavaScript)
- Storing plaintext in database (obvious vulnerability)
- Using database-level encryption only (doesn't protect against SQL injection)
- Sharing encryption key across environments (dev key != prod key)

### 4. Reference Data System (Extensible Types)

**Pattern:** Lookup tables for extensible enums without schema changes

**Implementation:**

```sql
-- Single reference_data table for all lookups
CREATE TABLE reference_data (
    id SERIAL PRIMARY KEY,
    class VARCHAR(50) NOT NULL,     -- 'account_type', 'event_type', 'credential_type'
    key VARCHAR(50) NOT NULL,       -- 'checking', 'savings', 'investment'
    value TEXT NOT NULL,            -- Human-readable: 'Checking Account'
    sort_index INTEGER DEFAULT 0,  -- Display order
    is_active BOOLEAN DEFAULT TRUE, -- Soft delete
    metadata JSONB,                 -- Extensible attributes
    UNIQUE(class, key)
);

-- Example data
INSERT INTO reference_data (class, key, value, sort_index) VALUES
    ('account_type', 'checking', 'Checking Account', 1),
    ('account_type', 'savings', 'Savings Account', 2),
    ('account_type', 'investment', 'Investment Account', 3),
    ('account_type', 'retirement', 'Retirement Account (401k/IRA)', 4),
    ('account_type', 'credit_card', 'Credit Card', 5),
    ('event_type', 'balance_update', 'Balance Update', 1),
    ('event_type', 'account_opened', 'Account Opened', 2),
    ('event_type', 'account_closed', 'Account Closed', 3),
    ('credential_type', 'username', 'Username', 1),
    ('credential_type', 'password', 'Password', 2),
    ('account_status', 'active', 'Active', 1),
    ('account_status', 'closed', 'Closed', 2);
```

**Service Layer with Cache:**

```python
class ReferenceDataService:
    """Cache reference data for fast lookups."""

    _cache: Dict[str, Dict[str, int]] = {}  # {class: {key: id}}

    async def get_id(self, class_name: str, key: str) -> int:
        """Get reference data ID by class and key."""
        if class_name not in self._cache:
            await self._load_class(class_name)
        return self._cache[class_name][key]

    async def get_options(self, class_name: str) -> List[Dict]:
        """Get all options for dropdown (e.g., account types)."""
        query = select(ReferenceData).where(
            ReferenceData.class_ == class_name,
            ReferenceData.is_active == True
        ).order_by(ReferenceData.sort_index)

        results = (await self.db.execute(query)).scalars().all()
        return [
            {"id": r.id, "key": r.key, "value": r.value}
            for r in results
        ]

# Usage in AccountService
class AccountService:
    async def create_account(self, account_data: AccountCreateRequest):
        # Resolve type ID from reference data
        account_type_id = await self.ref_data.get_id('account_type', account_data.type_key)
        status_id = await self.ref_data.get_id('account_status', 'active')

        account = Account(
            user_id=self.current_user.id,
            institution_id=account_data.institution_id,
            name=account_data.name,
            account_type_id=account_type_id,
            account_status_id=status_id
        )
        # ...
```

**Benefits:**

- Add new account types without altering schema
- Consistent lookup pattern across all entities
- Easy to add metadata (e.g., account type categories)
- Internationalization support (add `locale` column)

**Anti-Pattern to Avoid:**

- Hard-coded string enums in code (not extensible)
- Separate table for each type (maintenance burden)
- No caching (too many DB queries)

## Frontend Component Architecture

### Dashboard Component Structure

```
DashboardView (extends BaseView)
├── AccountListComponent
│   ├── AccountCardComponent (per account)
│   │   ├── InstitutionLogo
│   │   ├── AccountName
│   │   ├── CurrentBalance
│   │   └── LastUpdated
│   └── AddAccountButton
├── NetWorthSummaryComponent
│   ├── TotalAssetsCard
│   ├── TotalLiabilitiesCard
│   └── NetWorthCard
└── QuickActionsComponent
    ├── UpdateBalanceButton
    ├── AddAccountButton
    └── ViewHistoryButton
```

**Component Responsibilities:**

| Component | Responsibility | State | Reusability |
|-----------|---------------|-------|-------------|
| `DashboardView` | Layout, data fetching | Accounts list, institutions | Page-level |
| `AccountListComponent` | Group accounts by institution | None (receives props) | Reusable |
| `AccountCardComponent` | Display single account | None | Highly reusable |
| `NetWorthSummaryComponent` | Calculate/display aggregates | None (computed from props) | Reusable |
| `BalanceChartComponent` | Render balance history chart | None | Reusable |

**Data Flow:**

1. `DashboardController.init()` fetches accounts via `apiService.getAccounts()`
2. Controller passes data to `DashboardView.render(accounts, institutions)`
3. View creates components, passing subsets of data as props
4. User clicks "Update Balance" → Controller handles → API call → Re-render

**Anti-Pattern to Avoid:**

- Components fetching their own data (breaks MVC pattern)
- Global state in localStorage (use controller state)
- Passing entire controller to views (tight coupling)

### Sidebar Navigation Pattern

```typescript
// router.ts enhancement for sidebar
class Router {
    private currentPage: string = 'dashboard';

    navigate(page: string): void {
        this.currentPage = page;
        this.updateSidebar();
        // ... existing navigation logic
    }

    private updateSidebar(): void {
        // Remove active class from all nav links
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.classList.remove('active');
        });
        // Add active class to current page link
        document.querySelector(`[data-page="${this.currentPage}"]`)?.classList.add('active');
    }
}

// View structure
class SidebarView extends BaseView {
    render(currentPage: string): string {
        return `
            <nav class="sidebar-nav">
                <a href="#" data-page="dashboard" class="${currentPage === 'dashboard' ? 'active' : ''}">
                    Dashboard
                </a>
                <a href="#" data-page="accounts" class="${currentPage === 'accounts' ? 'active' : ''}">
                    Accounts
                </a>
                <a href="#" data-page="vault" class="${currentPage === 'vault' ? 'active' : ''}">
                    Credential Vault
                </a>
                <a href="#" data-page="household" class="${currentPage === 'household' ? 'active' : ''}">
                    Household
                </a>
            </nav>
        `;
    }
}
```

## API Design Patterns

### RESTful Endpoints for Account/Balance Operations

**Accounts:**

```
GET    /api/v1/accounts                    # List all accessible accounts (user + household)
GET    /api/v1/accounts/{id}               # Get single account details
POST   /api/v1/accounts                    # Create new account
PUT    /api/v1/accounts/{id}               # Update account details
DELETE /api/v1/accounts/{id}               # Close account (soft delete)

GET    /api/v1/accounts/{id}/events        # Get balance history for account
POST   /api/v1/accounts/{id}/events        # Add balance update event
```

**Request/Response Examples:**

```json
// POST /api/v1/accounts
{
    "institution_id": 5,
    "name": "Primary Checking",
    "account_type_key": "checking",
    "initial_balance": 5000.00,
    "balance_date": "2026-02-03"
}

// Response
{
    "id": 123,
    "user_id": 1,
    "institution_id": 5,
    "institution_name": "Chase Bank",
    "name": "Primary Checking",
    "account_type": "checking",
    "account_type_display": "Checking Account",
    "status": "active",
    "current_balance": 5000.00,
    "last_updated": "2026-02-03T10:30:00Z",
    "created_at": "2026-02-03T10:30:00Z"
}

// POST /api/v1/accounts/123/events
{
    "event_type_key": "balance_update",
    "event_date": "2026-02-03",
    "value": 5250.00,
    "note": "Monthly salary deposit"
}

// GET /api/v1/accounts/123/events?start_date=2025-01-01&end_date=2026-02-03
{
    "account_id": 123,
    "events": [
        {
            "id": 1001,
            "event_type": "balance_update",
            "event_date": "2025-01-01",
            "value": 4800.00,
            "note": null,
            "created_at": "2025-01-01T09:00:00Z"
        },
        {
            "id": 1002,
            "event_type": "balance_update",
            "event_date": "2026-02-03",
            "value": 5250.00,
            "note": "Monthly salary deposit",
            "created_at": "2026-02-03T10:30:00Z"
        }
    ]
}
```

**Institutions:**

```
GET    /api/v1/institutions                # List user's institutions
POST   /api/v1/institutions                # Add institution
PUT    /api/v1/institutions/{id}           # Update institution
DELETE /api/v1/institutions/{id}           # Delete institution (if no accounts)
```

**Credentials (Credential Vault):**

```
GET    /api/v1/institutions/{id}/credentials          # Get credentials (decrypted)
POST   /api/v1/institutions/{id}/credentials          # Store credential
PUT    /api/v1/institutions/{id}/credentials/{key}    # Update credential
DELETE /api/v1/institutions/{id}/credentials/{key}    # Delete credential
```

**Security Note:** Credential endpoints must:
- Require authentication (JWT)
- Enforce user ownership (can't access other users' credentials)
- Log all access (audit trail)
- Rate limit (prevent brute force)

**Households:**

```
GET    /api/v1/household                   # Get current user's household
POST   /api/v1/household                   # Create household
POST   /api/v1/household/invite            # Invite user to household
DELETE /api/v1/household/members/{user_id} # Remove member
DELETE /api/v1/household                   # Leave household
```

**Reference Data:**

```
GET    /api/v1/reference/{class}           # Get options for dropdown
                                           # e.g., /api/v1/reference/account_type
```

### Controller Pattern

```python
# backend/app/controllers/accounts.py
from fastapi import APIRouter, Depends, HTTPException
from app.services.account import AccountService
from app.services.reference_data import ReferenceDataService
from app.schemas.account import AccountCreateRequest, AccountResponse
from app.database import get_db
from app.services.auth import get_current_user

router = APIRouter(prefix="/accounts", tags=["accounts"])

@router.get("/", response_model=List[AccountResponse])
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all accounts accessible to user (owned + household)."""
    service = AccountService(db, current_user)
    accounts = await service.get_accounts()
    return accounts

@router.post("/", response_model=AccountResponse, status_code=201)
async def create_account(
    request: AccountCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new account with initial balance."""
    service = AccountService(db, current_user)
    account = await service.create_account(request)
    return account

@router.post("/{account_id}/events", status_code=201)
async def add_balance_event(
    account_id: int,
    request: BalanceEventRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add balance update event."""
    service = AccountService(db, current_user)

    # Verify ownership
    account = await service.get_account(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    event = await service.add_balance_event(account_id, request)
    return event
```

## Build Order and Dependencies

### Phase Dependency Graph

```
Phase 1: Data Model + Reference System
├── Create database models (Account, Institution, AccountEvent, etc.)
├── Implement ReferenceDataService with cache
├── Seed reference_data table
└── Write model tests

Phase 2: Multi-Tenancy Foundation
├── Add household_id to User model
├── Create Household and HouseholdMember models
├── Implement HouseholdService with membership logic
├── Update AccountService to filter by user OR household
└── Write multi-tenancy tests

Phase 3: Account Management (Core)
├── Depends on: Phase 1 (models), Phase 2 (multi-tenancy)
├── Implement AccountService (CRUD)
├── Create /api/v1/accounts endpoints
├── Create InstitutionService and endpoints
├── Frontend: AccountView, AccountController
└── Write integration tests

Phase 4: Balance History (Event Sourcing)
├── Depends on: Phase 3 (accounts must exist)
├── Implement balance event operations in AccountService
├── Create /api/v1/accounts/{id}/events endpoints
├── Frontend: BalanceHistoryView with chart component
└── Write event sourcing tests

Phase 5: Credential Vault (Encryption)
├── Depends on: Phase 3 (institutions must exist)
├── Implement EncryptionService with Fernet
├── Create InstitutionCredential model
├── Implement CredentialVaultService
├── Create /api/v1/institutions/{id}/credentials endpoints
├── Frontend: CredentialVaultView with masked display
└── Write encryption/security tests

Phase 6: Dashboard (Integration)
├── Depends on: Phase 3 (accounts), Phase 4 (balance history)
├── Aggregate balance queries in AccountService
├── Create /api/v1/dashboard/summary endpoint
├── Frontend: DashboardView with components
├── Implement NetWorthSummaryComponent
└── Write end-to-end tests

Phase 7: Household Sharing (Advanced Multi-Tenancy)
├── Depends on: Phase 2 (household foundation), Phase 6 (dashboard)
├── Implement household invitation flow
├── Create /api/v1/household endpoints
├── Frontend: HouseholdSettingsView
├── Update dashboard to show household members
└── Write household sharing tests
```

### Critical Build Order Rules

1. **Reference Data FIRST** - Everything depends on reference_data table for types
2. **Multi-Tenancy EARLY** - Bake in ownership checks before adding features
3. **Encryption ISOLATED** - CredentialVault can be built in parallel with balance history
4. **Dashboard LAST** - Integrates all other features, build after dependencies complete

### Component Dependencies

| Component | Depends On | Can Build In Parallel With |
|-----------|-----------|---------------------------|
| Reference Data System | None | - |
| Multi-Tenancy Layer | Reference Data | - |
| Account Management | Multi-Tenancy, Reference Data | Institution Management |
| Institution Management | Multi-Tenancy, Reference Data | Account Management |
| Balance History | Account Management | Credential Vault |
| Credential Vault | Institution Management | Balance History |
| Dashboard | Account Management, Balance History | Household Sharing UI |
| Household Sharing | Multi-Tenancy, Dashboard | - |

## Patterns to Follow

### Pattern 1: Service Initialization with Context

**What:** Every service receives user context at initialization

**When:** All service classes that access user-scoped data

**Example:**

```python
class AccountService:
    def __init__(
        self,
        db: AsyncSession,
        current_user: User,
        ref_data: ReferenceDataService
    ):
        self.db = db
        self.current_user = current_user
        self.ref_data = ref_data

    async def get_accounts(self) -> List[Account]:
        # current_user automatically available for filtering
        pass

# In controller
@router.get("/accounts")
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ref_data: ReferenceDataService = Depends(get_ref_data_service)
):
    service = AccountService(db, current_user, ref_data)
    return await service.get_accounts()
```

### Pattern 2: Transparent Encryption in Service Layer

**What:** Service handles encryption/decryption, controllers/models don't know

**When:** Storing/retrieving sensitive data (credentials, SSN, etc.)

**Example:**

```python
class CredentialVaultService:
    def __init__(self, db, current_user, encryption: EncryptionService):
        self.encryption = encryption
        # ...

    async def store_credential(self, institution_id: int, key: str, value: str):
        # Encrypt before storage - caller passes plaintext
        encrypted = self.encryption.encrypt(value)
        cred = InstitutionCredential(
            user_id=self.current_user.id,
            institution_id=institution_id,
            key=key,
            value_encrypted=encrypted
        )
        self.db.add(cred)
        await self.db.commit()

    async def get_credential(self, institution_id: int, key: str) -> str:
        # Decrypt on retrieval - returns plaintext to caller
        cred = await self.db.execute(
            select(InstitutionCredential).where(...)
        )
        return self.encryption.decrypt(cred.value_encrypted)
```

### Pattern 3: Reference Data Resolution

**What:** Use reference data keys in requests, resolve to IDs in service

**When:** Any field using reference_data (account types, statuses, event types)

**Example:**

```python
# Request schema uses keys
class AccountCreateRequest(BaseModel):
    name: str
    institution_id: int
    account_type_key: str  # 'checking', 'savings', etc.
    initial_balance: Decimal

# Service resolves to ID
class AccountService:
    async def create_account(self, request: AccountCreateRequest) -> Account:
        # Resolve type key to ID
        type_id = await self.ref_data.get_id('account_type', request.account_type_key)
        status_id = await self.ref_data.get_id('account_status', 'active')

        account = Account(
            user_id=self.current_user.id,
            name=request.name,
            institution_id=request.institution_id,
            account_type_id=type_id,
            account_status_id=status_id
        )
        self.db.add(account)
        await self.db.commit()
        return account
```

### Pattern 4: Event Sourcing for Balance History

**What:** Never update balances, always insert new events

**When:** Recording any account balance change

**Example:**

```python
class AccountService:
    async def update_balance(self, account_id: int, new_balance: Decimal, note: str):
        # Verify ownership first
        account = await self.get_account(account_id)
        if not account:
            raise ValueError("Account not found")

        # Create event (don't update account.balance field)
        event_type_id = await self.ref_data.get_id('event_type', 'balance_update')
        event = AccountEvent(
            user_id=self.current_user.id,
            account_id=account_id,
            event_type_id=event_type_id,
            event_date=datetime.utcnow(),
            value=new_balance,
            note=note,
            created_at=datetime.utcnow()
        )
        self.db.add(event)
        await self.db.commit()

        # Don't update account.current_balance - derive from events

    async def get_current_balance(self, account_id: int) -> Decimal:
        # Query latest event
        query = select(AccountEvent.value).where(
            AccountEvent.account_id == account_id,
            AccountEvent.event_type_id == balance_update_type_id
        ).order_by(AccountEvent.event_date.desc()).limit(1)

        result = await self.db.execute(query)
        return result.scalar_one_or_none() or Decimal(0)
```

### Pattern 5: Component-Based Frontend Rendering

**What:** Break views into small, reusable rendering functions

**When:** Building dashboard and complex views

**Example:**

```typescript
class DashboardView extends BaseView {
    render(accounts: Account[], institutions: Institution[]): string {
        return `
            <div class="dashboard">
                ${this.renderNetWorthSummary(accounts)}
                ${this.renderAccountList(accounts, institutions)}
                ${this.renderQuickActions()}
            </div>
        `;
    }

    private renderNetWorthSummary(accounts: Account[]): string {
        const totalAssets = accounts
            .filter(a => ['checking', 'savings', 'investment'].includes(a.account_type))
            .reduce((sum, a) => sum + a.current_balance, 0);

        return `
            <div class="net-worth-summary">
                <div class="card">
                    <h3>Total Assets</h3>
                    <p class="amount">${this.formatCurrency(totalAssets)}</p>
                </div>
            </div>
        `;
    }

    private renderAccountList(accounts: Account[], institutions: Institution[]): string {
        // Group accounts by institution
        const grouped = this.groupBy(accounts, 'institution_id');

        return `
            <div class="account-list">
                ${Object.entries(grouped).map(([instId, accts]) => {
                    const inst = institutions.find(i => i.id === parseInt(instId));
                    return this.renderInstitutionGroup(inst, accts);
                }).join('')}
            </div>
        `;
    }

    private renderInstitutionGroup(institution: Institution, accounts: Account[]): string {
        return `
            <div class="institution-group">
                <h4>${institution.name}</h4>
                ${accounts.map(a => this.renderAccountCard(a)).join('')}
            </div>
        `;
    }

    private renderAccountCard(account: Account): string {
        return `
            <div class="account-card" data-account-id="${account.id}">
                <div class="account-name">${account.name}</div>
                <div class="account-type">${account.account_type_display}</div>
                <div class="balance">${this.formatCurrency(account.current_balance)}</div>
                <div class="last-updated">Updated ${this.formatDate(account.last_updated)}</div>
            </div>
        `;
    }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct Database Access from Controllers

**What goes wrong:** Controllers directly execute SQLAlchemy queries

**Why it happens:** Seems faster than creating service layer

**Consequences:**
- No multi-tenancy enforcement (security vulnerability)
- Business logic scattered across controllers
- Hard to test (need to mock database)
- No reusability across endpoints

**Prevention:**

```python
# BAD
@router.get("/accounts")
async def list_accounts(db: AsyncSession = Depends(get_db)):
    # Direct query - NO user filtering!
    accounts = await db.execute(select(Account))
    return accounts.scalars().all()

# GOOD
@router.get("/accounts")
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AccountService(db, current_user)
    return await service.get_accounts()  # Service enforces multi-tenancy
```

### Anti-Pattern 2: Storing Current Balance in Account Table

**What goes wrong:** Adding `current_balance` column to `accounts` table

**Why it happens:** Seems easier to query than aggregating events

**Consequences:**
- Balance can drift out of sync with events (data integrity issue)
- Lose audit trail of when balance was updated
- Can't time-travel (no historical balances)
- Update-heavy (need to update account + insert event)

**Prevention:**

```python
# BAD
class Account(Base):
    current_balance: Mapped[Decimal]  # DON'T DO THIS

async def update_balance(account_id, new_balance):
    account.current_balance = new_balance  # Can drift from events

# GOOD
class Account(Base):
    # No balance field - derive from events
    pass

async def get_current_balance(account_id):
    # Query latest event
    return await db.execute(
        select(AccountEvent.value)
        .where(AccountEvent.account_id == account_id)
        .order_by(AccountEvent.event_date.desc())
        .limit(1)
    )
```

### Anti-Pattern 3: Client-Side Encryption

**What goes wrong:** Encrypting credentials in TypeScript before sending to backend

**Why it happens:** Misconception that it's more secure

**Consequences:**
- Encryption key exposed in JavaScript (visible to users)
- Can't rotate keys without redeploying frontend
- Doesn't protect against compromised backend
- Still need HTTPS, so adds no real security

**Prevention:**

```typescript
// BAD
class VaultController {
    async saveCredential(value: string) {
        const encrypted = this.encrypt(value);  // Key in JS - BAD
        await apiService.post('/credentials', { value: encrypted });
    }
}

// GOOD
class VaultController {
    async saveCredential(value: string) {
        // Send plaintext over HTTPS - backend encrypts
        await apiService.post('/credentials', { value });
    }
}
```

### Anti-Pattern 4: Global State in Frontend

**What goes wrong:** Storing accounts/balances in global variables or localStorage

**Why it happens:** Trying to avoid re-fetching data

**Consequences:**
- Stale data (doesn't update when other household members make changes)
- Hard to debug (global state mutations anywhere)
- No single source of truth
- localStorage quotas (5-10MB limit)

**Prevention:**

```typescript
// BAD
// global.ts
export let accounts: Account[] = [];

// DashboardController.ts
import { accounts } from './global';
accounts = await apiService.getAccounts();  // Mutating global

// GOOD
class DashboardController {
    private accounts: Account[] = [];

    async init() {
        this.accounts = await this.apiService.getAccounts();  // Instance state
        this.view.render(this.accounts);
    }
}
```

### Anti-Pattern 5: Hard-Coded Account Types

**What goes wrong:** Using string enums in code instead of reference_data

**Why it happens:** Seems simpler than database lookups

**Consequences:**
- Can't add new account types without code deploy
- Account types scattered across codebase (hard to find all usages)
- No way for users to suggest custom types
- Frontend/backend can drift (different enums)

**Prevention:**

```python
# BAD
class AccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    # Adding new type requires code change

# GOOD
# Use reference_data table
type_id = await ref_data.get_id('account_type', request.account_type_key)
# Adding new type is just INSERT INTO reference_data
```

## Scalability Considerations

| Concern | At 100 Users | At 10K Users | At 1M Users |
|---------|--------------|--------------|-------------|
| **Database Queries** | Single PostgreSQL instance | Add read replicas for dashboard queries | Shard by household_id |
| **Reference Data Cache** | In-memory per worker | Redis shared cache | Redis cluster |
| **Encryption** | Synchronous Fernet | Async encryption in thread pool | Hardware security module (HSM) |
| **Balance History** | Store all events | Partition events table by year | Archive old events to cold storage |
| **Dashboard Aggregation** | Real-time queries | Materialized view refreshed hourly | Pre-computed rollups in cache |
| **API Rate Limiting** | None needed | Per-user rate limits (10 req/sec) | Per-user + per-household limits |

## Sources

**Pattern sources (training data, HIGH confidence):**
- Multi-tenancy patterns: Row-level security and junction table patterns are industry standard for B2B SaaS
- Event sourcing: CQRS/Event Sourcing patterns documented in Martin Fowler's work
- Encryption: Fernet (symmetric encryption) from cryptography library is standard for field-level encryption
- Reference data pattern: Common EAV (Entity-Attribute-Value) variant for extensible enums
- FastAPI patterns: Dependency injection and service layer from FastAPI documentation patterns
- MVC frontend: Component-based rendering aligns with your existing BaseView pattern

**Confidence assessment:**
- Data layer patterns: HIGH (standard patterns, verified against your existing codebase)
- Encryption architecture: HIGH (Fernet is production-proven, well-documented)
- Multi-tenancy: HIGH (row-level filtering is standard approach)
- API design: HIGH (RESTful conventions, matches your existing auth endpoints)
- Frontend architecture: HIGH (extends your existing MVC pattern)

**Areas needing validation:**
- Specific library versions (cryptography.fernet current version)
- Performance benchmarks for your data volumes
- PostgreSQL-specific optimizations for your query patterns

---

*Architecture research completed: 2026-02-03*
*Confidence level: HIGH for patterns, MEDIUM for scalability specifics*
