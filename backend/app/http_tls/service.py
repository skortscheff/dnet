import asyncio
import socket
import ssl
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin

import httpx


async def check_http(url: str) -> dict[str, Any]:
    chain: list[dict[str, Any]] = []
    current_url = url
    max_hops = 10
    sec_headers: dict[str, Any] = {}

    async with httpx.AsyncClient(
        timeout=10.0,
        follow_redirects=False,
        verify=False,
    ) as client:
        for _ in range(max_hops):
            try:
                r = await client.get(
                    current_url,
                    headers={"User-Agent": "internet-toolkit/0.1"},
                )
                hop: dict[str, Any] = {
                    "url": current_url,
                    "status_code": r.status_code,
                    "location": None,
                }
                if r.is_redirect:
                    location = r.headers.get("location", "")
                    hop["location"] = location
                    chain.append(hop)
                    if location.startswith("http"):
                        current_url = location
                    else:
                        current_url = urljoin(current_url, location)
                else:
                    chain.append(hop)
                    sec_headers = {
                        "strict-transport-security": r.headers.get(
                            "strict-transport-security"
                        ),
                        "content-security-policy": r.headers.get(
                            "content-security-policy"
                        ),
                        "x-frame-options": r.headers.get("x-frame-options"),
                        "x-content-type-options": r.headers.get(
                            "x-content-type-options"
                        ),
                        "referrer-policy": r.headers.get("referrer-policy"),
                        "permissions-policy": r.headers.get("permissions-policy"),
                    }
                    break
            except Exception as e:
                chain.append({"url": current_url, "error": str(e)})
                break

    final_url = chain[-1]["url"] if chain else url
    return {
        "url": url,
        "chain": chain,
        "hops": len(chain),
        "final_url": final_url,
        "uses_https": final_url.startswith("https://"),
        "security_headers": sec_headers,
    }


def _tls_info_sync(host: str, port: int) -> dict[str, Any]:
    # Try verified context first so getpeercert() returns parsed cert data.
    # Fall back to CERT_NONE (no cert details) if verification fails.
    cert: dict = {}
    cipher = None
    version = None
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        with socket.create_connection((host, port), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                cert = ssock.getpeercert() or {}
                cipher = ssock.cipher()
                version = ssock.version()
    except ssl.SSLError:
        # Verification failed — retry without verification for version/cipher only
        ctx_no_verify = ssl.create_default_context()
        ctx_no_verify.check_hostname = False
        ctx_no_verify.verify_mode = ssl.CERT_NONE
        try:
            with socket.create_connection((host, port), timeout=10) as sock:
                with ctx_no_verify.wrap_socket(sock, server_hostname=host) as ssock:
                    cipher = ssock.cipher()
                    version = ssock.version()
        except Exception as e:
            return {"host": host, "port": port, "error": str(e)}
    except Exception as e:
        return {"host": host, "port": port, "error": str(e)}

    not_after_str: str = cert.get("notAfter", "")
    not_before_str: str = cert.get("notBefore", "")
    not_after: datetime | None = None
    not_before: datetime | None = None
    days_until_expiry: int | None = None

    if not_after_str:
        not_after = datetime.strptime(not_after_str, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        days_until_expiry = (not_after - datetime.now(timezone.utc)).days
    if not_before_str:
        not_before = datetime.strptime(not_before_str, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)

    sans: list[dict[str, str]] = []
    for san_type, san_value in cert.get("subjectAltName", []):
        sans.append({"type": san_type, "value": san_value})

    subject = dict(x[0] for x in cert.get("subject", []))
    issuer = dict(x[0] for x in cert.get("issuer", []))

    return {
        "host": host,
        "port": port,
        "tls_version": version,
        "cipher_suite": cipher[0] if cipher else None,
        "subject": {
            "cn": subject.get("commonName"),
            "o": subject.get("organizationName"),
        },
        "issuer": {
            "cn": issuer.get("commonName"),
            "o": issuer.get("organizationName"),
        },
        "not_before": not_before.isoformat() if not_before else None,
        "not_after": not_after.isoformat() if not_after else None,
        "days_until_expiry": days_until_expiry,
        "expired": days_until_expiry < 0 if days_until_expiry is not None else None,
        "san": sans,
        "san_count": len(sans),
    }


async def check_tls(host: str, port: int = 443) -> dict[str, Any]:
    return await asyncio.to_thread(_tls_info_sync, host, port)
