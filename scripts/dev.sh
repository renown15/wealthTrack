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
echo -e "${GREEN}✓ Database running on port 5433${NC}"
echo ""

# Terminate any existing backend before starting new one so ports are free
pkill -f "uvicorn app.main:app" >/dev/null 2>&1 || true

# Start backend
echo -e "${BLUE}2/3 Starting FastAPI backend...${NC}"
cd "$ROOT_DIR/backend"
export DATABASE_URL="postgresql+asyncpg://wealthtrack:wealthtrack_dev_password@localhost:5433/wealthtrack"
export ENVIRONMENT="development"
export SECRET_KEY="dev-secret-key-change-in-production"
nohup python -m uvicorn app.main:app --reload --port 8001 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend running on http://localhost:8001${NC}"
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

# Start frontend dev server
echo -e "${BLUE}4/4 Starting Vite frontend dev server locally...${NC}"
cd "$ROOT_DIR/frontend"
VITE_API_URL="http://localhost:8001" nohup npm run dev -- --host 0.0.0.0 --port 3000 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend dev server running on http://localhost:3000${NC}"
echo "  (PID: $FRONTEND_PID, logs: tail -f /tmp/frontend.log)"
echo ""

# Save PIDs for cleanup
echo "$BACKEND_PID" > /tmp/wealthtrack.pids
echo "$FRONTEND_PID" >> /tmp/wealthtrack.pids

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Development environment ready!${NC}"
echo ""
echo "Services:"
echo "  📊 Database:  localhost:5433 (PostgreSQL)"
echo "  🔌 API:       http://localhost:8001 (FastAPI)"
echo "  🎨 Frontend:  http://localhost:3000 (Vite)"
echo ""
echo "View logs:"
echo "  Backend:  tail -f /tmp/backend.log"
echo "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID     # Stop backend"
echo "  kill $FRONTEND_PID    # Stop frontend"
echo "  docker-compose down   # Stop database"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
