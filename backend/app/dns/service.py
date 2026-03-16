import asyncio
from typing import Any

import dns.asyncresolver
import dns.exception


RECORD_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "SOA", "CNAME", "CAA"]


async def _query(name: str, rdtype: str) -> list[str]:
    try:
        resolver = dns.asyncresolver.Resolver()
        resolver.timeout = 5
        resolver.lifetime = 8
        answers = await resolver.resolve(name, rdtype, raise_on_no_answer=False)
        return [r.to_text() for r in answers]
    except (dns.exception.DNSException, Exception):
        return []


async def lookup_dns(name: str) -> dict[str, Any]:
    results = await asyncio.gather(*[_query(name, t) for t in RECORD_TYPES])
    records = {rdtype: rdata for rdtype, rdata in zip(RECORD_TYPES, results)}
    return {"name": name, "records": records}
