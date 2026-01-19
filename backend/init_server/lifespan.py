from fastapi import FastAPI

from database.data_base_init import init_db


async def lifespan(app: FastAPI):
    await init_db()
    yield
