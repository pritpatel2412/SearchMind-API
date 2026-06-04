from typing import List, Dict

def filter_safe_results(results: List[Dict]) -> List[Dict]:
    """
    Filters search results based on the family_friendly flag 
    and checks text/URL for potential unsafe or adult content.
    """
    safe_results = []
    unsafe_keywords = [
        "porn", "nsfw", "xxx", "casino", "gamble", "betting", 
        "torrent", "warez", "crack", "serial", "pirated", "x-rated"
    ]

    for r in results:
        # 1. Reject if explicitly marked non-family-friendly by provider
        if not r.get("family_friendly", True):
            continue

        # 2. Reject if unsafe keywords match title, snippet, or URL
        combined_text = f"{r.get('title', '')} {r.get('snippet', '')} {r.get('url', '')}".lower()
        if any(kw in combined_text for kw in unsafe_keywords):
            continue

        safe_results.append(r)

    return safe_results
