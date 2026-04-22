"""Verify all Alembic migrations apply cleanly to a blank database.

Uses a dedicated Docker container on port 5435 — completely isolated from
the dev DB (5433) and the regular test DB (5434). The container is created
fresh and destroyed after the test, with no volumes or persistent state.
"""
import os
import subprocess
import time
import uuid
from pathlib import Path

import pytest

_BACKEND_DIR = Path(__file__).parent.parent
_PORT = 5435
_PASSWORD = "migtest_password"
_DB = "wealthtrack"
_USER = "postgres"
_URL = f"postgresql+asyncpg://{_USER}:{_PASSWORD}@localhost:{_PORT}/{_DB}"
_PSQL_URL = f"postgresql://{_USER}:{_PASSWORD}@localhost:{_PORT}/{_DB}"


def _run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kwargs)


@pytest.fixture(scope="module")
def migration_db_url():
    """Start a blank Postgres container, yield its URL, then destroy it."""
    container = f"wealthtrack-migration-test-{uuid.uuid4().hex[:8]}"
    started = False
    try:
        result = _run(
            [
                "docker",
                "run",
                "-d",
                "--name",
                container,
                "-e",
                f"POSTGRES_PASSWORD={_PASSWORD}",
                "-e",
                f"POSTGRES_DB={_DB}",
                "-p",
                f"{_PORT}:5432",
                "postgres:15-alpine",
            ]
        )
        assert result.returncode == 0, f"docker run failed: {result.stderr.strip()}"
        started = True

        # Poll until ready (up to 30 s)
        for _ in range(30):
            ready = _run(["docker", "exec", container, "pg_isready", "-U", _USER])
            if ready.returncode == 0:
                break
            time.sleep(1)
        else:
            pytest.fail("Migration test DB did not become ready within 30 s")

        yield _URL

    finally:
        if started:
            _run(["docker", "stop", container])
            _run(["docker", "rm", container])


@pytest.mark.migration
def test_upgrade_head_on_blank_db(migration_db_url: str) -> None:
    """alembic upgrade head runs without error on a completely blank database."""
    env = {**os.environ, "DATABASE_URL": migration_db_url}
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
        cwd=str(_BACKEND_DIR),
        env=env,
    )
    assert result.returncode == 0, (
        f"alembic upgrade head failed:\n" f"stdout: {result.stdout}\nstderr: {result.stderr}"
    )
    assert "ERROR" not in result.stderr.upper() or "Running upgrade" in result.stderr


@pytest.mark.migration
def test_current_matches_head_after_upgrade(migration_db_url: str) -> None:
    """After upgrade head, alembic current reports the latest revision."""
    env = {**os.environ, "DATABASE_URL": migration_db_url}

    # Ensure fully upgraded first
    subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=True,
        cwd=str(_BACKEND_DIR),
        env=env,
    )

    result = subprocess.run(
        ["alembic", "current"],
        capture_output=True,
        text=True,
        cwd=str(_BACKEND_DIR),
        env=env,
    )
    assert result.returncode == 0
    assert (
        "(head)" in result.stdout
    ), f"Expected '(head)' in alembic current output:\n{result.stdout}"
