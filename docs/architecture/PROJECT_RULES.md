# WealthTrack Project Rules & Status

## 🔒 CRITICAL PROJECT RULES

These rules are non-negotiable and must be followed throughout the entire project lifecycle.

### 1. Test Coverage Requirement
- **Minimum 90% code coverage ALWAYS**
- Coverage is enforced via `pytest.ini`: `--cov-fail-under=90`
- **Cannot be lowered, negotiated, or bypassed** under any circumstances
- This is measured across the entire codebase
- Every change must maintain or improve coverage

### 2. File Preservation Policy  
- **NO FILES SHALL BE DELETED** without explicit user approval in chat
- All proposed file deletions must be requested and confirmed before execution
- Applies to ALL files: test files, source code, configuration, documentation
- Violations of this rule have critical downstream impact

### 3. Maximum File Size
- No Python or TypeScript/JavaScript file exceeds 200 lines
- Enforced via automated test: `test_file_constraints.py`
- Applies to ALL files in the project
- Long files must be split into smaller modules

## 📊 Current Coverage Status

**Overall Coverage: 91.39%** ✅ (Target: 90%)

### Module Breakdown
| Module | Coverage | Status |
|--------|----------|--------|
| `app/config.py` | 100% | ✅ |
| `app/services/auth.py` | 100% | ✅ |
| `app/services/user.py` | 98% | ✅ |
| `app/controllers/auth.py` | 71% | ⚠️ |
| `app/controllers/dependencies.py` | 100% | ✅ |
| `app/database.py` | 100% | ✅ |
| `app/main.py` | 82% | ✅ |
| `app/models/` | 94-95% | ✅ |
| `app/schemas/user.py` | 90% | ✅ |

### Test Summary
- **Total Tests**: 34
- **Passing**: 34 (100%)
- **Failed**: 0

### Test Files
1. `test_auth_controller.py` - 10 tests (API endpoint coverage)
2. `test_auth_service.py` - 5 tests (Auth service logic)
3. `test_auth_integration.py` - 4 tests (Error path testing)
4. `test_user_service.py` - 9 tests (User CRUD operations)
5. `test_database.py` - 2 tests (Database session handling)
6. `test_file_constraints.py` - 2 tests (File size enforcement)
7. `test_main_routes.py` - 2 tests (Root/health endpoints)

## 📋 Coverage Strategy

### High Coverage Modules (>95%)
- **Auth Service** (100%): All password hashing and JWT token logic tested
- **Services/Models** (92-98%): Core business logic well-tested
- **Dependencies** (100%): Authentication dependency injection fully tested

### Acceptable Lower Coverage Areas
- **Controller error paths** (71%): Some edge cases in HTTPException handling remain
- **Main startup** (82%): Some lifespan events not exercised (require special fixtures)

## 🚀 Development Guidelines

### When Adding Features
1. Write tests FIRST (TDD approach)
2. Ensure new code brings total coverage to ≥90%
3. Never commit code that drops coverage below 90%
4. Run `./dev.sh` to start environment and run tests

### When Modifying Code
1. Run full test suite: `python -m pytest tests/ --cov=app --cov-fail-under=90`
2. All existing tests must still pass
3. Coverage must remain ≥90%
4. Document any untestable code paths with comments

### File Organization
- Keep all files ≤200 lines (enforced)
- Split large files into smaller modules
- Use clear naming for test files: `test_<module>.py`
- Place tests in `tests/` directory

## 🛠️ Running Tests

```bash
# Full test run with coverage report
python -m pytest tests/ --cov=app --cov-report=html --cov-fail-under=90

# Run specific test file
python -m pytest tests/test_auth_service.py -v

# Run with detailed output
python -m pytest tests/ -v --tb=short

# Generate HTML coverage report
python -m pytest tests/ --cov=app --cov-report=html
# Open htmlcov/index.html to view detailed coverage
```

## ✅ Verification Checklist

Before submitting any changes:
- [ ] All tests pass: `pytest tests/ -v`
- [ ] Coverage ≥90%: `pytest tests/ --cov=app --cov-fail-under=90`
- [ ] No files exceed 200 lines: `pytest tests/test_file_constraints.py -v`
- [ ] No files were deleted without approval
- [ ] Git status shows only intended changes

## 📝 Historical Notes

**90% Coverage Achieved**: Session where this requirement was established and met
- Started at 83.15% coverage
- Added 34 comprehensive tests
- Implemented database.py tests to push over threshold
- Final: 91.39% coverage with all 34 tests passing

**Critical Incident**: Agent deleted `test_auth_integration.py` without user approval
- This violated the file preservation rule
- Rule was subsequently emphasized as non-negotiable
- Documentation updated to prevent future violations
