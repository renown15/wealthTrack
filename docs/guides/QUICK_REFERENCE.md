# 🚀 WealthTrack Development - Quick Reference

## One-Time Setup

```bash
# Clone and navigate
git clone <repo>
cd wealthtrack

# Make scripts executable
chmod +x scripts/setup-dev.sh scripts/setup-hooks.sh

# Automated setup
./scripts/setup-dev.sh

# Optional: Set up pre-commit hooks
./scripts/setup-hooks.sh
```

## Daily Development

### Start Development Servers

```bash
# Terminal 1 - Backend
make backend-dev

# Terminal 2 - Frontend  
make frontend-dev
```

### Create Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Before Committing

```bash
# Auto-fix style issues
make lint-fix

# Run all checks
make pr-check
```

### After Committing

```bash
git push -u origin feature/your-feature-name
```

## Useful Commands

| Command | Purpose |
|---------|---------|
| `make help` | Show all available commands |
| `make setup` | Full development setup |
| `make test` | Run all tests |
| `make lint` | Check code style |
| `make type-check` | Check TypeScript/Python types |
| `make lint-fix` | Auto-fix style issues |
| `make pr-check` | Simulate PR checks locally |
| `make ci` | Run full CI pipeline locally |
| `make backend-dev` | Start backend server |
| `make frontend-dev` | Start frontend server |
| `make docker-up` | Start PostgreSQL |
| `make docker-down` | Stop PostgreSQL |

## Testing

```bash
# Backend tests
cd backend && pytest --cov=app

# Frontend tests
cd frontend && npm run test:coverage

# All tests
make test
```

## Code Quality

```bash
# Check everything
make lint && make type-check

# Auto-fix issues
make lint-fix

# View linting issues
make lint

# View type issues
make type-check
```

## Import Conventions

The frontend uses **TypeScript path aliases** for clean imports:

```typescript
// ✅ Good: Use path aliases
import { ApiService } from '@services/ApiService';
import type { User } from '@models/User';
import { LoginView } from '@views/LoginView';

// ❌ Bad: Don't use relative imports
import { ApiService } from '../../../services/ApiService';
```

**Available Aliases:**
- `@/` - Root src directory
- `@controllers/` - Controller classes
- `@services/` - API and services
- `@views/` - View components
- `@models/` - Data models
- `@composables/` - Vue composables
- `@styles/` - Stylesheets

See [PATH_ALIASES.md](./PATH_ALIASES.md) for detailed guide.

## GitHub PR Workflow

1. Create branch: `git checkout -b feature/name`
2. Make changes
3. Check locally: `make pr-check`
4. Commit: `git commit -m "feat: description"`
5. Push: `git push -u origin feature/name`
6. Create PR on GitHub
7. Address review comments
8. Merge when approved ✅

## Common Issues

| Issue | Solution |
|-------|----------|
| Tests fail locally | Run `make test` to see full output |
| Linting errors | Run `make lint-fix` to auto-fix |
| Type errors | Run `make type-check` for details |
| Docker won't start | Ensure Docker is installed: `docker --version` |
| Node modules missing | Run `npm ci` in frontend directory |
| Python venv issues | Delete `venv/` and run `./scripts/setup-dev.sh` again |

## File Locations

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | GitHub Actions CI pipeline |
| `CONTRIBUTING.md` | Full development guide |
| `Makefile` | Development commands |
| `scripts/setup-dev.sh` | Automated setup script |
| `scripts/setup-hooks.sh` | Pre-commit hooks setup |
| `frontend/package.json` | Frontend scripts |
| `backend/requirements.txt` | Backend dependencies |

## Quick Links

- 📖 [Full Contributing Guide](./CONTRIBUTING.md)
- 🔧 [CI/CD Setup Details](./CI_CD_SETUP.md)
- 🛡️ [Branch Protection Rules](./.github/BRANCH_PROTECTION.md)
- 📋 [PR Template](./.github/pull_request_template.md)

## Coverage Requirements

- **Frontend**: 90%+ line coverage (currently 94.31% ✅)
- **Backend**: 85%+ line coverage

## Important Branches

- `main` - Production (2 approvals required)
- `develop` - Integration (1 approval required)
- `feature/*` - Feature development
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical fixes

---

**💡 Tip**: Bookmark this page! You'll reference it often.

**📞 Need help?** Check CONTRIBUTING.md or GitHub Issues.
