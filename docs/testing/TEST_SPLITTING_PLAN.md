# Frontend Test File Splitting Action Plan

## Problem

Frontend test files violate the 200-line per file constraint from the specification. 13 test files exceed this limit, with some over 1000 lines.

## Current Violations

| File | Lines | Target | Priority |
|------|-------|--------|----------|
| PortfolioView.test.ts | 1470 | 3-4 files | Critical |
| ApiService.test.ts | 1237 | 6 files | Critical |
| usePortfolio.test.ts | 432 | 2-3 files | High |
| LoginController.test.ts | 427 | 2-3 files | High |
| RegistrationController.test.ts | 427 | 2-3 files | High |
| ValidationService.test.ts | 358 | 2 files | Medium |
| Router.test.ts | 278 | 1-2 files | Medium |
| RegistrationView.test.ts | 308 | 1-2 files | Medium |
| LoginView.test.ts | 256 | 1-2 files | Medium |
| PortfolioService.test.ts | 245 | 1 file | Low |
| BaseView.test.ts | 266 | 1 file | Low |
| ApiService.integration.test.ts | 298 | 1 file | Low |
| HomeController.test.ts | 212 | 1 file | Low |

## Solution

### Step 1: Update Test Schema (PREREQUISITE)
Before splitting, all test files must be updated to use the new User schema:
- ❌ Old: `username`, `fullName`
- ✅ New: `firstname`, `surname`, `first_name`, `last_name`, `email`

**Files to update**: All 13 oversized test files

### Step 2: Split by Logical Groups
For each large test file:

1. **Identify test groups** (describe blocks)
2. **Extract related tests** into focused files
3. **Name clearly**: `FileFeature.test.ts` pattern
4. **Share imports**: Import common test utilities
5. **Keep under 200 lines**: Target 150-190 lines per file

### Step 3: Create Constraint Test
Add frontend test file size validation:
```typescript
// frontend/tests/FileConstraints.test.ts
it('should enforce max 200 lines per test file', () => {
  // Check all .test.ts files in /frontend/tests/
  // Ensure none exceed 200 lines
  // Fail CI if any do
});
```

### Step 4: Verification
```bash
npm run test  # All tests pass
npm run lint  # All linting passes
make pr-check # Full validation passes
```

## Implementation Notes

- Each test file should focus on one logical component
- Use descriptive filenames that indicate test scope
- Maintain 90%+ coverage requirement
- Don't split test utilities/fixtures (keep in conftest equivalent)
- Update imports in all affected test files
- Run tests after each split to verify functionality

## Timeline

- **Critical** (ApiService, PortfolioView): 2-3 hours
- **High** (Controllers, Composables): 1-2 hours  
- **Medium/Low** (Views, Services): 1 hour

Total estimated effort: 4-6 hours

## Blocking Issues

❌ Current test files use old User schema (username, fullName)
- Source files updated to: firstname, surname, first_name, last_name
- Tests restored from older commit with old schema
- **Must resolve schema alignment before splitting**
