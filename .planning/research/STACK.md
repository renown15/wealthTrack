# Technology Stack

**Project:** WealthTrack
**Researched:** 2026-02-03
**Confidence:** MEDIUM (based on training data through Jan 2025, unable to verify current versions)

## Recommended Stack

### Backend: Python FastAPI

#### Encryption & Credential Storage

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **cryptography** | 42+ | Credential encryption (Fernet symmetric encryption) | Industry standard, NIST-approved algorithms, simple API for symmetric encryption. Fernet provides authenticated encryption with key rotation support. |
| **argon2-cffi** | 23+ | Password hashing (for user authentication) | Winner of Password Hashing Competition, better than bcrypt/scrypt for memory-hard hashing. Protects against GPU attacks. |
| **python-dotenv** | 1.0+ | Environment variable management | Keep encryption keys out of code, standard .env pattern |

**Critical:** Use Fernet for credential vault encryption, NOT RSA or custom crypto. Fernet provides:
- Authenticated encryption (prevents tampering)
- Timestamp validation
- Key rotation capabilities
- Simple encrypt/decrypt API

**Key Management Pattern:**
```python
# Store master key in environment, derive per-credential keys
from cryptography.fernet import Fernet
import os

MASTER_KEY = os.environ['VAULT_MASTER_KEY']  # Base64-encoded 32-byte key
fernet = Fernet(MASTER_KEY)
```

#### Database: PostgreSQL

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **PostgreSQL** | 15+ | Primary database | ACID compliance critical for financial data. Row-level security for household sharing. JSON columns for flexible metadata. |
| **asyncpg** | 0.29+ | Async PostgreSQL driver | Fast, native async/await support, works with FastAPI's async model |
| **SQLAlchemy** | 2.0+ | ORM (if needed) | Type-safe queries, migrations via Alembic. Use async session API. |
| **Alembic** | 1.13+ | Database migrations | Standard migration tool, version control for schema |

**PostgreSQL-Specific Features to Use:**
1. **Row-Level Security (RLS)** for household sharing
2. **JSONB columns** for account metadata (institution-specific fields)
3. **TimescaleDB extension** (optional) for balance history if >100K data points
4. **Partial indexes** on encrypted credential columns (index on institution_id, not encrypted values)

**Schema Pattern for Balance History:**
```sql
-- Efficient time-series pattern
CREATE TABLE balance_snapshots (
    id BIGSERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    balance NUMERIC(15,2) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT balance_positive CHECK (balance >= 0)
);

-- Partial index for recent queries (90% of queries)
CREATE INDEX idx_recent_balances
ON balance_snapshots(account_id, recorded_at DESC)
WHERE recorded_at > NOW() - INTERVAL '2 years';
```

#### API Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **FastAPI** | 0.109+ | API framework | Already in stack. Async support, automatic OpenAPI docs, Pydantic validation. |
| **Pydantic** | 2.5+ | Data validation | Type-safe request/response models. Strict mode for financial data. |
| **python-jose[cryptography]** | 3.3+ | JWT tokens | Session management for multi-user households. Use RS256 for tokens. |

#### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **pytest** | 7.4+ | Test framework | Standard Python testing, fixture support for database setup |
| **pytest-asyncio** | 0.23+ | Async test support | Test async FastAPI endpoints and database operations |
| **pytest-cov** | 4.1+ | Coverage reporting | Enforce 90% coverage requirement |
| **httpx** | 0.26+ | HTTP client for testing | Async client for FastAPI TestClient, better than requests |

### Frontend: TypeScript + Vite

#### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **TypeScript** | 5.3+ | Type system | Already in stack. Strict mode required for financial calculations. |
| **Vite** | 5.0+ | Build tool | Already in stack. Fast HMR, native ESM. |
| **React** | 18.2+ | UI framework | Assumption based on TypeScript/Vite. If not using React, specify framework. |

#### Dashboard & Data Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **TanStack Table** (formerly React Table) | 8.11+ | Data tables | Headless, fully typed, virtualization support for large datasets. Best-in-class for financial tables. |
| **Recharts** | 2.10+ | Charts/graphs | Simple API, responsive, composable. Good for balance history line charts. TypeScript support. |
| **date-fns** | 3.0+ | Date manipulation | Immutable, tree-shakeable, better DX than moment.js. Critical for time-series data. |

**Alternative:** Use **AG Grid Community** (31+) if need advanced features (filtering, sorting, grouping). Heavier but more powerful.

**Avoid:** Chart.js (imperative API, poor TypeScript support), D3.js directly (too complex for standard dashboards).

#### UI Components

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Radix UI** | 1.1+ | Unstyled primitives | Accessible, composable, no style opinions. Good for 200-line file limit (import only what you need). |
| **Tailwind CSS** | 3.4+ | Styling | Utility-first, small bundle with JIT. Good for small components. |
| **class-variance-authority (CVA)** | 0.7+ | Component variants | Type-safe variant API, pairs well with Tailwind. |

**Pattern for Financial Tables:**
```typescript
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { type Balance } from './types'

// Type-safe, composable, under 200 lines
const balanceColumns = [
  { accessorKey: 'date', header: 'Date' },
  {
    accessorKey: 'balance',
    header: 'Balance',
    cell: (info) => formatCurrency(info.getValue())
  }
]
```

#### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **TanStack Query** (React Query) | 5.17+ | Server state | Cache API responses, optimistic updates for balance entry. Better than Redux for API-driven apps. |
| **Zustand** | 4.4+ | Client state | Lightweight (1KB), simple API. Only if need global state (current household, user prefs). |

**Avoid:** Redux (too heavy), MobX (less TypeScript-friendly), Context API for server state (use TanStack Query).

#### Forms & Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **React Hook Form** | 7.49+ | Form management | Minimal re-renders, built-in validation. Good for account/balance entry forms. |
| **Zod** | 3.22+ | Schema validation | TypeScript-first, runtime safety. Share schemas with Pydantic backend (via TypeScript codegen). |

#### Development Tools

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vitest** | 1.1+ | Test runner | Native Vite integration, fast, Jest-compatible API. |
| **Testing Library** | 14.1+ | Component testing | Best practices for React testing, accessibility-focused. |
| **ESLint** | 8.56+ | Linting | Enforce code quality, catch type errors. Use `@typescript-eslint/strict`. |
| **Prettier** | 3.1+ | Formatting | Consistent code style. |

### Infrastructure & DevOps

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Docker** | 24+ | Containerization | Consistent dev/prod environments. |
| **Docker Compose** | 2.23+ | Local orchestration | Run PostgreSQL + FastAPI + Vite locally. |
| **GitHub Actions** | N/A | CI/CD | Run tests, enforce 90% coverage, type checking. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Encryption | cryptography (Fernet) | PyCryptodome | cryptography is better maintained, simpler API for symmetric encryption |
| Encryption | cryptography (Fernet) | NaCl/libsodium | Fernet is simpler for credential vault use case, built on same primitives |
| Database Driver | asyncpg | psycopg3 | asyncpg is faster, more mature async support |
| ORM | SQLAlchemy 2.0 | Django ORM | Not using Django, SQLAlchemy more flexible |
| ORM | SQLAlchemy 2.0 | Raw SQL | ORM provides type safety, migrations, but use raw SQL for complex financial queries |
| Data Tables | TanStack Table | Material-UI DataGrid | TanStack is headless (more flexible), lighter, better TypeScript |
| Data Tables | TanStack Table | AG Grid Enterprise | AG Grid Community free tier sufficient, Enterprise expensive for personal project |
| Charts | Recharts | Chart.js | Recharts more React-friendly, better composition |
| State | TanStack Query | Redux Toolkit | TanStack Query better for API-driven apps, simpler |
| UI Library | Radix + Tailwind | Material-UI | MUI too heavy, harder to fit in 200-line limit |
| UI Library | Radix + Tailwind | Ant Design | Same as MUI, plus less modern React patterns |

## Installation

### Backend (Python)

```bash
# Core
pip install fastapi[all]==0.109.0 uvicorn[standard]==0.27.0
pip install cryptography==42.0.0 argon2-cffi==23.1.0
pip install asyncpg==0.29.0 sqlalchemy[asyncio]==2.0.25 alembic==1.13.1
pip install pydantic==2.5.3 pydantic-settings==2.1.0
pip install python-jose[cryptography]==3.3.0 python-dotenv==1.0.0

# Testing
pip install pytest==7.4.4 pytest-asyncio==0.23.3 pytest-cov==4.1.0 httpx==0.26.0

# Dev
pip install black==24.1.0 mypy==1.8.0 ruff==0.1.11
```

### Frontend (TypeScript)

```bash
# Core
npm install react@18.2.0 react-dom@18.2.0
npm install @tanstack/react-table@8.11.6 @tanstack/react-query@5.17.19
npm install recharts@2.10.3 date-fns@3.0.6
npm install react-hook-form@7.49.3 zod@3.22.4 @hookform/resolvers@3.3.4

# UI
npm install @radix-ui/react-dialog@1.0.5 @radix-ui/react-select@2.0.0
npm install tailwindcss@3.4.1 class-variance-authority@0.7.0 clsx@2.1.0

# State (if needed)
npm install zustand@4.4.7

# Dev dependencies
npm install -D typescript@5.3.3 vite@5.0.11
npm install -D vitest@1.1.3 @testing-library/react@14.1.2 @testing-library/jest-dom@6.2.0
npm install -D eslint@8.56.0 @typescript-eslint/parser@6.19.0 @typescript-eslint/eslint-plugin@6.19.0
npm install -D prettier@3.1.1
```

## Configuration Patterns

### Backend: Encryption Key Management

**CRITICAL:** Never commit encryption keys. Use environment variables.

```python
# config.py
from pydantic_settings import BaseSettings
from cryptography.fernet import Fernet
import os

class Settings(BaseSettings):
    # Generate with: Fernet.generate_key()
    vault_master_key: str
    database_url: str
    secret_key: str  # For JWT signing

    class Config:
        env_file = ".env"

settings = Settings()
```

**.env (never commit):**
```
VAULT_MASTER_KEY=your-base64-encoded-32-byte-key
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/wealthtrack
SECRET_KEY=your-jwt-secret
```

### Frontend: API Client Pattern

```typescript
// api-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
})

// Type-safe API calls
export async function fetchBalances(accountId: string): Promise<Balance[]> {
  const response = await fetch(`/api/accounts/${accountId}/balances`)
  if (!response.ok) throw new Error('Failed to fetch balances')
  return response.json()
}
```

### Database: Migration Strategy

```bash
# Initialize Alembic
alembic init migrations

# Create migration
alembic revision --autogenerate -m "add balance_snapshots table"

# Apply migrations
alembic upgrade head
```

## Security Considerations

### Encryption Strategy

1. **Master Key:** Store in environment variable, rotate annually
2. **Credential Encryption:** Use Fernet symmetric encryption
3. **Password Hashing:** Use Argon2id for user passwords
4. **JWT Tokens:** Use RS256, short expiry (15min access, 7d refresh)

### Database Security

1. **Row-Level Security:** Enable PostgreSQL RLS for household data isolation
2. **Encrypted Columns:** Use application-level encryption (Fernet) for credentials, NOT pgcrypto
3. **Connection Security:** Use SSL for database connections in production

### Frontend Security

1. **No Sensitive Data in LocalStorage:** Only store JWT tokens in httpOnly cookies
2. **CSRF Protection:** FastAPI middleware for state-changing operations
3. **Input Validation:** Zod schemas on frontend, Pydantic on backend (defense in depth)

## Performance Considerations

### Database

- **Indexes:** Create indexes on `account_id`, `recorded_at` for balance queries
- **Partial Indexes:** Index only recent data (last 2 years) for 90% of queries
- **Connection Pooling:** Use asyncpg pool (10-20 connections)
- **Query Optimization:** Use `EXPLAIN ANALYZE` for slow queries

### Frontend

- **Code Splitting:** Vite automatic code splitting, lazy load dashboard components
- **Table Virtualization:** Use TanStack Table virtualizer for >1000 rows
- **Image Optimization:** Use WebP for institution logos, lazy load
- **Bundle Size:** Monitor with `vite-bundle-visualizer`

## Testing Strategy

### Backend (90% Coverage)

```python
# test_vault.py
import pytest
from app.vault import encrypt_credential, decrypt_credential

@pytest.mark.asyncio
async def test_credential_encryption():
    """Test credential vault encryption/decryption"""
    plaintext = "my-bank-password"
    encrypted = encrypt_credential(plaintext)
    assert encrypted != plaintext
    assert decrypt_credential(encrypted) == plaintext
```

### Frontend

```typescript
// balance-table.test.tsx
import { render, screen } from '@testing-library/react'
import { BalanceTable } from './balance-table'

test('renders balance table with correct formatting', () => {
  const balances = [
    { date: '2025-01-01', balance: 1000.50 }
  ]
  render(<BalanceTable balances={balances} />)
  expect(screen.getByText('$1,000.50')).toBeInTheDocument()
})
```

## Confidence Assessment

| Component | Confidence | Notes |
|-----------|------------|-------|
| Python Encryption | **HIGH** | cryptography/Fernet is standard, unlikely to change |
| Database Patterns | **HIGH** | PostgreSQL patterns for financial data well-established |
| FastAPI Stack | **MEDIUM** | Versions from training data (Jan 2025), likely current but unverified |
| TypeScript Libraries | **MEDIUM** | TanStack ecosystem stable, versions may have minor updates |
| React UI Libraries | **MEDIUM** | Radix UI may have updates, core API stable |

## Known Limitations

1. **Version Currency:** All version numbers from training data (Jan 2025). Verify latest versions with npm/pip before installing.
2. **TimescaleDB:** Recommended for >100K balance snapshots, but not verified if needed for your scale.
3. **Zustand:** Only recommended if global state needed. TanStack Query may be sufficient alone.
4. **Testing Library Versions:** May have minor version updates since training cutoff.

## Sources

**Note:** Unable to access Context7, WebSearch, or WebFetch during research. All recommendations based on training data through January 2025. Confidence levels reflect this limitation.

**Recommended verification:**
- Check npm registry for latest TypeScript package versions
- Check PyPI for latest Python package versions
- Review official documentation for breaking changes:
  - https://cryptography.io/
  - https://www.postgresql.org/docs/
  - https://tanstack.com/table/latest
  - https://fastapi.tiangolo.com/

## Next Steps

1. **Verify Versions:** Check latest stable versions for all dependencies
2. **Prototype Encryption:** Test Fernet encryption with sample credentials
3. **PostgreSQL Setup:** Design schema with RLS for household sharing
4. **Component Library:** Choose Radix UI primitives needed for dashboard
5. **Testing Setup:** Configure pytest-cov and Vitest with 90% threshold

---

**Research Complete:** 2026-02-03
**Ready for:** Roadmap creation and phase structure planning
