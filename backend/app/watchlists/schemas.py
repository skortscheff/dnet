import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class WatchlistCreate(BaseModel):
    label: str = Field(max_length=200)
    input: str = Field(max_length=512)
    input_type: str = Field(max_length=50)
    check_interval_minutes: int = Field(default=60, ge=5, le=10080)
    team_id: Optional[uuid.UUID] = None


class WatchlistOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    team_id: Optional[uuid.UUID]
    label: str
    input: str
    input_type: str
    check_interval_minutes: int
    last_checked_at: Optional[datetime]
    created_at: datetime
    model_config = {"from_attributes": True}
