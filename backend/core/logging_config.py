import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path

from core.log_context import UserIdFilter

_LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s [user_id=%(user_id)s] %(message)s"
_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
_USER_ID_FILTER = UserIdFilter()


def setup_logging() -> None:
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    log_dir = Path(os.getenv("LOG_DIR", "/app/logs"))
    log_dir.mkdir(parents=True, exist_ok=True)

    formatter = logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT)

    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(level)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    stream_handler.addFilter(_USER_ID_FILTER)
    root.addHandler(stream_handler)

    file_handler = RotatingFileHandler(
        log_dir / "app.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    file_handler.addFilter(_USER_ID_FILTER)
    root.addHandler(file_handler)

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
