import uvicorn
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from init_server.lifespan import lifespan
from routers.routers import router

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
