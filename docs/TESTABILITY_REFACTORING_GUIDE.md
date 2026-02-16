"""
Guidelines for refactoring code to improve testability.

This document provides patterns and examples for making the wealthTrack
backend more testable through refactoring.
"""

# # Testability Refactoring Guide

## Current Coverage Status
- **Current**: 74.07% (306 tests passing)
- **Target**: 80% (+6% needed)
- **Gap**: ~129 additional lines of code need to be tested

## Problem Areas by Category

### 1. Service Layer (28-25% coverage)
**Files**: `price_service.py`, `*_balance_service.py`, `auth.py`

**Current Issues**:
- Static methods make dependency injection impossible
- Hardcoded external dependencies (API keys, URLs)
- Tight coupling to database operations
- No separation between pure logic and I/O

**Recommended Refactoring Pattern**:

Instead of:
```python
class PriceService:
    API_KEY = os.getenv("API_NINJAS_KEY", "")  # Static, can't mock
    
    @staticmethod
    async def fetch_price(symbol: str):
        async with httpx.AsyncClient() as client:  # Creates inline, can't mock
            response = await client.get(...)
            ...
```

Refactor to:
```python
class PriceService:
    def __init__(self, api_key: str, http_client: Optional[AsyncClient] = None):
        self.api_key = api_key  # Injected
        self.http_client = http_client  # Mockable
    
    async def fetch_price(self, symbol: str):
        # Can now test with mock HTTP client
        async with self.http_client or httpx.AsyncClient() as client:
            ...
```

**Testing Benefits**:
- Mock external HTTP calls
- Test with different API keys
- Control retry behavior
- No real API calls in tests

### 2. Cache Layer (Untested in services)
**Current Issues**:
- Cache mixed with fetch logic
- Static cache prevents test isolation
- Cache state leaks between tests

**Refactoring Strategy**:

Extract cache into separate class:
```python
class PriceCache(Protocol):
    async def get(self, symbol: str) -> Optional[str]: ...
    async def set(self, symbol: str, price: str) -> None: ...

class SimplePriceCache:
    def __init__(self, ttl_seconds: int = 3600):
        self.cache = {}
        self.ttl = ttl_seconds
    
    async def get(self, symbol: str) -> Optional[str]:
        # Pure logic, testable
        if symbol not in self.cache:
            return None
        price, timestamp = self.cache[symbol]
        if time.time() - timestamp < self.ttl:
            return price
        return None
```

**Testing Benefits**:
- Test cache logic independently
- Use mock cache in service tests
- No side effects between tests

### 3. Database Services (24-25% coverage)
**Files**: `deferred_*_balance_service.py`, `rsu_balance_service.py`

**Current Issues**:
- Everything is one big async method
- Database access tightly coupled
- Hard to test without real database
- Multiple concerns: validation, lookup, insert, update

**Recommended Refactoring**:

Split into smaller methods:

```python
class DeferredCashBalanceService:
    @staticmethod
    async def save_daily_balance(...) -> bool:
        # Current: 76 lines of mixed concerns
        # Proposed: Call extracted helpers
        error = await _validate_balance(balance_value)
        if error:
            return False
        
        already_saved = await _check_if_already_saved_today(
            account_id, user_id, session
        )
        if already_saved:
            return False
        
        return await _save_balance_to_db(
            account_id, user_id, balance_value, session
        )

    @staticmethod
    async def _validate_balance(balance_value: float) -> Optional[str]:
        """Pure validation logic - testable without database."""
        if balance_value < 0:
            return "negative_balance"
        if balance_value > 999999999:  # Reasonable upper bound
            return "excessive_balance"
        return None

    @staticmethod
    async def _check_if_already_saved_today(
        account_id: int, user_id: int, session
    ) -> bool:
        """Database lookup - can be mocked."""
        # Query logic ...

    @staticmethod
    async def _save_balance_to_db(
        account_id: int, user_id: int, balance_value: float, session
    ) -> bool:
        """Database insert - can be tested separately."""
        # Insert logic ...
```

**Testing Strategy**:
1. Unit test `_validate_balance` with pure data
2. Mock session for `_check_if_already_saved_today` tests
3. Mock session for `_save_balance_to_db` tests
4. Integration test `save_daily_balance` with test database

### 4. Controller Layer (39-59% coverage)
**Files**: `account_group.py`, `account_events.py`, `portfolio.py`

**Current Issues**:
- Repository created inline (harder to mock)
- Error paths not fully tested
- Dependency setup implicit

**Refactoring Strategy**:

Use FastAPI dependency injection consistently:

```python
# Current - repository created inline
@router.get("/{group_id}")
async def get_account_group(
    group_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
):
    repo = AccountGroupRepository(session)  # Created here
    group = await repo.get_by_id(group_id, current_user.id)

# Refactored - repository injected
@router.get("/{group_id}")
async def get_account_group(
    group_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
    repo: AccountGroupRepository = Depends(
        lambda s: AccountGroupRepository(s), 
        uses=[get_db]
    ),
):
    group = await repo.get_by_id(group_id, current_user.id)
```

Or better yet, create a dependency:

```python
async def get_account_group_repo(
    session: AsyncSession = Depends(get_db),
) -> AccountGroupRepository:
    return AccountGroupRepository(session)

@router.get("/{group_id}")
async def get_account_group(
    group_id: int,
    current_user: UserProfile = Depends(get_current_user),
    repo: AccountGroupRepository = Depends(get_account_group_repo),
):
    group = await repo.get_by_id(group_id, current_user.id)
```

**Testing Pattern**:
```python
async def test_get_account_group():
    mock_repo = AsyncMock(spec=AccountGroupRepository)
    mock_repo.get_by_id = AsyncMock(return_value=test_group)
    
    # Pass mock directly
    response = await get_account_group(
        group_id=1,
        current_user=test_user,
        repo=mock_repo,
    )
    
    assert response.id == 1
```

## Refactoring Priority

### Phase 1: Quick Wins (Already Started)
- ✅ Add calculator utility tests (31+37+33 lines = 101 lines)
- ✅ Add wrapper utility tests (31+37+33 lines = 101 lines)  
- ✅ Add encryption tests (32 lines)
- 👉 **Fix obvious bugs** (duplicate decorator in price_service) ✓

### Phase 2: Medium Effort, High Impact (~60 lines each)
1. Extract validation logic from balance services into unit-testable functions
2. Extract cache logic into separate Protocol-based classes
3. Add focused integration tests for common paths in services

### Phase 3: Major Refactoring (~3-5% coverage gain each)
1. Refactor services to use dependency injection
2. Split complex database services into smaller units
3. Refactor controllers to inject repositories

## Quick Refactoring Wins Available

### Win 1: Extract validation functions (~5-10 lines testable)
Move validation logic from complex methods into pure functions:

```python
# Can be tested without async/database
def validate_balance(value: float) -> Optional[str]:
    if value < 0:
        return "negative"
    return None

# Then use in service
async def save_balance(value, session):
    error = validate_balance(value)  # Unit testable
    if error:
        return False
    # ... rest of logic
```

### Win 2: Extract retry logic (~10 lines testable)
Move retry/backoff logic into testable function:

```python
async def retry_with_backoff(
    func,
    max_retries=2,
    initial_backoff=1.0,
):
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt < max_retries - 1:
                backoff = initial_backoff * (2 ** attempt)
                await asyncio.sleep(backoff)
            else:
                raise
```

### Win 3: Add simple integration tests (~20-30 lines each)
For controllers/services that are partially tested:

```python
async def test_account_group_create_success(mock_repo):
    """Test successful account group creation."""
    result = await create_account_group(
        group_data=AccountGroupCreate(name="Test"),
        current_user=test_user,
        repo=mock_repo,
    )
    assert result.name == "Test"

async def test_account_group_create_not_found(mock_repo):
    """Test error when creation fails."""
    mock_repo.create.side_effect = ValueError("DB error")
    
    with pytest.raises(HTTPException):
        await create_account_group(...)
```

## Refactoring Tools Available

### 1. Dependency Injection (FastAPI already supports)
```python
def get_repository(session: AsyncSession = Depends(get_db)):
    return MyRepository(session)

# In route
@router.get("/{id}")
async def get_item(
    id: int,
    repo: MyRepository = Depends(get_repository)
):
    return await repo.get_by_id(id)
```

### 2. Protocols for Mocking (Python 3.10+)
```python
from typing import Protocol

class PriceCache(Protocol):
    async def get(self, symbol: str) -> Optional[str]: ...
    async def set(self, symbol: str, price: str) -> None: ...

# Easy to mock
class MockCache:
    async def get(self, symbol): return "15000"
    async def set(self, symbol, price): pass
```

### 3. AsyncMock (Already available)
```python
from unittest.mock import AsyncMock

repo = AsyncMock(spec=MyRepository)
repo.get_by_id = AsyncMock(return_value=test_obj)
```

## Next Steps

1. **In current session**:
   - ✅ Add ~92 tests for calculator/wrapper/encryption utilities
   - ✅ Reach 74.07% coverage (306 tests)
   - 👈 Review refactoring opportunities

2. **Immediate wins** (5-15 minutes):
   - Extract validation functions from services
   - Add 5-10 focused tests on error paths

3. **Medium term** (1-2 hours):
   - Refactor services to use dependency injection
   - Add integration tests for balance services

4. **Long term**:
   - Full refactor to Protocol-based architecture
   - Separate concerns between validation, I/O, and business logic

## Measurable Goals

- Current: 74.07% coverage (306 tests)
- After quick wins: 76-77% coverage (+20-40 tests)
- After medium refactoring: 78-79% coverage (+40-60 tests)
- After full refactoring: 82-85% coverage (+100+ tests)
"""
