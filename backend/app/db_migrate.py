"""Run Alembic migrations programmatically (Docker entrypoint + app startup)."""

import logging
from pathlib import Path

from alembic import command
from alembic.config import Config

logger = logging.getLogger("searchmind.migrate")

_BACKEND_ROOT = Path(__file__).resolve().parent.parent


def run_migrations() -> None:
    """Apply all pending Alembic revisions (upgrade head)."""
    alembic_ini = _BACKEND_ROOT / "alembic.ini"
    if not alembic_ini.is_file():
        raise FileNotFoundError(f"alembic.ini not found at {alembic_ini}")

    cfg = Config(str(alembic_ini))
    cfg.set_main_option("script_location", str(_BACKEND_ROOT / "alembic"))
    logger.info("Running Alembic migrations (upgrade head)...")
    command.upgrade(cfg, "head")
    logger.info("Alembic migrations complete.")
