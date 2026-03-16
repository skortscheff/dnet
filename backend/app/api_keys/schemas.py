import uuid
from datetime import datetime
from pydantic import BaseModel


class ApiKeyCreate(BaseModel):
    name: str


class ApiKeyOut(BaseModel):
    id: uuid.UUID
    name: str
    prefix: str
    is_active: bool
    last_used_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyCreated(ApiKeyOut):
    """Returned only on creation — includes the raw key (shown once)."""

    raw_key: str
