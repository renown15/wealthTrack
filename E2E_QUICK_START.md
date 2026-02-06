# E2E Testing Quick Start

Get up and running with end-to-end tests in 30 seconds.

## One-Line Start

```bash
make test-e2e
```

That's it! ✅

## What Happens Automatically

1. **Dependencies installed** - @playwright/test, pg
2. **Docker containers started** - PostgreSQL (port 5433), API (port 8001)
3. **Database seeded** - Reference data loaded
4. **35 tests run** - Registration, Login, Portfolio, Persistence, Error Handling
5. **Containers stopped** - Clean shutdown with volume removal

**Time**: ~5-10 minutes first run (docker image pulls), ~2-3 minutes after

## Different Modes

### See the browser in action
```bash
make test-e2e-headed
```

### Use interactive UI
```bash
make test-e2e-ui
```
Then select test files to run, watch execution timeline

### Debug step-by-step
```bash
make test-e2e-debug
```
Debugger pauses before each action - inspect, evaluate, continue

## Check Results

### HTML Report
After tests complete:
```bash
cd frontend
npx playwright show-report
```

Opens browser showing:
- Visual timeline of each test
- Screenshots of failures
- Full page recording option
- Traces for debugging

### Console Output
Look for:
- ✅ All tests passed
- ❌ 1 failed
- ⏭️  5 skipped

## Common Issues

### Port already in use?
```bash
# Kill stray processes
kill -9 $(lsof -t -i:5433)  # Test DB
kill -9 $(lsof -t -i:8001)  # Test API
kill -9 $(lsof -t -i:5173)  # Dev server
```

### Docker containers won't start?
```bash
# Clean up and try again
docker-compose -f test-docker-compose.yml down -v
make test-e2e
```

### Tests timeout waiting for API?
Backend may be slow to start. Check:
```bash
docker logs wealthtrack_test-api_1 | tail -20
```

If migrations running, give it 60+ seconds.

## Test Files

Located in `frontend/tests/e2e/`

- **registration.spec.ts** - User signup workflows
- **login.spec.ts** - Authentication flows  
- **portfolio.spec.ts** - Account management
- **persistence.spec.ts** - Database persistence
- **error-handling.spec.ts** - Error recovery

Run specific test file:
```bash
npx playwright test registration.spec.ts
```

Run specific test:
```bash
npx playwright test -g "should register new user"
```

## What's Tested

✅ Complete user workflows (browser → API → database)
✅ Data persistence across sessions
✅ Error handling and recovery
✅ Form validation
✅ Authentication and tokens
✅ Database integrity (password hashing, relationships, etc.)

## Documentation

- **Quick reference**: This file
- **Detailed guide**: `frontend/tests/e2e/README.md`
- **Architecture**: `E2E_TESTING_FRAMEWORK.md`
- **Implementation summary**: `E2E_IMPLEMENTATION_SUMMARY.md`

## What NOT to Do

❌ Don't modify `test-docker-compose.yml` ports without updating playwright.config.ts
❌ Don't run tests while dev API is running on port 8000 (test uses 8001)
❌ Don't manually start Docker containers - let setup handle it
❌ Don't kill processes mid-test - teardown needs to clean them up

## Still Stuck?

1. Check `frontend/tests/e2e/README.md` - Troubleshooting section
2. View test report: `npx playwright show-report`
3. Run in debug mode: `make test-e2e-debug`
4. Check Docker logs: `docker logs wealthtrack_test-api_1`

---

**That's all you need to know to run E2E tests!** 🚀
