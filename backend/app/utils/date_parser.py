import re
from typing import Optional
from bs4 import BeautifulSoup


def extract_published_date(html: str) -> Optional[str]:
    """
    Extract the published/modified date from HTML meta tags and common
    structured data patterns. Returns an ISO-style date string or None.
    """
    if not html:
        return None

    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception:
        return None

    # 1. Check standard meta tags
    meta_names = [
        "article:published_time",
        "og:published_time",
        "datePublished",
        "date",
        "pubdate",
        "publish_date",
        "article:modified_time",
        "og:updated_time",
        "dateModified",
        "DC.date.issued",
        "DC.date.created",
        "last-modified",
    ]

    for name in meta_names:
        # Try property attribute
        tag = soup.find("meta", attrs={"property": name})
        if tag and tag.get("content"):
            return _clean_date(tag["content"])
        # Try name attribute
        tag = soup.find("meta", attrs={"name": name})
        if tag and tag.get("content"):
            return _clean_date(tag["content"])

    # 2. Check <time> elements with datetime attribute
    time_tag = soup.find("time", attrs={"datetime": True})
    if time_tag:
        return _clean_date(time_tag["datetime"])

    # 3. Check JSON-LD structured data
    for script in soup.find_all("script", type="application/ld+json"):
        text = script.string or ""
        date_match = re.search(r'"datePublished"\s*:\s*"([^"]+)"', text)
        if date_match:
            return _clean_date(date_match.group(1))
        date_match = re.search(r'"dateModified"\s*:\s*"([^"]+)"', text)
        if date_match:
            return _clean_date(date_match.group(1))

    return None


def _clean_date(raw: str) -> str:
    """Trim and return first 10 chars (YYYY-MM-DD) or full ISO string."""
    raw = raw.strip()
    # If it has a T separator, return up to the T or full
    if "T" in raw:
        return raw[:10]
    return raw[:10] if len(raw) >= 10 else raw
