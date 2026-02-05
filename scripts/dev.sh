#!/bin/bash

# WealthTrack Development Environment Startup Script
# Starts database, backend API, and frontend dev server (all in background)

# Get the root directory (parent of scripts/)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

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
docker compose up -d db > /dev/null 2>&1
sleep 2
echo -e "${GREEN}✓ Database running on port 5433${NC}"
echo ""

# Start backend
echo -e "${BLUE}2/3 Starting FastAPI backend...${NC}"
cd "$ROOT_DIR/backend"
nohup python -m uvicorn app.main:app --reload --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend running on http://localhost:8000${NC}"
echo "  (PID: $BACKEND_PID, logs: tail -f /tmp/backend.log)"
echo ""

# Start frontend
echo -e "${BLUE}3/3 Starting Vite frontend dev server...${NC}"
cd "$ROOT_DIR/frontend"
nohup npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend running on http://localhost:3000${NC}"
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
echo "  🔌 API:       http://localhost:8000 (FastAPI)"
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
