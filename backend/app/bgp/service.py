import asyncio
from typing import Any

import httpx

_HEADERS = {"User-Agent": "internet-toolkit/0.1", "Accept": "application/json"}
_RIPE_STAT = "https://stat.ripe.net/data"


async def _get(client: httpx.AsyncClient, url: str) -> dict[str, Any]:
    try:
        r = await client.get(url, headers=_HEADERS, timeout=10.0)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return {}


async def lookup_asn(asn: str) -> dict[str, Any]:
    """ASN info + announced prefixes via RIPE Stat."""
    num = asn.upper().lstrip("AS")
    resource = f"AS{num}"

    async with httpx.AsyncClient(timeout=12.0) as client:
        overview, prefixes = await asyncio.gather(
            _get(client, f"{_RIPE_STAT}/as-overview/data.json?resource={resource}&sourceapp=internet-toolkit"),
            _get(client, f"{_RIPE_STAT}/announced-prefixes/data.json?resource={resource}&sourceapp=internet-toolkit"),
        )

    ov = overview.get("data", {})
    pdata = prefixes.get("data", {}).get("prefixes", [])

    all_v4 = [p["prefix"] for p in pdata if ":" not in p.get("prefix", "")]
    all_v6 = [p["prefix"] for p in pdata if ":" in p.get("prefix", "")]

    return {
        "asn": resource,
        "name": ov.get("holder"),
        "description": ov.get("block", {}).get("desc") if ov.get("block") else None,
        "country": None,  # RIPE Stat as-overview doesn't include country; available via other endpoints
        "rir": ov.get("block", {}).get("name") if ov.get("block") else None,
        "announced": ov.get("announced"),
        "prefixes_v4": all_v4[:25],
        "prefixes_v6": all_v6[:10],
        "prefixes_v4_count": len(all_v4),
        "prefixes_v6_count": len(all_v6),
    }


async def lookup_prefix(cidr: str) -> dict[str, Any]:
    """Prefix origin + RPKI validity via RIPE Stat + Cloudflare."""
    async with httpx.AsyncClient(timeout=12.0) as client:
        overview = await _get(
            client,
            f"{_RIPE_STAT}/prefix-overview/data.json?resource={cidr}&sourceapp=internet-toolkit",
        )

    data = overview.get("data", {})
    asns_raw = data.get("asns", [])
    origin_asns = [
        {"asn": a.get("asn"), "name": a.get("holder")}
        for a in asns_raw
        if a.get("asn") is not None
    ]

    rpki_state: str | None = None
    rpki_description: str | None = None

    if origin_asns:
        first_asn = origin_asns[0]["asn"]
        rpki_url = (
            f"{_RIPE_STAT}/rpki-validation/data.json"
            f"?resource=AS{first_asn}&prefix={cidr}&sourceapp=internet-toolkit"
        )
        async with httpx.AsyncClient(timeout=10.0) as client:
            rpki_data = await _get(client, rpki_url)
        rdata = rpki_data.get("data", {})
        rpki_state = rdata.get("status")
        roas = rdata.get("validating_roas", [])
        rpki_description = f"{len(roas)} covering ROA(s)" if roas else None

    block = data.get("block", {})

    return {
        "prefix": cidr,
        "name": block.get("name"),
        "description": block.get("desc"),
        "country": None,
        "origin_asns": origin_asns,
        "rpki_state": rpki_state,
        "rpki_description": rpki_description,
        "is_less_specific": data.get("is_less_specific"),
        "related_prefixes_count": len(data.get("related_prefixes", [])),
    }
