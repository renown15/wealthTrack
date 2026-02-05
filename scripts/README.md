# Scripts

Utility scripts for development, setup, and testing.

## Setup Scripts

### `setup-dev.sh`
Complete development environment setup.

```bash
chmod +x setup-dev.sh
./setup-dev.sh
```

Sets up:
- Python virtual environment (backend)
- Node.js dependencies (frontend)
- Git pre-commit hooks
- Database initialization

### `setup-hooks.sh`
Configure git pre-commit hooks for code quality checks.

```bash
chmod +x setup-hooks.sh
./setup-hooks.sh
```

Installs hooks for:
- Code formatting
- Linting
- Type checking
- Test execution

## Development Scripts

### `dev.sh`
Start all development services.

```bash
chmod +x dev.sh
./dev.sh
```

Starts:
- PostgreSQL database (Docker)
- Backend server (FastAPI)
- Frontend dev server (Vite)

Watch this script's output for service URLs and status.

## Database Scripts

### `init-db.sql`
Database initialization script with schema and seed data.

Used automatically by Docker Compose to initialize the PostgreSQL database on first run.

## Testing Scripts

### `test_untracked_files.py`
Verify that all source files are tracked in git.

```bash
python3 test_untracked_files.py
```

Checks for:
- Untracked files in protected source directories
- Proper .gitignore coverage
- No accidentally uncommitted source code

## Using Makefile Instead

For convenience, most scripts can be run via Makefile:

```bash
make setup          # Run setup-dev.sh
make hooks          # Run setup-hooks.sh
make dev            # Run dev.sh
make test           # Run tests
make lint           # Run linters
make type-check     # Run type checkers
```

See `Makefile` in the root directory or run `make help` for all available commands.
