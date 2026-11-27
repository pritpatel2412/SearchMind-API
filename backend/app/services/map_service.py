import gzip
import re
import time
import json
import hashlib
import logging
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, urljoin
from typing import List, Dict, Any, Optional, Set, Tuple

from app.config import settings
from app.http_client import get_http_client
from app.schemas.crawl import MapRequest, MapResponse, MapLinkMetadata
from app.services.cache_service import get_cached, set_cached

logger = logging.getLogger("searchmind.map")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SearchMindBot/1.0; +https://searchmind.dev/bot)",
    "Accept": "application/xml,text/xml,text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
}

def _strip_namespace(tag: str) -> str:
    """Removes XML namespace prefix like {http://...} from element tags."""
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag

def parse_sitemap_xml(xml_content: str | bytes) -> Tuple[List[MapLinkMetadata], List[str]]:
    """
    Parses sitemap or sitemapindex XML content.
    Returns:
        (page_links: List[MapLinkMetadata], child_sitemaps: List[str])
    """
    links: List[MapLinkMetadata] = []
    child_sitemaps: List[str] = []

    if isinstance(xml_content, bytes):
        # Attempt transparent gzip decompression if gzipped
        if xml_content.startswith(b"\x1f\x8b"):
            try:
                xml_content = gzip.decompress(xml_content).decode("utf-8", errors="replace")
            except Exception as e:
                logger.debug("Failed gzip decompression of sitemap: %s", e)
                xml_content = xml_content.decode("utf-8", errors="replace")
        else:
            xml_content = xml_content.decode("utf-8", errors="replace")

    xml_text = xml_content.strip()
    if not xml_text:
        return links, child_sitemaps

    try:
        root = ET.fromstring(xml_text)
        root_tag = _strip_namespace(root.tag).lower()

        if root_tag == "sitemapindex":
            # Sitemap index containing pointers to other sitemaps
            for sitemap_node in root:
                if _strip_namespace(sitemap_node.tag).lower() == "sitemap":
                    loc = None
                    for child in sitemap_node:
                        tag_name = _strip_namespace(child.tag).lower()
                        if tag_name == "loc" and child.text:
                            loc = child.text.strip()
                            break
                    if loc:
                        child_sitemaps.append(loc)

        elif root_tag == "urlset":
            # Standard sitemap containing URLs
            for url_node in root:
                if _strip_namespace(url_node.tag).lower() == "url":
                    loc, lastmod, changefreq, priority = None, None, None, None
                    for child in url_node:
                        tag_name = _strip_namespace(child.tag).lower()
                        child_val = child.text.strip() if child.text else None
                        if tag_name == "loc":
                            loc = child_val
                        elif tag_name == "lastmod":
                            lastmod = child_val
                        elif tag_name == "changefreq":
                            changefreq = child_val
                        elif tag_name == "priority" and child_val:
                            try:
                                priority = float(child_val)
                            except ValueError:
                                pass
                    if loc:
                        links.append(MapLinkMetadata(
                            url=loc,
                            lastmod=lastmod,
                            changefreq=changefreq,
                            priority=priority
                        ))

    except ET.ParseError:
        # Fallback regex parsing if XML is malformed
        # 1. Check for sitemap index
        sitemap_locs = re.findall(r"<sitemap>\s*<loc>([^<]+)</loc>", xml_text, re.IGNORECASE)
        if sitemap_locs:
            child_sitemaps.extend([s.strip() for s in sitemap_locs])
        else:
            # 2. Check for url locations
            url_matches = re.finditer(r"<url>(.*?)</url>", xml_text, re.DOTALL | re.IGNORECASE)
            for m in url_matches:
                block = m.group(1)
                loc_m = re.search(r"<loc>([^<]+)</loc>", block, re.IGNORECASE)
                if loc_m:
                    loc = loc_m.group(1).strip()
                    lastmod_m = re.search(r"<lastmod>([^<]+)</lastmod>", block, re.IGNORECASE)
                    changefreq_m = re.search(r"<changefreq>([^<]+)</changefreq>", block, re.IGNORECASE)
                    priority_m = re.search(r"<priority>([^<]+)</priority>", block, re.IGNORECASE)
                    p_val = None
                    if priority_m:
                        try:
                            p_val = float(priority_m.group(1).strip())
                        except ValueError:
                            pass
                    links.append(MapLinkMetadata(
                        url=loc,
                        lastmod=lastmod_m.group(1).strip() if lastmod_m else None,
                        changefreq=changefreq_m.group(1).strip() if changefreq_m else None,
                        priority=p_val
                    ))

    return links, child_sitemaps

async def fetch_robots_sitemaps(base_url: str) -> List[str]:
    """Fetches robots.txt and extracts declared Sitemap directives."""
    parsed = urlparse(base_url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    client = get_http_client()
    try:
        resp = await client.get(robots_url, headers=HEADERS, timeout=8.0, follow_redirects=True)
        if resp.status_code == 200:
            lines = resp.text.splitlines()
            sitemaps = []
            for line in lines:
                if line.strip().lower().startswith("sitemap:"):
                    parts = line.split(":", 1)
                    if len(parts) > 1 and parts[1].strip():
                        sitemaps.append(parts[1].strip())
            return sitemaps
    except Exception as e:
        logger.debug("Failed to read robots.txt from %s: %s", robots_url, e)
    return []

def extract_links_from_html(html: str, base_url: str) -> List[str]:
    """Fallback heuristic link extractor from page HTML when sitemaps do not exist."""
    links: Set[str] = set()
    parsed_base = urlparse(base_url)
    base_netloc = parsed_base.netloc.lower()

    # Regex search for href links
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', html, re.IGNORECASE)
    for href in hrefs:
        href = href.strip()
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        joined = urljoin(base_url, href)
        parsed_target = urlparse(joined)
        # Keep same domain
        if parsed_target.netloc.lower() == base_netloc and parsed_target.scheme in ["http", "https"]:
            # Strip fragment
            clean = f"{parsed_target.scheme}://{parsed_target.netloc}{parsed_target.path}"
            if parsed_target.query:
                clean += f"?{parsed_target.query}"
            links.add(clean)

    return list(links)

def is_same_domain(target_url: str, base_url: str, include_subdomains: bool = False) -> bool:
    """Checks whether target_url belongs to the same domain as base_url."""
    try:
        base_host = urlparse(base_url).netloc.lower().split(":")[0]
        target_host = urlparse(target_url).netloc.lower().split(":")[0]

        if not base_host or not target_host:
            return False

        if not include_subdomains:
            # Normalize www.
            base_norm = base_host[4:] if base_host.startswith("www.") else base_host
            target_norm = target_host[4:] if target_host.startswith("www.") else target_host
            return base_norm == target_norm
        else:
            # Sibling or parent domain matching
            base_parts = base_host.split(".")
            root_domain = ".".join(base_parts[-2:]) if len(base_parts) >= 2 else base_host
            return target_host.endswith(root_domain)
    except Exception:
        return False

async def map_website(
    req: MapRequest,
    db: Optional[Any] = None
) -> MapResponse:
    """
    Zero-Crawl Topological Site Mapping.
    Discovers complete URL topology of a website through fast sitemap resolution,
    robots.txt inspection, recursive index processing, and topical search filtering.
    """
    start_time = time.time()

    # 1. Normalization and cache key
    parsed = urlparse(req.url)
    if not parsed.scheme:
        req.url = f"https://{req.url}"
        parsed = urlparse(req.url)

    cache_payload = {
        "url": req.url,
        "search": req.search,
        "ignore_sitemap": req.ignore_sitemap,
        "include_subdomains": req.include_subdomains,
        "limit": req.limit
    }
    cache_key = "map:" + hashlib.sha256(json.dumps(cache_payload, sort_keys=True).encode()).hexdigest()

    try:
        cached = await get_cached(cache_key, db=db)
        if cached:
            cached["cached"] = True
            cached["execution_time_ms"] = int((time.time() - start_time) * 1000)
            return MapResponse(**cached)
    except Exception as e:
        logger.debug("Cache read error in site mapping: %s", e)

    client = get_http_client()
    base_domain_url = f"{parsed.scheme}://{parsed.netloc}"
    
    discovered_metadata: Dict[str, MapLinkMetadata] = {}
    sitemap_found = False

    # 2. Sitemap Discovery (unless explicitly ignored)
    if not req.ignore_sitemap:
        candidate_sitemaps: List[str] = []

        # A) Check robots.txt
        robots_sitemaps = await fetch_robots_sitemaps(base_domain_url)
        candidate_sitemaps.extend(robots_sitemaps)

        # B) Check standard sitemap locations
        standard_locations = [
            f"{base_domain_url}/sitemap.xml",
            f"{base_domain_url}/sitemap_index.xml",
            f"{base_domain_url}/sitemap-index.xml",
            f"{base_domain_url}/sitemaps.xml",
            f"{base_domain_url}/sitemap/sitemap.xml",
        ]
        for loc in standard_locations:
            if loc not in candidate_sitemaps:
                candidate_sitemaps.append(loc)

        visited_sitemaps: Set[str] = set()
        pending_sitemaps: List[str] = list(candidate_sitemaps)
        depth = 0

        while pending_sitemaps and depth < 4 and len(discovered_metadata) < req.limit:
            current_batch = pending_sitemaps[:10]  # Process in batches of 10
            pending_sitemaps = pending_sitemaps[10:]
            depth += 1

            for sitemap_url in current_batch:
                if sitemap_url in visited_sitemaps:
                    continue
                visited_sitemaps.add(sitemap_url)

                try:
                    resp = await client.get(sitemap_url, headers=HEADERS, timeout=10.0, follow_redirects=True)
                    if resp.status_code == 200:
                        sitemap_found = True
                        page_links, child_sitemaps = parse_sitemap_xml(resp.content)

                        for link_meta in page_links:
                            url = link_meta.url
                            if is_same_domain(url, req.url, req.include_subdomains):
                                if url not in discovered_metadata:
                                    discovered_metadata[url] = link_meta
                                    if len(discovered_metadata) >= req.limit:
                                        break

                        for child in child_sitemaps:
                            if child not in visited_sitemaps and child not in pending_sitemaps:
                                pending_sitemaps.append(child)

                        if page_links or child_sitemaps:
                            # If this standard sitemap yielded links, don't spam unrelated candidate fallbacks
                            pass

                except Exception as e:
                    logger.debug("Failed to fetch or parse sitemap %s: %s", sitemap_url, e)

    # 3. Fallback Link Extraction from Root if No Sitemap Found
    if not discovered_metadata:
        try:
            resp = await client.get(req.url, headers=HEADERS, timeout=12.0, follow_redirects=True)
            if resp.status_code == 200:
                html_links = extract_links_from_html(resp.text, req.url)
                for hlink in html_links:
                    if is_same_domain(hlink, req.url, req.include_subdomains):
                        discovered_metadata[hlink] = MapLinkMetadata(url=hlink)
                        if len(discovered_metadata) >= req.limit:
                            break
        except Exception as e:
            logger.warning("Fallback link extraction failed for %s: %s", req.url, e)

    # 4. Search & Topical Filter
    all_links = list(discovered_metadata.values())
    if req.search:
        search_query = req.search.strip()
        filtered_links = []
        try:
            pattern = re.compile(search_query, re.IGNORECASE)
            for meta in all_links:
                if pattern.search(meta.url):
                    filtered_links.append(meta)
        except re.error:
            # Fallback simple substring
            sq_lower = search_query.lower()
            for meta in all_links:
                if sq_lower in meta.url.lower():
                    filtered_links.append(meta)
        all_links = filtered_links

    # Enforce limit
    all_links = all_links[:req.limit]
    url_list = [meta.url for meta in all_links]
    execution_time = int((time.time() - start_time) * 1000)

    response = MapResponse(
        success=True,
        links=url_list,
        links_metadata=all_links,
        total_links=len(url_list),
        sitemap_found=sitemap_found,
        execution_time_ms=execution_time,
        cached=False
    )

    # 5. Cache response
    try:
        await set_cached(
            cache_key,
            response.model_dump(),
            ttl=settings.CRAWL_CACHE_TTL if hasattr(settings, "CRAWL_CACHE_TTL") else 3600,
            db=db
        )
    except Exception as e:
        logger.debug("Failed to cache map response: %s", e)

    return response
