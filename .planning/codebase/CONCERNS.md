# Codebase Concerns

**Analysis Date:** 2026-02-03

## Security Considerations

**XSS Vulnerability in Link Rendering:**
- Risk: Links are rendered using `innerHTML` instead of safer methods, allowing potential injection attacks if data is unsanitized
- Files: `frontend/src/views/LoginView.ts` (line 52), `frontend/src/views/RegistrationView.ts` (line 54)
- Current mitigation: HTML is hardcoded (not from user input), but pattern is unsafe
- Recommendations: Use `textContent` with DOM methods or sanitize HTML via library like DOMPurify. Replace `innerHTML` assignments with safer DOM APIs

**Weak Email Validation:**
- Risk: Email regex pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` is overly permissive and doesn't follow RFC 5322 standards, allowing invalid emails like "test@domain.c"
- Files: `frontend/src/services/ValidationService.ts` (line 11)
- Current mitigation: None - backend may catch this, but frontend validation gives false sense of security
- Recommendations: Either use HTML5 email input type validation or implement more robust email regex pattern

**localStorage Token Storage Without Expiry:**
- Risk: Authentication tokens stored in `localStorage` without expiration handling. If token is compromised, attacker has indefinite access
- Files: `frontend/src/controllers/LoginController.ts` (line 47), `frontend/src/index.ts` (line 13)
- Current mitigation: None - token persists until manually cleared
- Recommendations: Implement token expiration checking, use secure httpOnly cookies instead of localStorage, add token refresh logic

**Missing CSRF Protection:**
- Risk: No CSRF token mechanism in API requests or form submissions
- Files: `frontend/src/services/ApiService.ts`, `frontend/src/views/LoginView.ts`, `frontend/src/views/RegistrationView.ts`
- Current mitigation: None
- Recommendations: Add CSRF token to request headers, validate on backend

**No Validation on Password Special Characters:**
- Risk: Password validation only requires uppercase, lowercase, and digits - no special characters required. Reduces password entropy
- Files: `frontend/src/services/ValidationService.ts` (lines 18-31)
- Current mitigation: 8-character minimum length
- Recommendations: Consider requiring at least one special character for stronger passwords

## Tech Debt

**Manual Event Delegation in Router:**
- Issue: Router uses global click event listener with manual ID checking instead of event delegation framework
- Files: `frontend/src/router.ts` (lines 55-68)
- Impact: Fragile - dependent on specific HTML element IDs, hard to maintain as new pages are added
- Fix approach: Use data attributes or class-based selectors for routing targets, or migrate to routing library

**Hardcoded Timing Constants:**
- Issue: Navigation delays hardcoded as magic numbers (5000ms for message auto-removal, 1000ms and 2000ms for redirects)
- Files: `frontend/src/views/BaseView.ts` (line 37, 52), `frontend/src/controllers/LoginController.ts` (line 56), `frontend/src/controllers/RegistrationController.ts` (line 54)
- Impact: Difficult to adjust UX consistently, scattered across multiple files
- Fix approach: Extract to constants file (e.g., `frontend/src/constants/timings.ts`)

**Direct DOM Manipulation Without Type Safety:**
- Issue: Extensive use of `document.getElementById()` with string IDs requires careful coordination between HTML and TypeScript
- Files: Multiple view files - `frontend/src/views/BaseView.ts`, `frontend/src/views/LoginView.ts`, `frontend/src/views/RegistrationView.ts`
- Impact: Runtime errors if HTML structure changes, no compile-time checking
- Fix approach: Consider using a component framework (React, Vue, Svelte) or introducing a templating layer with type-safe selectors

**Axios Instance Pattern Antipattern:**
- Issue: `ApiService` creates axios instance in constructor but relies on module-level singleton export, makes testing difficult
- Files: `frontend/src/services/ApiService.ts` (lines 7-68)
- Impact: Tests show awkward re-importing pattern (lines 41, 64, 87, 109 in test file), mocking is fragile
- Fix approach: Move instance creation outside class, or use dependency injection

**Error Handling Too Generic:**
- Issue: Most error handlers catch all errors and convert to generic "failed" messages, losing specificity
- Files: `frontend/src/services/ApiService.ts` (lines 24-34, 40-50), controllers (LoginController.ts line 57-61, RegistrationController.ts line 57-61)
- Impact: Users can't distinguish between network failures, validation errors, and server errors
- Fix approach: Create typed error classes, maintain error specificity through error chain

## Test Coverage Gaps

**Untested Router Navigation:**
- What's not tested: Router's page switching, event listener setup, navigation state management
- Files: `frontend/src/router.ts`
- Risk: Changes to router logic could break navigation without detection
- Priority: High

**Untested View Rendering:**
- What's not tested: HTML generation, form field creation, error display formatting, message auto-removal timing
- Files: `frontend/src/views/BaseView.ts`, `frontend/src/views/LoginView.ts`, `frontend/src/views/RegistrationView.ts`, `frontend/src/views/HomeView.ts`
- Risk: UI could be broken and undetected until manual testing
- Priority: High

**Untested Controllers:**
- What's not tested: Controller initialization, event callback handling, API service integration, success/error flows
- Files: `frontend/src/controllers/LoginController.ts`, `frontend/src/controllers/RegistrationController.ts`, `frontend/src/controllers/HomeController.ts`
- Risk: Business logic bugs in request/response handling
- Priority: Medium

**Missing End-to-End Tests:**
- What's not tested: Full user journeys (register → login → dashboard), form submission, API error recovery
- Files: No E2E test files exist
- Risk: Integration issues between services and views
- Priority: Medium

## Fragile Areas

**Singleton ApiService Instance:**
- Files: `frontend/src/services/ApiService.ts`
- Why fragile: Global singleton created at module load time. Multiple imports all reference the same instance. Difficult to reset state between operations.
- Safe modification: Use factory function instead of singleton, or pass instance via dependency injection
- Test coverage: Basic happy path tested, but error edge cases and state management not fully covered

**Event-Driven Navigation:**
- Files: `frontend/src/router.ts`, `frontend/src/index.ts`, controllers
- Why fragile: Relies on custom `navigate` event dispatching. Navigation logic split between router, views, and controllers. No centralized navigation state.
- Safe modification: Document event contract clearly, add navigation guards/middleware pattern before navigation changes
- Test coverage: No tests exist for navigation logic

**Form Error Display:**
- Files: `frontend/src/views/BaseView.ts` (displayFieldError), view implementations
- Why fragile: Error elements keyed by field name with `-error` suffix. If field naming changes, error display breaks silently.
- Safe modification: Use a form state management object instead of DOM-based error storage
- Test coverage: No tests for error display behavior

## Performance Bottlenecks

**DOM innerHTML Usage for Clear:**
- Problem: `clear()` method uses `innerHTML = ''` which can trigger reflows
- Files: `frontend/src/views/BaseView.ts` (line 24)
- Cause: Each navigation clears entire container, re-renders forms. No virtual DOM or change detection.
- Improvement path: Consider caching rendered forms, use targeted DOM manipulation, or adopt framework with virtual DOM

**Frequent Regex Compilation in Validation:**
- Problem: Email and password regex patterns compiled on every validation call
- Files: `frontend/src/services/ValidationService.ts` (lines 11, 22, 25, 28, 44)
- Cause: Static methods create new regex instances each invocation
- Improvement path: Cache regex patterns as static class fields or module constants

**No Lazy Loading or Code Splitting:**
- Problem: All JavaScript bundled together, no route-based code splitting
- Files: Build configuration - `frontend/vite.config.ts`
- Cause: Small app currently, but will grow. All code loaded upfront.
- Improvement path: Implement dynamic imports for route controllers, enable Vite code splitting

## Dependencies at Risk

**Axios ^1.6.5 Version Range:**
- Risk: Very loose constraint (1.6.5 to <2.0.0) could pull in breaking changes or security updates unexpectedly
- Impact: Unintended behavior changes in HTTP requests, error handling
- Migration plan: Pin to specific minor version, use dependabot or manual auditing for updates

**Outdated TypeScript Strict Checks:**
- Risk: Enabled strict mode but some files still bypass with type casts (e.g., `as AxiosError<ApiError>`, `as HTMLElement`)
- Impact: Loss of type safety benefits, potential runtime errors
- Migration plan: Audit all type casts, use proper typing instead of assertions

## Known Bugs

**Email Field Type Mismatch:**
- Symptoms: Registration form uses email field but validation uses generic string regex
- Files: `frontend/src/views/RegistrationView.ts` (line 38 - uses type "email" in HTML), `frontend/src/services/ValidationService.ts` (line 11 - weak regex validation)
- Trigger: Register form with invalid email address
- Workaround: Browser HTML5 validation catches invalid emails, but app validation is weaker

**Potential Race Condition in Token Initialization:**
- Symptoms: Token might not be set on axios instance if import completes after first request
- Files: `frontend/src/index.ts` (lines 16-18 - async import), `frontend/src/services/ApiService.ts` (instance creation)
- Trigger: Page load immediately followed by API request
- Workaround: First requests won't have auth token even if one exists locally; backend returns 401

**Missing Null Check on Form Data:**
- Symptoms: Form submission assumes all FormData values are strings
- Files: `frontend/src/views/LoginView.ts` (line 76), `frontend/src/views/RegistrationView.ts` (line 78)
- Trigger: Unusual browser behavior where FormData contains non-string values
- Workaround: `toString()` call prevents crash but may hide data issues

## Scaling Limits

**Single Page State Management:**
- Current capacity: Handles 3 pages (home, login, register) with no client-side data persistence between navigations
- Limit: Adding features like shopping cart, user preferences, pagination would require complete rewrite of state system
- Scaling path: Implement a state management system (Zustand, Jotai, Redux) before adding multi-page data dependencies

**No Request Caching:**
- Current capacity: Every navigation triggers fresh API calls
- Limit: If user navigates back to visited pages frequently, redundant requests hammer server
- Scaling path: Implement request caching with expiration, or move to framework with built-in caching (SWR, React Query)

**Form Validation Happens After Submission:**
- Current capacity: All validation is synchronous, happens on form submit
- Limit: Can't provide real-time validation feedback as user types
- Scaling path: Split validation into sync (format) and async (uniqueness), add onChange handlers

## Missing Critical Features

**No Logout Functionality:**
- Problem: Users can register and login but no way to logout or clear token
- Blocks: Users stuck in authenticated state, can't test re-authentication flows, no session management
- Required before production: Implement logout button that clears localStorage and removes auth header

**No Error Recovery or Retry Logic:**
- Problem: Network failures or temporary server errors result in fatal error display
- Blocks: Resilient user experience, handling transient failures gracefully
- Required before production: Add exponential backoff retry, user-triggered retry button

**No Loading States:**
- Problem: Users don't know if API request is in progress, appears to hang
- Blocks: Users may click buttons multiple times, thinking nothing happened
- Required before production: Add loading indicators, disable buttons during requests

**No Session Timeout Protection:**
- Problem: Token stored indefinitely, no warning if expired
- Blocks: Users may attempt actions with invalid token, receive cryptic errors
- Required before production: Implement token refresh, detect 401 responses, auto-redirect to login

---

*Concerns audit: 2026-02-03*
