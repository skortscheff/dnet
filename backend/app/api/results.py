from fastapi import APIRouter, HTTPException

from app.lookup.schemas import LookupResponse
from app.lookup.store import get_result

router = APIRouter()


@router.get("/lookup/{permalink_id}", response_model=LookupResponse)
async def get_lookup(permalink_id: str) -> LookupResponse:
    data = await get_result(permalink_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Result not found or expired")
    return LookupResponse(**data)
