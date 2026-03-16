from fastapi import APIRouter

from app.dns.service import lookup_dns
from app.lookup.schemas import LookupResponse

router = APIRouter()


@router.get("/dns/{name:path}", response_model=LookupResponse)
async def get_dns(name: str) -> LookupResponse:
    name = name.rstrip(".")
    result = await lookup_dns(name)
    return LookupResponse(
        input=name,
        input_type="domain",
        normalized=name.lower(),
        result=result,
        pivots=[f"/api/v1/mail/{name}", f"/api/v1/ip/{name}"],
    )
