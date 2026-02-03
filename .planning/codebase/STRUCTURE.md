# Codebase Structure

**Analysis Date:** 2026-02-03

## Directory Layout

```
wealthtrack/
├── backend/                    # Python FastAPI backend server
│   ├── app/                   # Main application code
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app initialization, routes, lifespan
│   │   ├── config.py          # Settings and environment configuration
│   │   ├── database.py        # Async database setup and session factory
│   │   ├── models/            # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   └── user.py        # User database model
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   └── user.py        # User validation schemas
│   │   ├── services/          # Business logic services
│   │   │   ├── __init__.py
│   │   │   ├── user.py        # UserService for CRUD operations
│   │   │   └── auth.py        # Password hashing, JWT token functions
│   │   └── controllers/       # API endpoint handlers (routers)
│   │       ├── __init__.py
│   │       └── auth.py        # Authentication endpoints
│   ├── tests/                 # Backend test suite
│   │   ├── __init__.py
│   │   ├── conftest.py        # Pytest fixtures and configuration
│   │   ├── test_auth_service.py
│   │   ├── test_auth_controller.py
│   │   └── test_user_service.py
│   ├── Dockerfile            # Docker image definition
│   ├── requirements.txt       # Python dependencies
│   ├── mypy.ini              # Type checking configuration
│   ├── pytest.ini            # Testing configuration
│   ├── ruff.toml             # Linting configuration
│   └── .env.example          # Environment variables template
├── frontend/                 # TypeScript/Vite frontend client
│   ├── src/
│   │   ├── index.ts          # Entry point, router initialization
│   │   ├── router.ts         # Client-side navigation router
│   │   ├── models/           # TypeScript type definitions
│   │   │   ├── User.ts       # User, UserRegistration, UserLogin interfaces
│   │   │   └── Form.ts       # ValidationResult, FormField interfaces
│   │   ├── views/            # UI view classes
│   │   │   ├── BaseView.ts   # Abstract base class for all views
│   │   │   ├── HomeView.ts   # Homepage view
│   │   │   ├── RegistrationView.ts
│   │   │   └── LoginView.ts
│   │   ├── controllers/      # View controllers (MVC controllers)
│   │   │   ├── HomeController.ts
│   │   │   ├── RegistrationController.ts
│   │   │   └── LoginController.ts
│   │   ├── services/         # API and validation services
│   │   │   ├── ApiService.ts # Axios HTTP client singleton
│   │   │   └── ValidationService.ts
│   │   ├── styles/           # CSS stylesheets
│   │   └── index.html        # HTML root document
│   ├── tests/                # Frontend test suite
│   │   ├── BaseView.test.ts
│   │   ├── ApiService.test.ts
│   │   └── ValidationService.test.ts
│   ├── Dockerfile           # Frontend build and serve
│   ├── package.json         # Node dependencies
│   ├── tsconfig.json        # TypeScript compiler options
│   ├── .eslintrc.json       # ESLint configuration
│   ├── vite.config.ts       # Vite build tool configuration
│   ├── vitest.config.ts     # Vitest test runner configuration
│   └── .env.example         # Environment variables template
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions CI/CD pipeline
├── .planning/
│   └── codebase/            # GSD codebase analysis documents
├── docker-compose.yml       # Multi-container orchestration (backend, frontend, PostgreSQL)
├── .gitignore
└── README.md
```

## Directory Purposes

**backend/app/:**
- Purpose: All backend application code organized by responsibility
- Contains: Database models, request schemas, business logic, API controllers
- Key files: `main.py` (app entry), `config.py` (settings), `database.py` (session management)

**backend/app/models/:**
- Purpose: SQLAlchemy ORM model definitions representing database tables
- Contains: `User` model with fields: id, email, username, hashed_password, full_name, is_active, is_verified, created_at, updated_at
- Key files: `user.py`

**backend/app/schemas/:**
- Purpose: Pydantic validation schemas for API requests and responses
- Contains: `UserRegistrationRequest` (email, username, password, full_name with validators), `UserLoginRequest`, `UserResponse`, `TokenResponse`
- Key files: `user.py`

**backend/app/services/:**
- Purpose: Business logic layer abstracting database operations
- Contains: `UserService` (create, retrieve, authenticate users), auth utilities (hash, verify, JWT)
- Key files: `user.py`, `auth.py`

**backend/app/controllers/:**
- Purpose: FastAPI route handlers receiving HTTP requests
- Contains: API endpoints for registration (`POST /auth/register`), login (`POST /auth/login`), current user (`GET /auth/me`)
- Key files: `auth.py`

**backend/tests/:**
- Purpose: Pytest test suite with async test support
- Contains: Unit tests for services and controllers
- Key files: `conftest.py` (fixtures), `test_user_service.py`, `test_auth_service.py`, `test_auth_controller.py`

**frontend/src/:**
- Purpose: All frontend application code
- Contains: Router, controllers, views, services, models

**frontend/src/models/:**
- Purpose: TypeScript type definitions shared across components
- Contains: Interfaces for User, UserRegistration, UserLogin, AuthToken, ApiError, ValidationResult
- Key files: `User.ts`, `Form.ts`

**frontend/src/views/:**
- Purpose: UI rendering classes (MVC View layer)
- Contains: `BaseView` abstract class with DOM utilities, concrete views for each page
- Key files: `BaseView.ts` (template), `RegistrationView.ts`, `LoginView.ts`, `HomeView.ts`

**frontend/src/controllers/:**
- Purpose: MVC Controller layer coordinating user interaction with views and services
- Contains: Controller for each major page feature
- Key files: `RegistrationController.ts`, `LoginController.ts`, `HomeController.ts`

**frontend/src/services/:**
- Purpose: Shared business logic services
- Contains: `ApiService` (axios HTTP wrapper), `ValidationService` (form validation rules)
- Key files: `ApiService.ts`, `ValidationService.ts`

**frontend/tests/:**
- Purpose: Vitest test suite for frontend code
- Contains: Tests for views, services, controllers
- Key files: `BaseView.test.ts`, `ApiService.test.ts`, `ValidationService.test.ts`

## Key File Locations

**Entry Points:**
- `backend/app/main.py`: FastAPI application initialization (port 8000)
- `frontend/src/index.ts`: Frontend initialization (compiled by Vite to run in browser)

**Configuration:**
- `backend/app/config.py`: Environment-based settings (database URL, JWT secret, API prefix)
- `frontend/src/router.ts`: Frontend routing configuration
- `backend/pytest.ini`: Test discovery and async markers
- `frontend/vitest.config.ts`: Frontend test configuration

**Core Logic:**
- `backend/app/services/user.py`: User CRUD operations (create, retrieve, authenticate)
- `backend/app/services/auth.py`: Password and JWT utilities
- `frontend/src/services/ApiService.ts`: HTTP client for backend communication
- `frontend/src/services/ValidationService.ts`: Shared form validation rules

**Testing:**
- `backend/tests/conftest.py`: Pytest async fixtures and database setup
- `frontend/tests/BaseView.test.ts`: Example frontend test pattern
- `backend/tests/test_user_service.py`: Service layer tests

## Naming Conventions

**Files:**
- Controllers: `{Feature}Controller.ts` (e.g., `RegistrationController.ts`)
- Views: `{Feature}View.ts` (e.g., `RegistrationView.ts`)
- Services: `{Service}Service.ts` or `{service}.py` (e.g., `ApiService.ts`, `user.py`)
- Models: `{Entity}.ts` or `{entity}.py` (e.g., `User.ts`, `user.py`)
- Tests: `{Module}.test.ts` or `test_{module}.py`

**Directories:**
- Plural names for collections: `models/`, `services/`, `controllers/`, `views/`, `schemas/`, `tests/`
- Lowercase with underscores in Python: `user_service.py`, `test_user_service.py`
- Camel case in TypeScript: `ApiService.ts`, `ValidationService.ts`

**Classes/Interfaces:**
- PascalCase: `UserService`, `ApiService`, `BaseView`, `RegistrationController`
- Interfaces in TypeScript: `User`, `UserRegistration`, `ValidationResult`
- Models in Python: `User` (SQLAlchemy), `UserResponse` (Pydantic schema)

**Functions/Methods:**
- camelCase: `registerUser()`, `validateEmail()`, `createUser()`, `handleSubmit()`
- Backend utilities: `hash_password()`, `verify_password()`, `create_access_token()`

**Variables/Properties:**
- camelCase in TypeScript: `baseURL`, `asyncSession`, `errorMessage`
- snake_case in Python: `base_url`, `db_session`, `hashed_password`

**Database/Table Names:**
- Table names: lowercase, plural - `users` (from `User` model)
- Column names: snake_case - `hashed_password`, `full_name`, `is_active`, `created_at`

## Where to Add New Code

**New Feature (e.g., Portfolio Management):**
1. Database model: `backend/app/models/portfolio.py`
2. Schema: `backend/app/schemas/portfolio.py`
3. Service: `backend/app/services/portfolio.py` with business logic
4. Controller: `backend/app/controllers/portfolio.py` with routes
5. Tests: `backend/tests/test_portfolio_*.py`
6. Frontend view: `frontend/src/views/PortfolioView.ts` extending `BaseView`
7. Frontend controller: `frontend/src/controllers/PortfolioController.ts`
8. Frontend model: `frontend/src/models/Portfolio.ts` if needed
9. Update router: `frontend/src/router.ts` to handle new page navigation
10. Update main router: `backend/app/main.py` to include new controller router

**New Component/Module (e.g., Reusable Form Component):**
- Base class: `frontend/src/views/BaseForm.ts` extending `BaseView`
- Subclasses use it: `RegistrationView extends BaseForm` instead of `BaseView`

**Utilities/Helpers (e.g., Date formatting):**
- Frontend: `frontend/src/services/DateService.ts` as static utility class
- Backend: `backend/app/utils/date_utils.py` module with functions

**Shared Validation Rules:**
- Frontend: Add method to `frontend/src/services/ValidationService.ts`
- Backend: Add field validator to relevant schema in `backend/app/schemas/`

## Special Directories

**backend/tests/:**
- Purpose: Pytest test suite
- Generated: No (manually written)
- Committed: Yes
- Structure: Tests organized by module being tested (test_user_service.py, test_auth_controller.py)
- Key fixture: `db_session` creates fresh database for each test, `client` for HTTP testing

**frontend/tests/:**
- Purpose: Vitest test suite
- Generated: No (manually written)
- Committed: Yes
- Run: `npm test` or `npm run test:coverage`

**frontend/node_modules/:**
- Purpose: Installed npm packages
- Generated: Yes (by npm install)
- Committed: No (ignored in .gitignore)

**.planning/codebase/:**
- Purpose: GSD analysis documents for architecture, structure, conventions, testing, etc.
- Generated: Yes (by GSD mapping commands)
- Committed: Yes (tracked in git)

**backend/venv/ or .venv/:**
- Purpose: Python virtual environment
- Generated: Yes
- Committed: No (ignored in .gitignore)

**.mypy_cache/, .pytest_cache/:**
- Purpose: Type checker and test runner caches
- Generated: Yes
- Committed: No (ignored in .gitignore)

**frontend/dist/, backend/__pycache__/:**
- Purpose: Build output and Python bytecode
- Generated: Yes
- Committed: No (ignored in .gitignore)
