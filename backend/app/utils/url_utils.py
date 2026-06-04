from urllib.parse import urlparse, urlunparse, urljoin
from typing import List


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
