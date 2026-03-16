import ipaddress
import re
from enum import StrEnum


class InputType(StrEnum):
    IPV4 = "ipv4"
    IPV6 = "ipv6"
    CIDR4 = "cidr4"
    CIDR6 = "cidr6"
    ASN = "asn"
    DOMAIN = "domain"
    URL = "url"
    EMAIL = "email"
    EMAIL_HEADER = "email_header"
    UNKNOWN = "unknown"


_DOMAIN_RE = re.compile(
    r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
)
_ASN_RE = re.compile(r"^(?:AS|ASN)?(\d{1,10})$", re.IGNORECASE)
_EMAIL_RE = re.compile(r"^[^@\s]+@([^@\s]+\.[^@\s]+)$")
_URL_RE = re.compile(r"^https?://", re.IGNORECASE)
_HEADER_KEYS_RE = re.compile(
    r"^(Received|From|To|Subject|Message-ID|Date|DKIM-Signature):", re.MULTILINE
)


def detect(raw: str) -> tuple[InputType, str]:
    """Return (InputType, normalized_value) for any user-supplied input string."""
    text = raw.strip()
    if not text:
        return InputType.UNKNOWN, text

    # Multi-line email header blob — check before URL/email
    if "\n" in text and _HEADER_KEYS_RE.search(text):
        return InputType.EMAIL_HEADER, text

    # URL
    if _URL_RE.match(text):
        return InputType.URL, text

    # Email address
    m = _EMAIL_RE.match(text)
    if m:
        return InputType.EMAIL, text.lower()

    # ASN: AS64500, ASN64500, or bare 64500
    m = _ASN_RE.match(text)
    if m:
        return InputType.ASN, f"AS{m.group(1)}"

    # IP address or CIDR prefix
    try:
        if "/" in text:
            net = ipaddress.ip_network(text, strict=False)
            kind = InputType.CIDR4 if net.version == 4 else InputType.CIDR6
            return kind, str(net)
        else:
            addr = ipaddress.ip_address(text)
            kind = InputType.IPV4 if addr.version == 4 else InputType.IPV6
            return kind, str(addr)
    except ValueError:
        pass

    # Domain / hostname
    if _DOMAIN_RE.match(text):
        return InputType.DOMAIN, text.lower()

    return InputType.UNKNOWN, text
