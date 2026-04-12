# WealthTrack Documentation Index

Complete guide to all available documentation for WealthTrack. Use this index to find answers and understand the project.

---

## 🚀 Getting Started

**New to WealthTrack?** Start here:

1. **[README.md](README.md)** — Project overview, features, and quick start
2. **[docs/setup/QUICKSTART.md](docs/setup/QUICKSTART.md)** — Step-by-step setup guide
3. **[FEATURES.md](FEATURES.md)** — Detailed feature descriptions

---

## 📚 Core Documentation

### Project Overview
- **[README.md](README.md)** — What WealthTrack is, what it does, tech stack, security
- **[CLAUDE.md](CLAUDE.md)** — Agent context with project structure and non-negotiable rules
- **[CHANGELOG.md](CHANGELOG.md)** — Version history and recent feature additions

### Features & Capabilities
- **[FEATURES.md](FEATURES.md)** — Comprehensive guide to all current features:
  - Account Hub (institution & account management)
  - Portfolio View (dashboard and summaries)
  - Tax Hub (share sales and capital gains)
  - Analytics (charts and breakdowns)
  - Credential Vault (encrypted storage)
  - Reference Data Administration
  - API endpoints reference

### Development & Architecture
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** — Architecture overview:
  - Layered architecture pattern
  - Frontend architecture (Vue 3 composables)
  - Backend architecture (FastAPI services/repositories)
  - Recent features implementation details
  - Testing strategy
  - Quality gates and tools
  - Common development tasks

---

## 🛠️ Setup & Deployment

### Local Development
- **[docs/setup/QUICKSTART.md](docs/setup/QUICKSTART.md)** — Local setup and first-time configuration
- **[docs/setup/CONTRIBUTING.md](docs/setup/CONTRIBUTING.md)** — Contribution guidelines

### Production Deployment
- **[docs/setup/DEPLOYMENT.md](docs/setup/DEPLOYMENT.md)** — Deploy to Raspberry Pi or Windows
- **[docs/setup/CI_CD_SETUP.md](docs/setup/CI_CD_SETUP.md)** — CI/CD pipeline configuration

---

## 📋 Architecture & Design

### Project Rules & Conventions
- **[docs/architecture/PROJECT_RULES.md](docs/architecture/PROJECT_RULES.md)** — Non-negotiable rules, conventions, development workflow, file organization
  - Coverage thresholds (backend ≥80%, frontend ≥70%)
  - File size limits (max 200 lines per file)
  - Naming conventions
  - Code style patterns

### Infrastructure
- **[docs/architecture/DOCKER_COMPOSE_ARCHITECTURE.md](docs/architecture/DOCKER_COMPOSE_ARCHITECTURE.md)** — Docker setup and container architecture
  - Dev database (port 5433)
  - Test database (port 5434)
  - Separate volumes for data isolation

### Data Model Guides
- **[docs/ARCHITECTURE_NAMING_CONVENTIONS.md](docs/ARCHITECTURE_NAMING_CONVENTIONS.md)** — Database field naming and conventions
- **[docs/FIELD_IMPLEMENTATION_GUIDE.md](docs/FIELD_IMPLEMENTATION_GUIDE.md)** — Adding new fields to existing models
- **[docs/MIDDLEWARE_IMPLEMENTATION.md](docs/MIDDLEWARE_IMPLEMENTATION.md)** — Middleware patterns and implementation

### Testing & Quality
- **[docs/testing/COVERAGE_ACHIEVEMENT.md](docs/testing/COVERAGE_ACHIEVEMENT.md)** — Coverage thresholds and current status
- **[docs/TESTABILITY_REFACTORING_GUIDE.md](docs/TESTABILITY_REFACTORING_GUIDE.md)** — Patterns for writing testable code

---

## 🗂️ Quick Reference Guides

### For Frontend Developers
- **[docs/guides/PATH_ALIASES.md](docs/guides/PATH_ALIASES.md)** — TypeScript path aliases for imports
- **[docs/guides/QUICK_REFERENCE.md](docs/guides/QUICK_REFERENCE.md)** — Common frontend patterns and utilities
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#frontend-architecture)** — Frontend architecture section

**Key Patterns:**
- Composables for business logic (never put logic in components)
- `usePortfolio()` creates NEW state each call (not a singleton)
- Services for HTTP abstraction
- UnoCSS utilities for styling (no scoped CSS)
- `debug` utility for logging (not `console`)

### For Backend Developers
- **[docs/guides/IMPLEMENTATION_GUIDE.md](docs/guides/IMPLEMENTATION_GUIDE.md)** — Backend implementation patterns
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#backend-architecture)** — Backend architecture section

**Key Patterns:**
- Controller → Service → Repository → ORM layers
- Services handle business logic and validation
- Repositories encapsulate SQL queries
- Cascade deletes manually before parent deletion
- Alembic for database migrations

---

## 📊 Project State & Progress

### Current Status
- **[.planning/STATE.md](.planning/STATE.md)** — Current phase, progress, recent changes
  - Phase: 6 of 7 complete (v1 feature-complete)
  - Status: Active development
  - Last activity: 2026-04-12 (Tax Hub, share sales, price tracking)

### Planning Documents
- **[.planning/PROJECT.md](.planning/PROJECT.md)** — Original project goals and scope
- **[.planning/ROADMAP.md](.planning/ROADMAP.md)** — Phase breakdown and requirements
- **[.planning/REQUIREMENTS.md](.planning/REQUIREMENTS.md)** — Detailed requirement tracking

---

## 🎯 Feature Guides by Topic

### Account Management
- Add institutions and accounts
- Track balances over time
- Update account information
- View account history
- See **[FEATURES.md#1-account-hub](FEATURES.md#1-account-hub)**

### Portfolio Tracking
- Dashboard with summary stats
- Portfolio table view
- Account grouping
- Total net worth calculation
- See **[FEATURES.md#2-portfolio-view](FEATURES.md#2-portfolio-view)**

### Tax Management
- Record share sales
- Calculate capital gains
- Prepare tax returns
- Track tax liability
- See **[FEATURES.md#3-tax-hub](FEATURES.md#3-tax-hub)**

### Analytics & Reporting
- Portfolio breakdown by type/institution/asset class
- Balance history trends
- Multi-account comparison
- See **[FEATURES.md#4-analytics](FEATURES.md#4-analytics)**

### Security & Credentials
- Encrypted credential storage
- Support for multiple credential types
- Secure access control
- See **[FEATURES.md#5-credential-vault](FEATURES.md#5-credential-vault)**

---

## 🔧 Common Tasks

### Running Tests
```bash
make pr-check          # Full pre-PR check (must pass!)
make test-backend      # Backend tests only
make test-frontend     # Frontend tests only
make test-watch        # Frontend watch mode
```
See: [docs/setup/QUICKSTART.md](docs/setup/QUICKSTART.md#running-tests)

### Code Quality
```bash
make lint              # Check code quality
make type-check        # Type check
make format            # Auto-format
make lint-fix          # Auto-fix issues
```
See: [docs/setup/QUICKSTART.md](docs/setup/QUICKSTART.md#code-quality)

### Database
```bash
make migrate           # Apply migrations
make seed-db           # Seed reference data
```
See: [docs/setup/QUICKSTART.md](docs/setup/QUICKSTART.md#database)

### Development
```bash
make dev               # Start everything
make backend-dev       # Backend only
make frontend-dev      # Frontend only
```
See: [docs/setup/QUICKSTART.md](docs/setup/QUICKSTART.md#starting-the-app)

---

## 📖 API Documentation

### Runtime API Docs
When running the backend: **http://localhost:8000/docs** (FastAPI Swagger UI)

### API Reference in Documentation
See: **[FEATURES.md#10-api-endpoints](FEATURES.md#10-api-endpoints)**

Endpoints covered:
- Authentication (register, login)
- Portfolio (get user portfolio)
- Accounts (CRUD operations)
- Events/Balance history
- Institutions (CRUD)
- Credentials (CRUD)
- Tax (returns, share sales)
- Reference Data (CRUD)
- Analytics (breakdowns, history)

---

## ❓ FAQ & Troubleshooting

### Database Issues
- Port 8000 in use? → See QUICKSTART.md troubleshooting
- Connection refused? → Run `make docker-up`

### Tests Failing
- Check coverage thresholds in [docs/testing/COVERAGE_ACHIEVEMENT.md](docs/testing/COVERAGE_ACHIEVEMENT.md)
- File too long? → See file size limits in [docs/architecture/PROJECT_RULES.md](docs/architecture/PROJECT_RULES.md)
- Tests not running? → Verify setup with [docs/setup/QUICKSTART.md](docs/setup/QUICKSTART.md)

### Development Setup
- Step-by-step: [docs/setup/QUICKSTART.md](docs/setup/QUICKSTART.md)
- First-time setup: `make setup`
- Start dev servers: `make dev`

---

## 🚀 Next Steps

### For New Contributors
1. Read [README.md](README.md)
2. Follow [docs/setup/QUICKSTART.md](docs/setup/QUICKSTART.md)
3. Review [docs/architecture/PROJECT_RULES.md](docs/architecture/PROJECT_RULES.md)
4. Check [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
5. Look at relevant feature guide in [FEATURES.md](FEATURES.md)

### For Feature Development
1. Understand the feature in [FEATURES.md](FEATURES.md)
2. Review architecture in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
3. Check existing related code
4. Follow patterns from [docs/architecture/PROJECT_RULES.md](docs/architecture/PROJECT_RULES.md)
5. Run `make pr-check` before PR

### For Deployment
1. Read [docs/setup/DEPLOYMENT.md](docs/setup/DEPLOYMENT.md)
2. Configure `.env` properly
3. Set strong `SECRET_KEY`
4. Run migrations
5. Start with systemd/supervisor

---

## 📞 Documentation Maintenance

Documentation was last comprehensively updated on **2026-04-12** when the Tax Hub feature was completed.

Key files updated:
- **README.md** — Added Tax Hub features
- **CLAUDE.md** — Updated status and activity timestamp
- **STATE.md** — Documented recent changes
- **QUICKSTART.md** — Updated feature list
- **CHANGELOG.md** — Created with full version history
- **FEATURES.md** — Created with comprehensive feature guide
- **DEVELOPMENT.md** — Created with detailed architecture guide
- **This file (DOCUMENTATION.md)** — Created as navigation index

---

## 📌 Key Links

**Project Files:**
- Source code: `backend/app/` and `frontend/src/`
- Tests: `backend/tests/` and `frontend/tests/`
- Migrations: `backend/alembic/versions/`
- Configuration: `.env.dev.example`, `.env.test.example`
- Build tasks: `Makefile`

**External Resources:**
- FastAPI docs: https://fastapi.tiangolo.com/
- Vue 3 docs: https://vuejs.org/
- PostgreSQL docs: https://www.postgresql.org/docs/
- SQLAlchemy: https://docs.sqlalchemy.org/
- pytest: https://docs.pytest.org/

---

*Last updated: 2026-04-12*
*Next review: Before Phase 7 implementation (Household Sharing)*
