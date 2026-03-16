from fastapi import APIRouter

from app.bgp.service import lookup_asn, lookup_prefix
from app.dns.service import lookup_dns
from app.ip.service import lookup_ip
from app.lookup.detector import InputType, detect
from app.lookup.schemas import LookupResponse, SearchRequest
from app.lookup.store import save_result

router = APIRouter()


@router.post("/search", response_model=LookupResponse)
async def search(req: SearchRequest) -> LookupResponse:
    input_type, normalized = detect(req.q)

    result: dict = {}
    pivots: list[str] = []
    error: str | None = None

    try:
        if input_type in (InputType.IPV4, InputType.IPV6):
            result = await lookup_ip(normalized)
            pivots = [f"/api/v1/ip/{normalized}", f"/api/v1/dns/{normalized}"]

        elif input_type == InputType.DOMAIN:
            result = await lookup_dns(normalized)
            pivots = [f"/api/v1/dns/{normalized}", f"/api/v1/mail/{normalized}"]

        elif input_type in (InputType.CIDR4, InputType.CIDR6):
            result = await lookup_prefix(normalized)
            asns = result.get("origin_asns", [])
            pivots = [f"/api/v1/prefix/{normalized}"]
            if asns:
                pivots.append(f"/api/v1/asn/AS{asns[0]['asn']}")

        elif input_type == InputType.ASN:
            result = await lookup_asn(normalized)
            pivots = [f"/api/v1/asn/{normalized}"]

        elif input_type == InputType.URL:
            pivots = ["/api/v1/http/check", "/api/v1/tls/check"]

        elif input_type == InputType.EMAIL:
            domain = normalized.split("@")[1]
            pivots = [f"/api/v1/mail/{domain}", f"/api/v1/dns/{domain}"]

        elif input_type == InputType.EMAIL_HEADER:
            pass  # header parsing tool — Phase 1 placeholder

        else:
            error = f"Unrecognized input: {req.q!r}"

    except Exception as exc:
        error = str(exc)

    response = LookupResponse(
        input=req.q,
        input_type=str(input_type),
        normalized=normalized,
        result=result,
        pivots=pivots,
        error=error,
    )

    # Save to Redis — best-effort, never fails the request
    try:
        permalink_id = await save_result(response.model_dump(mode="json"))
        response.permalink_id = permalink_id
    except Exception:
        pass

    return response
