# WealthTrack

A self-hosted personal wealth tracker. One place to see all your savings and investments across every bank, ISA, pension, and investment account — without connecting to any bank APIs.

## The Problem

Most people have money spread across many institutions: a current account here, a Cash ISA there, a pension somewhere else, Premium Bonds, a stocks and shares account. Getting a clear picture of your total net worth means logging into each one separately, or maintaining a spreadsheet that quickly goes stale.

WealthTrack solves this by giving you a single dashboard where you manually log balances and keep a full history over time. It's simple by design: you own the data, it runs on your own server, and nothing connects to your bank.

## What It Does

**Account Hub** — Add your financial institutions and the accounts you hold with each one. Update balances whenever you like and see the full history of every account over time.

**Portfolio View** — See all accounts grouped by institution, with current balances and total net worth at a glance.

**Analytics** — Charts showing how your portfolio is split by account type, institution, and asset class, plus balance history trends.

**Credential Vault** — Optionally store your login credentials for each institution, encrypted at rest. Useful for keeping all your financial logins in one secure place.

## Who It's For

Anyone who wants a clear picture of their finances without giving a third party access to their bank accounts. Particularly suited to UK users — account types include Savings, Current, Cash ISA, Stocks & Shares ISA, Lifetime ISA, SIPP, and Premium Bonds.

## What It Doesn't Do

- No bank API integration — balances are entered manually
- No transaction-level tracking — just balance snapshots over time
- No budgeting or spending analysis
- No mobile app — web only (responsive)

Household sharing (multiple users sharing a combined view) is planned but not yet built.

---

## Getting Started

**Requirements:** Docker, Node.js v18+, Python 3.12

```bash
git clone https://github.com/your-username/wealthTrack.git
cd wealthTrack

cp .env.dev.example .env.dev   # configure your local environment
make setup                      # install deps, run migrations, seed reference data

make dev                        # start everything
```

Then open http://localhost:3001. The API runs at http://localhost:8000 (Swagger UI at /docs).

See [docs/setup/QUICKSTART.md](docs/setup/QUICKSTART.md) for the full setup guide including troubleshooting.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy (async), PostgreSQL 15, Alembic |
| Frontend | Vue 3, TypeScript, Vite, UnoCSS |
| Auth | JWT tokens, bcrypt |
| Encryption | Fernet symmetric encryption (credential vault) |

---

## Security

Credentials stored in the vault are encrypted at rest using Fernet symmetric encryption. JWT tokens are used for session auth (configurable expiry — default 8 hours in dev). Passwords are hashed with bcrypt.

**Before deploying:** change `SECRET_KEY` in your `.env` to a strong random value. Never commit `.env` files.

---

## Contributing

Run `make pr-check` before any pull request — it runs linting, type checking, tests with coverage thresholds, and a production build against an isolated test database. All steps must pass.

See [docs/architecture/PROJECT_RULES.md](docs/architecture/PROJECT_RULES.md) for conventions and rules.
