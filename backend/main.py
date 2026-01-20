import uvicorn
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from init_server.lifespan import lifespan
from routers.auth_routers import auth_router
from routers.routers import router

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(auth_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
