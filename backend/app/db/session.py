import os
import urllib.parse
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost:5432/bsdsteel")

# Normalize postgres:// → postgresql+asyncpg://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Supabase transaction pooler (port 6543) requires statement_cache_size=0
# Also decode URL-encoded credentials for asyncpg
is_supabase = "supabase.com" in DATABASE_URL

connect_args = {}
if is_supabase:
    parsed = urllib.parse.urlparse(DATABASE_URL)
    connect_args = {
        "statement_cache_size": 0,
        "server_settings": {"application_name": "bsdsteel"},
    }

engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

Base = declarative_base()
