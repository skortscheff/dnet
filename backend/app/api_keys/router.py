import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api_keys import service as key_service
from app.api_keys.schemas import ApiKeyCreate, ApiKeyCreated, ApiKeyOut
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.core.database import get_db

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.post("", response_model=ApiKeyCreated, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    payload: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiKeyCreated:
    """Create a new API key for the authenticated user.

    The raw key is returned only once in the response. Store it securely.
    """
    api_key, raw_key = await key_service.create_api_key(db, current_user.id, payload.name)
    return ApiKeyCreated(
        id=api_key.id,
        name=api_key.name,
        prefix=api_key.prefix,
        is_active=api_key.is_active,
        last_used_at=api_key.last_used_at,
        created_at=api_key.created_at,
        raw_key=raw_key,
    )


@router.get("", response_model=list[ApiKeyOut])
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ApiKeyOut]:
    """List all API keys for the authenticated user."""
    return await key_service.list_api_keys(db, current_user.id)


@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Revoke an API key. Returns 404 if the key is not found or not owned by the user."""
    revoked = await key_service.revoke_api_key(db, key_id, current_user.id)
    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
