import asyncio
import ipaddress
import socket
from typing import Any

import httpx


async def _empty() -> dict:
    return {}


def _classify(addr: ipaddress.IPv4Address | ipaddress.IPv6Address) -> dict[str, bool]:
    return {
        "private": addr.is_private,
        "loopback": addr.is_loopback,
        "global": addr.is_global,
        "multicast": addr.is_multicast,
    }


def _rdns(ip: str) -> str | None:
    try:
        return socket.gethostbyaddr(ip)[0]
    except (socket.herror, socket.gaierror):
        return None


async def _ipinfo(ip: str) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(
                f"https://ipinfo.io/{ip}/json",
                headers={"Accept": "application/json"},
            )
            if r.status_code == 200:
                return r.json()
    except Exception:
        pass
    return {}


async def lookup_ip(ip: str) -> dict[str, Any]:
    addr = ipaddress.ip_address(ip)

    # Only call external IP info API for public/global addresses
    info_coro = _ipinfo(ip) if addr.is_global else _empty()
    rdns, info = await asyncio.gather(asyncio.to_thread(_rdns, ip), info_coro)

    return {
        "ip": ip,
        "version": addr.version,
        "rdns": rdns,
        "classification": _classify(addr),
        "org": info.get("org"),
        "city": info.get("city"),
        "region": info.get("region"),
        "country": info.get("country"),
        "timezone": info.get("timezone"),
    }
