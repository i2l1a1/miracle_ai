import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from core.log_context import bind_user_id, clear_user_id

logger = logging.getLogger("miracle.api")

_QUIET_PATHS = frozenset({"/verify-token", "/me", "/docs", "/openapi.json", "/redoc"})


class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        token = bind_user_id(request)
        start = time.perf_counter()
        try:
            response = await call_next(request)
            path = request.url.path
            if path not in _QUIET_PATHS:
                duration_ms = (time.perf_counter() - start) * 1000
                logger.info(
                    f"{request.method} {path} status={response.status_code} duration_ms={duration_ms:.1f}"
                )
            return response
        finally:
            clear_user_id(token)
