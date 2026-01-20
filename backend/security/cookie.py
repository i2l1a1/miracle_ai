from typing import Dict, Optional
from fastapi.security import OAuth2
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from fastapi import Request, status, HTTPException
from fastapi.security.utils import get_authorization_scheme_param


class OAuth2PasswordBearerWithCookie(OAuth2):
    def __init__(
            self,
            tokenUrl: str,
            auto_error: bool = True,
    ):
        flows = OAuthFlowsModel(password={"tokenUrl": tokenUrl, "scopes": {}})
        super().__init__(flows=flows, auto_error=auto_error)

    async def __call__(self, request: Request) -> Optional[str]:
        authorization: str = request.cookies.get("access_token")

        scheme, token = get_authorization_scheme_param(authorization)
        if not authorization or scheme.lower() != "bearer":
            if self.auto_error:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated",
                                    headers={"WWW-Authenticate": "Bearer"})
            else:
                return None
        return token
