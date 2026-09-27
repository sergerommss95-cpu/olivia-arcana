"""Database setup — SQLAlchemy async. Postgres in prod (DATABASE_URL), SQLite for dev."""

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from db.models import Base

_raw_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/olivia.db")

# Railway/Heroku-style URLs arrive as postgres:// or postgresql:// —
# rewrite to the asyncpg driver the async engine requires.
if _raw_url.startswith("postgres://"):
    _raw_url = _raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgresql://"):
    _raw_url = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

DATABASE_URL = _raw_url

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Create all tables."""
    if DATABASE_URL.startswith("sqlite"):
        os.makedirs("data", exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """Dependency: yield a DB session."""
    async with AsyncSessionLocal() as session:
        yield session
