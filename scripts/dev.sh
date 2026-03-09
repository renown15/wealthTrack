#!/bin/bash

# WealthTrack Development Environment Startup Script
# Starts database, backend API, and frontend dev server (all in background)

# Get the root directory (parent of scripts/)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load development environment overrides if they exist so docker-compose uses curated ports
if [ -f "$ROOT_DIR/.env.dev" ]; then
	set -a
	# shellcheck disable=SC1090
	source "$ROOT_DIR/.env.dev"
	set +a
fi

# Kill previous backend/frontend processes (if any) so new run can bind the target ports
PID_FILE="/tmp/wealthtrack.pids"
if [ -f "$PID_FILE" ]; then
	while IFS= read -r pid; do
		if [ -n "$pid" ]; then
			kill "$pid" >/dev/null 2>&1 || true
		fi
	done < "$PID_FILE"
	rm -f "$PID_FILE"
fi

echo "🚀 Starting WealthTrack Development Environment"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Start database
echo -e "${BLUE}1/3 Starting PostgreSQL database...${NC}"
cd "$ROOT_DIR"
docker compose up -d --force-recreate db > /dev/null 2>&1
sleep 2
echo -e "${GREEN}✓ Database running on port ${DB_PORT:-5433}${NC}"
echo ""

# Terminate any existing backend before starting new one so ports are free
pkill -f "uvicorn app.main:app" >/dev/null 2>&1 || true
lsof -ti :"${BACKEND_PORT:-8000}" 2>/dev/null | xargs kill -9 2>/dev/null || true

# Start backend
echo -e "${BLUE}2/3 Starting FastAPI backend...${NC}"
cd "$ROOT_DIR/backend"
export DATABASE_URL="postgresql+asyncpg://${DB_USER:-wealthtrack}:${DB_PASSWORD:-wealthtrack_dev_password}@localhost:${DB_PORT:-5433}/${DB_NAME:-wealthtrack}"
export ENVIRONMENT="${ENVIRONMENT:-development}"
export SECRET_KEY="${SECRET_KEY:-dev-secret-key-change-in-production}"
# Activate virtual environment if present
if [ -f "$ROOT_DIR/backend/venv/bin/activate" ]; then
    # shellcheck disable=SC1091
    source "$ROOT_DIR/backend/venv/bin/activate"
fi
nohup python -m uvicorn app.main:app --reload --port "${BACKEND_PORT:-8000}" > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend running on http://localhost:${BACKEND_PORT:-8000}${NC}"
echo "  (PID: $BACKEND_PID, logs: tail -f /tmp/backend.log)"
echo ""

# Stop any containerized frontend preview server so it does not shadow the dev server
echo -e "${BLUE}3/3 Stopping containerized frontend preview (if running)...${NC}"
cd "$ROOT_DIR"
docker compose stop frontend > /dev/null 2>&1 || true
echo -e "${GREEN}✓ Containerized frontend stopped (if it was running)${NC}"
echo ""

# Terminate any existing frontend dev server
pkill -f "npm run dev" >/dev/null 2>&1 || true
lsof -ti :"${FRONTEND_PORT:-3001}" 2>/dev/null | xargs kill -9 2>/dev/null || true

# Start frontend dev server
echo -e "${BLUE}4/4 Starting Vite frontend dev server locally...${NC}"
cd "$ROOT_DIR/frontend"
# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "  Installing frontend dependencies..."
    npm install --silent
fi
VITE_API_URL="${VITE_API_URL:-http://localhost:${BACKEND_PORT:-8000}}" nohup npm run dev -- --host 0.0.0.0 --port "${FRONTEND_PORT:-3001}" > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend dev server running on http://localhost:${FRONTEND_PORT:-3001}${NC}"
echo "  (PID: $FRONTEND_PID, logs: tail -f /tmp/frontend.log)"
echo ""

# Save PIDs for cleanup
echo "$BACKEND_PID" > /tmp/wealthtrack.pids
echo "$FRONTEND_PID" >> /tmp/wealthtrack.pids

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Development environment ready!${NC}"
echo ""
echo "Services:"
echo "  📊 Database:  localhost:${DB_PORT:-5433} (PostgreSQL)"
echo "  🔌 API:       http://localhost:${BACKEND_PORT:-8000} (FastAPI)"
echo "  🎨 Frontend:  http://localhost:${FRONTEND_PORT:-3001} (Vite)"
echo ""
echo "View logs:"
echo "  Backend:  tail -f /tmp/backend.log"
echo "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID     # Stop backend"
echo "  kill $FRONTEND_PID    # Stop frontend"
echo "  docker compose down   # Stop database"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
