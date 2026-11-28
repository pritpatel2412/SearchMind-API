import ipaddress
import socket
from urllib.parse import urlparse, urlunparse, urljoin
from typing import List, Optional
from fastapi import HTTPException, status
from app.config import settings

# Explicitly forbidden hostnames and internal domain suffixes for SSRF protection
BLOCKED_HOSTNAMES = {
    "localhost",
    "127.0.0.1",
    "::1",
    "0.0.0.0",
    "metadata.google.internal",
    "metadata.goog",
    "instance-data",
    "169.254.169.254",
    "fd00::",
}

BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),      # IPv4 loopback
    ipaddress.ip_network("10.0.0.0/8"),       # RFC 1918 private
    ipaddress.ip_network("172.16.0.0/12"),    # RFC 1918 private
    ipaddress.ip_network("192.168.0.0/16"),   # RFC 1918 private
    ipaddress.ip_network("169.254.0.0/16"),   # IPv4 link-local (AWS/GCP/Azure metadata)
    ipaddress.ip_network("100.64.0.0/10"),    # Carrier-grade NAT
    ipaddress.ip_network("0.0.0.0/8"),        # Current network
    ipaddress.ip_network("224.0.0.0/4"),      # Multicast
    ipaddress.ip_network("240.0.0.0/4"),      # Reserved
    ipaddress.ip_network("::1/128"),          # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),         # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),        # IPv6 link-local
]


def is_ip_blocked(ip_obj: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Check if an IP address belongs to loopback, private, link-local, or metadata address spaces."""
    if (
        ip_obj.is_loopback
        or ip_obj.is_private
        or ip_obj.is_link_local
        or ip_obj.is_multicast
        or ip_obj.is_reserved
        or ip_obj.is_unspecified
    ):
        return True
    for blocked_net in BLOCKED_IP_NETWORKS:
        if ip_obj in blocked_net:
            return True
    return False


def validate_safe_url(url: str) -> None:
    """
    Validates that a URL is safe to fetch and prevents Server-Side Request Forgery (SSRF)
    against private IP spaces, cloud metadata services (169.254.169.254), and loopback daemons.
    Raises HTTPException(status_code=400) if unsafe or invalid.
    """
    if getattr(settings, "ALLOW_INTERNAL_NETWORKS", False):
        return

    if not url or not isinstance(url, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid HTTP or HTTPS URL must be provided."
        )

    url_clean = url.strip()
    try:
        parsed = urlparse(url_clean)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed URL provided."
        )

    if parsed.scheme.lower() not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"URL scheme '{parsed.scheme}' is prohibited. Only HTTP and HTTPS are allowed."
        )

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL missing valid hostname."
        )

    hostname_lower = hostname.lower()

    # Block obvious local names and metadata hostnames
    if (
        hostname_lower in BLOCKED_HOSTNAMES
        or hostname_lower.endswith(".localhost")
        or hostname_lower.endswith(".local")
        or hostname_lower.endswith(".internal")
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Access to host '{hostname}' is forbidden (SSRF protection)."
        )

    # Check direct IP address literal
    try:
        ip = ipaddress.ip_address(hostname_lower)
        if is_ip_blocked(ip):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Access to private or restricted IP address '{hostname}' is forbidden (SSRF protection)."
            )
        return
    except ValueError:
        pass  # Hostname is a domain name; proceed to DNS resolution

    # Resolve hostname via DNS and check all returned IP addresses
    try:
        addr_info = socket.getaddrinfo(hostname_lower, None)
        for family, _, _, _, sockaddr in addr_info:
            ip_str = sockaddr[0]
            ip = ipaddress.ip_address(ip_str)
            if is_ip_blocked(ip):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Host '{hostname}' resolved to prohibited address space ({ip_str}) (SSRF protection)."
                )
    except socket.gaierror:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not resolve host '{hostname}'."
        )


def normalize_url(url: str) -> str:
    """Normalize a URL by stripping fragments, trailing slashes, and lowercasing the scheme/host."""
    try:
        parsed = urlparse(url)
        normalized = parsed._replace(
            scheme=parsed.scheme.lower(),
            netloc=parsed.netloc.lower(),
            fragment="",
            path=parsed.path.rstrip("/") or "/",
        )
        return urlunparse(normalized)
    except Exception:
        return url


def extract_domain(url: str) -> str:
    """Extract the root domain from a URL, stripping www. prefix."""
    try:
        netloc = urlparse(url).netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc
    except Exception:
        return ""


def deduplicate_urls(urls: List[str]) -> List[str]:
    """Remove duplicate URLs after normalization, preserving order."""
    seen = set()
    unique = []
    for url in urls:
        norm = normalize_url(url)
        if norm not in seen:
            seen.add(norm)
            unique.append(url)
    return unique


def is_valid_url(url: str) -> bool:
    """Basic URL validity check."""
    try:
        parsed = urlparse(url)
        return bool(parsed.scheme in ("http", "https") and parsed.netloc)
    except Exception:
        return False
