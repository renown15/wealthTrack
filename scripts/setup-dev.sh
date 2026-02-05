#!/bin/bash

# WealthTrack Development Setup Script
# This script sets up the development environment with all necessary tools

set -e

echo "🚀 WealthTrack Development Environment Setup"
echo "==========================================="
echo ""

# Check prerequisites
echo "✅ Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20 or higher."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Database will not start automatically."
    echo "    Install Docker to use the provided docker-compose setup."
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
NODE_VERSION=$(node --version | cut -d'v' -f2)

echo "Python: $PYTHON_VERSION"
echo "Node.js: $NODE_VERSION"
echo ""

# Backend Setup
echo "📦 Setting up Backend..."
echo "----------------------"

cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
DATABASE_URL=postgresql+asyncpg://wealthtrack:wealthtrack@localhost:5432/wealthtrack
SECRET_KEY=dev-secret-key-change-in-production
ENVIRONMENT=development
DEBUG=true
EOF
    echo "✅ Created .env file (please update SECRET_KEY)"
else
    echo "✅ .env file already exists"
fi

echo "✅ Backend setup complete"
echo ""

cd ..

# Frontend Setup
echo "📦 Setting up Frontend..."
echo "------------------------"

cd frontend

# Install dependencies
echo "Installing Node dependencies..."
npm ci

echo "✅ Frontend setup complete"
echo ""

cd ..

# Docker Setup
echo "🐳 Setting up Docker..."
echo "----------------------"

if command -v docker &> /dev/null; then
    echo "Starting PostgreSQL container..."
    docker-compose up -d postgres
    
    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo "✅ PostgreSQL is running"
else
    echo "⚠️  Docker not found. Skipping database setup."
    echo "    Run 'docker-compose up -d postgres' manually when Docker is installed."
fi

echo ""

# Database Migrations
echo "🗄️  Running database migrations..."
echo "-----------------------------------"

cd backend
source venv/bin/activate

# Check if alembic is installed
if command -v alembic &> /dev/null; then
    alembic upgrade head
    echo "✅ Database migrations complete"
else
    echo "⚠️  Alembic not found in PATH. Run manually:"
    echo "    cd backend && alembic upgrade head"
fi

cd ..

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "📝 Next Steps:"
echo "============"
echo ""
echo "1. Backend Development:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload"
echo ""
echo "2. Frontend Development:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Run Tests:"
echo ""
echo "   Backend:"
echo "     cd backend && pytest --cov=app"
echo ""
echo "   Frontend:"
echo "     cd frontend && npm run test:coverage"
echo ""
echo "4. Check Code Quality:"
echo ""
echo "   Backend:"
echo "     cd backend"
echo "     ruff check app/ tests/"
echo "     mypy app/"
echo ""
echo "   Frontend:"
echo "     cd frontend"
echo "     npm run lint"
echo "     npm run type-check"
echo ""
echo "5. Create a Feature Branch:"
echo "   git checkout -b feature/your-feature-name"
echo ""
echo "For more details, see CONTRIBUTING.md"
echo ""
