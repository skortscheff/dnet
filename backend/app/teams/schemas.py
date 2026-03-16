import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class TeamCreate(BaseModel):
    name: str = Field(max_length=100)


class TeamOut(BaseModel):
    id: uuid.UUID
    name: str
    owner_id: uuid.UUID
    created_at: datetime
    model_config = {"from_attributes": True}


class TeamMemberOut(BaseModel):
    id: uuid.UUID
    team_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    joined_at: datetime
    model_config = {"from_attributes": True}


class TeamInvite(BaseModel):
    email: str
