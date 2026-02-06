# End-to-End Testing Framework - CI/CD Deployment Model

## Overview

Comprehensive E2E testing that exercises the **full stack in isolation**:

```
Browser (Playwright) → Frontend (Vite Dev Server)
                      ↓
                      HTTP Requests
                      ↓
Backend API (Docker) → Test Database (Docker, PostgreSQL)
```

**Key Principle:** Every test exercises:
1. **Real browser interactions** (Playwright)
2. **Real HTTP requests** (no mocks)
3. **Real backend API** (uvicorn in Docker)
4. **Real test database** (PostgreSQL in Docker)
5. **Database verification** (SQL queries to confirm persistence)

---

## Architecture

### Containers

**test-docker-compose.yml** defines isolated test environment:

```yaml
test-db:
  - PostgreSQL 16 on port 5433 (separate from dev DB on 5432)
  - Database: wealthtrack_test
  - User: wealthtrack_test / test_password
  - Healthcheck: Ready when responding to pg_isready
  - Volumes: Named volume for data isolation

test-api:
  - Backend API from ./backend Dockerfile
  - Environment: DATABASE_URL points to test-db
  - Port: 8001 (separate from dev API on 8000)
  - Runs: alembic upgrade → uvicorn startup
  - Depends on: test-db healthy
  - Healthcheck: API /docs endpoint responsive
```

### Test Lifecycle

**global-setup.ts** (runs once before all tests):
1. `docker-compose -f test-docker-compose.yml up -d` → Start containers
2. Wait for test-db to be healthy
3. Wait for test-api to be healthy (polls /docs)
4. Continue to tests

**Each E2E Test**:
1. Browser navigates to http://localhost:5173 (Vite dev server)
2. User interacts (fills forms, clicks, submits)
3. Frontend makes HTTP requests → test-api (localhost:8001)
4. Backend processes requests, writes to test-db
5. Test verifies:
   - UI state (Playwright assertions)
   - API responses (HTTP 200, correct JSON)
   - Database state (SQL queries against test-db)

**global-teardown.ts** (runs once after all tests):
1. `docker-compose -f test-docker-compose.yml down -v` → Stop & clean up containers
2. Remove volumes (fresh DB for next run)

---

## What Gets Tested

### User Workflows

**1. Registration Flow**
- User enters email, firstName, lastName, password
- Clicks Register
- Browser: Shows success message
- API: Returns user object
- Database: User exists in users table + user_profile table
- Verify: Query DB for user email, confirm encrypted password hash

**2. Login Flow**
- User enters email, password
- Clicks Login
- Browser: Receives JWT token, stored in localStorage
- API: Validates credentials, returns JWT
- Database: User record found, credentials match
- Verify: JWT decoded, contains user ID

**3. Portfolio Operations**
- Authenticated user views portfolio
- Browser: Lists accounts, institutions, balances
- API: Queries user's accounts from database
- Database: Account records exist for user
- Verify: Account names, balances, institution links correct in DB

**4. Data Persistence**
- User creates account
- User logs out, logs back in
- Verify: Account still visible (wasn't just in memory)
- Database: Account persists across sessions

**5. Error Handling**
- Invalid credentials → 401 error → UI shows message
- Network timeout → Retry logic → Eventually succeeds or shows error
- Invalid token → 403 error → Redirect to login
- Database: Error logs recorded

---

## Database Verification

### Query Helper Functions

```typescript
// Get user from test database
async function getUser(email: string) {
  return await queryTestDb(
    "SELECT id, email, is_active, is_verified FROM users WHERE email = $1",
    [email]
  );
}

// Get user's accounts
async function getUserAccounts(userId: number) {
  return await queryTestDb(
    "SELECT id, name, type_id, status_id, created_at FROM accounts WHERE user_id = $1",
    [userId]
  );
}

// Verify password was hashed
async function verifyPasswordHashed(email: string) {
  const result = await queryTestDb(
    "SELECT hashed_password FROM users WHERE email = $1",
    [email]
  );
  return result[0].hashed_password.startsWith('$2'); // bcrypt hash
}
```

### Test Assertions

```typescript
// UI and API tests
await expect(page.locator('text=Registration successful')).toBeVisible();
expect(response.status()).toBe(200);
expect(data.accessToken).toBeTruthy();

// Database assertions
const user = await getUser('test@example.com');
expect(user.is_verified).toBe(true);
expect(user.email).toBe('test@example.com');

const accounts = await getUserAccounts(user.id);
expect(accounts).toHaveLength(2);
expect(accounts[0].name).toBe('Checking Account');
```

---

## Running E2E Tests

### Prerequisites
```bash
# Install Playwright
npm install -D @playwright/test

# Ensure Docker is running
docker --version
docker-compose --version
```

### Run Tests
```bash
# Start test environment, run all E2E tests, tear down
npx playwright test

# Run specific test file
npx playwright test tests/e2e/registration.spec.ts

# Run in UI mode (visual debugging)
npx playwright test --ui

# Run headless with video
npx playwright test --record-video=all
```

### Debug Failing Tests
```bash
# Run single test with browser visible
npx playwright test tests/e2e/login.spec.ts --headed

# Pause at breakpoints
npx playwright test --debug

# Inspect elements
page.pause()  // in test code
```

---

## Test Database Reset

**Between each test:**
- Database persists from setup to teardown
- Optional: Add `beforeEach` to truncate tables (faster isolation)

**Full cleanup:**
```bash
# Manual cleanup if tests fail to teardown
docker-compose -f test-docker-compose.yml down -v
```

---

## File Structure

```
frontend/
├── playwright.config.ts
├── tests/
│   └── e2e/
│       ├── global-setup.ts      # Start containers
│       ├── global-teardown.ts   # Stop containers
│       ├── fixtures.ts          # DB query helpers
│       └── [feature].spec.ts    # Individual tests
│           ├── registration.spec.ts
│           ├── login.spec.ts
│           ├── portfolio.spec.ts
│           ├── persistence.spec.ts
│           └── error-handling.spec.ts

test-docker-compose.yml          # Test environment
playwright-report/               # Generated test reports
```

---

## Why This Approach

✅ **True End-to-End**
- No mocks (except external APIs)
- Real HTTP layer tested
- Real database mutations verified

✅ **CI/CD Ready**
- Docker containers reproducible everywhere
- Self-contained (doesn't touch dev DB)
- All dependencies declared

✅ **Fast Feedback**
- Parallel-safe (isolated containers)
- Playwright is fast
- Can run in CI without GUI

✅ **Debugging**
- Browser videos on failure
- Screenshots on failure
- HTML reports with traces
- Can run in headed mode locally

✅ **Realistic**
- Tests actual user workflows
- Tests actual UI + API integration
- Tests database persistence

---

## Next Steps

1. ✅ Create test-docker-compose.yml
2. ✅ Create playwright.config.ts
3. ✅ Create global-setup.ts / global-teardown.ts
4. → **Create database query helper module**
5. → **Create individual E2E test files** (.spec.ts)
6. → **Add to Makefile** (make e2e-test command)
7. → **Add to CI/CD** (run in GitHub Actions)

---

## Open Questions to Resolve

1. **Backend Dockerfile** - Does it have all dependencies? Alembic configured?
2. **Test database seeding** - Any baseline data needed before tests?
3. **External API mocks** - Which external services to mock vs real?
4. **Test isolation** - Fresh DB per test or reuse across tests?
5. **Performance** - Docker startup time (typically 30-60 seconds)?
6. **Parallel execution** - Run multiple test files simultaneously?
