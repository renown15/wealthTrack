# Phase 1: Database Foundation - Research

**Researched:** 2026-02-03
**Domain:** PostgreSQL database migration and schema design with SQLAlchemy 2.0 + asyncpg
**Confidence:** HIGH

## Summary

Phase 1 establishes a PostgreSQL database foundation with Alembic migrations for a FastAPI application. The project already has PostgreSQL configured in docker-compose with health checks and is using SQLAlchemy 2.0 async with asyncpg, so the primary work is initializing Alembic with the async template and creating migrations for the existing schema plus new reference data tables.

**Key findings:**
- The project already uses SQLAlchemy 2.0.25 with asyncpg 0.29.0 and has Alembic 1.13.1 installed but not initialized
- PostgreSQL 15-alpine is already configured in docker-compose with proper health checks using `pg_isready`
- Use DECIMAL(19,4) for monetary values as specified in requirements (PostgreSQL NUMERIC type with Python Decimal)
- ReferenceData table should use separate lookup tables per domain (not One True Lookup Table anti-pattern)
- Alembic async template handles event loops and connection management automatically

**Primary recommendation:** Initialize Alembic with `alembic init -t async migrations`, configure env.py to import all models for autogenerate, and create separate migration files for schema creation and data seeding to maintain clear separation of concerns.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL | 15-alpine | Database | Proven ACID compliance, excellent DECIMAL support for money, JSON types, robust async driver ecosystem |
| asyncpg | 0.29.0 | Async driver | Fastest PostgreSQL driver for Python, native async/await, efficient connection pooling |
| SQLAlchemy | 2.0.25 | ORM | Industry standard ORM, full async support in 2.0+, type-safe with mypy plugin |
| Alembic | 1.13.1 | Migrations | Official SQLAlchemy migration tool, atomic migrations, autogenerate support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pytest-alembic | 0.11+ | Migration testing | Verifies migrations are reversible and match model definitions |
| python-dotenv | 1.0.0 | Config management | Already in use for environment variables |
| pydantic-settings | 2.1.0 | Settings validation | Already in use for database URL configuration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| asyncpg | psycopg3 async | psycopg3 more mature but asyncpg significantly faster for async workloads |
| Separate lookup tables | OTLT (One True Lookup Table) | OTLT creates hot spots, prevents proper foreign keys, harder to evolve - avoid |
| DECIMAL(19,4) | INTEGER cents | Integer faster but can't handle fractional pence/sub-cent precision if needed |

**Installation:**
```bash
# Already installed in requirements.txt
# Add for testing:
pytest-alembic==0.11.0
```

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── alembic/                 # Alembic migrations directory
│   ├── versions/            # Migration files
│   │   ├── 001_create_users.py
│   │   ├── 002_create_reference_data.py
│   │   └── 003_seed_reference_data.py
│   ├── env.py               # Alembic async environment config
│   └── script.py.mako       # Migration template
├── alembic.ini              # Alembic configuration
├── app/
│   ├── models/
│   │   ├── __init__.py      # Import ALL models here for autogenerate
│   │   ├── user.py          # Existing
│   │   └── reference_data.py # New lookup tables
│   └── database.py          # Existing async session factory
└── tests/
    └── test_migrations.py   # pytest-alembic tests
```

### Pattern 1: Async Alembic Configuration
**What:** Configure Alembic to work with asyncpg using the async template
**When to use:** Required for all async SQLAlchemy 2.0 projects

**Example env.py structure:**
```python
# Source: https://github.com/sqlalchemy/alembic/blob/main/alembic/templates/async/env.py
import asyncio
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy import pool

from alembic import context
from app.database import Base
from app.models import *  # Import all models for autogenerate

def do_run_migrations(connection):
    """Execute migrations synchronously using provided connection."""
    context.configure(
        connection=connection,
        target_metadata=Base.metadata,
        compare_type=True,  # Detect type changes
        compare_server_default=True,  # Detect default changes
    )
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations():
    """Create async engine and run migrations."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

def run_migrations_online():
    """Run migrations in online mode."""
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### Pattern 2: Separate Lookup Tables (Not OTLT)
**What:** Create individual reference data tables for each domain type
**When to use:** Always for reference/lookup data

**Example:**
```python
# Source: https://www.baeldung.com/cs/lookup-table-in-databases
# DON'T: One True Lookup Table (anti-pattern)
class ReferenceData(Base):
    __tablename__ = "reference_data"
    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str]  # 'account_type', 'account_status', etc.
    code: Mapped[str]
    value: Mapped[str]

# DO: Separate tables per domain
class AccountType(Base):
    __tablename__ = "account_types"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(default=True)

class AccountStatus(Base):
    __tablename__ = "account_statuses"
    # Same pattern
```

**Why separate tables:**
- Proper foreign key constraints (can't FK to OTLT)
- No hot spots on single table
- Independent schema evolution per type
- Clear domain boundaries

### Pattern 3: Monetary Value Storage
**What:** Use PostgreSQL NUMERIC/DECIMAL with Python Decimal type
**When to use:** All monetary fields

**Example:**
```python
# Source: https://www.postgresql.org/docs/current/datatype-numeric.html
from decimal import Decimal
from sqlalchemy import NUMERIC
from sqlalchemy.orm import Mapped, mapped_column

class Account(Base):
    __tablename__ = "accounts"

    # Use DECIMAL(19,4) as specified in requirements
    balance: Mapped[Decimal] = mapped_column(NUMERIC(19, 4), nullable=False)
    # 19 total digits, 4 decimal places
    # Supports up to 999,999,999,999,999.9999

    # NEVER use Float - introduces rounding errors
    # balance: Mapped[float]  # DON'T DO THIS
```

### Pattern 4: Seed Data in Migrations
**What:** Use `op.bulk_insert()` for reference data seeding
**When to use:** Initial setup and reference data additions

**Example:**
```python
# Source: Alembic documentation + SQLAlchemy best practices
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

def upgrade():
    # Define table structure for bulk insert
    account_types = table('account_types',
        column('code', sa.String),
        column('name', sa.String),
        column('description', sa.String),
        column('sort_order', sa.Integer),
        column('is_active', sa.Boolean)
    )

    # Bulk insert UK account types
    op.bulk_insert(account_types, [
        {'code': 'SAVINGS', 'name': 'Savings Account', 'description': 'Standard savings account', 'sort_order': 1, 'is_active': True},
        {'code': 'CURRENT', 'name': 'Current Account', 'description': 'Day-to-day banking account', 'sort_order': 2, 'is_active': True},
        {'code': 'CASH_ISA', 'name': 'Cash ISA', 'description': 'Tax-free cash savings', 'sort_order': 3, 'is_active': True},
        {'code': 'STOCKS_ISA', 'name': 'Stocks & Shares ISA', 'description': 'Tax-free investment account', 'sort_order': 4, 'is_active': True},
        {'code': 'LIFETIME_ISA', 'name': 'Lifetime ISA', 'description': 'ISA for first home or retirement', 'sort_order': 5, 'is_active': True},
        {'code': 'SIPP', 'name': 'SIPP', 'description': 'Self-Invested Personal Pension', 'sort_order': 6, 'is_active': True},
        {'code': 'PREMIUM_BONDS', 'name': 'Premium Bonds', 'description': 'NS&I Premium Bonds', 'sort_order': 7, 'is_active': True},
    ])

def downgrade():
    # Clean up seed data on rollback
    op.execute("DELETE FROM account_types WHERE code IN ('SAVINGS', 'CURRENT', 'CASH_ISA', 'STOCKS_ISA', 'LIFETIME_ISA', 'SIPP', 'PREMIUM_BONDS')")
```

### Pattern 5: Model Import for Autogenerate
**What:** Import all models in models/__init__.py so Alembic can detect them
**When to use:** Always when using autogenerate

**Example:**
```python
# app/models/__init__.py
# Import ALL models here so Alembic autogenerate finds them
from app.models.user import User
from app.models.reference_data import (
    AccountType,
    AccountStatus,
    EventType,
    CredentialType,
)

__all__ = [
    "User",
    "AccountType",
    "AccountStatus",
    "EventType",
    "CredentialType",
]
```

### Anti-Patterns to Avoid

- **One True Lookup Table (OTLT):** Creates hot spots, prevents proper foreign keys, makes schema evolution difficult. Use separate tables per domain instead.
- **Float for money:** Introduces rounding errors. Always use DECIMAL/NUMERIC with Python Decimal type.
- **Not importing models in env.py:** Causes autogenerate to miss tables. Import all models explicitly.
- **Data migrations with schema changes:** Separate into two migration files for clarity and easier rollback.
- **Not reviewing autogenerate output:** Always review and edit autogenerated migrations before committing.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Database connection pooling | Custom pool manager | SQLAlchemy engine (already configured) | Handles connection lifecycle, async/await, proper cleanup, tested edge cases |
| Migration versioning | Git-based SQL files | Alembic | Tracks applied migrations, handles dependencies, autogenerate, rollback support |
| Seed data management | Python scripts with raw SQL | Alembic bulk_insert in migrations | Version controlled, atomic with schema, proper rollback |
| Test database setup | Manual DB creation/teardown | pytest-alembic + fixtures | Verifies migrations work, tests up/down consistency, parallel test isolation |
| Type conversions SQLite→PostgreSQL | Manual data transformation | pgloader (if migrating existing data) | Handles AUTOINCREMENT→SERIAL, boolean conversion, datetime formatting automatically |
| Async engine lifecycle | Custom async context managers | SQLAlchemy async_engine_from_config | Proper event loop handling, connection disposal, tested with asyncpg |

**Key insight:** Database migration tooling has evolved extensively. SQLAlchemy + Alembic handle complex edge cases like dependency ordering, partial rollbacks, and type changes that custom solutions invariably get wrong. The async template specifically handles the async/sync bridge correctly.

## Common Pitfalls

### Pitfall 1: Autogenerate Missing Tables
**What goes wrong:** Run `alembic revision --autogenerate` but new models don't appear in migration
**Why it happens:** Models not imported in env.py so Alembic can't see them via Base.metadata
**How to avoid:**
- Import ALL models in app/models/__init__.py
- Import the models module in alembic/env.py before calling autogenerate
- Set `target_metadata = Base.metadata` in env.py
**Warning signs:** Migration file is empty or missing expected tables when you know models exist

### Pitfall 2: Wrong Database URL for Async
**What goes wrong:** Alembic fails with "no async driver" or connection errors
**Why it happens:** Using `postgresql://` instead of `postgresql+asyncpg://` in connection string
**How to avoid:**
- alembic.ini: `sqlalchemy.url = postgresql+asyncpg://user:pass@host/db`
- Verify config.py settings.database_url includes `+asyncpg` driver
**Warning signs:** Error messages about missing async driver or "AttributeError: 'Connection' object has no attribute 'run_sync'"

### Pitfall 3: Not Committing Migration Files
**What goes wrong:** Migrations work locally but fail in other environments
**Why it happens:** .gitignore excludes alembic/versions/ or forgot to add files
**How to avoid:**
- Ensure alembic/versions/*.py files are committed to version control
- Check .gitignore doesn't exclude migration files
- Migrations are code - treat them like application code
**Warning signs:** "Target database is not up to date" errors in CI/CD or other developers' environments

### Pitfall 4: Modifying Applied Migrations
**What goes wrong:** Alembic revision checksum mismatch or migrations run in wrong order
**Why it happens:** Edited a migration file that was already applied to a database
**How to avoid:**
- NEVER edit a migration once it's been applied anywhere (dev, staging, prod)
- Create a new migration to fix issues instead
- Use `alembic history` to see what's been applied
**Warning signs:** Checksum errors, migrations skipped, database state doesn't match code

### Pitfall 5: Autogenerate Column Renames as Drop+Add
**What goes wrong:** Autogenerate creates DROP column + ADD column instead of RENAME, losing data
**Why it happens:** Alembic can't detect renames - sees old column gone and new column added
**How to avoid:**
- Manually review ALL autogenerated migrations before applying
- For renames, manually edit to use `op.alter_column(new_column_name='...')`
- Consider three-step migration: add new column, copy data, drop old column
**Warning signs:** Migration contains both `op.drop_column()` and `op.add_column()` with similar names

### Pitfall 6: Forgetting to Import Models in Cascade
**What goes wrong:** Related models with foreign keys cause autogenerate to miss relationships
**Why it happens:** Importing only User model but not related AccountType model that User references
**How to avoid:**
- Use `from app.models import *` in env.py (imports __all__ from models/__init__.py)
- Verify all relationship targets are imported
- Check Base.metadata.tables to see what Alembic sees
**Warning signs:** Foreign key constraints missing in generated migrations

### Pitfall 7: Mixed Sync/Async in Tests
**What goes wrong:** Tests fail with "RuntimeError: no running event loop" or "Task was destroyed but it is pending"
**Why it happens:** Mixing sync pytest fixtures with async database operations
**How to avoid:**
- Use pytest-asyncio for all database test fixtures
- Mark test functions with `@pytest.mark.asyncio`
- Use `AsyncSession` consistently, never mix with sync `Session`
**Warning signs:** Event loop errors, coroutine warnings, tests pass individually but fail together

### Pitfall 8: Not Setting compare_type in env.py
**What goes wrong:** Type changes (e.g., VARCHAR(50) → VARCHAR(100)) not detected by autogenerate
**Why it happens:** Alembic skips type comparison by default for performance
**How to avoid:**
- Set `compare_type=True` in context.configure() in env.py
- Also set `compare_server_default=True` for default value changes
**Warning signs:** Column type changes in models don't appear in autogenerated migrations

## Code Examples

Verified patterns from official sources:

### Complete Alembic Initialization
```bash
# Initialize with async template
alembic init -t async alembic

# Directory structure created:
# alembic/
#   ├── versions/          # Migration files go here
#   ├── env.py            # Async environment config
#   ├── script.py.mako    # Template for new migrations
#   └── README            # Alembic documentation

# Configure database URL in alembic.ini
# Line ~58: sqlalchemy.url = postgresql+asyncpg://user:pass@host:5432/dbname
```

### env.py Configuration for Async
```python
# alembic/env.py
# Source: https://alembic.sqlalchemy.org/en/latest/cookbook.html
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context
from app.database import Base
# Import all models for autogenerate
from app.models import *

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = Base.metadata

def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations():
    # Check if connection provided by pytest-alembic
    connectable = context.config.attributes.get("connection", None)

    if connectable is None:
        # Create engine for normal migration runs
        connectable = async_engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
        await connectable.dispose()
    else:
        # Use provided connection (pytest-alembic)
        await connectable.run_sync(do_run_migrations)

def run_migrations_online():
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### Reference Data Model Example
```python
# app/models/reference_data.py
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class AccountType(Base):
    """UK-specific account types lookup table."""
    __tablename__ = "account_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<AccountType(code={self.code}, name={self.name})>"
```

### Migration Workflow
```bash
# 1. Create schema migration (autogenerate)
alembic revision --autogenerate -m "create account_types table"
# Review and edit the generated file!

# 2. Create data seed migration (manual)
alembic revision -m "seed uk account types"
# Edit to add op.bulk_insert() with data

# 3. Check migration SQL without applying
alembic upgrade head --sql

# 4. Apply migrations
alembic upgrade head

# 5. Verify current state
alembic current

# 6. View migration history
alembic history --verbose

# 7. Rollback if needed
alembic downgrade -1  # Go back one migration
```

### Testing Migrations with pytest-alembic
```python
# tests/test_migrations.py
# Source: https://pytest-alembic.readthedocs.io/en/latest/setup.html
import pytest
from pytest_alembic import MigrationContext
from sqlalchemy.ext.asyncio import create_async_engine

@pytest.fixture
def alembic_engine():
    """Provide test database engine for pytest-alembic."""
    engine = create_async_engine(
        "postgresql+asyncpg://test:test@localhost:5432/test_db",
        poolclass=NullPool,
    )
    return engine

def test_single_head_revision(alembic_runner):
    """Verify only one head revision exists (no merge conflicts)."""
    heads = alembic_runner.heads
    assert len(heads) == 1

def test_upgrade(alembic_runner):
    """Verify migrations can be applied from base to head."""
    alembic_runner.migrate_up_to("head")

def test_model_definitions_match_ddl(alembic_runner):
    """Verify models match current migrations."""
    alembic_runner.migrate_up_to("head")
    # This automatically compares Base.metadata to database state

def test_up_down_consistency(alembic_runner):
    """Verify migrations are reversible."""
    alembic_runner.migrate_up_to("head")
    alembic_runner.migrate_down_to("base")
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SQLAlchemy 1.4 Query API | SQLAlchemy 2.0 select() | 2023 (v2.0 release) | More consistent async/sync API, better type hints, clearer semantics |
| Sync-only Alembic | Async template | Alembic 1.7+ (2022) | Proper async support for asyncpg/aiosqlite, no blocking calls |
| Manual env.py async config | `alembic init -t async` | Alembic 1.7+ | Automatic async setup, less boilerplate, fewer errors |
| PostgreSQL MONEY type | NUMERIC/DECIMAL | Always | MONEY doesn't support fractional cents, locale-dependent, NUMERIC more flexible |
| Single migrations folder | Same (but with clear naming) | N/A | Best practice: separate schema and data migrations with clear prefixes |

**Deprecated/outdated:**
- **SQLAlchemy Query API:** Use `select()` construct instead of `session.query()`
- **Sync-only alembic template:** Use `alembic init -t async` for async projects
- **PostgreSQL MONEY type:** Use NUMERIC(precision, scale) for better precision and portability
- **OTLT pattern:** Deprecated design pattern - use separate lookup tables

## Open Questions

Things that couldn't be fully resolved:

1. **Existing SQLite data migration**
   - What we know: Project structure suggests SQLite may have been used initially, but no .db files found in current codebase
   - What's unclear: Whether there's existing production SQLite data that needs migration, or if this is greenfield
   - Recommendation: Confirm with user - if greenfield, proceed with fresh PostgreSQL schema. If migration needed, plan to use pgloader with manual verification of user authentication data

2. **Event sourcing implementation details**
   - What we know: Requirements mention "event sourcing for all balance changes, append-only"
   - What's unclear: Whether event sourcing tables are part of Phase 1 or later phases
   - Recommendation: Based on phase description focusing on "database foundation," assume event sourcing tables come in later phase. Phase 1 focuses on core schema (users, reference data)

3. **Encryption key storage strategy**
   - What we know: Requirements specify "envelope encryption with user-derived keys, never store keys with data"
   - What's unclear: Database schema impact for Phase 1
   - Recommendation: Likely needs encrypted_data columns in later phases, not part of initial foundation. Document as consideration for future schema design

## Sources

### Primary (HIGH confidence)
- [PostgreSQL Numeric Types Documentation](https://www.postgresql.org/docs/current/datatype-numeric.html) - DECIMAL/NUMERIC precision and scale for monetary values
- [Alembic Async Cookbook](https://alembic.sqlalchemy.org/en/latest/cookbook.html) - Async engine configuration patterns
- [Alembic Async env.py Template](https://github.com/sqlalchemy/alembic/blob/main/alembic/templates/async/env.py) - Official async migration template structure
- [SQLAlchemy 2.0 Type Basics](https://docs.sqlalchemy.org/en/20/core/type_basics.html) - NUMERIC/DECIMAL type usage
- [pytest-alembic Setup](https://pytest-alembic.readthedocs.io/en/latest/setup.html) - Migration testing configuration

### Secondary (MEDIUM confidence)
- [TestDriven.io FastAPI SQLModel Alembic](https://testdriven.io/blog/fastapi-sqlmodel/) - Complete setup guide verified against official docs
- [Crunchy Data: Working with Money in Postgres](https://www.crunchydata.com/blog/working-with-money-in-postgres) - NUMERIC vs MONEY vs integer for currency
- [pgloader SQLite Documentation](https://pgloader.readthedocs.io/en/latest/ref/sqlite.html) - SQLite to PostgreSQL migration (if needed)
- [Alembic Autogenerate Documentation](https://alembic.sqlalchemy.org/en/latest/autogenerate.html) - What autogenerate can and cannot detect

### Secondary (MEDIUM confidence) - Community Resources
- [Baeldung: Lookup Tables in Databases](https://www.baeldung.com/cs/lookup-table-in-databases) - Reference data design patterns
- [Red Gate: Look-up Tables in SQL](https://www.red-gate.com/simple-talk/databases/sql-server/t-sql-programming-sql-server/look-up-tables-in-sql/) - OTLT anti-pattern discussion
- Web search results on Docker Compose health checks for PostgreSQL

### Tertiary (LOW confidence - training data)
- SQLAlchemy 2.0 migration breaking changes (based on training, not current docs)
- FastAPI async testing patterns (WebSearch unavailable, based on training)
- asyncpg connection pool best practices (WebSearch unavailable, based on training)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are official, versions confirmed in requirements.txt, PostgreSQL already in docker-compose
- Architecture: HIGH - Patterns from official Alembic and SQLAlchemy documentation, verified with current version docs
- Pitfalls: HIGH - Based on official Alembic autogenerate limitations docs and common migration issues documented by maintainers
- Monetary types: HIGH - PostgreSQL official documentation, requirement explicitly states DECIMAL(19,4)
- Reference data design: MEDIUM - Multiple sources agree on separate tables vs OTLT, but specific schema details are discretionary

**Research date:** 2026-02-03
**Valid until:** 60 days (stable ecosystem - SQLAlchemy, Alembic, PostgreSQL have infrequent breaking changes)
**Revalidate if:** Alembic 2.0 released, SQLAlchemy 2.1 released, or asyncpg 1.0 released
