# File Size Constraint Enforcement

## Status: ✅ Backend | ⏳ Frontend

### Backend: COMPLIANT ✅

**Constraint Test**: [`backend/tests/test_file_constraints.py`](../backend/tests/test_file_constraints.py)

Backend enforces **max 200 lines per file** via:
- `test_python_files_under_200_lines()` - All `/app/**/*.py` files
- `test_test_files_under_200_lines()` - All backend test files

**Current Status**: ✅ All backend files under 200 lines
- 113 backend tests passing
- 10.00/10 linting score

---

### Frontend: NEEDS ACTION ⏳

**Constraint Test**: [`backend/tests/test_frontend_constraints.py`](../backend/tests/test_frontend_constraints.py)

Frontend test files **exceed 200-line limit**:

#### Critical Violations (>400 lines):
- `ApiService.test.ts` - **1237 lines** → Needs splitting into 6+ focused test files
- `PortfolioView.test.ts` - **1470 lines** → Needs major refactoring

#### Moderate Violations (200-400 lines):
- `usePortfolio.test.ts` - 432 lines
- `LoginController.test.ts` - 427 lines  
- `RegistrationController.test.ts` - 427 lines
- `ValidationService.test.ts` - 358 lines
- `Router.test.ts` - 278 lines
- `RegistrationView.test.ts` - 308 lines
- `LoginView.test.ts` - 256 lines
- `PortfolioService.test.ts` - 245 lines
- `BaseView.test.ts` - 266 lines
- `ApiService.integration.test.ts` - 298 lines
- `HomeController.test.ts` - 212 lines

---

## Implementation Strategy

### Phase 1: Schema Alignment (BLOCKED)
Frontend test files were reverted to an older commit with different schema:
- Old schema: `username`, `fullName`
- New schema: `firstname`, `surname`, `first_name`, `last_name`, `email`

**Action Required**: Update all test files to match the new User/UserRegistration/UserLogin interfaces before splitting.

###Phase 2: Test File Splitting
Each large test file should be split by logical test groups:

**Example: ApiService.test.ts (1237 → multiple files)**
```
ApiService.auth.test.ts       (115 lines) - registerUser, loginUser, getCurrentUser
ApiService.errors.test.ts     (145 lines) - Error handling for all methods
ApiService.retry.test.ts      (120 lines) - Retry logic with exponential backoff
ApiService.methods.test.ts    (180 lines) - Method existence and Promise returns
ApiService.portfolio.test.ts  (240 lines) - Portfolio-related operations
ApiService.success.test.ts    (150 lines) - Successful API operations
```

**Example: PortfolioView.test.ts (1470 → multiple files)**
Split by feature area or view lifecycle phases.

---

## Enforcement

When implemented, run:
```bash
# Backend (already enforced)
make test-backend

# Frontend (needs implementation)
npm run test  # Will fail if test files exceed 200 lines
```

---

## Notes

- Backend constraint test: `test_file_constraints.py`
- Frontend needs similar validation in test suite
- Splitting should maintain test coverage (currently 90.22% backend, ~94% frontend)
- After splitting, all tests must still pass
