# Refactoring Opportunities for Test Coverage Improvement

## Summary

We've analyzed the low-coverage areas and identified key refactoring patterns that would significantly improve testability. The analysis covers **services**, **controllers**, and **utilities** that are candidates for improved test coverage (currently at 74.07%, need 80%).

## Quick Reference

### What We Fixed
- ✅ Removed duplicate `@staticmethod` decorator in `price_service.py` (line 26-27)

### Key Documents Created

1. **docs/REFACTORING_PATTERNS.md**
   - Shows before/after refactoring for `PriceService`
   - Demonstrates dependency injection pattern
   - Includes `PriceCache` protocol for mockability
   - Provides `PriceServiceRefactored` as reference implementation

2. **docs/TESTABILITY_REFACTORING_GUIDE.md**
   - Comprehensive guide on improving testability
   - Specific issues in each layer (Services, Database, Controllers)
   - Concrete refactoring patterns with code examples
   - Testing strategies for each pattern
   - Priority roadmap for refactoring effort

3. **backend/tests/test_refactoring_patterns.py**
   - Examples showing how refactored code is easier to test
   - Mock implementations that would work with refactored services
   - Tests demonstrating dependency injection benefits

## High-Impact Refactoring Areas

### 1. Service Layer (Lowest Coverage: 24-28%)

**Current Pain Point**: All logic is static, no dependency injection
```
Files with <30% coverage:
- deferred_cash_balance_service.py: 25% (33 uncovered)
- deferred_shares_balance_service.py: 24% (35 uncovered)
- rsu_balance_service.py: 24% (35 uncovered)
- price_service.py: 28% (59 uncovered)
```

**Refactoring Impact**: Converting to dependency injection would enable:
- Mock external dependencies (HTTP clients, databases)
- Test error paths without complex setup
- Estimate: +40-60 lines of testable code per service

### 2. Database Service Logic (Untestable parts)

**Current Issue**: Complex async methods mixing validation, queries, and inserts
```
Pattern in all *_balance_service.py:
- save_daily_balance() method: 70+ lines
- Multiple database lookups in one method
- Error handling mixed with business logic
```

**Refactoring Strategy**: Extract helper methods
```python
# Split complex methods into:
- _validate_balance(value) -> pure logic, easily testable
- _check_if_already_saved(id, session) -> mockable database call
- _save_to_db(id, value, session) -> mockable database call
```

**Expected Impact**: +30-50 testable lines per service

### 3. Controllers (39-59% coverage)

**Files with low coverage**:
- account_group.py: 39% (34 uncovered)
- account_dates.py: 55% (13 uncovered)  
- account_events.py: 51% (17 uncovered)
- portfolio.py: 50% (13 uncovered)

**Current Issue**: Repository created inline, making mocking harder
```python
# Current (harder to mock)
async def list_groups(session = Depends(get_db)):
    repo = AccountGroupRepository(session)  # Can't mock easily
    return await repo.get_all()
```

**Refactored (easier to test)**:
```python
# With dependency injection
async def list_groups(repo = Depends(get_account_group_repo)):
    return await repo.get_all()  # Can inject mock

# Test
mock_repo = AsyncMock()
response = await list_groups(repo=mock_repo)
```

**Expected Impact**: +30-40 additional tests, +20-30 covered lines

## Testability Patterns Explained

### Pattern 1: Dependency Injection
**How it works**: Pass dependencies as parameters instead of creating inline
**Testability gain**: Can pass mocks for testing
**Example**: See `PriceServiceRefactored` in `REFACTORING_PATTERNS.md`

### Pattern 2: Protocol-based Interfaces  
**How it works**: Define what a dependency should do, not its concrete type
**Testability gain**: Easy to create mock implementations
**Example**: `PriceCache(Protocol)` can be mocked with any class implementing get/set

### Pattern 3: Separation of Concerns
**How it works**: Split validation, I/O, and business logic into separate methods
**Testability gain**: Can unit test logic without I/O
**Example**: Extract `_validate_balance()` from complex service method

## Recommended Approach

### Immediate (Today)
1. ✅ Review the refactoring patterns and guides
2. ✅ Fix bugs found during analysis (duplicate decorator) ✓
3. Focus on quick wins with highest coverage gain per time

### Short Term (This Week)
1. Extract validation functions from services → +10-20 tests
2. Add integration tests for common paths → +15-30 tests
3. Refactor 1-2 controllers for DI pattern → +20-40 tests

### Medium Term (This Month)  
1. Refactor all services to use DI
2. Split complex database methods
3. Full controller refactoring

## Estimated Coverage Gains

| Action | Effort | Coverage Gain | Total Coverage |
|--------|--------|---------------|-----------------|
| Current | - | - | 74.07% |
| Extract validation (3 services) | 30 min | +1-2% | 75-76% |
| Add integration tests | 1 hour | +1-2% | 76-77% |
| Refactor services to DI | 2 hours | +2-3% | 78-80% |
| Refactor controllers | 1 hour | +1-2% | 80-81% |

## Files to Review

1. **Services that need refactoring**:
   - `backend/app/services/price_service.py` (28% coverage)
   - `backend/app/services/deferred_cash_balance_service.py` (25%)
   - `backend/app/services/deferred_shares_balance_service.py` (24%)
   - `backend/app/services/rsu_balance_service.py` (24%)

2. **Controllers to improve**:
   - `backend/app/controllers/account_group.py` (39%)
   - `backend/app/controllers/account_events.py` (51%)
   - `backend/app/controllers/portfolio.py` (50%)

3. **Reference implementations**:
   - `backend/docs/REFACTORING_PATTERNS.md` - Concrete examples
   - `backend/tests/test_refactoring_patterns.py` - Test examples

## Key Takeaways

1. **Dependency Injection is key** - Remove static methods and hardcoded dependencies
2. **Split concerns** - Separate validation, I/O, and business logic
3. **Use Protocols** - Define behavior, not concrete types
4. **Test incrementally** - Add tests as you refactor
5. **Mockability matters** - Design for testing from the start

The guides and examples provided show exactly how to implement these patterns in the wealthTrack codebase.
