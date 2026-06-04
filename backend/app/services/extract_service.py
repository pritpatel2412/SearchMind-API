import trafilatura
from readability import Document
from bs4 import BeautifulSoup
from typing import Optional
from app.utils.html_cleaner import clean_text
from app.utils.date_parser import extract_published_date

def extract_content(html: str, url: str) -> dict:
    """
    Extract clean readable main text content and metadata from HTML source code.
    Fallback chain: Trafilatura -> Readability-lxml -> BeautifulSoup4 parsing.
    """
    
    # 1. Primary extractor: trafilatura
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
            return {
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
    try:
        doc = Document(html)
        soup = BeautifulSoup(doc.summary(), "html.parser")
        text = soup.get_text(separator="\n", strip=True)
        if text and len(text.strip()) > 100:
            return {
                "content": clean_text(text),
                "title": doc.title() or "",
                "author": None,
                "published_date": extract_published_date(html),
                "language": None,
                "extraction_method": "readability"
            }
    except Exception:
        pass

    # 3. Final fallback: BeautifulSoup raw parsing
    try:
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)

        title = ""
        if soup.title and soup.title.string:
            title = soup.title.string.strip()

        return {
            "content": clean_text(text[:8000]) if text else "",
            "title": title,
            "author": None,
            "published_date": extract_published_date(html),
            "language": None,
            "extraction_method": "beautifulsoup_fallback"
        }
    except Exception as e:
        return {
            "content": "",
            "title": "",
            "author": None,
            "published_date": None,
            "language": None,
            "extraction_method": f"error: {str(e)}"
        }
