try:
    import trafilatura
except ImportError:
    trafilatura = None

try:
    from readability import Document
except ImportError:
    Document = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None
from typing import Optional, List
from app.utils.html_cleaner import clean_text
from app.utils.date_parser import extract_published_date
from app.services.highlight_service import extract_dynamic_highlights

def extract_content(
    html: str, 
    url: str,
    query: Optional[str] = None,
    highlights: bool = False,
    max_highlights: int = 3,
    highlight_strategy: str = "dynamic"
) -> dict:
    """
    Extract clean readable main text content and metadata from HTML source code.
    Fallback chain: Trafilatura -> Readability-lxml -> BeautifulSoup4 parsing.
    Optionally extracts dynamic query-conditioned passage highlights.
    """
    
    res = None
    # 1. Primary extractor: trafilatura
    if trafilatura:
        try:
            extracted = trafilatura.extract(
                html,
                url=url,
                include_comments=False,
                include_tables=True,
                no_fallback=False,
                favor_precision=True,
                deduplicate=True
            )

            if extracted and len(extracted.strip()) > 100:
                metadata = trafilatura.extract_metadata(html, default_url=url)
                res = {
                    "content": clean_text(extracted),
                    "title": metadata.title if (metadata and metadata.title) else "",
                    "author": metadata.author if (metadata and metadata.author) else None,
                    "published_date": metadata.date if (metadata and metadata.date) else extract_published_date(html),
                    "language": metadata.language if (metadata and metadata.language) else None,
                    "extraction_method": "trafilatura"
                }
        except Exception:
            pass

    # 2. Fallback extractor: readability-lxml
    if not res and Document:
        try:
            doc = Document(html)
            soup = BeautifulSoup(doc.summary(), "html.parser")
            text = soup.get_text(separator="\n", strip=True)
            if text and len(text.strip()) > 100:
                res = {
                    "content": clean_text(text),
                    "title": doc.title() or "",
                    "author": None,
                    "published_date": extract_published_date(html),
                    "language": None,
                    "extraction_method": "readability"
                }
        except Exception:
            pass

    # 3. Final fallback: BeautifulSoup raw parsing or regex
    if not res:
        try:
            if BeautifulSoup:
                soup = BeautifulSoup(html, "html.parser")
                for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    tag.decompose()
                text = soup.get_text(separator="\n", strip=True)

                title = ""
                if soup.title and soup.title.string:
                    title = soup.title.string.strip()
            else:
                import re
                cleaned_html = re.sub(r"<(script|style|nav|footer|header|aside)[^>]*>.*?</\1>", "", html, flags=re.DOTALL|re.IGNORECASE)
                text = re.sub(r"<[^>]+>", " ", cleaned_html)
                title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE)
                title = title_match.group(1).strip() if title_match else ""

            res = {
                "content": clean_text(text[:8000]) if text else "",
                "title": title,
                "author": None,
                "published_date": extract_published_date(html),
                "language": None,
                "extraction_method": "beautifulsoup_fallback" if BeautifulSoup else "regex_fallback"
            }
        except Exception as e:
            res = {
                "content": "",
                "title": "",
                "author": None,
                "published_date": None,
                "language": None,
                "extraction_method": f"error: {str(e)}"
            }

    # 4. Dynamic Passage Highlights
    if highlights and query and res and res.get("content"):
        h_list, savings = extract_dynamic_highlights(
            content=res["content"],
            query=query,
            max_highlights=max_highlights,
            strategy=highlight_strategy
        )
        res["highlights"] = h_list
        res["token_savings_percentage"] = savings
    else:
        res["highlights"] = None
        res["token_savings_percentage"] = None

    return res
