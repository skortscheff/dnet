import asyncio
import re
from typing import Any

import dns.asyncresolver
import dns.exception


_DKIM_SELECTORS = [
    "google",
    "default",
    "mail",
    "k1",
    "selector1",
    "selector2",
    "smtp",
    "dkim",
    "mailjet",
    "mandrill",
    "sendgrid",
]


async def _txt_records(name: str) -> list[str]:
    try:
        resolver = dns.asyncresolver.Resolver()
        resolver.timeout = 5
        resolver.lifetime = 8
        answers = await resolver.resolve(name, "TXT", raise_on_no_answer=False)
        return [r.to_text().strip('"') for r in answers]
    except (dns.exception.DNSException, Exception):
        return []


async def _mx_records(name: str) -> list[dict[str, Any]]:
    try:
        resolver = dns.asyncresolver.Resolver()
        resolver.timeout = 5
        resolver.lifetime = 8
        answers = await resolver.resolve(name, "MX", raise_on_no_answer=False)
        records = [
            {"priority": r.preference, "host": r.exchange.to_text().rstrip(".")}
            for r in answers
        ]
        return sorted(records, key=lambda x: x["priority"])
    except (dns.exception.DNSException, Exception):
        return []


async def _check_mx(domain: str) -> dict[str, Any]:
    try:
        records = await _mx_records(domain)
        return {"records": records, "found": bool(records)}
    except Exception:
        return {"records": [], "found": False}


async def _check_spf(domain: str) -> dict[str, Any]:
    try:
        txts = await _txt_records(domain)
        spf = next((r for r in txts if r.startswith("v=spf1")), None)
        return {
            "found": spf is not None,
            "record": spf,
            "valid": spf is not None and spf.startswith("v=spf1"),
        }
    except Exception:
        return {"found": False, "record": None, "valid": False}


async def _check_dmarc(domain: str) -> dict[str, Any]:
    try:
        txts = await _txt_records(f"_dmarc.{domain}")
        record = next((r for r in txts if r.startswith("v=DMARC1")), None)
        if record is None:
            return {"found": False, "record": None, "policy": None, "rua": None}

        def _tag(tag: str) -> str | None:
            m = re.search(rf"(?:^|;\s*){re.escape(tag)}=([^;]+)", record)
            return m.group(1).strip() if m else None

        return {
            "found": True,
            "record": record,
            "policy": _tag("p"),
            "rua": _tag("rua"),
        }
    except Exception:
        return {"found": False, "record": None, "policy": None, "rua": None}


async def _check_dkim_selector(selector: str, domain: str) -> str | None:
    try:
        txts = await _txt_records(f"{selector}._domainkey.{domain}")
        combined = " ".join(txts)
        if "v=DKIM1" in combined or "k=rsa" in combined or "p=" in combined:
            return selector
        return None
    except Exception:
        return None


async def _check_dkim(domain: str) -> dict[str, Any]:
    try:
        results = await asyncio.gather(
            *[_check_dkim_selector(sel, domain) for sel in _DKIM_SELECTORS]
        )
        found = [sel for sel in results if sel is not None]
        return {"selectors_found": found, "selectors_checked": list(_DKIM_SELECTORS)}
    except Exception:
        return {"selectors_found": [], "selectors_checked": list(_DKIM_SELECTORS)}


async def _check_mta_sts(domain: str) -> dict[str, Any]:
    try:
        txts = await _txt_records(f"_mta-sts.{domain}")
        found = bool(txts)
        return {"dns_record_found": found}
    except Exception:
        return {"dns_record_found": False}


async def _check_bimi(domain: str) -> dict[str, Any]:
    try:
        txts = await _txt_records(f"default._bimi.{domain}")
        record = txts[0] if txts else None
        return {"found": record is not None, "record": record}
    except Exception:
        return {"found": False, "record": None}


async def lookup_mail(domain: str) -> dict[str, Any]:
    mx, spf, dmarc, dkim, mta_sts, bimi = await asyncio.gather(
        _check_mx(domain),
        _check_spf(domain),
        _check_dmarc(domain),
        _check_dkim(domain),
        _check_mta_sts(domain),
        _check_bimi(domain),
    )

    health_summary = {
        "mx_ok": mx["found"],
        "spf_ok": spf["valid"],
        "dmarc_ok": dmarc["found"] and dmarc.get("policy") not in (None, "none"),
        "dkim_ok": bool(dkim["selectors_found"]),
    }

    return {
        "domain": domain,
        "mx": mx,
        "spf": spf,
        "dmarc": dmarc,
        "dkim": dkim,
        "mta_sts": mta_sts,
        "bimi": bimi,
        "health_summary": health_summary,
    }
