import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class SnapshotOut(BaseModel):
    id: uuid.UUID
    watchlist_id: uuid.UUID
    result_data: dict[str, Any]
    taken_at: datetime
    model_config = {"from_attributes": True}
