import logging
import json
import sys
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Production formatter that emits one JSON object per log line."""

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "exc_info": self.formatException(record.exc_info) if record.exc_info else None,
            "stack_info": self.formatStack(record.stack_info) if record.stack_info else None,
        }
        return json.dumps(log_data)


def setup_logging(environment: str = "development") -> None:
    """
    Configure root logger.
    - production  → JSON lines to stdout (machine-parseable)
    - development → human-readable coloured text
    """
    root = logging.getLogger()
    root.setLevel(logging.INFO)

    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    if environment == "production":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(
            logging.Formatter(
                fmt="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )

    root.addHandler(handler)

    if environment == "production":
        # Force uvicorn and fastapi logs to propagate to root logger and use our JSONFormatter
        for logger_name in ("uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"):
            l = logging.getLogger(logger_name)
            l.handlers = []
            l.propagate = True

    if environment != "development":
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
