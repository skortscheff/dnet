import ipaddress
import re

from fastapi import APIRouter, HTTPException

from app.bgp.service import lookup_asn, lookup_prefix
from app.lookup.schemas import LookupResponse

router = APIRouter()

_ASN_RE = re.compile(r"^AS?(\d+)$", re.IGNORECASE)


@router.get("/asn/{asn}", response_model=LookupResponse)
async def get_asn(asn: str) -> LookupResponse:
    m = _ASN_RE.match(asn.strip())
    if not m:
        raise HTTPException(status_code=422, detail=f"Invalid ASN: {asn!r}")

    normalized = f"AS{m.group(1)}"
    result = await lookup_asn(normalized)

    return LookupResponse(
        input=asn,
        input_type="asn",
        normalized=normalized,
        result=result,
        pivots=[f"/api/v1/asn/{normalized}"],
    )


@router.get("/prefix/{cidr:path}", response_model=LookupResponse)
async def get_prefix(cidr: str) -> LookupResponse:
    try:
        net = ipaddress.ip_network(cidr, strict=False)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid CIDR prefix: {cidr!r}")

    normalized = str(net)
    result = await lookup_prefix(normalized)

    pivots = [f"/api/v1/prefix/{normalized}"]
    asns = result.get("origin_asns", [])
    if asns:
        pivots.append(f"/api/v1/asn/AS{asns[0]['asn']}")

    return LookupResponse(
        input=cidr,
        input_type=f"cidr{net.version}",
        normalized=normalized,
        result=result,
        pivots=pivots,
    )
