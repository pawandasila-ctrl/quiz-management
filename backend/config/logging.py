import logging
import json
import sys
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Production formatter that emits one JSON object per log line with level-specific structures."""

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if record.levelno >= logging.ERROR:
            log_data["file"] = record.pathname
            log_data["line"] = record.lineno
            log_data["function"] = record.funcName
            log_data["exc_info"] = self.formatException(record.exc_info) if record.exc_info else None
        elif record.levelno == logging.WARNING:
            log_data["function"] = record.funcName
            log_data["line"] = record.lineno
            if record.exc_info:
                log_data["exc_info"] = self.formatException(record.exc_info)
        elif record.levelno == logging.DEBUG:
            log_data["module"] = record.module
            log_data["line"] = record.lineno

        if record.stack_info:
            log_data["stack_info"] = self.formatStack(record.stack_info)

        return json.dumps(log_data)


class PlainFormatter(logging.Formatter):
    """Development formatter that emits clean plain text without ANSI colors."""

    def format(self, record: logging.LogRecord) -> str:
        levelname = f"{record.levelname:<8}"

        if record.levelno >= logging.ERROR:
            fmt = f"%(asctime)s {levelname} %(name)s [%(pathname)s:%(lineno)d in %(funcName)s]: %(message)s"
        elif record.levelno == logging.WARNING:
            fmt = f"%(asctime)s {levelname} %(name)s [%(filename)s:%(lineno)d]: %(message)s"
        else:
            fmt = f"%(asctime)s {levelname} %(name)s: %(message)s"

        formatter = logging.Formatter(fmt=fmt, datefmt="%Y-%m-%d %H:%M:%S")
        return formatter.format(record)


def setup_logging(environment: str = "development") -> None:
    """
    Configure root logger.
    - production  → JSON lines to stdout (machine-parseable)
    - development → human-readable plain text (no colors)
    """
    root = logging.getLogger()
    root.setLevel(logging.INFO)

    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    if environment == "production":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(PlainFormatter())

    root.addHandler(handler)

    if environment == "production":
        for logger_name in ("uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"):
            l = logging.getLogger(logger_name)
            l.handlers = []
            l.propagate = True

    if environment != "development":
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
