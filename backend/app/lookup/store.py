import json
import uuid
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

_TTL_SECONDS = 7 * 24 * 3600  # 7 days


def _client() -> aioredis.Redis:
    return aioredis.from_url(settings.redis_url, decode_responses=True)


async def save_result(data: dict[str, Any]) -> str:
    """Persist a lookup result and return its permalink ID."""
    permalink_id = str(uuid.uuid4())
    client = _client()
    try:
        await client.setex(
            f"lookup:{permalink_id}",
            _TTL_SECONDS,
            json.dumps(data, default=str),  # default=str handles datetime serialization
        )
    finally:
        await client.aclose()
    return permalink_id


async def get_result(permalink_id: str) -> dict[str, Any] | None:
    """Retrieve a previously stored lookup result. Returns None if not found or expired."""
    client = _client()
    try:
        raw = await client.get(f"lookup:{permalink_id}")
        if raw is None:
            return None
        return json.loads(raw)
    finally:
        await client.aclose()
