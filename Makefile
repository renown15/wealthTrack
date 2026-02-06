# WealthTrack Development Makefile
# Provides convenient commands for common development tasks

.PHONY: help setup dev backend-dev frontend-dev test lint type-check format clean docker-up docker-down build-frontend

help:
	@echo "WealthTrack Development Commands"
	@echo "=================================="
	@echo ""
	@echo "Setup and Environment:"
	@echo "  make setup              - Full development environment setup"
	@echo "  make docker-up          - Start development containers (db + api)"
	@echo "  make docker-down        - Stop development containers"
	@echo ""
	@echo "Development:"
	@echo "  make backend-dev        - Start backend development server"
	@echo "  make frontend-dev       - Start frontend development server"
	@echo "  make dev                - Start both backend and frontend (requires 2 terminals)"
	@echo ""
	@echo "Testing:"
	@echo "  make test               - Run all tests (includes backend startup)"
	@echo "  make test-backend       - Run backend tests with coverage"
	@echo "  make test-frontend      - Run frontend tests with coverage (auto-starts backend)"
	@echo "  make test-e2e           - Run E2E tests with isolated test containers"
	@echo "  make test-e2e:ui        - Run E2E tests with interactive UI"
	@echo "  make test-e2e:headed    - Run E2E tests with visible browser"
	@echo "  make test-watch         - Run tests in watch mode"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint               - Run linters (ruff + eslint)"
	@echo "  make lint-fix           - Auto-fix linting issues"
	@echo "  make type-check         - Run type checkers (mypy + tsc)"
	@echo "  make format             - Format code (ruff + prettier)"
	@echo ""
	@echo "Database:"
	@echo "  make migrate            - Run database migrations"
	@echo "  make migrate-create     - Create new migration"
	@echo ""
	@echo "Utilities:"
	@echo "  make check-backend      - Check if backend is running (starts if not)"
	@echo "  make check-db           - Check if database is running (starts if not)"
	@echo "  make clean              - Clean up build artifacts and cache"
	@echo "  make pr-check           - Run all checks before PR (auto-manages servers)"
	@echo ""
	@echo "Docker Environments (.env files):"
	@echo "  Development:  docker-compose --env-file .env.dev up -d"
	@echo "  Test:         docker-compose --env-file .env.test --profile test up -d"
	@echo "  Production:   docker-compose --env-file .env.prod up -d"
	@echo ""

# Setup
setup:
	@echo "Setting up development environment..."
	@bash scripts/setup-dev.sh

docker-up:
	@echo "Starting Docker containers for development..."
	@echo "Loading environment from .env.dev"
	docker-compose --env-file .env.dev --profile dev up -d db backend
	@echo "✅ Database and API running on: localhost:5433 and localhost:8000"

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose --env-file .env.dev -f docker-compose.yml down


# Development Servers
backend-dev:
	@echo "Starting backend development server..."
	cd backend && source venv/bin/activate && uvicorn app.main:app --reload

frontend-dev:
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

dev:
	@echo "To run both servers, open two terminals:"
	@echo ""
	@echo "Terminal 1 (Backend):"
	@echo "  make backend-dev"
	@echo ""
	@echo "Terminal 2 (Frontend):"
	@echo "  make frontend-dev"
	@echo ""

# Testing
test: check-db test-backend test-frontend
	@echo "✅ All tests passed!"

check-db:
	@echo "Checking if database is running..."
	@if docker-compose --env-file .env.dev ps db 2>/dev/null | grep -q "Up"; then \
		echo "✅ Database is already running on localhost:5433"; \
	else \
		echo "Starting database..."; \
		docker-compose --env-file .env.dev up -d db; \
		echo "Waiting for database to be ready (10 seconds)..."; \
		sleep 10; \
		if docker-compose --env-file .env.dev ps db 2>/dev/null | grep -q "Up"; then \
			echo "✅ Database started successfully on localhost:5433"; \
		else \
			echo "⚠️  Database may still be starting, continuing with tests..."; \
		fi \
	fi


test-backend: check-db
	@echo "Running backend tests..."
	cd backend && python -m pytest --cov=app --cov-report=term

test-frontend: check-backend
	@echo "Running frontend tests..."
	cd frontend && npm run test:coverage

test-watch:
	@echo "Running tests in watch mode..."
	cd frontend && npm run test -- --watch

test-e2e:
	@echo "============================================"
	@echo "  E2E Test Suite (Isolated Docker)"
	@echo "============================================"
	@echo ""
	@echo "[1/4] Checking dependencies..."
	cd frontend && npm install --save-dev @playwright/test pg 2>&1 | grep -E "(added|up to date|vulnerabilities)" || true
	@echo ""
	bash scripts/e2e-setup.sh || (echo "Setup failed"; bash scripts/e2e-teardown.sh; exit 1)
	@echo ""
	@echo "[3/4] Running E2E tests..."
	cd frontend && npm run test:e2e; TEST_RESULT=$$?; bash scripts/e2e-teardown.sh; exit $$TEST_RESULT

test-e2e-ui:
	@echo "============================================"
	@echo "  E2E Tests (Interactive UI Mode)"
	@echo "============================================"
	cd frontend && npm install --save-dev @playwright/test pg >/dev/null 2>&1
	bash scripts/e2e-setup.sh || (bash scripts/e2e-teardown.sh; exit 1)
	@echo ""
	@echo "Starting Playwright UI..."
	@echo ""
	cd frontend && npm run test:e2e:ui; TEST_RESULT=$$?; bash scripts/e2e-teardown.sh; exit $$TEST_RESULT

test-e2e-headed:
	@echo "============================================"
	@echo "  E2E Tests (Visible Browser)"
	@echo "============================================"
	cd frontend && npm install --save-dev @playwright/test pg >/dev/null 2>&1
	bash scripts/e2e-setup.sh || (bash scripts/e2e-teardown.sh; exit 1)
	@echo ""
	@echo "Starting tests in headed mode..."
	@echo ""
	cd frontend && npm run test:e2e:headed; TEST_RESULT=$$?; bash scripts/e2e-teardown.sh; exit $$TEST_RESULT

test-e2e-debug:
	@echo "============================================"
	@echo "  E2E Tests (Debug Mode - Step Through)"
	@echo "============================================"
	cd frontend && npm install --save-dev @playwright/test pg >/dev/null 2>&1
	bash scripts/e2e-setup.sh || (bash scripts/e2e-teardown.sh; exit 1)
	@echo ""
	@echo "Starting debugger..."
	@echo ""
	cd frontend && npm run test:e2e:debug; TEST_RESULT=$$?; bash scripts/e2e-teardown.sh; exit $$TEST_RESULT

check-backend:
	@echo "Checking if backend is running..."
	@if curl -s http://localhost:8000/docs > /dev/null 2>&1; then \
		echo "✅ Backend is already running"; \
	else \
		echo "Starting backend server in background..."; \
		cd backend && python -m uvicorn app.main:app --reload --port 8000 > /tmp/backend.log 2>&1 & \
		echo "Waiting for backend to start (retrying for 30 seconds)..."; \
		for i in 1 2 3 4 5 6; do \
			sleep 5; \
			if curl -s http://localhost:8000/docs > /dev/null 2>&1; then \
				echo "✅ Backend started successfully"; \
				exit 0; \
			fi \
		done; \
		echo "⚠️  Backend startup timeout - continuing anyway"; \
	fi

# Code Quality
lint: lint-backend lint-frontend
	@echo "✅ All linting passed!"

lint-backend:
	@echo "Linting backend code (ruff)..."
	cd backend && ruff check app/
	@echo "Linting backend code (pylint)..."
	cd backend && pylint app/ --rcfile=.pylintrc

lint-frontend:
	@echo "Linting frontend code..."
	cd frontend && npm run lint

lint-fix: lint-fix-backend lint-fix-frontend
	@echo "✅ Auto-fixed linting issues!"

lint-fix-backend:
	@echo "Auto-fixing backend linting issues..."
	cd backend && ruff check app/ --fix

lint-fix-frontend:
	@echo "Auto-fixing frontend linting issues..."
	cd frontend && npm run lint -- --fix

type-check: type-check-backend type-check-frontend
	@echo "✅ Type checking passed!"

type-check-backend:
	@echo "Type checking backend code..."
	cd backend && mypy app/ --config-file mypy.ini

type-check-frontend:
	@echo "Type checking frontend code..."
	cd frontend && npx tsc --noEmit --project tsconfig.src.json

# Build frontend for production - runs tsc type checking + vite build
build-frontend:
	@echo "Building frontend..."
	@echo "Running TypeScript compiler and Vite build..."
	cd frontend && npm run build
	@echo "✅ Frontend build complete!"

format: format-backend format-frontend
	@echo "✅ Code formatted!"

format-backend:
	@echo "Formatting backend code..."
	cd backend && ruff format app/ tests/

format-frontend:
	@echo "Formatting frontend code..."
	cd frontend && npx prettier --write "src/**/*.{ts,tsx,css}"

# Database
migrate:
	@echo "Running database migrations..."
	cd backend && alembic upgrade head

migrate-create:
	@echo "Creating new migration..."
	@read -p "Enter migration name: " name; \
	cd backend && alembic revision --autogenerate -m "$$name"

# Utilities
clean:
	@echo "Cleaning up build artifacts..."
	@pkill -f "uvicorn app.main:app --reload" || true
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -not -path "./.git/*" -prune -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name dist -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name htmlcov -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name coverage -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Cleanup complete!"

pr-check: check-db lint type-check test-backend test-frontend build-frontend check-backend
	@echo ""
	@echo "✅ All PR checks passed! Ready to create a pull request."

# CI/CD Simulation (simulate what GitHub Actions will do)
ci-backend:
	@echo "=== Simulating Backend CI ==="
	cd backend && ruff check app/ tests/
	cd backend && mypy app/ --config-file mypy.ini
	cd backend && pytest --cov=app --cov-report=term

ci-frontend:
	@echo "=== Simulating Frontend CI ==="
	cd frontend && npm run lint
	cd frontend && npm run type-check
	cd frontend && npm run test:coverage

ci: ci-backend ci-frontend
	@echo ""
	@echo "✅ All CI checks passed!"
