# WealthTrack Development Makefile
# Provides convenient commands for common development tasks

.PHONY: help setup dev backend-dev frontend-dev local-prod stop-dev stop-prod test lint type-check format clean docker-up docker-down build-frontend tail-backend tail-frontend pi-setup deploy-pi deploy-pi-code sync-db-to-pi deploy-windows dump-db

help:
	@echo "WealthTrack Development Commands"
	@echo "=================================="
	@echo ""
	@echo "Setup and Environment:"
	@echo "  make setup              - Full development environment setup"
	@echo "  make docker-up          - Start development containers (db + api)"
	@echo "  make docker-down        - Stop development containers"
	@echo "  make seed-db            - Seed database with reference data (all environments)"
	@echo ""
	@echo "Development:"
	@echo "  make backend-dev        - Start backend development server"
	@echo "  make frontend-dev       - Start frontend development server"
	@echo "  make dev                - Start all services in background (DB + backend + frontend)"
	@echo "  make stop-dev           - Stop dev backend and frontend (leaves database running)"
	@echo "  make stop-prod          - Stop local-prod frontend container (leaves database running)"
	@echo "  make local-prod         - Build and run frontend (nginx) locally against existing backend"
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
	@echo "  make dump-db            - Dump dev database to cloud-replicated location (iCloud/Dropbox)"
	@echo ""
	@echo "Utilities:"
	@echo "  make check-backend      - Check if backend is running (starts if not)"
	@echo "  make check-db           - Check if database is running (starts if not)"
	@echo "  make tail-backend       - Tail backend server logs"
	@echo "  make tail-frontend      - Tail frontend development server logs"
	@echo "  make clean              - Clean up build artifacts and cache"
	@echo "  make pr-check           - Run all checks before PR (auto-manages servers)"
	@echo ""
	@echo "Raspberry Pi Deployment:"
	@echo "  make pi-setup           - First-time Pi setup (SSH + rsync + env)"
	@echo "  make deploy-pi          - Deploy/update to Pi (rsync + build + migrate + seed)"
	@echo "  make deploy-pi-code     - Deploy code only to Pi (no DB changes)"
	@echo "  make sync-db-to-pi      - Dump local DB and restore to Pi"
	@echo "  make deploy-windows     - Deploy/update to KATE-SURFACE (rsync + build + migrate + seed)"
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
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev --profile dev up -d
	@echo "✅ DB, API, and frontend running on: localhost:5433, localhost:8000, localhost:3001"

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose --env-file .env.dev -f docker-compose.yml down

seed-db:
	@echo "Seeding database with all reference data..."
	@cd backend && source venv/bin/activate && cd .. && python scripts/seed-db.py
	@echo "✅ Reference data seeded"

dump-db:
	@if [ ! -f .env.dev ]; then echo "❌ .env.dev not found"; exit 1; fi
	@. ./.env.dev && \
	TIMESTAMP=$$(date +%Y%m%d_%H%M%S) && \
	DUMP_FILE="wealthtrack_db_$$TIMESTAMP.pgdump" && \
	CLOUD_DIR="" && \
	if [ -d "$$HOME/Library/CloudStorage/Dropbox-" ]; then \
		CLOUD_DIR=$$(ls -dt $$HOME/Library/CloudStorage/Dropbox-* | head -n1); \
		BACKUP_DIR="$$CLOUD_DIR/WealthTrack-Backups"; \
	elif [ -d "$$HOME/Dropbox" ]; then \
		BACKUP_DIR="$$HOME/Dropbox/WealthTrack-Backups"; \
	elif [ -d "$$HOME/Library/CloudStorage" ]; then \
		BACKUP_DIR="$$HOME/Library/CloudStorage/iCloud~com~apple~CloudDocs/WealthTrack-Backups"; \
	elif [ -d "$$HOME/OneDrive" ]; then \
		BACKUP_DIR="$$HOME/OneDrive/WealthTrack-Backups"; \
	elif [ -d "$$HOME/Google Drive" ]; then \
		BACKUP_DIR="$$HOME/Google Drive/WealthTrack-Backups"; \
	else \
		BACKUP_DIR="$$HOME/.wealthtrack-backups"; \
		echo "⚠️  No cloud storage detected, using local fallback: $$BACKUP_DIR"; \
	fi && \
	mkdir -p "$$BACKUP_DIR" && \
	echo "📦 Dumping dev database ($$DB_NAME on port $$DB_PORT) to $$BACKUP_DIR/$$DUMP_FILE..." && \
	docker compose --env-file .env.dev exec -T db pg_dump -U $$DB_USER -d $$DB_NAME -Fc -v > "$$BACKUP_DIR/$$DUMP_FILE" 2>&1 && \
	DUMP_SIZE=$$(du -h "$$BACKUP_DIR/$$DUMP_FILE" | cut -f1) && \
	echo "✅ Database dumped successfully ($$DUMP_SIZE)" && \
	echo "📍 Location: $$BACKUP_DIR/$$DUMP_FILE" && \
	echo "☁️  File will sync to cloud automatically" && \
	echo "" && \
	echo "To restore this dump:" && \
	echo "  docker compose --env-file .env.dev exec -T db pg_restore --no-owner --no-privileges -U $$DB_USER -d $$DB_NAME < $$BACKUP_DIR/$$DUMP_FILE"

# Raspberry Pi Deployment
PI_HOST ?= raspberrypi.local
PI_USER ?= marklewis
PI_DIR  ?= ~/wealthTrack

pi-setup:
	@echo "Checking SSH connection to $(PI_USER)@$(PI_HOST)..."
	@ssh $(PI_USER)@$(PI_HOST) "echo '✅ SSH OK'"
	@if [ ! -f .env.pi ]; then \
		echo ""; \
		echo "Next: copy .env.pi.example to .env.pi and fill in values, then run 'make deploy-pi'"; \
	else \
		echo "Run 'make deploy-pi' to deploy."; \
	fi

deploy-pi:
	@if [ ! -f .env.pi ]; then \
		echo "❌ .env.pi not found — copy .env.pi.example and fill in values first"; \
		exit 1; \
	fi
	@echo "Syncing code to $(PI_USER)@$(PI_HOST):$(PI_DIR)..."
	@rsync -av --exclude='.git' --exclude='node_modules' --exclude='backend/venv' \
		--exclude='__pycache__' --exclude='*.pyc' --exclude='.env.*' \
		--exclude='htmlcov' --exclude='.pytest_cache' --exclude='.mypy_cache' \
		. $(PI_USER)@$(PI_HOST):$(PI_DIR)/
	@echo "Copying .env.pi..."
	@scp .env.pi $(PI_USER)@$(PI_HOST):$(PI_DIR)/.env.pi
	@echo "Building and starting containers (first build takes a few minutes)..."
	@ssh $(PI_USER)@$(PI_HOST) "cd $(PI_DIR) && docker compose --env-file .env.pi --profile prod up -d --build"
	@echo "Running migrations..."
	@ssh $(PI_USER)@$(PI_HOST) "cd $(PI_DIR) && docker compose --env-file .env.pi --profile prod exec -T backend alembic upgrade head"
	@echo "Seeding reference data..."
	@ssh $(PI_USER)@$(PI_HOST) "cd $(PI_DIR) && docker compose --env-file .env.pi --profile prod exec -T backend python seed.py"
	@echo "✅ Deployed to http://$(PI_HOST):3000"

deploy-pi-code:
	@if [ ! -f .env.pi ]; then \
		echo "❌ .env.pi not found"; \
		exit 1; \
	fi
	@echo "Syncing code to $(PI_USER)@$(PI_HOST):$(PI_DIR)..."
	@rsync -av --exclude='.git' --exclude='node_modules' --exclude='backend/venv' \
		--exclude='__pycache__' --exclude='*.pyc' --exclude='.env.*' \
		--exclude='htmlcov' --exclude='.pytest_cache' --exclude='.mypy_cache' \
		. $(PI_USER)@$(PI_HOST):$(PI_DIR)/
	@echo "Copying .env.pi..."
	@scp .env.pi $(PI_USER)@$(PI_HOST):$(PI_DIR)/.env.pi
	@echo "Building and starting containers..."
	@ssh $(PI_USER)@$(PI_HOST) "cd $(PI_DIR) && docker compose --env-file .env.pi --profile prod up -d --build"
	@echo "✅ Deployed to http://$(PI_HOST):3000"

sync-db-to-pi:
	@if [ ! -f .env.dev ]; then echo "❌ .env.dev not found"; exit 1; fi
	@if [ ! -f .env.pi ]; then echo "❌ .env.pi not found"; exit 1; fi
	@. ./.env.dev && \
	echo "Dumping local database via Docker container (postgres:15)..." && \
	docker compose --env-file .env.dev exec -T db pg_dump -U $$DB_USER -d $$DB_NAME -Fc > /tmp/wealthtrack_dump.pgdump && \
	echo "Dump complete ($$(du -h /tmp/wealthtrack_dump.pgdump | cut -f1))" && \
	echo "Transferring to $(PI_USER)@$(PI_HOST)..." && \
	scp /tmp/wealthtrack_dump.pgdump $(PI_USER)@$(PI_HOST):/tmp/ && \
	echo "Dropping and recreating database on Pi..." && \
	ssh $(PI_USER)@$(PI_HOST) "cd ~/wealthTrack && \
		docker compose --env-file .env.pi --profile prod exec -T db psql -U postgres -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='wealthtrack' AND pid <> pg_backend_pid()\" && \
		docker compose --env-file .env.pi --profile prod exec -T db psql -U postgres -c \"DROP DATABASE IF EXISTS wealthtrack\" && \
		docker compose --env-file .env.pi --profile prod exec -T db psql -U postgres -c \"CREATE DATABASE wealthtrack OWNER wealthtrack\"" && \
	echo "Copying dump into Pi container..." && \
	ssh $(PI_USER)@$(PI_HOST) "cd ~/wealthTrack && \
		docker cp /tmp/wealthtrack_dump.pgdump \$$(docker compose --env-file .env.pi --profile prod ps -q db):/tmp/wealthtrack_dump.pgdump" && \
	echo "Restoring database on Pi..." && \
	ssh $(PI_USER)@$(PI_HOST) "cd ~/wealthTrack && \
		docker compose --env-file .env.pi --profile prod exec -T db pg_restore --no-owner --no-privileges -U wealthtrack -d wealthtrack /tmp/wealthtrack_dump.pgdump" && \
	echo "Cleaning up..." && \
	ssh $(PI_USER)@$(PI_HOST) "cd ~/wealthTrack && \
		docker compose --env-file .env.pi --profile prod exec -T db rm /tmp/wealthtrack_dump.pgdump && \
		rm /tmp/wealthtrack_dump.pgdump" && \
	rm /tmp/wealthtrack_dump.pgdump && \
	echo "✅ Database synced to Pi"

WINDOWS_HOST ?= KATE-SURFACE.local
WINDOWS_USER ?= user
WINDOWS_DIR  ?= C:/Users/user/wealthTrack
WINDOWS_PASS := $(shell grep '^WINDOWS_SSH_PASSWORD=' .env.windows 2>/dev/null | cut -d= -f2)
WINDOWS_SSH  := sshpass -p '$(WINDOWS_PASS)' ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no -o StrictHostKeyChecking=no
WINDOWS_SCP  := sshpass -p '$(WINDOWS_PASS)' scp -o PreferredAuthentications=password -o PubkeyAuthentication=no -o StrictHostKeyChecking=no

deploy-windows:
	@if [ ! -f .env.windows ]; then \
		echo "❌ .env.windows not found"; \
		exit 1; \
	fi
	@echo ""
	@echo "[1/7] Building backend image for linux/amd64 (this takes a few minutes)..."
	docker buildx build --platform linux/amd64 --progress=plain -t wealthtrack-backend --load ./backend
	@echo ""
	@echo "[2/7] Building frontend image for linux/amd64..."
	docker buildx build --platform linux/amd64 --progress=plain \
		--build-arg VITE_API_URL=http://KATE-SURFACE.local:8080 \
		-t wealthtrack-frontend --load ./frontend
	@echo ""
	@echo "[3/7] Saving images to /tmp (backend then frontend)..."
	docker save wealthtrack-backend | gzip > /tmp/wealthtrack-backend.tar.gz
	@echo "   backend saved"
	docker save wealthtrack-frontend | gzip > /tmp/wealthtrack-frontend.tar.gz
	@echo "   frontend saved"
	@echo ""
	@echo "[4/7] Transferring images to $(WINDOWS_USER)@$(WINDOWS_HOST)..."
	$(WINDOWS_SCP) /tmp/wealthtrack-backend.tar.gz $(WINDOWS_USER)@$(WINDOWS_HOST):wealthtrack-backend.tar.gz
	@echo "   backend transferred"
	$(WINDOWS_SCP) /tmp/wealthtrack-frontend.tar.gz $(WINDOWS_USER)@$(WINDOWS_HOST):wealthtrack-frontend.tar.gz
	@echo "   frontend transferred"
	@echo ""
	@echo "[5/7] Loading images on Windows and starting containers..."
	$(WINDOWS_SSH) $(WINDOWS_USER)@$(WINDOWS_HOST) "docker load -i wealthtrack-backend.tar.gz && docker load -i wealthtrack-frontend.tar.gz && del wealthtrack-backend.tar.gz && del wealthtrack-frontend.tar.gz"
	$(WINDOWS_SCP) docker-compose.yml $(WINDOWS_USER)@$(WINDOWS_HOST):$(WINDOWS_DIR)/docker-compose.yml
	$(WINDOWS_SCP) .env.windows $(WINDOWS_USER)@$(WINDOWS_HOST):$(WINDOWS_DIR)/.env.windows
	$(WINDOWS_SSH) $(WINDOWS_USER)@$(WINDOWS_HOST) "cd $(WINDOWS_DIR) && docker compose --env-file .env.windows --profile prod up -d"
	@echo ""
	@echo "[6/7] Running migrations..."
	$(WINDOWS_SSH) $(WINDOWS_USER)@$(WINDOWS_HOST) "cd $(WINDOWS_DIR) && docker compose --env-file .env.windows --profile prod exec -T backend alembic upgrade head"
	@echo ""
	@echo "[7/7] Seeding reference data..."
	$(WINDOWS_SSH) $(WINDOWS_USER)@$(WINDOWS_HOST) "cd $(WINDOWS_DIR) && docker compose --env-file .env.windows --profile prod exec -T backend python seed.py"
	@echo ""
	@echo "✅ Deployed to http://$(WINDOWS_HOST):3000"

ICLOUD_BACKUP_DIR = /Users/marklewis/Library/Mobile Documents/com~apple~CloudDocs/dev/wealthtrack-backups

backup-db:
	@mkdir -p "$(ICLOUD_BACKUP_DIR)"
	@BACKUP_FILE="$(ICLOUD_BACKUP_DIR)/wealthtrack_$$(date +%Y-%m-%d_%H%M%S).dump"; \
	pg_dump postgresql://postgres:postgres_password@localhost:5433/wealthtrack \
		--no-owner --no-acl -F c -f "$$BACKUP_FILE" && \
	echo "✅ Backup saved to $$BACKUP_FILE" && \
	ls -lh "$(ICLOUD_BACKUP_DIR)" | tail -5

restore-db:
	@LATEST=$$(ls -t "$(ICLOUD_BACKUP_DIR)"/wealthtrack_*.dump 2>/dev/null | head -1); \
	if [ -z "$$LATEST" ]; then echo "❌ No backup files found in $(ICLOUD_BACKUP_DIR)"; exit 1; fi; \
	echo "Restoring from $$LATEST ..."; \
	psql postgresql://postgres:postgres_password@localhost:5433/wealthtrack \
		-c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO wealthtrack;' && \
	pg_restore postgresql://postgres:postgres_password@localhost:5433/wealthtrack \
		--no-owner --no-acl -F c "$$LATEST" && \
	echo "✅ Restored from $$LATEST"


# Development Servers
backend-dev:
	@echo "Starting backend development server..."
	@echo "Cleaning up port 8000..."
	@lsof -ti :8000 2>/dev/null | xargs -r kill -9 || true
	@sleep 1
	cd backend && source venv/bin/activate && uvicorn app.main:app --reload

frontend-dev:
	@echo "Starting frontend development server..."
	@echo "Cleaning up port 3001..."
	@lsof -ti :3001 2>/dev/null | xargs -r kill -9 || true
	@sleep 1
	cd frontend && npm run dev

dev:
	@bash scripts/dev.sh

local-prod:
	@echo "Building and running production frontend (nginx) on port 3002..."
	@echo "✓ Make sure DB and backend are running (use 'make dev' or start separately)"
	docker-compose --env-file .env.local-prod build frontend
	docker-compose --env-file .env.local-prod up -d frontend
	@echo "✅ Frontend running at http://localhost:3002"

stop-dev:
	@echo "Stopping dev backend and frontend (leaving database running)..."
	@pkill -f "uvicorn app.main:app" >/dev/null 2>&1 || true
	@pkill -f "vite.*3001" >/dev/null 2>&1 || true
	@if [ -f /tmp/wealthtrack.pids ]; then \
		while IFS= read -r pid; do \
			[ -n "$$pid" ] && kill "$$pid" >/dev/null 2>&1 || true; \
		done < /tmp/wealthtrack.pids; \
		rm -f /tmp/wealthtrack.pids; \
	fi
	@. ./.env.dev 2>/dev/null; \
	docker stop "$${BACKEND_CONTAINER:-wealthtrack-backend-dev}" 2>/dev/null || true; \
	docker stop "$${FRONTEND_CONTAINER:-wealthtrack-frontend-dev}" 2>/dev/null || true
	@echo "✅ Dev backend and frontend stopped (database still running)"

stop-prod:
	@echo "Stopping local-prod frontend (leaving database running)..."
	@. ./.env.local-prod 2>/dev/null; \
	docker stop "$${FRONTEND_CONTAINER:-wealthtrack-frontend-prod}" 2>/dev/null || true
	@echo "✅ Local-prod frontend stopped"

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


start-test-db:
	@if pg_isready -h localhost -p 5434 -U postgres >/dev/null 2>&1; then \
		echo "✅ Test database already running on localhost:5434"; \
	else \
		echo "Starting test database on port 5434..."; \
		docker-compose --env-file .env.test --profile test up -d db; \
		RETRY=30; \
		while [ $$RETRY -gt 0 ]; do \
			if pg_isready -h localhost -p 5434 -U postgres >/dev/null 2>&1; then \
				echo "✅ Test database ready"; break; \
			fi; \
			RETRY=$$((RETRY-1)); sleep 1; \
		done; \
		[ $$RETRY -gt 0 ] || (echo "❌ Test database failed to start"; exit 1); \
	fi
	@cd backend && DATABASE_URL=$(PR_TEST_DB_URL) alembic upgrade head

test-backend: start-test-db
	@echo "Running backend tests..."
	cd backend && DATABASE_URL=$(PR_TEST_DB_URL) python -m pytest --cov=app --cov-report=term

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

# Tail Logs
tail-backend:
	@if [ -f /tmp/backend.log ]; then \
		echo "Tailing backend logs from /tmp/backend.log (Ctrl+C to stop)..."; \
		tail -f /tmp/backend.log; \
	else \
		echo "❌ Backend log file not found: /tmp/backend.log"; \
		echo "Backend may not be running. Start with: make check-backend or make dev"; \
		exit 1; \
	fi

tail-frontend:
	@if [ -f /tmp/frontend.log ]; then \
		echo "Tailing frontend logs from /tmp/frontend.log (Ctrl+C to stop)..."; \
		tail -f /tmp/frontend.log; \
	else \
		echo "❌ Frontend log file not found: /tmp/frontend.log"; \
		echo "Frontend may not be running. Start with: make frontend-dev or make dev"; \
		exit 1; \
	fi

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
	@. .env.dev && cd backend && DATABASE_URL="postgresql+asyncpg://$${DB_USER}:$${DB_PASSWORD}@localhost:$${DB_PORT}/$${DB_NAME}" alembic upgrade head

migrate-create:
	@echo "Creating new migration..."
	@read -p "Enter migration name: " name; \
	. .env.dev && cd backend && DATABASE_URL="postgresql+asyncpg://$${DB_USER}:$${DB_PASSWORD}@localhost:$${DB_PORT}/$${DB_NAME}" alembic revision --autogenerate -m "$$name"

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

PR_TEST_DB_URL=postgresql+asyncpg://postgres:test_postgres_password@localhost:5434/wealthtrack

pr-check:
	@bash -c ' \
		set -e; \
		TEST_DB_CONTAINER=$$(grep "^DB_CONTAINER=" .env.test 2>/dev/null | cut -d= -f2); \
		TEST_DB_CONTAINER=$${TEST_DB_CONTAINER:-wealthtrack-db-test}; \
		trap "docker stop $$TEST_DB_CONTAINER 2>/dev/null || true; docker rm $$TEST_DB_CONTAINER 2>/dev/null || true; docker volume rm wealthtrack_wealthtrack_test_pgdata 2>/dev/null || true" EXIT; \
		echo ""; \
		echo "╔════════════════════════════════════════════╗"; \
		echo "║  PR CHECK - Isolated Test Environment      ║"; \
		echo "╚════════════════════════════════════════════╝"; \
		echo ""; \
		echo "[1/6] Starting isolated test database (port 5434)..."; \
		docker-compose --env-file .env.test --profile test up -d db; \
		RETRY=30; \
		while [ $$RETRY -gt 0 ]; do \
			if pg_isready -h localhost -p 5434 -U postgres >/dev/null 2>&1; then \
				echo "   ✅ Test database ready"; break; \
			fi; \
			RETRY=$$((RETRY-1)); sleep 1; \
		done; \
		[ $$RETRY -gt 0 ] || (echo "   ❌ Test database failed to start"; exit 1); \
		echo ""; \
		echo "[2/6] Running migrations and seeding test database..."; \
		(cd backend && DATABASE_URL=$(PR_TEST_DB_URL) alembic upgrade head); \
		DATABASE_URL=$(PR_TEST_DB_URL) python scripts/seed-db.py; \
		echo "   ✅ Migrations applied and reference data seeded"; \
		echo ""; \
		echo "[3/6] Linting and type checking..."; \
		$(MAKE) lint type-check; \
		echo ""; \
		echo "[4/6] Running backend tests against test database..."; \
		(cd backend && DATABASE_URL=$(PR_TEST_DB_URL) python -m pytest --cov=app --cov-report=term --cov-report=json:/tmp/backend-cov.json); \
		echo ""; \
		echo "[5/6] Running frontend tests..."; \
		(cd frontend && npm run test:coverage); \
		echo ""; \
		echo "[6/6] Building frontend..."; \
		$(MAKE) build-frontend; \
		echo ""; \
		python3 scripts/show_coverage.py; \
		echo ""; \
		echo "╔════════════════════════════════════════════╗"; \
		echo "║  ✅ All PR checks passed!                  ║"; \
		echo "╚════════════════════════════════════════════╝"; \
		echo ""; \
	'

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
