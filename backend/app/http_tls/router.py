import ipaddress

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.http_tls.service import check_http, check_tls
from app.lookup.schemas import LookupResponse

router = APIRouter()


class HttpCheckRequest(BaseModel):
    url: str = Field(..., description="Full URL including scheme")


class TlsCheckRequest(BaseModel):
    host: str = Field(..., description="Hostname or IP")
    port: int = Field(443, ge=1, le=65535)


@router.post("/http/check", response_model=LookupResponse)
async def post_http_check(body: HttpCheckRequest) -> LookupResponse:
    if not body.url.startswith("http://") and not body.url.startswith("https://"):
        raise HTTPException(
            status_code=422,
            detail="url must start with http:// or https://",
        )

    result = await check_http(body.url)

    pivots = []
    final_url: str = result.get("final_url", body.url)
    if final_url.startswith("https://"):
        # Extract host from final URL for the TLS pivot suggestion
        pivots.append("/api/v1/tls/check")

    return LookupResponse(
        input=body.url,
        input_type="url",
        normalized=body.url,
        result=result,
        pivots=pivots,
    )


@router.post("/tls/check", response_model=LookupResponse)
async def post_tls_check(body: TlsCheckRequest) -> LookupResponse:
    if not body.host:
        raise HTTPException(status_code=422, detail="host must not be empty")

    result = await check_tls(body.host, body.port)

    # Determine input_type: ipv4 if parseable as IP, otherwise domain
    input_type = "domain"
    try:
        addr = ipaddress.ip_address(body.host)
        input_type = f"ipv{addr.version}"
    except ValueError:
        pass

    pivots = [f"/api/v1/dns/{body.host}", "/api/v1/http/check"]

    return LookupResponse(
        input=body.host,
        input_type=input_type,
        normalized=body.host,
        result=result,
        pivots=pivots,
    )
