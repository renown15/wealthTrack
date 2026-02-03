# Coding Conventions

**Analysis Date:** 2026-02-03

## Naming Patterns

**Files:**
- Classes/Controllers: PascalCase with descriptive names (e.g., `LoginController.ts`, `ValidationService.ts`, `BaseView.ts`)
- Models/Types: PascalCase interfaces (e.g., `User.ts`, `Form.ts`)
- Index files: `index.ts` for entry points

**Functions:**
- Public methods: camelCase (e.g., `registerUser`, `validateEmail`, `render`)
- Private methods: camelCase with underscore prefix or private keyword (e.g., `private handleLogin`, `private setupEventListeners`)
- Async functions: camelCase with clear action verbs (e.g., `loginUser`, `registerUser`, `handleSubmit`)

**Variables:**
- Local variables: camelCase (e.g., `userData`, `authToken`, `errorMessage`)
- Constants: UPPER_SNAKE_CASE for global constants
- Private class properties: camelCase with private keyword (e.g., `private view`, `private baseURL`, `private currentController`)
- Booleans: Prefix with `is` or `has` (e.g., `isValid`, `isActive`, `isVerified`, `hasError`)

**Types:**
- Interfaces: PascalCase with descriptive names (e.g., `User`, `UserRegistration`, `UserLogin`, `ValidationResult`, `AuthToken`)
- Generic types: Keep consistent with function/class naming
- Type imports: Use `type` keyword explicitly (e.g., `import type { User, UserRegistration }`)

## Code Style

**Formatting:**
- Line length: No explicit limit enforced, but code follows readable 80-120 character range
- Indentation: 2 spaces (inferred from codebase structure)
- Semicolons: Required at end of statements (enforced by ESLint)
- Quotes: Single quotes for strings (standard JavaScript convention)

**Linting:**
- Tool: ESLint with TypeScript plugin
- Config: `.eslintrc.json`
- Key rules enforced:
  - `@typescript-eslint/no-unused-vars`: Error - unused variables not allowed; parameters can be ignored with underscore prefix pattern
  - `@typescript-eslint/explicit-function-return-type`: Error - all functions must declare return type explicitly
  - `@typescript-eslint/no-explicit-any`: Error - strict typing, no `any` type
  - `@typescript-eslint/no-floating-promises`: Error - async operations must be properly awaited
  - `no-console`: Warning - console usage allowed only for `warn` and `error` levels
- Run linting: `npm run lint`

**Type Checking:**
- Full TypeScript strict mode enabled in `tsconfig.json`
- `strict: true` enforces strict null checks, strict function types, etc.
- `noUnusedLocals: true` - unused variables cause compilation error
- `noUnusedParameters: true` - unused parameters cause compilation error
- `noImplicitReturns: true` - all code paths must return a value
- Run type check: `npm run type-check`

## Import Organization

**Order:**
1. Framework/Library imports (e.g., `axios`, `vitest`)
2. Internal type imports with `type` keyword (e.g., `import type { User, UserLogin }`)
3. Internal value imports (services, controllers, views, models)

**Example from `src/services/ApiService.ts`:**
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import type { User, UserRegistration, UserLogin, AuthToken, ApiError } from '../models/User';
```

**Example from `src/controllers/LoginController.ts`:**
```typescript
import { LoginView } from '../views/LoginView';
import { apiService } from '../services/ApiService';
import { ValidationService } from '../services/ValidationService';
import type { UserLogin } from '../models/User';
```

**Path Aliases:**
- `@/*` maps to `src/*` (configured in `tsconfig.json`)
- Can import from `@/models/User` instead of `../../../models/User`
- Currently used in `vitest.config.ts` but source code prefers relative imports for clarity

## Error Handling

**Patterns:**
- Try-catch blocks for async operations that may fail (API calls, user registration/login)
- Error type checking: `error instanceof Error` to safely extract message
- Fallback messages: When error source is unknown, provide generic fallback (e.g., "An unexpected error occurred")
- Constructor validation: Throw `Error` immediately if required DOM elements not found
- HTTP error handling: Check `axios.isAxiosError()` before accessing response data

**Example from `src/services/ApiService.ts`:**
```typescript
try {
  const response = await this.client.post<User>('/api/v1/auth/register', userData);
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data?.detail || 'Registration failed');
  }
  throw new Error('An unexpected error occurred');
}
```

**Example from `src/controllers/LoginController.ts`:**
```typescript
try {
  const authToken = await apiService.loginUser(loginData);
  localStorage.setItem('accessToken', authToken.accessToken);
  // ... success handling
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Login failed';
  this.view.showError(errorMessage);
}
```

## Logging

**Framework:** No dedicated logging library. Uses `console.warn()` and `console.error()` only (per ESLint rule).

**Patterns:**
- Avoid `console.log()` in production code (ESLint warns)
- Use `console.warn()` for non-critical issues
- Use `console.error()` for errors
- Logging typically handled at service layer boundaries (API calls, validation)
- UI-level error display: Show user-friendly messages via `BaseView.showError()`

## Comments

**When to Comment:**
- File-level: Every file starts with JSDoc comment describing purpose
- Function-level: Every public function and method has JSDoc comment describing what it does
- Inline: Used sparingly for complex logic or non-obvious business rules
- Avoid: Obvious comments that restate what code clearly shows

**JSDoc/TSDoc:**
- Used consistently on all exported items
- Format: `/** ... */` style with single-line or multi-line as appropriate
- Include parameter descriptions for complex functions
- Example from `src/services/ApiService.ts`:

```typescript
/**
 * Register a new user.
 */
async registerUser(userData: UserRegistration): Promise<User> {
  // ...
}

/**
 * Set authentication token for future requests.
 */
setAuthToken(token: string): void {
  // ...
}
```

**Example from `src/models/User.ts`:**
```typescript
/**
 * User model representing user data.
 */
export interface User {
  id: number;
  email: string;
  // ...
}
```

## Function Design

**Size:**
- Functions stay reasonably compact (10-30 lines typical)
- Complex logic broken into helper methods
- Single responsibility principle applied

**Parameters:**
- Use typed objects instead of multiple parameters when practical
- Type annotations required on all parameters
- Example: `registerUser(userData: UserRegistration)` instead of individual fields

**Return Values:**
- Explicit return type required on all functions (ESLint error if missing)
- Async functions return `Promise<T>` type
- Void return for side-effect-only functions
- Single return value preferred; use typed object for multiple values

**Example from `src/services/ValidationService.ts`:**
```typescript
static validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters' };
  }
  // ...
  return { isValid: true };
}
```

## Module Design

**Exports:**
- Named exports for classes, functions, interfaces
- Default export for service singletons (e.g., `export const apiService = new ApiService()`)
- All public exports are at module level

**Example from `src/services/ApiService.ts`:**
```typescript
class ApiService {
  // ... implementation
}
export const apiService = new ApiService();
```

**Example from `src/services/ValidationService.ts`:**
```typescript
export class ValidationService {
  static validateEmail(email: string): boolean { ... }
  static validateUsername(username: string): { ... } { ... }
  // ... other static methods
}
```

**Barrel Files:**
- Not currently used; direct imports preferred
- Each component imports what it needs from specific files
- Reduces circular dependency risk and clarifies dependencies

## Class Design

**Access Modifiers:**
- `private` for internal-only properties and methods
- Public (no modifier) for interface methods
- `protected` used for inheritance in abstract classes like `BaseView`

**Constructors:**
- Initialize all dependencies
- Validate required inputs (throw if missing)
- Set up DOM elements and listeners

**Example from `src/views/BaseView.ts`:**
```typescript
constructor(containerId: string) {
  const element = document.getElementById(containerId);
  if (!element) {
    throw new Error(`Container with id '${containerId}' not found`);
  }
  this.container = element;
}
```

**Abstract Classes:**
- Use `abstract` keyword for base classes that define interface
- Mark abstract methods with `abstract` keyword
- Example: `BaseView` defines `render()` as abstract

---

*Convention analysis: 2026-02-03*
