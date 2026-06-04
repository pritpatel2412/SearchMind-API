def get_credibility_score(domain: str) -> float:
    """
    Computes a source credibility trust score between 0.0 and 1.0.
    Considers TLD extensions, keywords, and known low-trust patterns.
    """
    domain = domain.lower().strip().replace("www.", "")

    # 1. High trust domains
    if domain.endswith((".gov", ".edu", ".mil")):
        return 0.90
    if domain.endswith(".org"):
        return 0.80

    # 2. Known tech / academic keywords in domains
    trusted_keywords = [
        "academic", "science", "research", "university", "school",
        "github", "gitlab", "stackexchange", "stackoverflow", "readthedocs"
    ]
    if any(k in domain for k in trusted_keywords):
        return 0.80

    # 3. Known low-trust/spam words
    spam_keywords = [
        "casino", "gamble", "betting", "dietpill", "torrents", "warez",
        "pirate", "crack", "adfly", "doubleclick", "popup", "cheapoffers"
    ]
    if any(s in domain for s in spam_keywords):
        return 0.20

    # 4. Standard webpage base trust
    return 0.50
