import uuid
from datetime import datetime

from pydantic import BaseModel


class SavedResultCreate(BaseModel):
    permalink_id: str
    label: str | None = None
    input: str
    input_type: str


class SavedResultOut(BaseModel):
    id: uuid.UUID
    permalink_id: str
    label: str | None
    input: str
    input_type: str
    created_at: datetime
    model_config = {"from_attributes": True}
