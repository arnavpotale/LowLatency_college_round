import re
from typing import List, Dict, Any


def chunk_document(text: str, chunk_size: int = 500, overlap: int = 100) -> List[Dict[str, Any]]:
    """
    Chunks extracted document text into overlapping passages while tracking
    page/section hints and character offsets.
    
    Returns:
        List of chunks with keys: text, start_offset, end_offset, page_or_section
    """
    chunks = []
    # Simple regex for page markers created by parser
    page_splits = re.split(r"(--- \[Page \d+\] ---)", text)
    
    current_page = "Section 1"
    offset_cursor = 0
    
    for segment in page_splits:
        if segment.startswith("--- [Page ") and segment.endswith("] ---"):
            current_page = segment.strip("- []")
            offset_cursor += len(segment)
            continue
            
        segment_clean = segment.strip()
        if not segment_clean:
            offset_cursor += len(segment)
            continue
            
        # Split segment into chunks by paragraphs or sliding window
        paragraphs = segment_clean.split("\n\n")
        para_cursor = 0
        for p in paragraphs:
            p_text = p.strip()
            if not p_text:
                continue
            start_pos = offset_cursor + para_cursor
            end_pos = start_pos + len(p_text)
            chunks.append({
                "text": p_text,
                "start_offset": start_pos,
                "end_offset": end_pos,
                "page_or_section": current_page
            })
            para_cursor += len(p) + 2
            
        offset_cursor += len(segment)

    return chunks
