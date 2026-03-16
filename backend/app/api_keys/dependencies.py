from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.api_keys import service as key_service
from app.auth.dependencies import get_current_user_optional
from app.auth.models import User
from app.core.database import get_db


async def get_user_from_key_or_token(
    x_api_key: str | None = Header(default=None),
    token_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Resolve the caller's identity from either a JWT Bearer token or an API key.

    Precedence: JWT token takes priority over X-API-Key header.
    Returns None if neither credential is provided or if authentication fails.
    """
    if token_user:
        return token_user
    if x_api_key:
        return await key_service.authenticate_api_key(db, x_api_key)
    return None
