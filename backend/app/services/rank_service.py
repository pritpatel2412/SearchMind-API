import math
import re
from typing import List, Dict
from urllib.parse import urlparse
from app.services.credibility_service import get_credibility_score

STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "for", "of", "in", "on",
    "at", "to", "and", "or", "show", "me", "find", "get", "give"
}

def tokenize(text: str) -> List[str]:
    return re.findall(r"[a-z0-9]+", text.lower())

def query_bigrams(query: str) -> List[tuple]:
    tokens = [t for t in tokenize(query) if t not in STOPWORDS]
    return [tuple(tokens[i:i + 2]) for i in range(len(tokens) - 1)]

def phrase_proximity_score(content_tokens: List[str], bigrams: List[tuple], window: int = 5) -> float:
    """Fraction of query bigrams whose two terms co-occur within `window`
    tokens of each other anywhere in the content. Rewards phrase-like
    matches; scattered unigram hits across unrelated contexts score 0
    on this signal even if every individual word appears somewhere."""
    if not bigrams:
        return 0.0
    positions: dict = {}
    for i, tok in enumerate(content_tokens):
        positions.setdefault(tok, []).append(i)

    hits = 0
    for a, b in bigrams:
        pos_a, pos_b = positions.get(a, []), positions.get(b, [])
        if pos_a and pos_b and any(abs(i - j) <= window for i in pos_a for j in pos_b):
            hits += 1
    return hits / len(bigrams)

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
    filtered_terms = {t for t in tokenize(query) if t not in STOPWORDS}
    bigrams = query_bigrams(query)
    scored = []

    for r in results:
        score = compute_score(r, filtered_terms, bigrams)
        r["score"] = round(score, 4)
        r["source_type"] = classify_source(r.get("url", ""))
        scored.append(r)

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored


def compute_score(result: Dict, query_terms: set, bigrams: List[tuple]) -> float:
    score = 0.5

    content = (
        (result.get("title") or "") + " " +
        (result.get("snippet") or "") + " " +
        (result.get("content") or "")
    ).lower()
    content_tokens = tokenize(content)
    content_words = set(content_tokens)

    # Unigram overlap — weight cut from 0.30 to 0.15. Kept as a weak signal;
    # phrase proximity below is what actually disambiguates "great wall"
    # from "wall connector."
    overlap = len(query_terms & content_words)
    term_score = min(overlap / max(len(query_terms), 1), 1.0)
    score += term_score * 0.15

    # Phrase proximity — new signal, takes the weight cut from above.
    proximity_score = phrase_proximity_score(content_tokens, bigrams)
    score += proximity_score * 0.20

    # --- unchanged below: domain credibility, spam penalty, length, recency ---
    url = result.get("url", "")
    domain = urlparse(url).netloc.lower().replace("www.", "")
    domain_score = TRUSTED_DOMAINS.get(domain, get_credibility_score(domain))
    score += domain_score * 0.25

    spam_hits = sum(1 for kw in SPAM_KEYWORDS if kw in content)
    score -= spam_hits * 0.08

    content_len = len(result.get("content") or result.get("snippet") or "")
    length_score = min(math.log(content_len + 1) / 10, 0.15)
    score += length_score

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
