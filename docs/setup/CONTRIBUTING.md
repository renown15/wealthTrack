# Contributing to WealthTrack

Welcome to WealthTrack! This guide will help you set up your development environment and follow our branching and CI/CD workflow.

## Table of Contents
- [Development Setup](#development-setup)
- [Feature Branch Workflow](#feature-branch-workflow)
- [Code Quality Standards](#code-quality-standards)
- [Running Tests Locally](#running-tests-locally)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Pull Request Process](#pull-request-process)

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (for database)
- Git

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Environment Variables** (create `.env` file):
```
DATABASE_URL=postgresql+asyncpg://wealthtrack:wealthtrack@localhost:5432/wealthtrack
SECRET_KEY=your-secret-key-here
ENVIRONMENT=development
```

**Start Database**:
```bash
docker-compose up -d postgres
```

**Run Backend**:
```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm ci
npm run dev
```

## Feature Branch Workflow

### Branch Naming Conventions

Use the following prefixes for your branches:

- **`feature/`** - New features: `feature/user-dashboard`
- **`bugfix/`** - Bug fixes: `bugfix/login-validation`
- **`hotfix/`** - Critical production fixes: `hotfix/security-patch`
- **`refactor/`** - Code refactoring: `refactor/api-client`
- **`docs/`** - Documentation: `docs/api-guide`

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create and checkout new feature branch
git checkout -b feature/your-feature-name

# Push to remote
git push -u origin feature/your-feature-name
```

### Local Workflow

1. Make your changes
2. Run tests and linting (see below)
3. Commit with meaningful messages:
   ```bash
   git commit -m "feat: add user authentication"
   # Or: "fix:", "docs:", "refactor:", "test:", "chore:"
   ```
4. Push changes:
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Quality Standards

### Minimum Coverage Requirements
- **Frontend**: 90% line coverage
- **Backend**: 85% line coverage
- **All**: TypeScript/Python type checking must pass
- **All**: Linting must have 0 warnings

### Frontend - TypeScript & ESLint

```bash
cd frontend

# Type checking
npm run type-check

# Linting (with auto-fix)
npm run lint -- --fix

# Tests with coverage
npm run test:coverage
```

**TypeScript Configuration**: See `tsconfig.json`
**ESLint Configuration**: See `.eslintrc.json`

### Backend - Ruff & MyPy

```bash
cd backend

# Linting (with auto-fix)
ruff check app/ tests/ --fix

# Type checking
mypy app/ --config-file mypy.ini

# Tests with coverage
pytest --cov=app --cov-report=term
```

**Ruff Configuration**: See `ruff.toml`
**MyPy Configuration**: See `mypy.ini`

## Running Tests Locally

### Frontend

```bash
cd frontend

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- tests/LoginController.test.ts

# Watch mode
npm run test -- --watch
```

### Backend

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=term

# Run specific test file
pytest tests/test_auth_service.py

# Watch mode (requires pytest-watch)
ptw
```

## Pre-commit Hooks

Set up pre-commit hooks to automatically run linting and type checks before committing.

### Installation

```bash
# Install pre-commit tool
pip install pre-commit

# Create hook file
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
set -e

echo "Running pre-commit checks..."

# Frontend checks
if git diff --cached --name-only | grep -q "^frontend/"; then
  echo "🔍 Checking frontend..."
  cd frontend
  npm run type-check || exit 1
  npm run lint || exit 1
  npm run test:coverage || exit 1
  cd ..
fi

# Backend checks
if git diff --cached --name-only | grep -q "^backend/"; then
  echo "🔍 Checking backend..."
  cd backend
  ruff check app/ tests/ || exit 1
  mypy app/ --config-file mypy.ini || exit 1
  pytest --cov=app --cov-report=term || exit 1
  cd ..
fi

echo "✅ Pre-commit checks passed!"
EOF

# Make executable
chmod +x .git/hooks/pre-commit
```

## Pull Request Process

### Before Creating a PR

1. **Pull latest from develop**:
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

2. **Run all checks locally**:
   ```bash
   # Frontend
   cd frontend
   npm run type-check && npm run lint && npm run test:coverage
   
   # Backend
   cd backend
   ruff check app/ tests/ && mypy app/ && pytest --cov=app
   ```

3. **Ensure tests pass**:
   - Frontend: 90%+ coverage required
   - Backend: 85%+ coverage required

### Creating a PR

1. Push your branch to GitHub
2. Open a Pull Request against `develop` (or `main` for hotfixes)
3. Fill in the PR template with:
   - Description of changes
   - Related issue numbers
   - Testing done
   - Screenshots/demos (if applicable)

### PR Requirements

Your PR must meet these criteria to be merged:

- ✅ All GitHub Actions checks pass
- ✅ Code coverage meets minimum thresholds
- ✅ At least one code review approval
- ✅ No merge conflicts
- ✅ Branch is up-to-date with base branch
- ✅ Commit history is clean and meaningful

### Code Review

Please be respectful in reviews. Reviewers will check:

- Code quality and standards compliance
- Test coverage
- Type safety
- Performance implications
- Documentation completeness

## CI/CD Pipeline

The GitHub Actions workflow automatically runs on every push and PR:

### Jobs (Sequential)

1. **Backend Checks** (parallel):
   - Ruff linting
   - MyPy type checking
   - Pytest with coverage

2. **Frontend Checks** (parallel):
   - ESLint linting
   - TypeScript type checking
   - Vitest with coverage

3. **Docker Build** (after both checks pass):
   - Build backend image
   - Build frontend image
   - Push to registry (main branch only)

4. **Deploy** (main branch only):
   - Deploy to production

### Viewing CI Results

- Check the "Checks" tab on your PR
- Click on failed jobs to see detailed logs
- Fix issues locally and push again

## Common Issues

### Frontend Linting Issues

```bash
cd frontend

# Auto-fix most issues
npm run lint -- --fix

# Check what remains
npm run lint
```

### Backend Linting Issues

```bash
cd backend

# Auto-fix most issues
ruff check app/ tests/ --fix

# Check what remains
ruff check app/ tests/
```

### Type Checking Failures

**Frontend**:
```bash
cd frontend
npm run type-check
```

**Backend**:
```bash
cd backend
mypy app/ --config-file mypy.ini
```

### Coverage Not Meeting Threshold

Add more test cases to ensure adequate coverage. Check the coverage report:

**Frontend**:
```bash
cd frontend
npm run test:coverage
# Open: htmlcov/index.html
```

**Backend**:
```bash
cd backend
pytest --cov=app --cov-report=html
# Open: htmlcov/index.html
```

## Questions or Issues?

- Check existing issues on GitHub
- Create a new issue with detailed description
- Reach out to the team

Thank you for contributing to WealthTrack! 🚀
