from config.settings import settings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import asyncio
import logging
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
    pool_pre_ping=True,
    echo=settings.ENVIRONMENT == "development",
    connect_args=connect_args,
)


SessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession
)

Base = declarative_base()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init_db():
    logger.info("Initializing database schemas...")
    retries = 15
    while retries > 0:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database connection and schema creation successful.")
            return
        except (OperationalError, Exception) as e:
            logger.warning(f"Database connection failed: {e}")
            logger.warning(f"Retrying in 3 seconds... ({retries - 1} retries left)")
            await asyncio.sleep(3)
            retries -= 1

   
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with SessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()
