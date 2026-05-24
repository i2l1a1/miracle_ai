from fastapi import FastAPI

from core.logging_config import setup_logging
from database.data_base_init import init_db

import logging

logger = logging.getLogger("miracle")


async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("Application starting")
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception:
        logger.exception("Database initialization failed")
        raise
    yield
    logger.info("Application shutting down")
