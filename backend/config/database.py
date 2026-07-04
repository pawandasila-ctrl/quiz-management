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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _stamp_head_if_unversioned(sync_conn) -> None:
    """
    If this DB has never been touched by Alembic (no alembic_version row), stamp it at head
    right after create_all() bootstraps a fresh schema -- so future `alembic upgrade` calls
    don't try to replay history against a DB that's already at the latest shape.
    Existing, already-versioned DBs are left untouched; run `alembic upgrade head` to apply
    pending migrations to those (see Dockerfile / README).
    """
    from alembic.config import Config as AlembicConfig
    from alembic.script import ScriptDirectory
    from alembic.runtime.migration import MigrationContext

    backend_dir = Path(__file__).resolve().parent.parent
    alembic_cfg = AlembicConfig(str(backend_dir / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    script = ScriptDirectory.from_config(alembic_cfg)

    context = MigrationContext.configure(sync_conn)
    if context.get_current_revision() is None:
        context.stamp(script, "head")


async def init_db():
    logger.info("Initializing database schemas...")
    retries = 15
    while retries > 0:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                await conn.run_sync(_stamp_head_if_unversioned)
            logger.info("Database connection and schema creation successful.")
            return
        except (OperationalError, Exception) as e:
            logger.warning(f"Database connection failed: {e}")
            logger.warning(f"Retrying in 3 seconds... ({retries - 1} retries left)")
            await asyncio.sleep(3)
            retries -= 1


    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_stamp_head_if_unversioned)


async def get_db():
    async with SessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()
