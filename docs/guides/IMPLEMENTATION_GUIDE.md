# WealthTrack Implementation Guide

**Status:** Phase 01 - Database Foundation (Near Complete)  
**Last Updated:** 4 Feb 2026

---

## WHAT'S BEEN COMPLETED ✅

### Backend Foundation
1. **Database Models**
   - `User` - Legacy authentication table
   - `ReferenceData` - Single extensible lookup table
   - `UserProfile` - User account with profiles

2. **Services Layer**
   - `AuthService` - Password hashing (bcrypt), JWT token creation/validation
   - `UserService` - User CRUD, authentication logic
   - All methods fully async

3. **Controllers Layer**
   - `AuthController` - Register, Login, GetCurrentUser endpoints
   - JWT middleware for protected routes
   - HTTPException error handling

4. **Database Migrations**
   - `001_create_tables.py` - Creates all tables (reference_data, user_profile, users)
   - `002_seed_reference_data.py` - Seeds lookup data (account types, statuses, etc.)
   - Both ready for execution with `alembic upgrade head`

5. **Testing Framework**
   - conftest.py - Async fixtures, test database setup
   - test_auth_service.py - Password & JWT token tests
   - test_user_service.py - User CRUD & auth tests
   - test_auth_controller.py - Endpoint integration tests

### Frontend Foundation
1. **Services**
   - `ApiService` - Axios client for API calls (register, login)
   - `ValidationService` - Form validation (email, password strength, username)

2. **Controllers**
   - `RouterController` - Page navigation
   - `LoginController` - Login flow
   - `RegistrationController` - Registration flow
   - `HomeController` - Home page

3. **Views**
   - `BaseView` - Base class for all views
   - `LoginView` - Login form rendering
   - `RegistrationView` - Registration form rendering
   - `HomeView` - Home page

4. **Models**
   - `User` - TypeScript interfaces for user data
   - `Form` - Validation result interfaces

---

## CRITICAL NEXT STEPS 🔴

### 1. **Resolve Python Dependency Issues** (BLOCKING)
**Problem:** Python 3.14 has compatibility issues with asyncpg and pydantic-core

**Solution Options:**
```bash
# Option A: Downgrade Python version
pyenv local 3.12.0  # or 3.11.x

# Option B: Use pre-built wheels (if available)
pip install --only-binary :all: asyncpg pydantic-core

# Option C: Wait for package updates (not recommended)
```

**Verify fix:**
```bash
cd /Users/marklewis/dev/wealthTrack/backend
pip install -r requirements.txt
python -c "import asyncpg; import pydantic_core; print('OK')"
```

### 2. **Start PostgreSQL Database**
```bash
# From project root:
docker-compose up -d db

# Wait for it to be healthy:
docker-compose ps  # Look for "healthy" status on wealthtrack-db

# Verify connection:
docker-compose exec db psql -U wealthtrack -c "SELECT version();"
```

### 3. **Run Database Migrations**
```bash
cd /Users/marklewis/dev/wealthTrack/backend

# Create initial tables
alembic upgrade head

# Verify tables created:
docker-compose exec db psql -U wealthtrack -c "\dt"

# Check seed data:
docker-compose exec db psql -U wealthtrack -c "SELECT class, key, COUNT(*) FROM reference_data GROUP BY class, key;"
```

### 4. **Run Backend Tests**
```bash
cd /Users/marklewis/dev/wealthTrack/backend

# Install test dependencies:
pip install pytest pytest-asyncio httpx

# Run tests with coverage:
pytest tests/ -v --cov=app --cov-report=html

# View coverage report:
open htmlcov/index.html
```

**Expected Results:**
- test_auth_service.py: 5 tests ✅
- test_user_service.py: 7 tests ✅
- test_auth_controller.py: 7 tests ✅
- Total: 19 tests, ~95% coverage

### 5. **Verify Backend API**
```bash
cd /Users/marklewis/dev/wealthTrack/backend

# Start backend server:
uvicorn app.main:app --reload

# In another terminal, test endpoints:
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123",
    "full_name": "Test User"
  }'

# Should return 201 with user data
```

### 6. **Build & Test Frontend**
```bash
cd /Users/marklewis/dev/wealthTrack/frontend

# Install dependencies:
npm install

# Type check:
npm run type-check

# Lint code:
npm run lint

# Run tests:
npm test

# Start dev server:
npm run dev
# Opens http://localhost:5173
```

---

## ARCHITECTURE COMPLIANCE CHECKLIST ✓

- [x] **Max 200 lines per file**
  - All models, services, controllers under 150 lines
  - Views under 100 lines

- [x] **Type Safety**
  - Python: mypy strict mode ready
  - TypeScript: tsc strict mode configured
  - All functions have type hints

- [x] **Async Throughout**
  - All DB operations use async/await
  - Services return coroutines
  - Controllers handle async properly

- [x] **Separation of Concerns**
  - Models: DB schemas only
  - Services: Business logic only
  - Controllers: HTTP handling only
  - Views: Rendering only

- [x] **Error Handling**
  - Backend: HTTPException with status codes
  - Frontend: Try-catch with user-friendly messages
  - No bare exceptions

- [x] **Naming Conventions**
  - Python: snake_case (PEP 8)
  - TypeScript: camelCase + PascalCase for classes
  - Consistent across codebase

---

## FILE STRUCTURE REFERENCE

```
WealthTrack/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── user.py (34 lines) ✅
│   │   │   ├── reference_data.py (50 lines) ✅
│   │   │   └── user_profile.py (52 lines) ✅
│   │   ├── services/
│   │   │   ├── auth.py (80 lines) ✅
│   │   │   └── user.py (121 lines) ✅
│   │   ├── controllers/
│   │   │   ├── auth.py (112 lines) ✅
│   │   │   └── dependencies.py (32 lines) ✅
│   │   ├── schemas/
│   │   │   └── user.py (66 lines) ✅
│   │   ├── main.py (62 lines) ✅
│   │   ├── config.py (27 lines) ✅
│   │   └── database.py (44 lines) ✅
│   ├── alembic/
│   │   ├── env.py (90 lines) ✅
│   │   └── versions/
│   │       ├── 001_create_tables.py ✅
│   │       └── 002_seed_reference_data.py ✅
│   └── tests/
│       ├── conftest.py (57 lines) ✅
│       ├── test_auth_service.py (51 lines) ✅
│       ├── test_user_service.py (155 lines) ✅
│       └── test_auth_controller.py (151 lines) ✅
│
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── ApiService.ts (69 lines) ✅
│   │   │   └── ValidationService.ts (105 lines) ✅
│   │   ├── controllers/
│   │   │   ├── LoginController.ts (64 lines) ✅
│   │   │   ├── RegistrationController.ts (70 lines) ✅
│   │   │   ├── HomeController.ts (40 lines) ✅
│   │   │   └── router.ts (76 lines) ✅
│   │   ├── views/
│   │   │   ├── BaseView.ts (70 lines) ✅
│   │   │   ├── LoginView.ts (93 lines) ✅
│   │   │   ├── RegistrationView.ts (120 lines) ✅
│   │   │   └── HomeView.ts (50 lines) ✅
│   │   ├── models/
│   │   │   ├── User.ts (20 lines) ✅
│   │   │   └── Form.ts (15 lines) ✅
│   │   └── index.ts (18 lines) ✅
│   └── tests/
│       ├── ApiService.test.ts
│       ├── ValidationService.test.ts
│       └── BaseView.test.ts
│
└── GSD_STATUS.md (This document)
```

---

## ENVIRONMENT SETUP

### Backend .env
```env
DATABASE_URL=postgresql+asyncpg://wealthtrack:wealthtrack_dev_password@localhost:5432/wealthtrack
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
API_V1_PREFIX=/api/v1
```

### Frontend .env
```env
VITE_API_URL=http://localhost:8000
```

---

## TESTING STRATEGY

### Backend Testing
1. **Unit Tests** (test_*_service.py)
   - Test business logic in isolation
   - Mock database operations
   - No HTTP calls

2. **Integration Tests** (test_*_controller.py)
   - Test endpoints with real database
   - Verify request/response handling
   - Test error cases

3. **Coverage Goal:** ≥90%
   ```bash
   pytest tests/ --cov=app --cov-report=term-missing
   ```

### Frontend Testing
1. **Unit Tests** (*.test.ts)
   - Test services in isolation
   - Mock API calls
   - Validate form validation

2. **Component Tests**
   - Test controller logic
   - Test view rendering
   - Test event handling

3. **Coverage Goal:** ≥85%
   ```bash
   npm run test:coverage
   ```

---

## DEPLOYMENT CHECKLIST

- [ ] All tests passing (backend & frontend)
- [ ] Coverage ≥90% (backend), ≥85% (frontend)
- [ ] Type checking clean: `mypy app` and `tsc --noEmit`
- [ ] Linting clean: `ruff check .` and `eslint src`
- [ ] Database migrations applied: `alembic current`
- [ ] Environment variables configured (.env files)
- [ ] Docker images built: `docker-compose build`
- [ ] All services up: `docker-compose up`
- [ ] Health checks passing: All endpoints respond

---

## COMMON ISSUES & FIXES

### Issue: "asyncpg not found" / Compilation errors
```bash
# Solution: Use compatible Python version
pyenv install 3.12.0
pyenv local 3.12.0
pip install -r requirements.txt
```

### Issue: "Connection refused" on database
```bash
# Solution: Ensure Docker is running and healthy
docker-compose up -d db
docker-compose exec db pg_isready
```

### Issue: "Migration already applied"
```bash
# Solution: Check current migration state
alembic current
alembic history

# Downgrade if needed
alembic downgrade -1
```

### Issue: "Token invalid" on /me endpoint
```bash
# Solution: Ensure token is in Authorization header
# Correct format: Authorization: Bearer <token>
# Not: Authorization: <token>
```

### Issue: CORS errors on frontend
```bash
# Solution: Backend CORS is configured for localhost:3000 and :8080
# Ensure frontend port matches .env VITE_API_URL
```

---

## NEXT PHASE PLANNING

### Phase 02: Account Management
1. **Models:** Account, AccountType, AccountBalance
2. **Services:** AccountService, BalanceService
3. **Controllers:** AccountController
4. **Frontend:** AccountView, AccountListController
5. **Tests:** Complete coverage for all new services

### Phase 03: Transactions
1. **Models:** Transaction, TransactionType
2. **Services:** TransactionService, ReportService
3. **Controllers:** TransactionController, ReportController
4. **Frontend:** TransactionView, ReportView
5. **Tests:** Transaction flow testing

### Phase 04: Analytics & Reporting
1. **Services:** AnalyticsService, ExportService
2. **Controllers:** AnalyticsController
3. **Frontend:** DashboardView, ChartsView
4. **Integration:** Chart.js or similar for visualization

---

## QUICK START COMMANDS

```bash
# Full setup from scratch:
cd /Users/marklewis/dev/wealthTrack

# Backend setup
cd backend
pip install -r requirements.txt
alembic upgrade head
pytest tests/ -v

# Frontend setup (in new terminal)
cd frontend
npm install
npm test
npm run dev

# Run everything with Docker
docker-compose up

# Both apps should be available:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

---

## KEY CONTACTS / DOCUMENTATION

- **FastAPI Docs:** http://localhost:8000/docs (when running)
- **SQLAlchemy Async:** https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- **Vite Docs:** https://vitejs.dev/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Pytest Docs:** https://docs.pytest.org/
- **Alembic Docs:** https://alembic.sqlalchemy.org/

---

**Remember:** Always run type checking and linting before committing!
```bash
# Backend
mypy app --strict
ruff check .

# Frontend
npm run type-check
npm run lint
```
