# E2E Testing Framework Guide

This guide explains how to run the end-to-end (E2E) tests for WealthTrack.

## Overview

The E2E testing framework provides **true end-to-end testing** with:
- Real browser interactions (Playwright/Chromium)
- Real HTTP API calls (no mocks)
- Real database operations (PostgreSQL in Docker)
- Isolated test environment (dedicated containers)
- Full CI/CD-ready automation (Docker Compose)

## Architecture

```
Browser (Playwright)
    ↓
Frontend (http://localhost:5173 - dev server)
    ↓
API (http://localhost:8001 - test container)
    ↓
Database (localhost:5433 - test container)
```

All components are isolated in the test environment and cleaned up after tests complete.

## Running E2E Tests

### Simple: Run all E2E tests

```bash
# Using Makefile
make test-e2e

# Or directly with npm
npm run test:e2e
```

### Interactive UI Mode

```bash
# View test execution in Playwright UI
make test-e2e-ui

# Or directly
npm run test:e2e:ui
```

### Headed Mode (See Browser)

```bash
# Run tests with visible browser window
make test-e2e-headed

# Or directly
npm run test:e2e:headed
```

### Debug Mode (Step Through)

```bash
# Debug tests step-by-step
make test-e2e-debug

# Or directly
npm run test:e2e:debug
```

## Test Scenarios

### 1. **registration.spec.ts** - User Registration
- ✅ Register new user with valid data
- ✅ Validate email format
- ✅ Reject weak passwords
- ✅ Prevent duplicate emails
- ✅ Require all fields

**Verifies**: User created in database, password hashed with bcrypt, user_profile created

### 2. **login.spec.ts** - User Authentication
- ✅ Login with valid credentials
- ✅ Reject invalid credentials
- ✅ Reject wrong password
- ✅ Require email field
- ✅ Require password field
- ✅ Preserve login state on page refresh

**Verifies**: JWT token stored in localStorage, user verified in database, state persists

### 3. **portfolio.spec.ts** - Account Management
- ✅ Display portfolio hub after login
- ✅ Create new account
- ✅ Display account balance
- ✅ Link external institution
- ✅ Calculate total portfolio value
- ✅ List all user accounts
- ✅ Update account details

**Verifies**: Accounts created in database, balances calculated, institutions linked

### 4. **persistence.spec.ts** - Data Persistence Across Sessions
- ✅ User profile persists across sessions
- ✅ Account data persists across sessions
- ✅ Account balances persist across sessions
- ✅ Institution credentials persist across sessions
- ✅ Login state preserved with JWT token
- ✅ Transaction history persists across sessions

**Verifies**: Data written to database survives application restart, multiple sessions work correctly

### 5. **error-handling.spec.ts** - Error Recovery
- ✅ Handle invalid email format
- ✅ Handle network timeouts
- ✅ Handle server errors (500)
- ✅ Recover from validation errors
- ✅ Handle expired sessions
- ✅ Show friendly error for duplicate accounts
- ✅ Handle concurrent request errors
- ✅ Reject invalid tokens
- ✅ Prevent SQL injection
- ✅ Handle missing API response fields

**Verifies**: App remains functional under error conditions, appropriate error messages shown

## Test Database Setup

The test environment automatically:

1. **Starts containers** via docker-compose
   - PostgreSQL 16 on port 5433
   - Backend API on port 8001

2. **Waits for health**
   - Polls `/docs` endpoint until API responds
   - 30 retries × 2-second intervals = 60-second timeout

3. **Seeds reference data**
   - Account types (Checking, Savings, Stocks ISA, SIPP, Credit Card)
   - Account statuses (Active, Closed, Dormant)
   - Event types (Balance Update, Transaction, Fee)
   - Attribute types (Interest Rate, Overdraft Limit, Credit Limit)

4. **Clears between test suites**
   - All test suite files share one database (faster)
   - `clearTestDatabase()` truncates tables between suites
   - Reference data re-seeded for each suite

## Database Assertions

Tests use fixture functions to verify data in database:

```typescript
import {
  queryTestDb,           // Raw SQL queries
  getTestUser,           // Get user by email
  getUserAccounts,       // Get user's accounts
  getUserInstitutions,   // Get user's linked institutions
  verifyPasswordHashed,  // Check bcrypt hash
  clearTestDatabase,     // Truncate all data
  seedReferenceData,     // Insert reference data
  closeTestDb            // Close connections
} from './fixtures';

// Example: Verify user was created with hashed password
const user = await getTestUser('newuser@example.com');
expect(user).toBeTruthy();
const isHashed = await verifyPasswordHashed('newuser@example.com');
expect(isHashed).toBe(true);
```

## Configuration Files

### **playwright.config.ts**
- Base URL: http://localhost:5173 (Vite dev server)
- Browser: Chromium (headless)
- Workers: 1 (sequential - no parallel)
- Timeout: 30 seconds per test
- Screenshots/videos: On failure only
- Traces: First retry

### **test-docker-compose.yml**
- Isolated from development environment
- Separate database port: 5433
- Separate API port: 8001
- Health checks on all services
- Automatic volume cleanup on shutdown

### **global-setup.ts** (runs once before all tests)
1. Start Docker containers
2. Poll API health
3. Clear database
4. Seed reference data

### **global-teardown.ts** (runs once after all tests)
1. Close database connections
2. Stop Docker containers
3. Remove volumes

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run E2E Tests
  run: make test-e2e
  working-directory: /path/to/wealthTrack
```

Or directly:

```yaml
- name: Run E2E Tests
  run: |
    cd frontend
    npm install --save-dev @playwright/test pg
    npm run test:e2e
```

## Troubleshooting

### Port conflicts
If you see "Port already in use", kill existing processes:
```bash
# Check port 5433 (test DB)
lsof -i :5433
kill -9 <PID>

# Check port 8001 (test API)
lsof -i :8001
kill -9 <PID>

# Check port 5173 (dev server)
lsof -i :5173
kill -9 <PID>
```

### Docker containers won't start
```bash
# Check Docker status
docker ps

# View logs
docker logs wealthtrack_test-api_1
docker logs wealthtrack_test-db_1

# Manual cleanup and restart
docker-compose -f test-docker-compose.yml down -v
make test-e2e
```

### Database connection errors
Ensure PostgreSQL test container is healthy:
```bash
# Check if container is running
docker ps | grep test-db

# Check container logs
docker logs wealthtrack_test-db_1 | tail -20

# Manually test connection
psql -h localhost -p 5433 -U wealthtrack_test -d wealthtrack_test -c "SELECT 1;"
```

### Tests fail with "Cannot find element"
- Element selectors may have changed
- Check browser in headed mode: `make test-e2e-headed`
- Use debug mode: `make test-e2e-debug`
- View traces: Check `test-results/` folder

### API fails to become ready
- Backend may be building - give it more time
- Check backend logs: `docker logs wealthtrack_test-api_1`
- Ensure alembic migrations ran: Check for `alembic upgrade head` in setup

## Performance Notes

- **Sequential execution** (1 worker): ~30-60 seconds per test file
- **5 test files**: ~5-10 minutes total
- Slower than unit tests (real browser + real DB)
- Much faster than manual testing

## What's NOT Tested

These areas are covered by unit/integration tests:
- Backend business logic
- Complex calculations
- Edge cases in controllers
- Database constraints
- API response formats

## Best Practices

1. **Always verify in database**, not just UI
   - UI might show cached data
   - Database is source of truth

2. **Use unique identifiers** for test data
   - Include timestamps: `${Date.now()}`
   - Prevents conflicts across test runs

3. **Clean up after tests**
   - Tests automatically run `clearTestDatabase()`
   - Don't leave test data in production DB

4. **Test complete workflows**
   - Register → Login → Create Account → View Balance
   - Not individual steps in isolation

5. **Handle timing**
   - Use `.toBeVisible({ timeout: 5000 })`
   - Don't use `await page.waitForTimeout()`

## Extending E2E Tests

Add new test scenarios:

```typescript
import { test, expect } from '@playwright/test';
import { getTestUser, queryTestDb } from './fixtures';

test.describe('E2E - My Feature', () => {
  test('should do something remarkable', async ({ page }) => {
    // Arrange: Navigate and setup
    await page.goto('/');
    
    // Act: Interact with UI
    await page.click('text=MyButton');
    
    // Assert: Verify in UI
    await expect(page.locator('text=Success')).toBeVisible();
    
    // Assert: Verify in database
    const record = await queryTestDb(
      'SELECT * FROM my_table WHERE user_id = $1',
      [userId]
    );
    expect(record).toBeTruthy();
  });
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [WealthTrack Backend API](../backend/docs/)
