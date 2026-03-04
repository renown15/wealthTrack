# WealthTrack - Strategic Wealth Management Platform

![CI/CD](https://github.com/yourusername/wealthtrack/workflows/WealthTrack%20CI%2FCD/badge.svg)
[![codecov](https://codecov.io/gh/yourusername/wealthtrack/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/wealthtrack)

WealthTrack is a modern, scalable wealth management web application built with a focus on **maintainability, testability, and scalability**.

## 🏗️ Architecture

- **Backend**: Python FastAPI with async PostgreSQL
- **Frontend**: Vue 3 SPA with TypeScript + Vite
- **Database**: PostgreSQL 15
- **Deployment**: Docker & Docker Compose
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
wealthtrack/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── controllers/    # API endpoints
│   │   ├── config.py       # Configuration
│   │   ├── database.py     # Database setup
│   │   └── main.py         # FastAPI app
│   ├── tests/              # Backend tests
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── mypy.ini            # Type checking config
│   ├── pytest.ini          # Testing config
│   └── ruff.toml           # Linting config
├── frontend/               # TypeScript frontend
│   ├── src/
│   │   ├── models/         # TypeScript interfaces & types
│   │   ├── views/          # Vue components & view logic
│   │   ├── composables/    # Reusable Vue composables
│   │   ├── services/       # API & validation services
│   │   ├── styles/         # CSS styles
│   │   ├── router/         # Vue Router configuration
│   │   └── index.ts        # Entry point
│   ├── tests/              # Frontend tests
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json       # TypeScript config
│   ├── .eslintrc.json      # Linting config
│   ├── vite.config.ts      # Build config
│   └── vitest.config.ts    # Testing config
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CD pipeline
├── docker-compose.yml      # Multi-container setup
└── README.md
```

## ✨ Features

### Implemented
- ✅ User registration & authentication (JWT)
- ✅ Password hashing with bcrypt
- ✅ Account Hub — institutions, accounts, portfolio table
- ✅ Balance history (event-sourced, immutable events)
- ✅ Financial analytics dashboard (charts, history, breakdown)
- ✅ Encrypted credential vault (Fernet encryption)
- ✅ Reference data management (account types, statuses, etc.)
- ✅ Account groups & filtering
- ✅ Mobile-responsive UI (UnoCSS utility classes)
- ✅ Type safety (mypy + TypeScript strict)
- ✅ Comprehensive test coverage (backend ≥80%, frontend ≥70%)
- ✅ Docker containerization

### Planned
- 🔄 Household sharing (multi-user visibility)
- 🔄 Real-time market data integration

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/wealthtrack.git
   cd wealthtrack
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Start all services with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## � Documentation

Complete documentation is organized in the [docs/](./docs) folder:

- **[Setup & Quickstart](./docs/setup/)** - Getting started quickly
- **[Guides & References](./docs/guides/)** - How-to guides and common tasks
- **[Architecture](./docs/architecture/)** - Design decisions and principles
- **[Testing](./docs/testing/)** - Test coverage and quality metrics
- **[Progress](./docs/progress/)** - Project status and session notes

👉 **[Start with the Documentation Index →](./docs/README.md)**

## 🔧 Development Setup

### Quick Setup (Automated)

We provide automated setup scripts in the [scripts/](./scripts) folder:

```bash
# Make setup scripts executable
chmod +x scripts/setup-dev.sh scripts/setup-hooks.sh

# Run full setup
./scripts/setup-dev.sh

# Set up pre-commit hooks (optional but recommended)
./scripts/setup-hooks.sh
```

Or use Make (if installed):

```bash
make setup          # Set up development environment
make docker-up      # Start PostgreSQL
make backend-dev    # Start backend
make frontend-dev   # Start frontend
make test           # Run all tests
make lint           # Run linters
make type-check     # Run type checkers
make pr-check       # Simulate PR checks
```

For all available commands, run: `make help`

### Feature Branch Workflow

See [Contributing Guide](./docs/setup/CONTRIBUTING.md) for detailed instructions on:
- Branch naming conventions
- Code quality standards
- Testing requirements
- PR process
- Pre-commit hooks setup

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env

# Run database migrations (if applicable)
# alembic upgrade head

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run development server
npm run dev
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests with coverage
pytest

# Run specific test file
pytest tests/test_user_service.py

# Run with coverage report
pytest --cov=app --cov-report=html
```

**Coverage Requirements**: ≥80% overall (enforced via pytest)

### Frontend Tests

```bash
cd frontend

# Run all tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test

# View coverage report
open coverage/index.html
```

## 🔍 Code Quality

### Backend - Python

**Linting with Ruff:**
```bash
cd backend
ruff check app/ tests/
ruff check app/ tests/ --fix  # Auto-fix issues
```

**Type Checking with mypy:**
```bash
cd backend
mypy app/ --config-file mypy.ini
```

### Frontend - TypeScript

**Linting with ESLint:**
```bash
cd frontend
npm run lint
```

**Type Checking:**
```bash
cd frontend
npm run type-check
```

## � CI/CD Pipeline

### GitHub Actions Workflow

The project includes a comprehensive CI/CD pipeline that runs on every push and pull request:

**Pipeline Stages:**
1. **Backend Checks** (parallel jobs)
   - Ruff linting
   - MyPy type checking
   - Pytest with coverage (≥85%)

2. **Frontend Checks** (parallel jobs)
   - ESLint linting
   - TypeScript type checking
   - Vitest with coverage (lines/statements/branches ≥70%, functions ≥55%)

3. **Docker Build** (after checks pass)
   - Build backend image
   - Build frontend image
   - Push to registry (main branch only)

4. **Deploy** (main branch only)
   - Deploy to production

### Branch Protection Rules

- `main` branch: Requires 2 approvals + all checks passing
- `develop` branch: Requires 1 approval + all checks passing

See [.github/BRANCH_PROTECTION.md](./.github/BRANCH_PROTECTION.md) for detailed configuration.

### Local CI Simulation

To simulate the CI pipeline locally before pushing:

```bash
# Simulate all checks
make ci

# Or individually:
make ci-backend      # Backend checks only
make ci-frontend     # Frontend checks only
```

## �📦 Building for Production

### Build Docker Images

```bash
# Build backend
docker build -t wealthtrack-backend:latest ./backend

# Build frontend
docker build -t wealthtrack-frontend:latest ./frontend

# Build all with docker-compose
docker-compose build
```

### Deploy

```bash
# Start production containers
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## 🔐 Security

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ CORS protection
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ XSS protection
- ✅ Encrypted credential storage (Fernet encryption)
- ✅ Environment-based secrets management

**Important**: 
- Change default secrets in production!
- Set `ENCRYPTION_KEY` environment variable for credential encryption. Generate with: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`

## 📝 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Sample API Endpoints

**Register User:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePass123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- **Python**: Follow PEP 8, use type hints, max 100 chars per line
- **TypeScript**: Use strict mode, explicit return types
- **Files**: Keep files ≤200 lines
- **Tests**: Maintain ≥80% backend coverage, ≥70% frontend coverage
- **Commits**: Use conventional commit messages

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View database logs
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d db
```

### Port Already in Use

```bash
# Change ports in docker-compose.yml
# Backend: "8001:8000"
# Frontend: "3001:3000"
```

### Frontend Build Errors

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **WealthTrack Team** - *Initial work*

## 🙏 Acknowledgments

- FastAPI for the excellent Python web framework
- Vite for blazing-fast frontend tooling
- PostgreSQL for reliable data storage
- The open-source community

---

**Built with ❤️ for strategic wealth management**
