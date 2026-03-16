import re

from fastapi import APIRouter, HTTPException

from app.mail.service import lookup_mail
from app.lookup.schemas import LookupResponse

router = APIRouter()

_DOMAIN_RE = re.compile(
    r"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$"
)


@router.get("/mail/{domain:path}", response_model=LookupResponse)
async def get_mail(domain: str) -> LookupResponse:
    domain = domain.rstrip(".").lower()
    if not _DOMAIN_RE.match(domain):
        raise HTTPException(status_code=422, detail=f"Invalid domain: {domain!r}")

    error: str | None = None
    result: dict = {}
    try:
        result = await lookup_mail(domain)
    except Exception as exc:
        error = str(exc)

    return LookupResponse(
        input=domain,
        input_type="domain",
        normalized=domain,
        result=result,
        error=error,
        pivots=[f"/api/v1/dns/{domain}"],
    )
