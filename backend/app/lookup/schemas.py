from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    q: str = Field(
        ...,
        min_length=1,
        max_length=512,
        description="Any domain, IP, ASN, prefix, URL, or email address",
    )


class LookupResponse(BaseModel):
    input: str
    input_type: str
    normalized: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    result: dict[str, Any] = {}
    pivots: list[str] = []
    error: str | None = None
    permalink_id: str | None = None
