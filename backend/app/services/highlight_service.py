import re
import math
from typing import List, Optional, Tuple
from app.schemas.search import PassageHighlight

STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", 
    "by", "can", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", 
    "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", 
    "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", 
    "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once", 
    "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she", 
    "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", 
    "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", 
    "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", 
    "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
}

def _tokenize(text: str) -> List[str]:
    return [w.lower() for w in re.findall(r"\b[a-zA-Z0-9_\-\.]+\b", text)]

def _get_query_terms(query: str) -> Tuple[List[str], List[Tuple[str, str]]]:
    words = _tokenize(query)
    unigrams = [w for w in words if w not in STOP_WORDS and len(w) > 1]
    bigrams = []
    for i in range(len(unigrams) - 1):
        bigrams.append((unigrams[i], unigrams[i + 1]))
    return unigrams or words, bigrams

def _estimate_tokens(text: str) -> int:
    if not text:
        return 0
    words = text.split()
    return max(1, int(len(words) * 1.33))

def extract_dynamic_highlights(
    content: str,
    query: str,
    max_highlights: int = 3,
    strategy: str = "dynamic"
) -> Tuple[List[PassageHighlight], float]:
    """
    Extracts query-conditioned dynamic passage highlights from content,
    cutting token context usage by up to 95% while isolating high-relevance ground truth.
    """
    if not content or not content.strip() or not query or not query.strip():
        return [], 0.0

    total_tokens = _estimate_tokens(content)
    unigrams, bigrams = _get_query_terms(query)
    
    # 1. Segment text into candidate blocks with character offsets and active headers
    candidates = []
    current_header = None
    
    # Regex split preserving offsets
    # Match markdown headers or paragraphs
    lines = content.split("\n")
    char_cursor = 0
    
    current_passage = []
    passage_start = 0

    for line in lines:
        stripped = line.strip()
        line_len = len(line) + 1 # +1 for newline
        
        # Check if line is a header
        header_match = re.match(r"^#{1,6}\s+(.+)$", stripped)
        if header_match:
            # Flush current passage if any
            if current_passage:
                p_text = " ".join(current_passage).strip()
                if len(p_text) >= 40:
                    candidates.append((p_text, passage_start, char_cursor - 1, current_header))
                current_passage = []
            current_header = header_match.group(1).strip()
            char_cursor += line_len
            passage_start = char_cursor
            continue
        
        if not stripped:
            if current_passage:
                p_text = " ".join(current_passage).strip()
                if len(p_text) >= 40:
                    candidates.append((p_text, passage_start, char_cursor - 1, current_header))
                current_passage = []
            char_cursor += line_len
            passage_start = char_cursor
            continue
            
        if not current_passage:
            passage_start = char_cursor
        current_passage.append(stripped)
        char_cursor += line_len
        
    if current_passage:
        p_text = " ".join(current_passage).strip()
        if len(p_text) >= 40:
            candidates.append((p_text, passage_start, char_cursor, current_header))

    # If no paragraph-level candidates found, split by sentences
    if not candidates:
        sentence_matches = list(re.finditer(r"[^.!?]+[.!?]+", content))
        for m in sentence_matches:
            stext = m.group(0).strip()
            if len(stext) >= 30:
                candidates.append((stext, m.start(), m.end(), None))

    if not candidates:
        return [], 0.0

    # 2. Score candidate passages
    scored_candidates = []
    for text, start, end, header in candidates:
        p_tokens = _tokenize(text)
        if not p_tokens:
            continue
        p_token_set = set(p_tokens)
        
        # Unigram match ratio
        matched_unigrams = [u for u in unigrams if u in p_token_set]
        unigram_score = len(matched_unigrams) / max(1, len(unigrams))
        
        # Bigram proximity score
        bigram_score = 0.0
        if bigrams:
            bigram_matches = 0
            for b1, b2 in bigrams:
                # Find occurrences of b1 and b2 within a 6-token window
                for idx, t in enumerate(p_tokens):
                    if t == b1:
                        window = p_tokens[idx + 1: idx + 7]
                        if b2 in window:
                            bigram_matches += 1
                            break
            bigram_score = bigram_matches / len(bigrams)
            
        # Frequency density boost (higher term density in shorter text)
        density = len(matched_unigrams) / max(1, len(p_tokens))
        
        combined_score = (0.50 * unigram_score) + (0.35 * bigram_score) + (0.15 * min(1.0, density * 5.0))
        
        # Header boost
        if header and any(u in _tokenize(header) for u in unigrams):
            combined_score = min(1.0, combined_score + 0.15)
            
        if combined_score > 0.08:
            scored_candidates.append({
                "text": text,
                "score": round(combined_score, 4),
                "header": header,
                "start": start,
                "end": end
            })

    # Sort descending by relevance score
    scored_candidates.sort(key=lambda x: x["score"], reverse=True)

    # 3. Apply non-overlapping selection
    selected = []
    selected_spans = []

    for cand in scored_candidates:
        c_start, c_end = cand["start"], cand["end"]
        # Check overlap
        overlaps = False
        for s_start, s_end in selected_spans:
            if max(c_start, s_start) < min(c_end, s_end):
                overlaps = True
                break
        if not overlaps:
            # In dynamic strategy, trim excessively long candidate passages to surrounding window
            p_text = cand["text"]
            if strategy == "dynamic" and len(p_text) > 450:
                # Find central occurrence of first matched query unigram
                p_lower = p_text.lower()
                first_pos = -1
                for u in unigrams:
                    pos = p_lower.find(u)
                    if pos != -1 and (first_pos == -1 or pos < first_pos):
                        first_pos = pos
                if first_pos != -1:
                    w_start = max(0, first_pos - 150)
                    w_end = min(len(p_text), first_pos + 250)
                    # Expand to sentence or word boundary
                    if w_start > 0:
                        space_idx = p_text.find(" ", w_start)
                        w_start = space_idx if space_idx != -1 else w_start
                    if w_end < len(p_text):
                        space_idx = p_text.rfind(" ", 0, w_end)
                        w_end = space_idx if space_idx != -1 else w_end
                    trimmed = p_text[w_start:w_end].strip()
                    if w_start > 0:
                        trimmed = "..." + trimmed
                    if w_end < len(p_text):
                        trimmed = trimmed + "..."
                    p_text = trimmed

            selected.append(PassageHighlight(
                text=p_text,
                relevance_score=cand["score"],
                section_header=cand["header"],
                char_start=cand["start"],
                char_end=cand["end"]
            ))
            selected_spans.append((c_start, c_end))
            if len(selected) >= max_highlights:
                break

    # 4. Calculate token savings percentage
    highlight_tokens = sum(_estimate_tokens(h.text) for h in selected)
    savings = 0.0
    if total_tokens > 0:
        savings = max(0.0, round((1.0 - (highlight_tokens / total_tokens)) * 100, 1))

    return selected, savings
