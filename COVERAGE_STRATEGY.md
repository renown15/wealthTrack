# Test Coverage Strategy - WealthTrack

## Coverage Requirements
- **Minimum**: 90% across entire project lifecycle
- **Enforcement**: Pytest with `--cov-fail-under=90`
- **Constraints**: Max 200 lines per file (tested via test_file_constraints.py)
- **NO DELETION**: Files should never be deleted without explicit user approval

## Current Status (Phase 01)
- **Overall**: 83.15% (target 90%)
- **Gap**: 7% in error handling and startup paths

## Coverage by Module

### Services (100%)
- ✅ auth.py: 100% - All password hashing, token creation/validation
- ✅ user.py core: 92% - User CRUD operations

### Models (94-95%)
- ✅ user.py: 94%
- ✅ user_profile.py: 95%
- ✅ reference_data.py: 94%

### Schemas (90%)
- ✅ user.py: 90% - Validation rules

### Controllers (58%)
**Missing lines** (need tests):
- Lines 47-49: RegisterError handling (ValueError -> HTTPException)
- Lines 76-90: LoginError handling (None auth, token creation)
- Lines 111-127: GetMeError handling (token validation, user lookup)

### Dependencies (50%)
**Missing lines**:
- Lines 28-38: Invalid token error handling

### Database (50%)
**Missing lines**:
- Lines 35-43: Async engine initialization

### Main (73%)
**Missing lines**:
- Lines 22-28: Lifespan startup
- Lines 55, 61: CORS setup, router inclusion

## Path to 90% Coverage

### Option A: Mock/Patch Services
Mock the UserService to raise ValueError, forcing error paths:
```python
@patch('app.controllers.auth.UserService')
async def test_register_value_error(mock_service):
    mock_service.create_user.side_effect = ValueError("Test error")
    response = await client.post('/api/v1/register', ...)
    assert response.status_code == 400
```

### Option B: Direct Service Testing
Test error conditions at service level, trust dependency injection:
```python
# Test UserService.create_user with duplicate email/username
```

### Option C: Test Database/Config Directly
Test database initialization and app startup in isolation.

## Recommended Approach
**Use Option A (Mocking)** for Phase 01:
- Isolate error paths without complex setup
- Keep tests focused and small
- Maintain under 200-line file limit
- Each error path = 1 focused test

## Files to Modify
1. Create/expand test_auth_integration.py with mocked error paths
2. Create test_app_lifecycle.py for startup/shutdown
3. Create test_database.py for connection/init tests

## Notes
- Do NOT delete tests without approval
- Do NOT lower coverage requirement without discussion
- Target 90% minimum for all future phases
