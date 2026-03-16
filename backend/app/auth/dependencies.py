from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.auth import service as auth_service
from app.auth.models import User

bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token_data = auth_service.decode_token(credentials.credentials)
    user = await db.get(User, token_data.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Returns None instead of raising if unauthenticated."""
    if not credentials:
        return None
    try:
        token_data = auth_service.decode_token(credentials.credentials)
        user = await db.get(User, token_data.user_id)
        return user if (user and user.is_active) else None
    except Exception:
        return None
