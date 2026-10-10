import re
import uuid
from typing import List, Dict, Any


def extract_claims(original_answer: str) -> List[Dict[str, Any]]:
    """
    Decomposes the original answer text into individual factual claims.
    Preserves exact Unicode character offsets [start_offset, end_offset]
    relative to the original_answer string.
    
    In the initial foundation, this uses a deterministic sentence boundary
    parser with offset preservation. In future phases, this interfaces with
    an LLM structured output extractor for atomic claim decomposition.
    """
    if not original_answer or not original_answer.strip():
        return []

    claims = []
    # Sentence splitting regex that tracks positions
    sentence_pattern = re.compile(r'([^.!?\n]+[.!?]*)', re.UNICODE)
    
    for match in sentence_pattern.finditer(original_answer):
        raw_text = match.group(1)
        cleaned_text = raw_text.strip()
        
        # Skip trivial or empty lines
        if len(cleaned_text) < 5:
            continue
            
        start_offset = match.start(1) + (len(raw_text) - len(raw_text.lstrip()))
        end_offset = start_offset + len(cleaned_text)
        
        claims.append({
            "claim_id": f"claim_{uuid.uuid4().hex[:8]}",
            "claim_text": cleaned_text,
            "start_offset": start_offset,
            "end_offset": end_offset,
            "confidence": 0.95
        })

    return claims
