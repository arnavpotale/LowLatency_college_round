import re
from typing import List, Dict, Any, Optional
from app.core.config import settings


def estimate_token_count(text: str) -> int:
    """
    Estimates token count for subword tokenizers (e.g., DeBERTa-v3, RoBERTa, BERT).
    Subword tokenization typically produces ~1.2 to 1.4 tokens per whitespace word,
    plus additional tokens for special symbols and numbers.
    """
    if not text or not text.strip():
        return 0
    words = re.findall(r'\S+', text)
    punctuation_count = len(re.findall(r'[^\w\s]', text))
    estimated = int(len(words) * 1.25) + int(punctuation_count * 0.5)
    return max(1, estimated)


def find_safe_split_point(text: str, target_pos: int, min_pos: int, max_pos: int) -> int:
    """
    Finds a natural boundary (sentence end, newline, or word boundary) near target_pos
    between min_pos and max_pos to avoid cutting words or numbers in half.
    """
    if target_pos >= len(text):
        return len(text)

    # 1. Search for sentence terminators (. ! ?) followed by whitespace
    sentence_matches = list(re.finditer(r'[.!?]\s+', text[min_pos:max_pos]))
    if sentence_matches:
        # Pick the sentence boundary closest to target_pos
        best_match = min(sentence_matches, key=lambda m: abs((min_pos + m.end()) - target_pos))
        return min_pos + best_match.end()

    # 2. Search for newline characters
    newline_pos = text.rfind('\n', min_pos, max_pos)
    if newline_pos != -1 and newline_pos > min_pos:
        return newline_pos + 1

    # 3. Search for whitespace boundary
    space_pos = text.rfind(' ', min_pos, max_pos)
    if space_pos != -1 and space_pos > min_pos:
        return space_pos + 1

    # 4. Fallback to target_pos directly
    return min(target_pos, len(text))


def chunk_document(
    text: str,
    chunk_size: Optional[int] = None,
    overlap: Optional[int] = None,
    max_tokens: Optional[int] = None,
    source_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Chunks extracted document text into overlapping passages with stable offsets,
    page/section hints, and token limit awareness.
    
    Args:
        text: Plaintext document content.
        chunk_size: Maximum character length per chunk (default from settings).
        overlap: Character overlap between consecutive split chunks (default from settings).
        max_tokens: Maximum estimated tokens allowed per chunk (default from settings).
        source_id: Optional source document identifier.
        
    Returns:
        List of chunks with keys:
            - chunk_id: Stable sequential ID (e.g., 'chunk_0')
            - source_id: Associated source identifier
            - text: Clean chunk passage text
            - start_offset: 0-indexed Unicode character start offset in original text
            - end_offset: 0-indexed Unicode character end offset in original text
            - start_char: Alias for start_offset
            - end_char: Alias for end_offset
            - page_or_section: Page number or section label
            - token_count: Estimated token count
    """
    if not text or not text.strip():
        return []

    c_size = chunk_size if chunk_size is not None else settings.chunk_size_chars
    c_overlap = overlap if overlap is not None else settings.chunk_overlap_chars
    max_tok = max_tokens if max_tokens is not None else settings.max_chunk_tokens

    # Safety checks
    if c_size <= 50:
        c_size = 500
    if c_overlap >= c_size:
        c_overlap = c_size // 4
    if c_overlap < 0:
        c_overlap = 0

    chunks: List[Dict[str, Any]] = []

    # Parse page and section markers (e.g. --- [Page 2] ---, --- [Section: Title] ---)
    page_marker_pattern = re.compile(r'(---\s*\[(?:Page\s+\d+|Section:\s*[^\]]+)\]\s*---)', re.IGNORECASE)
    segments = []
    last_idx = 0

    for match in page_marker_pattern.finditer(text):
        if match.start() > last_idx:
            segments.append((text[last_idx:match.start()], last_idx, False))
        segments.append((match.group(0), match.start(), True))
        last_idx = match.end()

    if last_idx < len(text):
        segments.append((text[last_idx:], last_idx, False))

    current_page = "Section 1"
    chunk_counter = 0

    for seg_text, seg_start, is_marker in segments:
        if is_marker:
            current_page = seg_text.strip("- []")
            continue

        if not seg_text.strip():
            continue

        # Split into natural paragraphs by blank lines (\n\n+) or end of segment
        para_pattern = re.compile(r'(\S(?:.*?\S)?)(?=\n\s*\n|\s*\Z)', re.DOTALL)
        
        for para_match in para_pattern.finditer(seg_text):
            para_raw = para_match.group(0)
            para_clean = para_raw.strip()
            if not para_clean:
                continue

            para_start = seg_start + para_match.start() + (len(para_raw) - len(para_raw.lstrip()))
            para_end = para_start + len(para_clean)

            # Case A: Paragraph is within chunk_size and token limit -> keep intact
            para_tok = estimate_token_count(para_clean)
            if len(para_clean) <= c_size and para_tok <= max_tok:
                chunks.append({
                    "chunk_id": f"chunk_{chunk_counter}",
                    "source_id": source_id or "",
                    "text": para_clean,
                    "start_offset": para_start,
                    "end_offset": para_end,
                    "start_char": para_start,
                    "end_char": para_end,
                    "page_or_section": current_page,
                    "token_count": para_tok,
                    "line_start": text.count("\n", 0, para_start) + 1,
                    "line_end": text.count("\n", 0, para_end) + 1
                })
                chunk_counter += 1
                continue

            # Case B: Paragraph exceeds chunk_size -> apply sliding window with overlap
            cursor = 0
            para_len = len(para_clean)

            while cursor < para_len:
                remaining = para_len - cursor
                if remaining <= c_size:
                    chunk_text = para_clean[cursor:].strip()
                    if chunk_text:
                        actual_start = para_start + cursor + (len(para_clean[cursor:]) - len(para_clean[cursor:].lstrip()))
                        actual_end = actual_start + len(chunk_text)
                        chunks.append({
                            "chunk_id": f"chunk_{chunk_counter}",
                            "source_id": source_id or "",
                            "text": chunk_text,
                            "start_offset": actual_start,
                            "end_offset": actual_end,
                            "start_char": actual_start,
                            "end_char": actual_end,
                            "page_or_section": current_page,
                            "token_count": estimate_token_count(chunk_text),
                            "line_start": text.count("\n", 0, actual_start) + 1,
                            "line_end": text.count("\n", 0, actual_end) + 1
                        })
                        chunk_counter += 1
                    break

                # Window spans cursor to cursor + c_size
                target_end = cursor + c_size
                min_bound = cursor + max(50, c_size - c_overlap - 50)
                max_bound = min(para_len, target_end)

                split_point = find_safe_split_point(para_clean, target_end, min_bound, max_bound)
                chunk_slice = para_clean[cursor:split_point].strip()

                if chunk_slice:
                    slice_start_in_para = cursor + (len(para_clean[cursor:split_point]) - len(para_clean[cursor:split_point].lstrip()))
                    actual_start = para_start + slice_start_in_para
                    actual_end = actual_start + len(chunk_slice)

                    chunks.append({
                        "chunk_id": f"chunk_{chunk_counter}",
                        "source_id": source_id or "",
                        "text": chunk_slice,
                        "start_offset": actual_start,
                        "end_offset": actual_end,
                        "start_char": actual_start,
                        "end_char": actual_end,
                        "page_or_section": current_page,
                        "token_count": estimate_token_count(chunk_slice),
                        "line_start": text.count("\n", 0, actual_start) + 1,
                        "line_end": text.count("\n", 0, actual_end) + 1
                    })
                    chunk_counter += 1

                # Advance cursor with overlap
                next_cursor = split_point - c_overlap
                if next_cursor <= cursor:
                    # Prevent infinite loop if split point was too early
                    next_cursor = cursor + max(50, c_size - c_overlap)
                cursor = next_cursor

    return chunks
