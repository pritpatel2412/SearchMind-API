import re

BOT_WALL_PATTERNS = [
    r"please wait.{0,20}(verif|load)",
    r"verify you are human",
    r"checking your browser",
    r"enable javascript and cookies",
    r"are you a robot",
    r"just a moment",
    r"access denied",
    r"unusual traffic",
    r"complete the security check",
    r"attention required",
]

_COMPILED = [re.compile(p, re.IGNORECASE) for p in BOT_WALL_PATTERNS]


def is_blocked_content(content: str) -> bool:
    """Flags bot-check/verification interstitials and near-empty
    extractions so the pipeline falls back to the provider snippet
    instead of surfacing junk as if it were the page content."""
    if not content or not content.strip():
        return True
    stripped = content.strip()
    for pattern in _COMPILED:
        if pattern.search(stripped):
            return True
    if len(stripped.split()) < 8:
        return True
    return False
