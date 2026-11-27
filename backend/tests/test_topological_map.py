import gzip
import os
import sys
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.schemas.crawl import MapRequest, MapResponse, MapLinkMetadata
from app.services.map_service import (
    parse_sitemap_xml,
    is_same_domain,
    extract_links_from_html,
    map_website,
)

SAMPLE_URLSET_XML = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://docs.stripe.com/api</loc>
        <lastmod>2026-11-20T08:00:00Z</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://docs.stripe.com/api/charges</loc>
        <lastmod>2026-11-18T12:00:00Z</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://docs.stripe.com/api/refunds</loc>
        <lastmod>2026-11-15T10:00:00Z</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>https://docs.stripe.com/changelog</loc>
        <lastmod>2026-11-25T14:30:00Z</lastmod>
        <changefreq>always</changefreq>
        <priority>0.5</priority>
    </url>
</urlset>
"""

SAMPLE_INDEX_XML = """<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>https://docs.stripe.com/sitemap-api.xml</loc>
        <lastmod>2026-11-20T08:00:00Z</lastmod>
    </sitemap>
    <sitemap>
        <loc>https://docs.stripe.com/sitemap-guides.xml</loc>
        <lastmod>2026-11-22T08:00:00Z</lastmod>
    </sitemap>
</sitemapindex>
"""

def test_parse_standard_sitemap_xml():
    links, child_sitemaps = parse_sitemap_xml(SAMPLE_URLSET_XML)
    assert len(links) == 4
    assert len(child_sitemaps) == 0

    first = links[0]
    assert first.url == "https://docs.stripe.com/api"
    assert first.lastmod == "2026-11-20T08:00:00Z"
    assert first.changefreq == "daily"
    assert first.priority == 1.0

    second = links[1]
    assert second.url == "https://docs.stripe.com/api/charges"
    assert second.priority == 0.8

def test_parse_sitemap_index_xml():
    links, child_sitemaps = parse_sitemap_xml(SAMPLE_INDEX_XML)
    assert len(links) == 0
    assert len(child_sitemaps) == 2
    assert "https://docs.stripe.com/sitemap-api.xml" in child_sitemaps
    assert "https://docs.stripe.com/sitemap-guides.xml" in child_sitemaps

def test_gzip_sitemap_decompression():
    compressed = gzip.compress(SAMPLE_URLSET_XML.encode("utf-8"))
    links, child_sitemaps = parse_sitemap_xml(compressed)
    assert len(links) == 4
    assert links[2].url == "https://docs.stripe.com/api/refunds"

def test_domain_isolation_and_html_fallback():
    assert is_same_domain("https://docs.stripe.com/api", "https://docs.stripe.com", include_subdomains=False) is True
    assert is_same_domain("https://api.stripe.com/v1", "https://docs.stripe.com", include_subdomains=False) is False
    assert is_same_domain("https://api.stripe.com/v1", "https://docs.stripe.com", include_subdomains=True) is True
    assert is_same_domain("https://malicious.com/phish", "https://docs.stripe.com", include_subdomains=True) is False

    sample_html = """
    <html><body>
        <a href="/pricing">Pricing</a>
        <a href="https://docs.stripe.com/connect">Connect</a>
        <a href="https://external.com/docs">External</a>
    </body></html>
    """
    extracted = extract_links_from_html(sample_html, "https://docs.stripe.com")
    assert any("pricing" in l for l in extracted)
    assert any("connect" in l for l in extracted)
    assert not any("external.com" in l for l in extracted)

def test_end_to_end_map_website_service():
    req = MapRequest(
        url="https://docs.stripe.com",
        search="charges",
        limit=100
    )

    mock_resp_robots = MagicMock()
    mock_resp_robots.status_code = 200
    mock_resp_robots.text = "Sitemap: https://docs.stripe.com/sitemap.xml"

    mock_resp_sitemap = MagicMock()
    mock_resp_sitemap.status_code = 200
    mock_resp_sitemap.content = SAMPLE_URLSET_XML.encode("utf-8")

    async def mock_get(url, **kwargs):
        if "robots.txt" in url:
            return mock_resp_robots
        elif "sitemap.xml" in url:
            return mock_resp_sitemap
        resp = MagicMock()
        resp.status_code = 404
        return resp

    mock_http_client = MagicMock()
    mock_http_client.get = AsyncMock(side_effect=mock_get)

    with patch("app.services.map_service.get_cached", new=AsyncMock(return_value=None)):
        with patch("app.services.map_service.set_cached", new=AsyncMock(return_value=None)):
            with patch("app.services.map_service.get_http_client", return_value=mock_http_client):
                res: MapResponse = asyncio.run(map_website(req))

    assert res.success is True
    assert res.sitemap_found is True
    assert res.total_links == 1
    assert res.links[0] == "https://docs.stripe.com/api/charges"
    assert res.links_metadata[0].priority == 0.8

if __name__ == "__main__":
    print("Running topological site mapping tests directly...", flush=True)
    test_parse_standard_sitemap_xml()
    print("PASS: test_parse_standard_sitemap_xml", flush=True)
    test_parse_sitemap_index_xml()
    print("PASS: test_parse_sitemap_index_xml", flush=True)
    test_gzip_sitemap_decompression()
    print("PASS: test_gzip_sitemap_decompression", flush=True)
    test_domain_isolation_and_html_fallback()
    print("PASS: test_domain_isolation_and_html_fallback", flush=True)
    test_end_to_end_map_website_service()
    print("PASS: test_end_to_end_map_website_service", flush=True)
    print("ALL 5 TOPOLOGICAL SITE MAPPING TESTS PASSED!", flush=True)
