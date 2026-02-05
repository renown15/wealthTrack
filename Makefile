# WealthTrack Development Makefile
# Provides convenient commands for common development tasks

.PHONY: help setup dev backend-dev frontend-dev test lint type-check format clean docker-up docker-down

help:
	@echo "WealthTrack Development Commands"
	@echo "=================================="
	@echo ""
	@echo "Setup and Environment:"
	@echo "  make setup              - Full development environment setup"
	@echo "  make docker-up          - Start PostgreSQL container"
	@echo "  make docker-down        - Stop PostgreSQL container"
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

# Setup
setup:
	@echo "Setting up development environment..."
	@bash scripts/setup-dev.sh

docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d db
	@echo "PostgreSQL is running on localhost:5433"

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down

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
	@if docker-compose ps db | grep -q "healthy"; then \
		echo "✅ Database is already running"; \
	else \
		echo "Starting database..."; \
		docker-compose up -d db; \
		echo "Waiting for database to be ready (10 seconds)..."; \
		sleep 10; \
		if docker-compose ps db | grep -q "healthy"; then \
			echo "✅ Database started successfully"; \
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

pr-check: check-db lint type-check test-backend test-frontend check-backend
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
