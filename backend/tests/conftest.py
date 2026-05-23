import importlib
import os
import sys
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from dotenv import load_dotenv
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

load_dotenv(BACKEND_ROOT / ".env")

os.environ.setdefault(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://miracle_user:miracle_password@db:5432/miracle_db_test",
)
os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("REFRESH_TOKEN_EXPIRE_DAYS", "7")
os.environ.setdefault("USERNAME_FOR_PARSING", "parse_user")
os.environ.setdefault("PASSWORD_FOR_PARSING", "parse_pass")


def _migration_statements(sql: str) -> list[str]:
    body = sql.strip()
    if not body:
        return []
    if "$$" in body:
        return [body]
    statements = []
    for chunk in body.split(";"):
        stmt = chunk.strip()
        if stmt:
            statements.append(stmt)
    return statements


async def _schema_is_complete(conn) -> bool:
    result = await conn.execute(
        text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = 'answers' AND column_name = 'status'"
        )
    )
    return result.scalar() is not None


async def _apply_migrations(engine) -> None:
    sql_files = sorted((BACKEND_ROOT / "flyway" / "sql").glob("V*.sql"))
    async with engine.begin() as conn:
        for path in sql_files:
            raw = path.read_text(encoding="utf-8")
            for stmt in _migration_statements(raw):
                await conn.execute(text(stmt))


async def _ensure_test_database_and_schema() -> None:
    test_url = make_url(os.environ["TEST_DATABASE_URL"])
    db_name = test_url.database
    if not db_name:
        raise RuntimeError("TEST_DATABASE_URL must include a database name")

    admin_engine = create_async_engine(
        test_url.set(database="postgres"),
        isolation_level="AUTOCOMMIT",
        poolclass=NullPool,
    )
    async with admin_engine.connect() as conn:
        exists = await conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
            {"dbname": db_name},
        )
        if exists.scalar() is None:
            await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    await admin_engine.dispose()

    probe_engine = create_async_engine(
        os.environ["TEST_DATABASE_URL"],
        poolclass=NullPool,
    )
    async with probe_engine.connect() as conn:
        has_users = await conn.execute(text("SELECT to_regclass('public.users')"))
        if has_users.scalar() is not None and await _schema_is_complete(conn):
            await probe_engine.dispose()
            return
    await probe_engine.dispose()

    admin_engine = create_async_engine(
        test_url.set(database="postgres"),
        isolation_level="AUTOCOMMIT",
        poolclass=NullPool,
    )
    async with admin_engine.connect() as conn:
        await conn.execute(
            text(f'ALTER DATABASE "{db_name}" WITH ALLOW_CONNECTIONS false')
        )
        await conn.execute(
            text(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                "WHERE datname = :dbname AND pid <> pg_backend_pid()"
            ),
            {"dbname": db_name},
        )
        await conn.execute(text(f'DROP DATABASE IF EXISTS "{db_name}"'))
        await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    await admin_engine.dispose()

    migrate_engine = create_async_engine(
        os.environ["TEST_DATABASE_URL"],
        poolclass=NullPool,
    )
    await _apply_migrations(migrate_engine)
    await migrate_engine.dispose()


def _bind_test_engine(engine) -> None:
    import database.data_base_init as db_init

    db_init.engine = engine
    db_init.SessionLocal = async_sessionmaker(
        engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )

    import security.authSecurity as auth_security
    import database.auth_crud as auth_crud_module
    import database.crud as crud_module

    importlib.reload(auth_security)
    importlib.reload(auth_crud_module)
    importlib.reload(crud_module)


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    await _ensure_test_database_and_schema()
    engine = create_async_engine(
        os.environ["TEST_DATABASE_URL"],
        poolclass=NullPool,
    )
    _bind_test_engine(engine)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def clean_database(test_engine):
    async with test_engine.connect() as conn:
        await conn.execute(
            text(
                "TRUNCATE TABLE votes, question_tags, answers, questions, "
                "refresh_tokens, users RESTART IDENTITY CASCADE"
            )
        )
        await conn.commit()
    yield


def unique_name(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


async def register_user(client: AsyncClient, username: str, password: str) -> None:
    response = await client.post(
        "/register",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200, response.text


async def login_user(client: AsyncClient, username: str, password: str) -> None:
    response = await client.post(
        "/token",
        data={"username": username, "password": password},
    )
    assert response.status_code == 200, response.text


@pytest_asyncio.fixture
async def client(test_engine):
    from main import app

    with patch("init_server.lifespan.init_db", AsyncMock()):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
