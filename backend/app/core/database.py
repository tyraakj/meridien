from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Normalize postgresql:// to postgresql+asyncpg:// if needed
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Remove sslmode or channel_binding params if asyncpg expects standard connect args
# asyncpg uses ssl=True or ssl='require'
if "sslmode=require" in db_url:
    db_url = db_url.replace("sslmode=require", "ssl=require")
if "&channel_binding=require" in db_url:
    db_url = db_url.replace("&channel_binding=require", "")
if "?channel_binding=require" in db_url:
    db_url = db_url.replace("?channel_binding=require", "")

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    pool_pre_ping=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
