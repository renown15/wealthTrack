#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  E2E TEST ENVIRONMENT CLEANUP              ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Step 1: Stop and remove Docker containers
echo "📍 Step 1: Stopping Docker containers..."
cd "$(dirname "$0")/.."
docker-compose --env-file .env.test --profile test down -v 2>/dev/null || true
if [ $? -eq 0 ]; then
  echo "   ✅ Containers stopped and volumes removed"
fi

# Step 2: Remove Playwright artifacts
echo "📍 Step 2: Removing Playwright artifacts..."
rm -rf frontend/playwright-report frontend/test-results
echo "   ✅ Playwright report and test results removed"

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  ✅ CLEANUP COMPLETE                       ║"
echo "╚════════════════════════════════════════════╝"
echo ""
