import re
from typing import List, Dict, Any


def simple_token_overlap_score(query: str, passage: str) -> float:
    """Computes basic word token overlap (Jaccard similarity baseline)."""
    q_tokens = set(re.findall(r'\w+', query.lower()))
    p_tokens = set(re.findall(r'\w+', passage.lower()))
    
    if not q_tokens or not p_tokens:
        return 0.0
        
    intersection = len(q_tokens.intersection(p_tokens))
    union = len(q_tokens.union(p_tokens))
    return float(intersection / union) if union > 0 else 0.0


def retrieve_evidence(
    claim_text: str,
    chunks: List[Dict[str, Any]],
    top_k: int = 3
) -> List[Dict[str, Any]]:
    """
    Retrieves the most relevant passages from document chunks for a given claim.
    
    In the initial foundation, this uses lexical token similarity.
    In future phases, this will use hybrid retrieval:
    1. BM25 ranker for exact keyword/entity matches.
    2. Dense embedding retrieval (SentenceTransformers + FAISS/Chroma).
    3. Reciprocal Rank Fusion (RRF) or Cross-Encoder re-ranking.
    """
    if not chunks:
        return []

    scored_chunks = []
    for chunk in chunks:
        score = simple_token_overlap_score(claim_text, chunk["text"])
        scored_chunks.append({
            **chunk,
            "relevance_score": round(score, 3)
        })

    # Sort descending by relevance score
    scored_chunks.sort(key=lambda x: x["relevance_score"], reverse=True)
    return scored_chunks[:top_k]
