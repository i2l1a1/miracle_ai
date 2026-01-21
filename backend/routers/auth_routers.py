from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm

from database.auth_crud import authenticate_user_from_db, get_user_by_username_from_db, create_user_in_db
from database.data_base_models import User
from schemas.pydantic_schemas import UserCreateSchema
from security.authSecurity import (
    get_current_user,
    create_access_token,
    get_db,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from starlette.responses import Response
from datetime import timedelta

auth_router = APIRouter()


@auth_router.post("/register")
async def register_user(user: UserCreateSchema, db: AsyncSession = Depends(get_db)):
    db_user = await get_user_by_username_from_db(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    await create_user_in_db(db=db, user=user)
    return {"message": "User registered successfully"}


@auth_router.post("/token")
async def login_for_access_token(response: Response, form_data: OAuth2PasswordRequestForm = Depends(),
                                 db: AsyncSession = Depends(get_db)):
    user = await authenticate_user_from_db(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    response.set_cookie(key="access_token",
                        value=f"Bearer {access_token}",
                        httponly=True,
                        secure=False,
                        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                        samesite="lax")
    return {"message": "Logged in successfully"}


@auth_router.get("/verify-token")
async def verify_user_token(current_user: User = Depends(get_current_user)):
    return {"message": "Token is valid", "username": current_user.username}


@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}
