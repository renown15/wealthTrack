# Coverage Achievement Summary

## Current State ✅

**Status:** All thresholds met and enforced via CI (`make pr-check`)

### Backend Coverage

| Metric | Threshold | Current |
|--------|-----------|---------|
| Overall | ≥ 80% | ~81% |

Enforced via: `pytest --cov-fail-under=80`

Test count: ~360 backend tests across all features

### Frontend Coverage

| Metric | Threshold | Current |
|--------|-----------|---------|
| Statements | ≥ 70% | ~79% |
| Branches | ≥ 70% | ~81% |
| Functions | ≥ 55% | ~56% |
| Lines | ≥ 70% | ~79% |

Enforced via: `vitest --coverage` with v8 provider

Test count: ~650 frontend tests (66 test files)

## Coverage Philosophy

- Infrastructure files excluded (entry points, routers, chart-heavy browser API components)
- Complex integration composables (`useAccountHubHandlers`, `useAccountHubModals`) tested where practical
- Browser-API-dependent code (`Analytics.vue`, `exportToExcel.ts`) excluded from coverage
- Service classes fully tested via client stub pattern

## Excluded Files (Frontend)

```typescript
// Entry points and infrastructure
'src/index.ts',
'src/App.vue',
'src/router/index.ts',
'src/components/AppFooter.vue',
// Chart/browser-API components
'src/views/Analytics.vue',
'src/utils/exportToExcel.ts',
```

## Verification Commands

```bash
# Run all checks including coverage
make pr-check

# Backend only
cd backend && pytest --cov=app --cov-report=term-missing --cov-fail-under=80

# Frontend only
cd frontend && npm run test:coverage
```

## Coverage Enforcement Rules

1. **Backend ≥ 80%**: Hard fail in pytest config (`pytest.ini`/`pyproject.toml`)
2. **Frontend thresholds**: Hard fail via `vitest.config.ts` thresholds block
3. Both enforced in `make pr-check` before any PR can be merged

## Historical Context

The project started with a 90% backend target (early sessions). As the codebase grew with
complex async patterns, encrypted storage, and integration-heavy services, the threshold was
adjusted to 80% — still well above industry norms — while maintaining focus on testing
critical paths (auth, account CRUD, encryption, validation).

Frontend thresholds are set lower due to Vue component complexity: many UI interaction
functions are tested implicitly through component mount tests rather than direct function calls.
