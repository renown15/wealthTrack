# WealthTrack Deployment Guide

WealthTrack runs as three Docker containers (db, backend, frontend) using the `prod` profile. This guide covers deploying to a **Raspberry Pi** and a **Windows machine** running Docker.

---

## Raspberry Pi Deployment

### Prerequisites

On the Pi:
- Raspberry Pi OS (64-bit recommended)
- Docker and Docker Compose installed (`sudo apt install docker.io docker-compose-v2`)
- SSH enabled (`sudo raspi-config` → Interface Options → SSH)
- Your Mac's SSH key added to the Pi (`ssh-copy-id marklewis@raspberrypi.local`)

On your Mac:
- SSH access verified (`ssh marklewis@raspberrypi.local "echo OK"`)
- `rsync` available (pre-installed on macOS)
- `.env.pi` present in the project root (gitignored, not committed)

### Configuration — `.env.pi`

`.env.pi` holds all config for the Pi deployment. Key values:

| Variable | Notes |
|----------|-------|
| `DB_PASSWORD` / `POSTGRES_PASSWORD` | Database credentials |
| `SECRET_KEY` | App secret — generate with `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `BACKEND_PORT` | Port the backend listens on (currently `8080`) |
| `VITE_API_URL` | URL the **browser** uses to reach the backend — `http://raspberrypi.local:8080` |
| `FRONTEND_PORT` | Port the frontend listens on (currently `3000`) |

### Deploying

**First time — verify SSH:**
```bash
make pi-setup
```

**Every deploy:**
```bash
make deploy-pi
```

This does everything in one step:
1. `rsync` — syncs code to `~/wealthTrack` on the Pi (excludes `node_modules`, `venv`, `.env.*`, etc.)
2. Copies `.env.pi` to the Pi
3. Builds and starts containers (`prod` profile) on the Pi
4. Runs Alembic migrations
5. Seeds reference data

First deploy takes several minutes (Docker builds on the Pi are slow). Subsequent deploys are faster.

App is available at **http://raspberrypi.local:3000** when done.

### Overriding Defaults

```bash
PI_HOST=raspberrypi.local   # e.g. make deploy-pi PI_HOST=192.168.1.10
PI_USER=marklewis
PI_DIR=~/wealthTrack
```

---

## Windows Deployment

Docker images are **built on your Mac** for `linux/amd64`, saved as tarballs, transferred via SCP, and loaded on the Windows machine. This avoids needing a build environment on Windows.

### Prerequisites

On the Windows machine (KATE-SURFACE):
- Docker Desktop installed and running
- OpenSSH Server enabled (Settings → Apps → Optional Features → OpenSSH Server)

On your Mac:
- `sshpass` installed (`brew install sshpass`)
- `.env.windows` present in the project root (gitignored, not committed)

### Configuration — `.env.windows`

`.env.windows` holds all config for the Windows deployment, including:

| Variable | Notes |
|----------|-------|
| `WINDOWS_SSH_PASSWORD` | SSH password for the Windows user — used by `sshpass` at deploy time |
| `VITE_API_URL` | `http://KATE-SURFACE.local:8080` |
| `BACKEND_PORT` | `8080` |
| `FRONTEND_PORT` | `3000` |

### Deploying

```bash
make deploy-windows
```

This does:
1. Builds `wealthtrack-backend` and `wealthtrack-frontend` images for `linux/amd64` on your Mac
2. Saves them as compressed tarballs in `/tmp/`
3. SCPs the tarballs to KATE-SURFACE (home directory)
4. Loads the images into Docker on Windows, deletes the tarballs
5. Copies `docker-compose.yml` and `.env.windows` to `C:/Users/user/wealthTrack/`
6. Starts containers (`prod` profile)
7. Runs migrations and seeds reference data

App is available at **http://KATE-SURFACE.local:3000** when done.

### Overriding Defaults

```bash
WINDOWS_HOST=KATE-SURFACE.local   # e.g. make deploy-windows WINDOWS_HOST=192.168.1.20
WINDOWS_USER=user
WINDOWS_DIR=C:/Users/user/wealthTrack
```

---

## After Deployment

### Checking Logs

SSH into the target machine and check container logs:

```bash
# Pi
ssh marklewis@raspberrypi.local
cd ~/wealthTrack
docker compose --env-file .env.pi --profile prod logs -f backend
docker compose --env-file .env.pi --profile prod logs -f frontend
```

### Stopping / Restarting

```bash
# Pi
ssh marklewis@raspberrypi.local "cd ~/wealthTrack && docker compose --env-file .env.pi --profile prod down"
ssh marklewis@raspberrypi.local "cd ~/wealthTrack && docker compose --env-file .env.pi --profile prod up -d"
```

### Data Persistence

The database lives in the `wealthtrack_prod_pgdata` Docker volume on the target machine. It persists across container restarts and redeploys. Only `docker volume rm wealthtrack_prod_pgdata` will wipe it.

---

## Env Files Reference

| File | Purpose | In git |
|------|---------|--------|
| `.env.prod.example` | Template showing all available prod variables | Yes |
| `.env.pi` | Pi deployment config (your values) | No |
| `.env.windows` | Windows deployment config + SSH password | No |
| `.env.dev` | Local dev config | No |
