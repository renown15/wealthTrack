# Testing Patterns

**Analysis Date:** 2026-02-03

## Test Framework

**Runner:**
- Vitest 1.1.1
- Config: `frontend/vitest.config.ts`

**Assertion Library:**
- Vitest built-in expect API (compatible with Jest)

**Run Commands:**
```bash
npm run test              # Run all tests
npm run test -- --watch  # Watch mode (inferred from vitest capabilities)
npm run test:coverage    # Generate coverage report
```

**Coverage Configuration:**
- Provider: v8
- Thresholds enforced:
  - Lines: 90%
  - Functions: 90%
  - Branches: 90%
  - Statements: 90%
- Reporters: text (console) and HTML report
- Excluded from coverage: `node_modules/`, `tests/`, `**/*.test.ts`, `**/*.spec.ts`

## Test File Organization

**Location:**
- Separate `tests/` directory at project root, parallel to `src/`
- Directory: `frontend/tests/`

**Naming:**
- Pattern: `[ComponentName].test.ts` (e.g., `ApiService.test.ts`, `ValidationService.test.ts`, `BaseView.test.ts`)
- Suffix: `.test.ts` (not `.spec.ts`)

**Structure:**
```
frontend/
├── src/
│   ├── services/
│   │   ├── ApiService.ts
│   │   └── ValidationService.ts
│   ├── views/
│   │   └── BaseView.ts
│   └── ...
├── tests/
│   ├── ApiService.test.ts
│   ├── ValidationService.test.ts
│   └── BaseView.test.ts
├── vitest.config.ts
└── tsconfig.json
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ValidationService } from '../src/services/ValidationService';

describe('ValidationService', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(ValidationService.validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(ValidationService.validateEmail('invalid-email')).toBe(false);
    });
  });
});
```

**Patterns:**

1. **Describe Blocks:** Group related tests by functionality (e.g., one describe per method/feature)
2. **Test Cases (it blocks):** Each test covers one specific behavior
3. **Setup/Teardown:**
   - `beforeEach()`: Reset mocks and state before each test
   - `afterEach()`: Clean up resources (DOM elements, timers, etc.)

**Example from `tests/BaseView.test.ts`:**
```typescript
describe('BaseView', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should initialize with container', () => {
    const view = new TestView('test-container');
    expect(view).toBeDefined();
  });
});
```

## Mocking

**Framework:** Vitest's built-in `vi` object

**Patterns:**

1. **Module Mocking:** Mock entire modules at top of test file
```typescript
import { vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as ReturnType<typeof vi.mocked<typeof axios>>;
```

2. **Method Mocking:** Mock specific methods with `vi.fn()`
```typescript
mockedAxios.create = vi.fn().mockReturnValue({
  post: vi.fn().mockResolvedValue({ data: expectedUser }),
  defaults: { headers: { common: {} } },
});
```

3. **Mock Reset:** Clear all mocks between tests
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

**Example from `tests/ApiService.test.ts`:**
```typescript
describe('registerUser', () => {
  it('should register user successfully', async () => {
    const userData: UserRegistration = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'TestPass123',
    };

    const expectedUser: User = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      fullName: null,
      isActive: true,
      isVerified: false,
      createdAt: '2026-01-24T00:00:00Z',
    };

    mockedAxios.create = vi.fn().mockReturnValue({
      post: vi.fn().mockResolvedValue({ data: expectedUser }),
      defaults: { headers: { common: {} } },
    });

    const { apiService: testApiService } = await import('../src/services/ApiService');
    const result = await testApiService.registerUser(userData);

    expect(result).toEqual(expectedUser);
  });
});
```

**What to Mock:**
- External HTTP clients (axios)
- File system operations
- Third-party API calls
- System/browser APIs that don't work in test environment
- Module dependencies to isolate unit under test

**What NOT to Mock:**
- Core utilities and helper functions
- Validation logic (test real validation behavior)
- Pure functions
- Objects that are part of the API contract (interfaces, types)

## Fixtures and Factories

**Test Data:**
Inline test data within test cases, organized by concern:

```typescript
// From ValidationService.test.ts
it('should validate complete registration form', () => {
  const data = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPass123',
    fullName: 'Test User',
  };
  const result = ValidationService.validateRegistrationForm(data);
  expect(result.isValid).toBe(true);
});
```

**Location:**
- No separate fixture directory
- Test data defined inline within test functions
- Reusable data patterns in `beforeEach()` blocks where needed
- Type safety ensures fixtures match real data structures

## Coverage

**Requirements:** 90% threshold enforced on all metrics (lines, functions, branches, statements)

**View Coverage:**
```bash
npm run test:coverage
# Generates HTML report in coverage directory
# Open coverage/index.html in browser
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, methods, classes
- Approach: Mock external dependencies; test in isolation
- Examples: `ValidationService.test.ts`, `BaseView.test.ts` for utility methods

**Integration Tests:**
- Scope: Multiple components working together
- Approach: Real axios client with mocked API responses
- Example: `ApiService.test.ts` tests service interaction with mocked axios
- Pattern: Mock at module level, but test actual service class behavior

**E2E Tests:**
- Framework: Not currently implemented
- Approach: Could use Playwright or Cypress for full application flow testing
- Current gap: No end-to-end tests for complete user journeys (registration → login → dashboard)

## Common Patterns

**Async Testing:**
All async tests use `async`/`await` with proper error handling:

```typescript
// From ApiService.test.ts
it('should login user successfully', async () => {
  const credentials: UserLogin = {
    username: 'testuser',
    password: 'TestPass123',
  };

  mockedAxios.create = vi.fn().mockReturnValue({
    post: vi.fn().mockResolvedValue({ data: expectedToken }),
    defaults: { headers: { common: {} } },
  });

  const { apiService: testApiService } = await import('../src/services/ApiService');
  const result = await testApiService.loginUser(credentials);

  expect(result).toEqual(expectedToken);
});
```

**Error Testing:**
Tests verify error handling by expecting rejection or thrown errors:

```typescript
// From ApiService.test.ts
it('should handle login error', async () => {
  const credentials: UserLogin = {
    username: 'testuser',
    password: 'WrongPass123',
  };

  mockedAxios.create = vi.fn().mockReturnValue({
    post: vi.fn().mockRejectedValue({
      response: { data: { detail: 'Incorrect username or password' } },
      isAxiosError: true,
    }),
    defaults: { headers: { common: {} } },
  });

  mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

  const { apiService: testApiService } = await import('../src/services/ApiService');

  await expect(testApiService.loginUser(credentials)).rejects.toThrow(
    'Incorrect username or password'
  );
});
```

**Validation Testing:**
Comprehensive test coverage of validation rules:

```typescript
// From ValidationService.test.ts
describe('validatePassword', () => {
  it('should validate strong password', () => {
    const result = ValidationService.validatePassword('StrongPass123');
    expect(result.isValid).toBe(true);
  });

  it('should reject password without uppercase', () => {
    const result = ValidationService.validatePassword('weakpass123');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('uppercase');
  });

  it('should reject short password', () => {
    const result = ValidationService.validatePassword('Pass1');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('8 characters');
  });
});
```

**DOM Testing:**
Tests for view classes use actual DOM manipulation in jsdom environment:

```typescript
// From BaseView.test.ts
it('should show error message', () => {
  const view = new TestView('test-container');
  view['showError']('Test error');

  const errorDiv = container.querySelector('.error-message');
  expect(errorDiv).toBeDefined();
  expect(errorDiv?.textContent).toBe('Test error');
});

it('should create form field', () => {
  const view = new TestView('test-container');
  const field = view['createFormField']('text', 'testField', 'Test Label', 'Test placeholder');

  expect(field.querySelector('label')).toBeDefined();
  expect(field.querySelector('input')).toBeDefined();
  expect(field.querySelector('.field-error')).toBeDefined();
});
```

**Test Isolation:**
- Each test creates fresh mocks and state
- `beforeEach()` and `afterEach()` ensure no state bleed between tests
- DOM tests create and destroy container elements per test
- Service tests re-import modules to get fresh instances with mocks

## Testing Best Practices

**Do:**
- Write one assertion per logical unit (multiple expects allowed if testing one behavior)
- Use descriptive test names that explain the scenario and expected outcome
- Create realistic test data matching actual usage
- Mock external dependencies to isolate units
- Clean up after tests (DOM elements, timers, mocks)
- Test both success and failure paths

**Don't:**
- Skip tests (`.skip`) in committed code
- Create interdependent tests that rely on execution order
- Test implementation details instead of behavior
- Mock everything (mock only external boundaries)
- Use hardcoded delays or arbitrary timeouts in assertions
- Copy-paste test code without understanding

## Current Testing Gaps

**Not Covered:**
- Controller classes: `LoginController`, `RegistrationController`, `HomeController` lack tests
- Router class: `src/router.ts` has no test coverage
- View classes: `LoginView`, `RegistrationView`, `HomeView` lack full test coverage
- End-to-end flows: No tests for complete user journeys
- Error recovery: Some error scenarios not fully tested
- localStorage interactions: Token persistence and retrieval not thoroughly tested

**Recommendation:**
Expand test coverage to reach 90% threshold across all files; prioritize controller and router tests as they orchestrate application flow.

---

*Testing analysis: 2026-02-03*
