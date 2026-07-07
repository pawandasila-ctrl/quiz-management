from config.settings import settings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import asyncio
import logging
from pathlib import Path
from sqlalchemy.exc import OperationalError


from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

def get_engine_url_and_args(db_url: str):
    if not db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
        return db_url, {}

    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    parsed = urlparse(db_url)
    query_params = parse_qs(parsed.query)
    
    sslmode = query_params.pop("sslmode", [None])[0]
    query_params.pop("channel_binding", None)
    
    new_query = urlencode(query_params, doseq=True)
    parsed = parsed._replace(query=new_query)
    clean_url = urlunparse(parsed)
    
    connect_args = {}
    if sslmode in ("require", "verify-ca", "verify-full") or "ssl" in db_url:
        connect_args["ssl"] = "require"
        
    return clean_url, connect_args

DATABASE_URL, connect_args = get_engine_url_and_args(settings.DATABASE_URL)

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    bind=engine,
    class_=AsyncSession
)

Base = declarative_base()

logger = logging.getLogger(__name__)


import subprocess

def run_migrations():
    """
    Runs alembic migrations programmatically by invoking the CLI in a subprocess.
    This avoids event loop conflicts inside async FastAPI startup lifespans.
    """
    try:
        logger.info("Running database migrations via Alembic...")
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            check=True
        )
        logger.info("Database migrations completed successfully.")
        if result.stdout:
            logger.debug(f"Alembic stdout: {result.stdout}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Database migration failed: {e.stderr}")
        raise RuntimeError(f"Database migration failed: {e.stderr}")

async def get_db():
    async with SessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()
