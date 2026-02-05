# ✅ WealthTrack Quick Start Checklist

**Status:** Phase 01 Database Foundation - Code Complete, Ready for Execution

---

## 🔴 BEFORE YOU START - FIX THIS FIRST

### Step 1: Resolve Python Version Conflict
```bash
# Check current Python
python --version
# If 3.14, switch to 3.12:
pyenv local 3.12.0
python --version  # Should show 3.12.x
```

### Step 2: Install Dependencies
```bash
cd /Users/marklewis/dev/wealthTrack/backend
pip install -r requirements.txt
# Should complete without errors
```

### Step 3: Verify Installation
```bash
python -c "import asyncpg; import sqlalchemy; print('✅ OK')"
```

**If all 3 steps pass → Continue to next section**

---

## 🟢 SETUP & TESTING (Order Matters!)

### Step 4: Start PostgreSQL Database
```bash
cd /Users/marklewis/dev/wealthTrack
docker-compose up -d db
# Wait 10 seconds for startup
docker-compose ps
# Should show "db" with "healthy" status
```

### Step 5: Apply Database Migrations
```bash
cd backend
alembic upgrade head
# Should show: "Running upgrade ... Done"
```

### Step 6: Verify Database Setup
```bash
docker-compose exec db psql -U wealthtrack -c "SELECT COUNT(*) FROM reference_data;"
# Should show: count=25
```

### Step 7: Run Backend Tests
```bash
cd backend
pytest tests/ -v
# Should show: 19 passed in ~2-3 seconds
```

### Step 8: Start Backend Server (Optional Test)
```bash
cd backend
uvicorn app.main:app --reload
# Wait for "Application startup complete"
# Open http://localhost:8000/docs in browser
# Should show API documentation
# Press Ctrl+C to stop
```

### Step 9: Setup & Test Frontend
```bash
cd frontend
npm install
npm run type-check
npm run lint
npm test
# All should pass without warnings
```

### Step 10: Start Full Stack (Optional)
```bash
# Terminal 1: Database
docker-compose up db

# Terminal 2: Backend (from backend directory)
uvicorn app.main:app --reload

# Terminal 3: Frontend (from frontend directory)
npm run dev

# Open http://localhost:5173 in browser
# Should see WealthTrack app with login/register pages
```

---

## 📋 VERIFICATION CHECKLIST

After completing setup, verify:

```
Backend Database
✅ [ ] Migrations applied (alembic current shows 002)
✅ [ ] reference_data table has 25 rows
✅ [ ] user_profile table exists
✅ [ ] users table exists

Backend Services
✅ [ ] pytest runs 19 tests successfully
✅ [ ] Type checking: mypy app (no errors)
✅ [ ] Linting: ruff check . (no errors)
✅ [ ] API docs available: http://localhost:8000/docs

Frontend
✅ [ ] npm install completes
✅ [ ] npm test passes
✅ [ ] npm run type-check passes (no errors)
✅ [ ] npm run lint passes (no errors)
✅ [ ] npm run dev starts successfully

Full Stack
✅ [ ] Frontend loads at http://localhost:5173
✅ [ ] Can navigate between pages
✅ [ ] Register form loads and validates
✅ [ ] Login form loads and validates
✅ [ ] API calls work (check browser console)
```

---

## 🚀 IF EVERYTHING PASSES

You're ready to proceed to **Phase 02: Account Management**

Next steps:
1. Create Account model (similar to User model)
2. Create AccountService (similar to UserService)
3. Create AccountController endpoints
4. Add tests
5. Add frontend views

---

## 🆘 TROUBLESHOOTING

### "Python: No module named 'asyncpg'"
```bash
# Solution: Wrong Python version
pyenv local 3.12.0
pip install -r requirements.txt
```

### "Connection refused" on database
```bash
# Solution: Database not running
docker-compose up -d db
# Wait 10 seconds
docker-compose ps  # Check "healthy" status
```

### "Relation 'users' does not exist"
```bash
# Solution: Migrations not applied
cd backend
alembic upgrade head
```

### "Port 8000 already in use"
```bash
# Solution: Kill process on port 8000
lsof -ti:8000 | xargs kill -9
# Then restart: uvicorn app.main:app --reload
```

### "npm: command not found"
```bash
# Solution: Node not installed or not in PATH
node --version  # Should show v18+
# If not installed, use homebrew: brew install node
```

### "pytest: command not found"
```bash
# Solution: pytest not in PATH
pip install pytest pytest-asyncio
pytest tests/ -v
```

---

## 📊 EXPECTED TEST OUTPUT

```bash
$ pytest tests/ -v

backend/tests/test_auth_service.py::test_hash_password PASSED
backend/tests/test_auth_service.py::test_verify_password PASSED
backend/tests/test_auth_service.py::test_create_access_token PASSED
backend/tests/test_auth_service.py::test_decode_access_token PASSED
backend/tests/test_auth_service.py::test_decode_invalid_token PASSED
backend/tests/test_user_service.py::test_create_user PASSED
backend/tests/test_user_service.py::test_create_duplicate_email PASSED
backend/tests/test_user_service.py::test_create_duplicate_username PASSED
backend/tests/test_user_service.py::test_get_user_by_email PASSED
backend/tests/test_user_service.py::test_get_user_by_username PASSED
backend/tests/test_user_service.py::test_authenticate_user_success PASSED
backend/tests/test_user_service.py::test_authenticate_user_wrong_password PASSED
backend/tests/test_user_service.py::test_authenticate_nonexistent_user PASSED
backend/tests/test_auth_controller.py::test_register_user PASSED
backend/tests/test_auth_controller.py::test_register_duplicate_email PASSED
backend/tests/test_auth_controller.py::test_register_invalid_email PASSED
backend/tests/test_auth_controller.py::test_register_weak_password PASSED
backend/tests/test_auth_controller.py::test_login_success PASSED
backend/tests/test_auth_controller.py::test_login_wrong_password PASSED
backend/tests/test_auth_controller.py::test_login_nonexistent_user PASSED

========================= 19 passed in 2.45s ==========================
```

---

## 📚 DOCUMENTATION FILES

Review in this order:

1. **SESSION_SUMMARY.md** - What was done this session
2. **GSD_STATUS.md** - Current project status
3. **IMPLEMENTATION_GUIDE.md** - Detailed next steps
4. **README.md** - Project overview
5. **backend/alembic/README** - Migration info
6. **frontend/README.md** - Frontend setup info

---

## 🎯 SUCCESS CRITERIA

Phase 01 is complete when:

✅ **Backend**
- All models created and exported
- All services implemented
- All controllers implemented
- All migrations created
- All tests passing (≥19 tests)
- Type checking clean (mypy)
- Linting clean (ruff)

✅ **Frontend**
- All services implemented
- All controllers implemented
- All views rendering
- All models defined
- Type checking clean (tsc)
- Linting clean (eslint)

✅ **Integration**
- Backend API running
- Frontend loads
- Register endpoint works
- Login endpoint works
- JWT token generation works
- /me endpoint returns current user

✅ **Documentation**
- GSD_STATUS.md created
- IMPLEMENTATION_GUIDE.md created
- SESSION_SUMMARY.md created
- Code comments complete
- All docstrings present

---

## 🎓 KEY FILES TO UNDERSTAND

### Backend Architecture
1. `backend/app/models/*.py` - Database schemas
2. `backend/app/services/*.py` - Business logic
3. `backend/app/controllers/*.py` - HTTP endpoints
4. `backend/app/schemas/*.py` - Request/response validation

### Frontend Architecture
1. `frontend/src/models/*.ts` - TypeScript interfaces
2. `frontend/src/services/*.ts` - API & validation
3. `frontend/src/controllers/*.ts` - Logic handlers
4. `frontend/src/views/*.ts` - HTML rendering

### Database
1. `backend/alembic/versions/*.py` - Schema changes
2. `backend/app/database.py` - Connection setup
3. `backend/app/config.py` - Configuration

### Testing
1. `backend/tests/conftest.py` - Test fixtures
2. `backend/tests/test_*.py` - Test cases
3. `backend/tests/__init__.py` - Package marker

---

**Now follow the checklist above and you'll have a fully working backend + frontend!** 🚀

Good luck! 💪
