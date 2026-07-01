import os
import sys
import asyncio
from os.path import dirname, abspath
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Add backend directory to sys.path
sys.path.insert(0, dirname(dirname(abspath(__file__))))

# Set required environment variables BEFORE any application imports that load settings
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only-12345")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("ENVIRONMENT", "testing")

from config.database import Base, get_db
from main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Create async engine for test db
engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession
)

@pytest.fixture(scope="session", autouse=True)
async def init_test_db():
    """Create all tables in the test database once per session."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def db_session():
    """Provide a clean database session for each test, rolling back changes."""
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def client(db_session):
    """Provide an HTTP client that communicates with the app using the test session."""
    async def override_get_db():
        yield db_session

    # Override get_db in the main app
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test/api") as ac:
        yield ac
        
    app.dependency_overrides.clear()
