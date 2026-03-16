import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


class AlertCreate(BaseModel):
    watchlist_id: uuid.UUID
    name: str = Field(max_length=200)
    channel_type: str = Field(default="webhook", pattern="^webhook$")
    channel_url: str = Field(max_length=1024)
    is_active: bool = True


class AlertUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    channel_url: Optional[str] = Field(default=None, max_length=1024)
    is_active: Optional[bool] = None


class AlertOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    watchlist_id: uuid.UUID
    name: str
    channel_type: str
    channel_url: str
    is_active: bool
    last_triggered_at: Optional[datetime]
    created_at: datetime
    model_config = {"from_attributes": True}
