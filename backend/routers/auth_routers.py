from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt, JWTError

from database.auth_crud import authenticate_user_from_db, get_user_by_username_from_db, create_user_in_db
from database.data_base_models import User, QuestionDBModel, AnswerDBModel, RefreshTokenDBModel
from schemas.pydantic_schemas import UserCreateSchema, UserUpdateSchema, TokenRefreshRequest
from security.cookie import OAuth2PasswordBearerWithCookie
from security.authSecurity import (
    get_current_user,
    create_access_token,
    create_refresh_token,
    get_db,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    hash_token,
    verify_token_hash,
    SECRET_KEY,
    ALGORITHM
)
from starlette.responses import Response
from datetime import timedelta, datetime, timezone
from sqlalchemy import update, select

auth_router = APIRouter()


@auth_router.post("/register")
async def register_user(user: UserCreateSchema, db: AsyncSession = Depends(get_db)):
    db_user = await get_user_by_username_from_db(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    await create_user_in_db(db=db, user=user)
    return {"message": "User registered successfully"}


@auth_router.post("/token")
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    user = await authenticate_user_from_db(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)}, expires_delta=refresh_token_expires
    )

    user_id_to_return = user.id
    username_to_return = user.username

    hashed_refresh_token = hash_token(refresh_token)
    db_refresh_token = RefreshTokenDBModel(
        user_id=user.id,
        token=hashed_refresh_token,
        expires_at=datetime.now(timezone.utc) + refresh_token_expires,
        created_at=datetime.now(timezone.utc),
    )
    db.add(db_refresh_token)
    await db.flush()
    await db.commit()

    response.set_cookie(key="access_token",
                        value=f"Bearer {access_token}",
                        httponly=True,
                        secure=False,
                        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                        samesite="lax")
    response.set_cookie(key="refresh_token",
                        value=refresh_token,
                        httponly=True,
                        secure=False,
                        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
                        samesite="lax")

    return {"message": "Logged in successfully", "username": username_to_return, "user_id": user_id_to_return}


@auth_router.get("/verify-token")
async def verify_user_token(current_user: User = Depends(get_current_user)):
    return {
        "message": "Token is valid",
        "username": current_user.username,
        "user_id": current_user.id,
    }


@auth_router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "questions_count": current_user.questions_count,
        "answers_count": current_user.answers_count,
        "language": current_user.language,
        "status": current_user.status,
    }


@auth_router.put("/me")
async def update_me(
    payload: UserUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    username_changed = payload.username != current_user.username
    language_changed = payload.language != current_user.language

    if username_changed:
        existing = await get_user_by_username_from_db(db, username=payload.username)
        if existing:
            raise HTTPException(status_code=400, detail="Username already registered")
        current_user.username = payload.username
        await db.flush()
        await db.execute(
            update(QuestionDBModel)
            .where(
                QuestionDBModel.user_id == current_user.id,
                QuestionDBModel.is_deleted.is_(False),
            )
            .values(username=payload.username)
        )
        await db.execute(
            update(AnswerDBModel)
            .where(
                AnswerDBModel.user_id == current_user.id,
                AnswerDBModel.is_deleted.is_(False),
            )
            .values(username=payload.username)
        )

    if language_changed:
        current_user.language = payload.language

    if username_changed or language_changed:
        await db.commit()
        await db.refresh(current_user)

    return {
        "username": current_user.username,
        "questions_count": current_user.questions_count,
        "answers_count": current_user.answers_count,
        "language": current_user.language,
    }


@auth_router.post("/delete-account")
async def delete_account(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.status = "DELETED"
    current_user.username = f"[DELETED_{current_user.id}]"
    await db.flush()

    user_id = current_user.id
    await db.execute(
        update(QuestionDBModel)
        .where(QuestionDBModel.user_id == user_id)
        .values(username="[DELETED]")
    )
    await db.execute(
        update(AnswerDBModel)
        .where(AnswerDBModel.user_id == user_id)
        .values(username="[DELETED]")
    )
    await db.execute(
        update(RefreshTokenDBModel)
        .where(RefreshTokenDBModel.user_id == user_id)
        .values(revoked_at=datetime.now(timezone.utc))
    )

    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    
    await db.commit()
    return {"message": "Account deleted"}


@auth_router.post("/logout")
async def logout(response: Response, db: AsyncSession = Depends(get_db), refresh_token_from_cookie: str | None = Depends(OAuth2PasswordBearerWithCookie(tokenUrl="/token", cookie_name="refresh_token", auto_error=False))):
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")

    if refresh_token_from_cookie:
        try:
            payload = jwt.decode(refresh_token_from_cookie, SECRET_KEY, algorithms=[ALGORITHM])
            user_id_str: str | None = payload.get("sub")
            if user_id_str:
                user_id = int(user_id_str)
                stmt = select(RefreshTokenDBModel).where(
                    RefreshTokenDBModel.user_id == user_id,
                    RefreshTokenDBModel.revoked_at == None
                )
                refresh_tokens = (await db.execute(stmt)).scalars().all()
                for token_db in refresh_tokens:
                    if verify_token_hash(refresh_token_from_cookie, token_db.token):
                        token_db.revoked_at = datetime.now(timezone.utc)
                        await db.flush()
                        break
                await db.commit()
        except JWTError:
            pass

    return {"message": "Logged out successfully"}


@auth_router.post("/refresh-token")
async def refresh_token(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token_from_cookie: str | None = Depends(OAuth2PasswordBearerWithCookie(tokenUrl="/token", cookie_name="refresh_token", auto_error=False))
):
    if not refresh_token_from_cookie:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    try:
        payload = jwt.decode(refresh_token_from_cookie, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token payload")
        user_id = int(user_id_str)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    db_refresh_tokens_stmt = select(RefreshTokenDBModel).where(
        RefreshTokenDBModel.user_id == user_id,
        RefreshTokenDBModel.expires_at > datetime.now(timezone.utc),
        RefreshTokenDBModel.revoked_at == None
    )
    db_refresh_tokens = (await db.execute(db_refresh_tokens_stmt)).scalars().all()

    db_refresh_token = None
    for token_db in db_refresh_tokens:
        if verify_token_hash(refresh_token_from_cookie, token_db.token):
            db_refresh_token = token_db
            break

    if not db_refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    db_refresh_token.revoked_at = datetime.now(timezone.utc)
    await db.flush()

    new_access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={"sub": str(user_id)}, expires_delta=new_access_token_expires
    )

    new_refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    new_refresh_token = create_refresh_token(
        data={"sub": str(user_id)}, expires_delta=new_refresh_token_expires
    )
    hashed_new_refresh_token = hash_token(new_refresh_token)
    new_db_refresh_token = RefreshTokenDBModel(
        user_id=user_id,
        token=hashed_new_refresh_token,
        expires_at=datetime.now(timezone.utc) + new_refresh_token_expires,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_db_refresh_token)
    await db.commit()

    response.set_cookie(key="access_token",
                        value=f"Bearer {new_access_token}",
                        httponly=True,
                        secure=False,
                        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                        samesite="lax")
    response.set_cookie(key="refresh_token",
                        value=new_refresh_token,
                        httponly=True,
                        secure=False,
                        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
                        samesite="lax")

    return {"message": "Tokens refreshed successfully", "user_id": user_id}
