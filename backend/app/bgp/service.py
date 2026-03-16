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
    """ASN info + announced prefixes + visibility + IRR consistency via RIPE Stat."""
    num = asn.upper().lstrip("AS")
    resource = f"AS{num}"

    async with httpx.AsyncClient(timeout=12.0) as client:
        overview, prefixes, visibility, irr = await asyncio.gather(
            _get(client, f"{_RIPE_STAT}/as-overview/data.json?resource={resource}&sourceapp=internet-toolkit"),
            _get(client, f"{_RIPE_STAT}/announced-prefixes/data.json?resource={resource}&sourceapp=internet-toolkit"),
            _get(client, f"{_RIPE_STAT}/visibility/data.json?resource={resource}&sourceapp=internet-toolkit"),
            _get(client, f"{_RIPE_STAT}/as-routing-consistency/data.json?resource={resource}&sourceapp=internet-toolkit"),
        )

    ov = overview.get("data", {})
    pdata = prefixes.get("data", {}).get("prefixes", [])
    vis_data = visibility.get("data", {})
    irr_data = irr.get("data", {})

    all_v4 = [p["prefix"] for p in pdata if ":" not in p.get("prefix", "")]
    all_v6 = [p["prefix"] for p in pdata if ":" in p.get("prefix", "")]

    # Visibility percent: percentage of probes that see the ASN
    visibility_percent: float | None = None
    vis_peers = vis_data.get("peers_seeing", None)
    vis_total = vis_data.get("total_full_table_peers", None)
    if vis_peers is not None and vis_total:
        try:
            visibility_percent = round(vis_peers / vis_total * 100, 1)
        except (TypeError, ZeroDivisionError):
            pass

    # IRR consistency
    irr_routes = irr_data.get("routes", [])
    irr_route_count: int | None = None
    actual_route_count: int | None = None
    route_consistency_ok: bool | None = None
    if irr_routes:
        irr_count = sum(1 for r in irr_routes if r.get("in_whois"))
        actual_count = len(irr_routes)
        irr_route_count = irr_count
        actual_route_count = actual_count
        route_consistency_ok = irr_count == actual_count

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
        "visibility_percent": visibility_percent,
        "irr_route_count": irr_route_count,
        "actual_route_count": actual_route_count,
        "route_consistency_ok": route_consistency_ok,
    }


async def get_asn_prefixes(asn: str) -> dict[str, Any]:
    """All announced prefixes for an ASN, split by address family."""
    num = asn.upper().lstrip("AS")
    resource = f"AS{num}"

    async with httpx.AsyncClient(timeout=12.0) as client:
        data = await _get(
            client,
            f"{_RIPE_STAT}/announced-prefixes/data.json?resource={resource}&sourceapp=internet-toolkit",
        )

    pdata = data.get("data", {}).get("prefixes", [])
    all_v4 = sorted(
        [{"prefix": p["prefix"]} for p in pdata if ":" not in p.get("prefix", "")],
        key=lambda x: x["prefix"],
    )
    all_v6 = sorted(
        [{"prefix": p["prefix"]} for p in pdata if ":" in p.get("prefix", "")],
        key=lambda x: x["prefix"],
    )

    return {
        "asn": resource,
        "prefixes_v4": all_v4,
        "prefixes_v6": all_v6,
        "prefixes_v4_count": len(all_v4),
        "prefixes_v6_count": len(all_v6),
    }


async def get_asn_neighbours(asn: str) -> dict[str, Any]:
    """Upstream/downstream/peer neighbours for an ASN via RIPE Stat."""
    num = asn.upper().lstrip("AS")
    resource = f"AS{num}"

    async with httpx.AsyncClient(timeout=12.0) as client:
        data = await _get(
            client,
            f"{_RIPE_STAT}/asn-neighbours/data.json?resource={resource}&sourceapp=internet-toolkit",
        )

    neighbours = data.get("data", {}).get("neighbours", [])

    upstreams: list[dict[str, Any]] = []
    downstreams: list[dict[str, Any]] = []
    peers: list[dict[str, Any]] = []

    for n in neighbours:
        entry = {
            "asn": n.get("asn"),
            "power": n.get("power", 0),
            "prefixes": n.get("v4_peers", 0) + n.get("v6_peers", 0),
        }
        ntype = n.get("type", "")
        if ntype == "left":
            upstreams.append(entry)
        elif ntype == "right":
            downstreams.append(entry)
        else:
            peers.append(entry)

    upstreams.sort(key=lambda x: x["power"], reverse=True)
    downstreams.sort(key=lambda x: x["power"], reverse=True)
    peers.sort(key=lambda x: x["power"], reverse=True)

    return {
        "asn": resource,
        "upstreams": upstreams[:50],
        "downstreams": downstreams[:50],
        "peers": peers[:50],
        "upstream_count": len(upstreams),
        "downstream_count": len(downstreams),
        "peer_count": len(peers),
    }


async def get_asn_whois(asn: str) -> dict[str, Any]:
    """RDAP WHOIS data for an ASN via IANA."""
    num = asn.upper().lstrip("AS")
    resource = f"AS{num}"
    rdap_url = f"https://rdap.iana.org/autnum/{num}"

    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            r = await client.get(rdap_url, headers=_HEADERS)
            if r.status_code != 200:
                return {"asn": resource, "remarks": [], "links": [], "rdap_url": rdap_url}
            raw = r.json()
    except Exception:
        return {"asn": resource, "remarks": [], "links": [], "rdap_url": rdap_url}

    try:
        # Extract org name from entities
        org: str | None = None
        rir: str | None = None
        for entity in raw.get("entities", []):
            roles = entity.get("roles", [])
            vcard = entity.get("vcardArray", [None, []])[1] if entity.get("vcardArray") else []
            for prop in vcard:
                if prop[0] == "fn":
                    if "registrant" in roles or "technical" in roles:
                        org = prop[3]
                    if "iana" in [r.lower() for r in roles] or not org:
                        org = org or prop[3]
            for sub in entity.get("entities", []):
                sub_roles = sub.get("roles", [])
                sub_vcard = sub.get("vcardArray", [None, []])[1] if sub.get("vcardArray") else []
                for prop in sub_vcard:
                    if prop[0] == "fn" and "registrant" in sub_roles:
                        rir = prop[3]

        # Extract remarks
        remarks_list: list[str] = []
        for rem in raw.get("remarks", []):
            desc = rem.get("description", [])
            if isinstance(desc, list):
                remarks_list.extend(desc)
            elif isinstance(desc, str):
                remarks_list.append(desc)

        # Extract links
        links_list: list[str] = [
            lnk["href"] for lnk in raw.get("links", []) if lnk.get("href")
        ]

        # Dates
        reg_date: str | None = None
        changed_date: str | None = None
        for event in raw.get("events", []):
            action = event.get("eventAction", "")
            date = event.get("eventDate", "")
            if action == "registration":
                reg_date = date[:10] if date else None
            elif action in ("last changed", "last updated"):
                changed_date = date[:10] if date else None

        return {
            "asn": resource,
            "handle": raw.get("handle"),
            "name": raw.get("name"),
            "org": org,
            "country": raw.get("country"),
            "rir": rir,
            "registration_date": reg_date,
            "last_changed_date": changed_date,
            "remarks": remarks_list,
            "links": links_list,
            "rdap_url": rdap_url,
        }
    except Exception:
        return {"asn": resource, "remarks": [], "links": [], "rdap_url": rdap_url}


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
