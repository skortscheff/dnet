import ipaddress

from fastapi import APIRouter, HTTPException, Request

from app.ip.service import lookup_ip
from app.lookup.schemas import LookupResponse

router = APIRouter()


@router.get("/ip/me", response_model=LookupResponse)
async def get_my_ip(request: Request) -> LookupResponse:
    """Detect and look up the caller's public IP address."""
    # nginx sets X-Real-IP to $remote_addr; fall back to X-Forwarded-For then direct
    ip = (
        request.headers.get("x-real-ip")
        or (request.headers.get("x-forwarded-for", "").split(",")[0].strip() or None)
        or (request.client.host if request.client else None)
        or "127.0.0.1"
    )
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Could not determine client IP: {ip!r}")

    result = await lookup_ip(str(addr))
    return LookupResponse(
        input=str(addr),
        input_type=f"ipv{addr.version}",
        normalized=str(addr),
        result=result,
        pivots=[f"/api/v1/dns/{addr}"],
    )


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
