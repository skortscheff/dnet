import hashlib
import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api_keys.models import ApiKey


def generate_api_key() -> tuple[str, str, str]:
    """Generate a new API key.

    Returns:
        A tuple of (raw_key, prefix, key_hash).
    """
    raw_key = "itk_" + secrets.token_urlsafe(32)
    prefix = raw_key[:8]
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    return raw_key, prefix, key_hash


async def create_api_key(
    db: AsyncSession,
    user_id: uuid.UUID,
    name: str,
) -> tuple[ApiKey, str]:
    """Create a new API key for a user.

    Returns:
        A tuple of (ApiKey record, raw_key). The raw_key is only available
        at creation time and must be shown to the user immediately.
    """
    raw_key, prefix, key_hash = generate_api_key()
    api_key = ApiKey(
        user_id=user_id,
        name=name,
        key_hash=key_hash,
        prefix=prefix,
        is_active=True,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    return api_key, raw_key


async def list_api_keys(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[ApiKey]:
    """List all API keys belonging to a user."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == user_id).order_by(ApiKey.created_at.desc())
    )
    return list(result.scalars().all())


async def revoke_api_key(
    db: AsyncSession,
    key_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    """Revoke an API key by setting is_active=False.

    Returns:
        True if the key was found and revoked, False if not found or not
        owned by the given user.
    """
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user_id)
    )
    api_key = result.scalar_one_or_none()
    if api_key is None:
        return False
    api_key.is_active = False
    await db.commit()
    return True


async def authenticate_api_key(
    db: AsyncSession,
    raw_key: str,
):
    """Authenticate a request using a raw API key.

    Hashes the key, looks up the record, verifies it is active, updates
    last_used_at, and returns the associated User or None.
    """
    # Import here to avoid circular imports at module load time; the auth
    # agent will create this module before the app starts.
    from app.auth.models import User  # noqa: PLC0415

    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    result = await db.execute(
        select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)  # noqa: E712
    )
    api_key = result.scalar_one_or_none()
    if api_key is None:
        return None

    # Update last_used_at
    api_key.last_used_at = datetime.now(tz=timezone.utc)
    await db.commit()

    # Load and return the associated user
    user_result = await db.execute(
        select(User).where(User.id == api_key.user_id, User.is_active == True)  # noqa: E712
    )
    return user_result.scalar_one_or_none()
