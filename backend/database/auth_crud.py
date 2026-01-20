from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.data_base_models import User
from schemas.pydantic_schemas import UserCreateSchema
from security.authSecurity import pwd_context, verify_password


async def get_user_by_username_from_db(db: AsyncSession, username: str):
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def create_user_in_db(db: AsyncSession, user: UserCreateSchema):
    hashed_password = pwd_context.hash(user.password)
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    await db.commit()
    return "complete"


async def authenticate_user_from_db(username: str, password: str, db: AsyncSession):
    user = await get_user_by_username_from_db(db, username=username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user
