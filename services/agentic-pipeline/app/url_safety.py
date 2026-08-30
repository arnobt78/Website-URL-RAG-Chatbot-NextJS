"""Block private/metadata targets to reduce SSRF risk on extractor fetches."""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

BLOCKED_HOSTNAMES = frozenset(
    {
        "localhost",
        "metadata.google.internal",
        "metadata.goog",
    }
)


def _is_blocked_hostname(hostname: str) -> bool:
    host = hostname.lower().rstrip(".")
    if host in BLOCKED_HOSTNAMES:
        return True
    if host.endswith(".localhost") or host.endswith(".local"):
        return True
    if host == "169.254.169.254":
        return True
    return False


def _is_blocked_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return True
    if addr.is_private or addr.is_loopback or addr.is_link_local:
        return True
    if addr.is_reserved or addr.is_multicast or addr.is_unspecified:
        return True
    # CGNAT 100.64.0.0/10
    if isinstance(addr, ipaddress.IPv4Address):
        if ipaddress.IPv4Address("100.64.0.0") <= addr <= ipaddress.IPv4Address("100.127.255.255"):
            return True
    return False


def assert_safe_public_url(url: str) -> None:
    """
    Raise ValueError if URL is not a safe public http(s) target.
    Resolves DNS and rejects private/link-local/metadata addresses.
    """
    raw = (url or "").strip()
    if not raw:
        raise ValueError("URL is empty")

    parsed = urlparse(raw)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Only http(s) URLs are allowed")
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("Missing hostname")

    if _is_blocked_hostname(hostname):
        raise ValueError("Host is not allowed")

    # IP literal in hostname
    try:
        ipaddress.ip_address(hostname)
        if _is_blocked_ip(hostname):
            raise ValueError("IP address is not allowed")
        return
    except ValueError as exc:
        if "not allowed" in str(exc):
            raise
        # not an IP literal — continue to DNS
        pass

    try:
        results = socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise ValueError("Could not resolve host") from exc

    if not results:
        raise ValueError("Could not resolve host")

    for info in results:
        sockaddr = info[4]
        ip = sockaddr[0]
        if _is_blocked_ip(ip):
            raise ValueError("Host resolves to a private or restricted address")
