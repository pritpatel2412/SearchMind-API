import math
from typing import List, Dict
from urllib.parse import urlparse
from app.services.credibility_service import get_credibility_score

SPAM_KEYWORDS = [
    "click here", "buy now", "limited offer", "free download",
    "earn money", "make money fast", "diet pill", "casino"
]

TRUSTED_DOMAINS = {
    "github.com": 0.95, "arxiv.org": 0.98, "wikipedia.org": 0.90,
    "stackoverflow.com": 0.93, "docs.python.org": 0.99,
    "huggingface.co": 0.92, "langchain.com": 0.94,
    "anthropic.com": 0.97, "openai.com": 0.96
}

def rank_results(results: List[Dict], query: str) -> List[Dict]:
    """Score and rank search results for LLM relevance."""
    query_terms = set(query.lower().split())
    scored = []

    for r in results:
        score = compute_score(r, query_terms)
        r["score"] = round(score, 4)
        r["source_type"] = classify_source(r.get("url", ""))
        scored.append(r)

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored


def compute_score(result: Dict, query_terms: set) -> float:
    score = 0.5  # base

    content = (
        (result.get("title") or "") + " " +
        (result.get("snippet") or "") + " " +
        (result.get("content") or "")
    ).lower()

    # Term overlap score
    content_words = set(content.split())
    overlap = len(query_terms & content_words)
    term_score = min(overlap / max(len(query_terms), 1), 1.0)
    score += term_score * 0.30

    # Domain credibility
    url = result.get("url", "")
    domain = urlparse(url).netloc.lower().replace("www.", "")
    domain_score = TRUSTED_DOMAINS.get(domain, get_credibility_score(domain))
    score += domain_score * 0.25

    # Spam penalty
    spam_hits = sum(1 for kw in SPAM_KEYWORDS if kw in content)
    score -= spam_hits * 0.08

    # Content length bonus (more content = more useful for LLMs)
    content_len = len(result.get("content") or result.get("snippet") or "")
    length_score = min(math.log(content_len + 1) / 10, 0.15)
    score += length_score

    # Recency bonus (prefer newer content)
    if result.get("published_date"):
        score += 0.05

    return max(0.0, min(1.0, score))


def classify_source(url: str) -> str:
    """Classifies a URL into a source category based on domain patterns."""
    domain = urlparse(url).netloc.lower()
    if any(d in domain for d in ["github.com", "gitlab.com", "bitbucket.org"]):
        return "code_repository"
    if any(d in domain for d in ["arxiv.org", "scholar.google", "pubmed"]):
        return "research_paper"
    if "wikipedia" in domain:
        return "encyclopedia"
    if any(d in domain for d in ["docs.", "documentation", "readthedocs"]):
        return "documentation"
    if any(d in domain for d in ["medium.com", "dev.to", "hashnode", "substack"]):
        return "blog"
    if any(d in domain for d in ["stackoverflow", "stackexchange"]):
        return "qa_forum"
    if any(d in domain for d in ["youtube.com", "vimeo.com"]):
        return "video"
    return "webpage"
