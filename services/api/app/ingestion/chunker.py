import re
from typing import List, Dict, Any


def chunk_document(
    text: str,
    chunk_size: int = 500,
    overlap: int = 100
) -> List[Dict[str, Any]]:
    """
    Chunks extracted document text into passages while tracking page/section
    hints, line numbers, and character offsets.
    
    Args:
        text: Raw document text (may contain --- [Page X] --- or --- [Section: Y] --- markers).
        chunk_size: Maximum character length per chunk (default 500).
        overlap: Character overlap between consecutive sub-chunks (default 100).
        
    Returns:
        List of dictionaries with keys:
        - text: Chunk content
        - start_offset: 0-indexed start character index in `text`
        - end_offset: 0-indexed end character index in `text`
        - page_or_section: Page or section metadata tag
        - line_start: 1-indexed starting line number in original document
        - line_end: 1-indexed ending line number in original document
    """
    if not text or not text.strip():
        return []

    # Safeguard overlap parameters
    if overlap >= chunk_size:
        overlap = max(0, chunk_size // 2)

    chunks: List[Dict[str, Any]] = []
    
    # Regex to capture markers like --- [Page 1] --- or --- [Section: Introduction] ---
    marker_pattern = re.compile(r"--- \[(Page \d+|Section: [^\]]+)\] ---\n?")
    
    # Split document by markers while keeping offsets
    segments = []
    last_end = 0
    current_context = "Section 1"

    for match in marker_pattern.finditer(text):
        m_start, m_end = match.span()
        # Text before marker
        if m_start > last_end:
            seg_text = text[last_end:m_start]
            if seg_text.strip():
                segments.append({
                    "start": last_end,
                    "end": m_start,
                    "context": current_context
                })
        
        # Update current context tag from match group
        marker_label = match.group(1).strip()
        current_context = marker_label
        last_end = m_end

    # Remaining text after last marker
    if last_end < len(text):
        seg_text = text[last_end:]
        if seg_text.strip():
            segments.append({
                "start": last_end,
                "end": len(text),
                "context": current_context
            })

    # If no markers were found, process whole text as a single segment
    if not segments and text.strip():
        segments.append({
            "start": 0,
            "end": len(text),
            "context": current_context
        })

    # Process each segment into chunks respecting chunk_size & overlap
    for seg in segments:
        seg_start = seg["start"]
        seg_end = seg["end"]
        seg_context = seg["context"]
        seg_str = text[seg_start:seg_end]

        # Break segment into paragraphs / blocks
        para_matches = list(re.finditer(r"\S[\s\S]*?(?=\n\s*\n|\Z)", seg_str))
        
        if not para_matches:
            continue

        accumulated_text = ""
        accumulated_start = None
        accumulated_end = None

        for p_match in para_matches:
            p_rel_start, p_rel_end = p_match.span()
            p_abs_start = seg_start + p_rel_start
            p_abs_end = seg_start + p_rel_end
            p_text = text[p_abs_start:p_abs_end]

            # If a single paragraph is longer than chunk_size, split with sliding window
            if len(p_text) > chunk_size:
                # Flush accumulated text first if any
                if accumulated_text.strip():
                    _add_chunk(chunks, text, accumulated_start, accumulated_end, seg_context)
                    accumulated_text = ""
                    accumulated_start = None
                    accumulated_end = None

                # Sliding window over long paragraph
                step = chunk_size - overlap
                for window_start in range(0, len(p_text), step):
                    window_end = min(window_start + chunk_size, len(p_text))
                    if window_start >= window_end:
                        break
                    
                    abs_w_start = p_abs_start + window_start
                    abs_w_end = p_abs_start + window_end
                    
                    _add_chunk(chunks, text, abs_w_start, abs_w_end, seg_context)
                    if window_end == len(p_text):
                        break
            else:
                # Check if adding paragraph exceeds chunk_size
                if accumulated_text and (len(accumulated_text) + len(p_text) + 2 > chunk_size):
                    _add_chunk(chunks, text, accumulated_start, accumulated_end, seg_context)
                    accumulated_text = p_text
                    accumulated_start = p_abs_start
                    accumulated_end = p_abs_end
                else:
                    if not accumulated_text:
                        accumulated_start = p_abs_start
                    accumulated_text += ("\n\n" if accumulated_text else "") + p_text
                    accumulated_end = p_abs_end

        if accumulated_text.strip():
            _add_chunk(chunks, text, accumulated_start, accumulated_end, seg_context)

    return chunks


def _add_chunk(
    chunks: List[Dict[str, Any]],
    full_text: str,
    start_offset: int,
    end_offset: int,
    page_or_section: str
):
    """Helper to construct and append a chunk with offset verification and line numbers."""
    chunk_str = full_text[start_offset:end_offset]
    if not chunk_str.strip():
        return

    # Calculate 1-indexed line numbers in full_text
    line_start = full_text.count("\n", 0, start_offset) + 1
    line_end = full_text.count("\n", 0, end_offset) + 1

    chunks.append({
        "text": chunk_str,
        "start_offset": start_offset,
        "end_offset": end_offset,
        "page_or_section": page_or_section,
        "line_start": line_start,
        "line_end": line_end
    })

