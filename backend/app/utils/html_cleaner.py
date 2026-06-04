import re

def clean_text(text: str) -> str:
    """
    Strip HTML artifacts, normalize whitespace, remove boilerplate
    markers, and produce clean readable text for LLM consumption.
    """
    if not text:
        return ""

    # Remove leftover HTML entities
    text = re.sub(r'&[a-zA-Z]+;', ' ', text)
    text = re.sub(r'&#\d+;', ' ', text)

    # Remove URLs that leaked into body text
    text = re.sub(r'https?://\S+', '', text)

    # Remove email addresses
    text = re.sub(r'\S+@\S+\.\S+', '', text)

    # Remove common boilerplate markers
    boilerplate_patterns = [
        r'(?i)cookie\s*policy',
        r'(?i)privacy\s*policy',
        r'(?i)terms\s*(of|and)\s*(service|use)',
        r'(?i)all\s*rights\s*reserved',
        r'(?i)subscribe\s*to\s*our\s*newsletter',
        r'(?i)sign\s*up\s*for\s*free',
        r'(?i)follow\s*us\s*on',
        r'(?i)share\s*this\s*(article|post|page)',
        r'(?i)advertisement',
        r'(?i)sponsored\s*content',
    ]
    for pattern in boilerplate_patterns:
        text = re.sub(pattern, '', text)

    # Collapse multiple whitespace / newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)

    # Trim each line
    lines = [line.strip() for line in text.splitlines()]
    # Remove very short lines that are likely menu items or navigation
    lines = [l for l in lines if len(l) > 2 or l == '']

    text = '\n'.join(lines).strip()
    return text
