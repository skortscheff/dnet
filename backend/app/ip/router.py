import ipaddress

from fastapi import APIRouter, HTTPException

from app.ip.service import lookup_ip
from app.lookup.schemas import LookupResponse

router = APIRouter()


@router.get("/ip/{ip}", response_model=LookupResponse)
async def get_ip(ip: str) -> LookupResponse:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid IP address: {ip!r}")

    result = await lookup_ip(str(addr))
    return LookupResponse(
        input=ip,
        input_type=f"ipv{addr.version}",
        normalized=str(addr),
        result=result,
        pivots=[f"/api/v1/dns/{ip}"],
    )
