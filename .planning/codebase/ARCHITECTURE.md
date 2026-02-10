# Architecture

**Analysis Date:** 2026-02-03

## Pattern Overview

**Overall:** Layered MVC architecture with separate frontend and backend services communicating via REST API.

**Key Characteristics:**
- Strict separation between presentation layer (frontend), business logic (backend), and data persistence
- Service-based business logic encapsulation
- Repository/query pattern for data access
- Client-side MVC with controllers managing views and handling user interactions
- Async/await throughout backend for non-blocking database operations

## Layers

**Presentation Layer (Frontend):**
- Purpose: User interface rendering and interaction handling
- Location: `frontend/src/views/`
- Contains: View classes that extend `BaseView` for rendering HTML and handling DOM manipulation
- Depends on: Controllers, Services
- Used by: Controllers, Router

**Controller Layer (Frontend):**
- Purpose: Handle user interactions, coordinate views and services, manage page state
- Location: `frontend/src/controllers/`
- Contains: `RegistrationController`, `LoginController`, `PortfolioController` - each handles a specific page/feature (covering registration, login, and the authenticated portfolio/dashboard screens)
- Depends on: Views, ApiService, ValidationService
- Used by: Router

**Service Layer (Frontend):**
- Purpose: API communication and business logic validation
- Location: `frontend/src/services/`
- Contains: `ApiService` (HTTP client with axios), `ValidationService` (form field validation rules)
- Depends on: Models
- Used by: Controllers

**Model Layer (Frontend):**
- Purpose: Type definitions for frontend data structures
- Location: `frontend/src/models/`
- Contains: TypeScript interfaces for User, UserRegistration, UserLogin, AuthToken, ValidationResult, FormField
- Depends on: None
- Used by: Controllers, Services

**API Layer (Backend):**
- Purpose: HTTP endpoint definition and request/response handling
- Location: `backend/app/controllers/`
- Contains: `auth.py` with POST `/auth/register`, POST `/auth/login`, GET `/auth/me` routes
- Depends on: Services, Schemas, Database
- Used by: FastAPI router

**Service Layer (Backend):**
- Purpose: Core business logic, data validation, user operations
- Location: `backend/app/services/`
- Contains: `UserService` (CRUD operations, authentication logic), `auth.py` (password hashing, JWT token generation/validation)
- Depends on: Models, Schemas
- Used by: Controllers

**Data Layer (Backend):**
- Purpose: Database models and schema definitions
- Location: `backend/app/models/`, `backend/app/schemas/`
- Contains: SQLAlchemy ORM models (`User`), Pydantic request/response schemas
- Depends on: SQLAlchemy, Pydantic
- Used by: Services, Controllers

**Database Access (Backend):**
- Purpose: Database connection and session management
- Location: `backend/app/database.py`
- Contains: Async engine creation, async session factory, `get_db()` dependency
- Depends on: SQLAlchemy
- Used by: Controllers, Services

## Data Flow

**User Registration Flow:**

1. User fills registration form in `RegistrationView`
2. Form submission triggers `RegistrationController.handleRegistration()`
3. Controller calls `ValidationService.validateRegistrationForm()` for client-side validation
4. If valid, controller calls `apiService.registerUser()` with form data
5. API service makes POST request to `backend/app/controllers/auth.py:/auth/register`
6. Backend controller instantiates `UserService` and calls `create_user()`
7. `UserService` validates uniqueness, hashes password via `auth.hash_password()`, creates `User` model instance
8. User saved to PostgreSQL via async SQLAlchemy session
9. Backend returns `UserResponse` schema (Pydantic)
10. Frontend displays success message and redirects to login page

**User Login Flow:**

1. User fills login form in `LoginView`
2. Form submission triggers `LoginController.handleLogin()`
3. Controller validates form via `ValidationService.validateLoginForm()`
4. If valid, calls `apiService.loginUser()` with credentials
5. API service makes POST request to `/api/v1/auth/login`
6. Backend controller calls `UserService.authenticate_user()`
7. Service queries database by username, verifies password hash via `auth.verify_password()`
8. If authenticated, backend calls `auth.create_access_token()` to generate JWT
9. Returns `TokenResponse` with access token
10. Frontend stores token in localStorage and sets axios Authorization header
11. Subsequent API calls include token via `apiService.setAuthToken()`

**State Management:**

- **Frontend:** Page state managed in controller instances, authentication token stored in browser localStorage
- **Backend:** Request-scoped database session via FastAPI dependency injection, no global state
- **Cross-app:** Authentication state synchronized via JWT tokens in Authorization header

## Key Abstractions

**BaseView (Frontend):**
- Purpose: Abstract base for all view classes, provides common DOM utilities
- Examples: `RegistrationView`, `LoginView` extend `BaseView`; the authenticated dashboard area lives under `AccountHub/` and is orchestrated by `PortfolioController` with components such as `PortfolioView.vue`
- Pattern: Template method pattern with abstract `render()` method; subclasses override `render()` and use protected helper methods like `createFormField()`, `showError()`, `showSuccess()`
- Location: `frontend/src/views/BaseView.ts`

**UserService (Backend):**
- Purpose: Encapsulates all user-related database operations and business logic
- Pattern: Service class initialized with AsyncSession dependency, methods are async and return Optional types for nullable results
- Location: `backend/app/services/user.py`
- Methods: `create_user()`, `get_user_by_email()`, `get_user_by_username()`, `get_user_by_id()`, `authenticate_user()`

**ApiService (Frontend):**
- Purpose: Single point of HTTP communication with backend, manages auth header
- Pattern: Singleton instance (exported as `apiService`), axios client with interceptor-like capability through method chaining
- Location: `frontend/src/services/ApiService.ts`
- Methods: `registerUser()`, `loginUser()`, `setAuthToken()`, `clearAuthToken()`

**ValidationService (Frontend):**
- Purpose: Centralized validation rules for forms, shared between client and server
- Pattern: Static utility class with pure functions, validation results return both boolean and error message
- Location: `frontend/src/services/ValidationService.ts`
- Methods: `validateEmail()`, `validateUsername()`, `validatePassword()`, `validateRegistrationForm()`, `validateLoginForm()`

**Router (Frontend):**
- Purpose: Client-side page navigation without server reload
- Pattern: Singleton managing controller lifecycle; instantiates new controller on each page navigation
- Location: `frontend/src/router.ts`
- Methods: `navigate(page)`, event listener setup for link clicks and custom navigation events

**Pydantic Schemas (Backend):**
- Purpose: Request/response contract definition and validation
- Examples: `UserRegistrationRequest`, `UserLoginRequest`, `UserResponse`, `TokenResponse`
- Location: `backend/app/schemas/user.py`
- Pattern: Declarative validation via field validators and constraints (min_length, max_length, EmailStr)

## Entry Points

**Frontend:**
- Location: `frontend/src/index.ts`
- Triggers: Page load via bundled JavaScript by Vite
- Responsibilities: Initialize Router, restore auth token from localStorage, navigate to home page

**Backend:**
- Location: `backend/app/main.py`
- Triggers: Uvicorn server startup
- Responsibilities: Create FastAPI app instance, configure CORS middleware, include routers, define lifespan context manager for startup/shutdown (create/drop tables)

**Router (Frontend):**
- Location: `frontend/src/router.ts`
- Triggers: Navigation link clicks, custom navigate events
- Responsibilities: Instantiate appropriate controller, call controller.init(), update active nav link CSS

**API Routers (Backend):**
- Location: `backend/app/controllers/auth.py`
- Triggers: HTTP requests to `/api/v1/auth/*` endpoints
- Responsibilities: Parse request schema, call business logic service, return response schema

## Error Handling

**Strategy:** Explicit error propagation with meaningful messages at each layer

**Patterns:**

- **Backend Controllers:** Catch `ValueError` from services, convert to FastAPI `HTTPException` with 400/401 status codes and detail message
- **Backend Services:** Raise `ValueError` with descriptive message for business logic violations (duplicate user, invalid password)
- **Frontend Controllers:** Try/catch around API service calls, display user-friendly error messages in view via `showError()`
- **Frontend Views:** Timer-based auto-removal of error/success messages after 5 seconds
- **Database:** Async session automatically rolls back on exception via `conftest.py` context manager in `get_db()`

## Cross-Cutting Concerns

**Logging:**
- Backend: FastAPI logging via Uvicorn, database echo enabled in development mode
- Frontend: Browser console logs in development (no centralized logging)

**Validation:**
- Frontend: Client-side validation via `ValidationService` prevents unnecessary API calls
- Backend: Server-side validation via Pydantic schemas (field validators on `UserRegistrationRequest`) ensures data integrity regardless of client

**Authentication:**
- Frontend: JWT token stored in localStorage, attached to requests via axios default headers
- Backend: JWT token generation via `create_access_token()` in `auth.py`, validation via `decode_access_token()` (note: `/auth/me` endpoint not fully implemented, currently returns 501)

**CORS:**
- Configured in `backend/app/main.py` to allow requests from `localhost:3000` and `localhost:8080` (development only)

**Database Transactions:**
- Async session auto-commits on successful completion
- Auto-rolls back on exception
- Async/await ensures non-blocking I/O
