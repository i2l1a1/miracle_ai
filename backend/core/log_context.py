import logging
from contextvars import ContextVar, Token

from jose import JWTError, jwt
from starlette.requests import Request

user_id_var: ContextVar[str] = ContextVar("user_id", default="-")


def bind_user_id(request: Request) -> Token:
    return user_id_var.set(_user_id_from_access_cookie(request))


def clear_user_id(token: Token) -> None:
    user_id_var.reset(token)


def _user_id_from_access_cookie(request: Request) -> str:
    raw = request.cookies.get("access_token")
    if not raw:
        return "-"
    value = raw.strip()
    if value.lower().startswith("bearer "):
        value = value[7:].strip()
    if not value:
        return "-"
    try:
        from security.authSecurity import ALGORITHM, SECRET_KEY

        payload = jwt.decode(value, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            return "-"
        return str(int(sub))
    except (JWTError, TypeError, ValueError):
        return "-"


class UserIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.user_id = user_id_var.get()
        return True
