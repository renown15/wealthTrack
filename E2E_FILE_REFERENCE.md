# E2E Testing Framework - Complete File Reference

## Files Created (11 files)

### Configuration & Setup (3 files)

**1. `test-docker-compose.yml`** (root directory)
```yaml
Services:
├── test-db (PostgreSQL 16 on port 5433)
│   ├── User: wealthtrack_test
│   ├── Password: test_password
│   ├── Volume: wealthtrack-test-db-volume
│   └── Health check: pg_isready
└── test-api (Backend container on port 8001)
    ├── Builds from: ./backend/Dockerfile
    ├── Env: DATABASE_URL points to test-db
    ├── Command: alembic upgrade head && uvicorn
    └── Health check: curl http://localhost:8001/docs
```

**2. `frontend/playwright.config.ts`**
```typescript
Key settings:
├── baseURL: http://localhost:5173 (Vite dev server)
├── testDir: ./tests/e2e
├── workers: 1 (sequential execution)
├── timeout: 30 seconds per test
├── webServer: Launches npm run dev
├── globalSetup: ./tests/e2e/global-setup.ts
├── globalTeardown: ./tests/e2e/global-teardown.ts
├── reporters: [HTML, list]
├── screenshot: only-on-failure
├── video: retain-on-failure
└── trace: on-first-retry
```

**3. `frontend/tests/e2e/fixtures.ts`**
```typescript
Database helper functions:
├── queryTestDb(sql, values) - Raw SQL execution
├── clearTestDatabase() - Truncate tables
├── seedReferenceData() - Insert baseline data
├── getTestUser(email) - Fetch user
├── getTestUserProfile(userId) - Fetch profile
├── getUserAccounts(userId) - Fetch accounts
├── getUserInstitutions(userId) - Fetch institutions
├── verifyPasswordHashed(email) - Check bcrypt
└── closeTestDb() - Close connections

Connection Pool:
└── PostgreSQL pool (wealthtrack_test @ localhost:5433)
```

### Global Lifecycle (2 files)

**4. `frontend/tests/e2e/global-setup.ts`**
```typescript
Runs once BEFORE all tests:
├── 1. docker-compose -f test-docker-compose.yml up -d
│   └── Starts test-db and test-api containers
├── 2. Poll http://localhost:8001/docs (30 retries, 2s each)
│   └── Waits for API health (max 60 seconds)
├── 3. clearTestDatabase()
│   └── Truncates all tables from previous runs
└── 4. seedReferenceData()
    └── Inserts account types, statuses, events, attributes
```

**5. `frontend/tests/e2e/global-teardown.ts`**
```typescript
Runs once AFTER all tests:
├── 1. closeTestDb()
│   └── Closes PostgreSQL pool connections
└── 2. docker-compose -f test-docker-compose.yml down -v
    └── Stops containers and removes volumes (complete cleanup)
```

### Test Scenarios (5 files, 35 tests)

**6. `frontend/tests/e2e/registration.spec.ts`** (5 tests)
```typescript
Tests:
├── ✅ Register new user with valid data
│   └── Verifies: User in DB, password hashed, profile created
├── ✅ Reject invalid email format
│   └── Verifies: Validation error shown
├── ✅ Reject weak password
│   └── Verifies: Password requirement error
├── ✅ Reject duplicate email
│   └── Verifies: Duplicate prevention
└── ✅ Require all fields
    └── Verifies: Field validation
```

**7. `frontend/tests/e2e/login.spec.ts`** (6 tests)
```typescript
Tests:
├── ✅ Login with valid credentials
│   └── Verifies: JWT in localStorage, dashboard visible
├── ✅ Reject invalid credentials
│   └── Verifies: Error message, no token stored
├── ✅ Reject wrong password
│   └── Verifies: Authentication error
├── ✅ Require email field
│   └── Verifies: Validation error
├── ✅ Require password field
│   └── Verifies: Validation error
└── ✅ Preserve login state on refresh
    └── Verifies: Token persists, session maintained
```

**8. `frontend/tests/e2e/portfolio.spec.ts`** (7 tests)
```typescript
Tests:
├── ✅ Display portfolio hub after login
│   └── Verifies: Dashboard visible
├── ✅ Create new account
│   └── Verifies: Account in UI and database
├── ✅ Display account balance
│   └── Verifies: Balance calculation and display
├── ✅ Link external institution
│   └── Verifies: Institution in database
├── ✅ Calculate total portfolio value
│   └── Verifies: Multiple accounts aggregated
├── ✅ List all user accounts
│   └── Verifies: Account pagination/display
└── ✅ Update account details
    └── Verifies: Changes persisted in database
```

**9. `frontend/tests/e2e/persistence.spec.ts`** (7 tests)
```typescript
Tests (Multi-session scenarios):
├── ✅ User profile persists across sessions
│   └── Verifies: User data survives application restart
├── ✅ Account data persists across sessions
│   └── Verifies: Accounts still exist after login
├── ✅ Account balances persist across sessions
│   └── Verifies: Balance calculations maintained
├── ✅ Institution credentials persist
│   └── Verifies: Linked institutions reappear
├── ✅ Login state with JWT token
│   └── Verifies: Token management across sessions
├── ✅ Transaction history persists
│   └── Verifies: Events survive restarts
└── Uses browser.newContext() for multi-session testing
```

**10. `frontend/tests/e2e/error-handling.spec.ts`** (10 tests)
```typescript
Tests:
├── ✅ Handle invalid email format
│   └── Verifies: Error message, page usable
├── ✅ Handle network timeout
│   └── Verifies: Graceful degradation
├── ✅ Handle server errors (500)
│   └── Verifies: Error boundary works
├── ✅ Recover from validation errors
│   └── Verifies: Can fix and resubmit
├── ✅ Handle expired session
│   └── Verifies: Redirect to login
├── ✅ Show friendly duplicate account error
│   └── Verifies: User-friendly message
├── ✅ Handle concurrent requests
│   └── Verifies: No race conditions
├── ✅ Reject invalid token
│   └── Verifies: Authentication fails safely
├── ✅ Prevent SQL injection
│   └── Verifies: Input treated as data
└── ✅ Handle missing API response fields
    └── Verifies: Defensive code works
```

### Documentation (3 files)

**11. `frontend/tests/e2e/README.md`**
```markdown
Comprehensive guide covering:
├── Architecture overview
├── Running instructions (all modes)
├── Test scenario descriptions
├── Database setup process
├── Database assertion examples
├── Configuration explanations
├── CI/CD integration examples
├── Troubleshooting guide
├── Best practices
└── Extension guidance
```

## Files Modified (2 files)

**1. `frontend/package.json`**
```json
Added devDependencies:
├── "@playwright/test": "^1.40.1"
└── "pg": "^8.11.3"

Added scripts:
├── "test:e2e": "playwright test"
├── "test:e2e:ui": "playwright test --ui"
├── "test:e2e:headed": "playwright test --headed"
└── "test:e2e:debug": "playwright test --debug"
```

**2. `Makefile`**
```makefile
Added commands:
├── make test-e2e          # Run all E2E tests
├── make test-e2e-ui       # Run with interactive UI
├── make test-e2e-headed   # Run with visible browser
└── make test-e2e-debug    # Run in debug mode

Updated:
└── help section with E2E test documentation
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       Test Execution Flow                        │
└─────────────────────────────────────────────────────────────────┘

                        Start Test Suite
                              ↓
                    ┌─────────────────────┐
                    │  global-setup.ts    │ (Runs once)
                    │  (Once per session)  │
                    └─────────────────────┘
                              ↓
          ┌───────────────────────────────────────┐
          │  docker-compose up -d                 │
          │  ├─ test-db:5433 (PostgreSQL)        │
          │  └─ test-api:8001 (Backend API)      │
          └───────────────────────────────────────┘
                              ↓
          ┌───────────────────────────────────────┐
          │  Poll API health (max 60 seconds)     │
          │  GET http://localhost:8001/docs       │
          └───────────────────────────────────────┘
                              ↓
          ┌───────────────────────────────────────┐
          │  Seed test database                   │
          │  ├─ clearTestDatabase()               │
          │  └─ seedReferenceData()               │
          └───────────────────────────────────────┘
                              ↓
          ┌─────────────────────────────────────────────┐
          │      Run Each Test File Sequentially         │
          │  (playwright.config.ts: workers = 1)         │
          └─────────────────────────────────────────────┘
                              ↓
          ┌───────────────────────────────────────┐
          │    Test: registration.spec.ts         │
          │    ├─ Test 1: Valid registration    │
          │    ├─ Test 2: Invalid email         │
          │    ├─ Test 3: Weak password         │
          │    ├─ Test 4: Duplicate email       │
          │    └─ Test 5: Required fields       │
          └───────────────────────────────────────┘
                              ↓
          ┌───────────────────────────────────────┐
          │    Test: login.spec.ts                │
          │    ├─ Test 1: Valid credentials      │
          │    ├─ Test 2: Invalid credentials    │
          │    ├─ Test 3: Wrong password         │
          │    ├─ Test 4: Require email          │
          │    ├─ Test 5: Require password       │
          │    └─ Test 6: Preserve state         │
          └───────────────────────────────────────┘
                              ↓
          ┌───────────────────────────────────────┐
          │  ... portfolio.spec.ts (7 tests)      │
          │  ... persistence.spec.ts (7 tests)    │
          │  ... error-handling.spec.ts (10 tests)│
          │  Total: 35 tests                      │
          └───────────────────────────────────────┘
                              ↓
                   ┌──────────────────────┐
                   │ global-teardown.ts   │ (Runs once)
                   │  (Once per session)   │
                   └──────────────────────┘
                              ↓
          ┌───────────────────────────────────────┐
          │  closeTestDb()                        │
          │  └─ Close PostgreSQL pool             │
          └───────────────────────────────────────┘
                              ↓
          ┌───────────────────────────────────────┐
          │  docker-compose down -v               │
          │  ├─ Stop test-db                      │
          │  ├─ Stop test-api                     │
          │  └─ Remove volumes (complete cleanup) │
          └───────────────────────────────────────┘
                              ↓
                  Test Execution Complete
```

## Data Flow Example

```
Single Test: "Should create account"

Playwright Browser           Test Database
       │                           │
   Step 1: Navigate ──────────────→ (no DB interaction)
   page.goto('/')       Frontend (http://localhost:5173)
       │
   Step 2: Login ────────────────→ API ──────────────→ DB
   Click "Login"        POST /api/auth/login
   Type email/password  
   Click submit         Backend (http://localhost:8001)
       ↓
   API returns JWT + user data
   Frontend stores token in localStorage
       │
   Step 3: Create Account ───────→ API ──────────────→ DB
   Click "Create"       POST /api/accounts
   Type "My Savings"    Headers: Authorization: Bearer <jwt>
   Select type          Body: {name: "My Savings", type: "Savings"}
   Click submit         
       ↓
   API returns account data
   Frontend adds to account list
       │
   Step 4: Assert in UI ─────────→ (no DB interaction)
   page.locator('text=My Savings').toBeVisible()
       │
   Step 5: Assert in DB ─────────→ DB
   queryTestDb('SELECT * FROM accounts WHERE name = ?')
   Verify account exists in database
   Verify account_statuses entry created
   Verify balance record created
```

## Quick Command Reference

```bash
# Run all E2E tests
make test-e2e

# Interactive UI
make test-e2e-ui

# Visible browser
make test-e2e-headed

# Debug mode
make test-e2e-debug

# Specific test file
npx playwright test registration.spec.ts

# Specific test case
npx playwright test -g "should register new user"

# View test report
npx playwright show-report

# Direct npm (from frontend dir)
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:debug
```

## Database Schema Connection

E2E tests interact with these database tables:

```
users
├── id (PK)
├── email (unique)
├── hashed_password (bcrypt)
├── is_active
├── is_verified
└── created_at

user_profile
├── id (PK)
├── user_id (FK → users.id)
├── firstname
├── surname
└── emailaddress

institutions
├── id (PK)
├── user_id (FK → users.id)
├── name
└── created_at

accounts
├── id (PK)
├── user_id (FK → users.id)
├── institution_id (FK → institutions.id)
├── name
├── type_id (FK → reference_data.id)
├── status_id (FK → reference_data.id)
└── created_at

account_balances
├── id (PK)
├── account_id (FK → accounts.id)
├── balance
└── recorded_at

account_events
├── id (PK)
├── account_id (FK → accounts.id)
├── event_type_id (FK → reference_data.id)
├── description
├── amount
└── event_date

reference_data
├── id (PK)
├── class (ACCOUNT_TYPE, ACCOUNT_STATUS, EVENT_TYPE, ATTRIBUTE_TYPE)
├── key
├── reference_value
├── sort_index
├── created_at
└── updated_at
```

## Environment Isolation

```
Development              Test Environment        Production
───────────────────────────────────────────────────────────
localhost:5432           localhost:5433          (cloud provider)
(dev DB)                 (test-db container)     
                         
localhost:8000           localhost:8001          (cloud provider)
(dev API)                (test-api container)    

localhost:3000           (no frontent service)   (cloud provider)
(dev frontend)           Uses Vite dev server
                         on localhost:5173
```

---

**Complete E2E Framework**: 11 files created, 2 files modified, 35 tests implemented ✅
