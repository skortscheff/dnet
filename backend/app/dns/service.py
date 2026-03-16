import asyncio
from typing import Any

import dns.asyncresolver
import dns.exception


RECORD_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "SOA", "CNAME", "CAA"]


async def _query(name: str, rdtype: str) -> list:
    try:
        resolver = dns.asyncresolver.Resolver()
        resolver.timeout = 5
        resolver.lifetime = 8
        answers = await resolver.resolve(name, rdtype, raise_on_no_answer=False)

        if rdtype == "MX":
            # Return structured objects so the frontend can access priority and exchange
            return sorted(
                [
                    {
                        "priority": r.preference,
                        "exchange": r.exchange.to_text().rstrip("."),
                    }
                    for r in answers
                ],
                key=lambda x: x["priority"],
            )

        return [r.to_text() for r in answers]
    except (dns.exception.DNSException, Exception):
        return []


async def lookup_dns(name: str) -> dict[str, Any]:
    results = await asyncio.gather(*[_query(name, t) for t in RECORD_TYPES])
    records = {rdtype: rdata for rdtype, rdata in zip(RECORD_TYPES, results)}
    return {"name": name, "records": records}
