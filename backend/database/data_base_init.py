from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = async_sessionmaker(engine, autocommit=False, autoflush=False)

Base = declarative_base()


async def init_db():
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
