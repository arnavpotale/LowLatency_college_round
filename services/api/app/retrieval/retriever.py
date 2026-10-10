import re
import logging
from typing import List, Dict, Any, Optional, Callable
from app.core.config import settings
from app.retrieval.bm25 import BM25Scorer
from app.retrieval.embeddings import compute_dense_similarities, EmbeddingUnavailableError
from app.retrieval.fusion import reciprocal_rank_fusion

logger = logging.getLogger(__name__)


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
    top_k: int = 3,
    strategy: Optional[str] = None,
    embedder: Optional[Callable[[List[str]], Any]] = None
) -> List[Dict[str, Any]]:
    """
    Retrieves the most relevant passages from document chunks for a given claim.
    Supports hybrid retrieval (BM25 + Dense Embeddings with RRF), BM25 alone,
    Dense alone, or legacy lexical Jaccard overlap.
    
    Args:
        claim_text: Atomic claim text to find evidence for.
        chunks: List of candidate chunk dictionaries.
        top_k: Number of candidate evidence passages to return (default: 3).
        strategy: Retrieval strategy ('hybrid', 'bm25', 'dense', 'lexical').
                  Defaults to settings.retrieval_strategy.
        embedder: Optional custom embedding callable for unit testing.
        
    Returns:
        List of chunks with updated 'relevance_score' and 'retrieval_metadata', sorted by score.
    """
    if not chunks:
        return []

    strat = (strategy or settings.retrieval_strategy).lower().strip()
    num_chunks = len(chunks)

    # If only 1 chunk available, return it directly with score
    if num_chunks == 1:
        base_score = simple_token_overlap_score(claim_text, chunks[0].get("text", ""))
        return [{
            **chunks[0],
            "relevance_score": round(max(0.50, base_score), 3),
            "retrieval_metadata": {"strategy": "single_chunk", "rank": 1}
        }]

    passages = [str(c.get("text", "")) for c in chunks]

    # --- Strategy: Pure Lexical (Jaccard baseline) ---
    if strat in ["lexical", "jaccard"]:
        scored = []
        for idx, chunk in enumerate(chunks):
            s = simple_token_overlap_score(claim_text, passages[idx])
            scored.append({
                **chunk,
                "relevance_score": round(s, 3),
                "retrieval_metadata": {"strategy": "lexical_jaccard", "rank": idx + 1}
            })
        scored.sort(key=lambda x: x["relevance_score"], reverse=True)
        for rank, item in enumerate(scored, 1):
            item["retrieval_metadata"]["rank"] = rank
        return scored[:top_k]

    # --- BM25 Lexical Ranking ---
    bm25_scorer = BM25Scorer(corpus=passages)
    bm25_scores = bm25_scorer.get_scores(claim_text)
    bm25_sorted_indices = sorted(range(num_chunks), key=lambda i: bm25_scores[i], reverse=True)

    # --- Strategy: Pure BM25 ---
    if strat == "bm25":
        max_bm25 = max(bm25_scores) if max(bm25_scores) > 0 else 1.0
        scored = []
        for idx, chunk in enumerate(chunks):
            norm_score = round(bm25_scores[idx] / max_bm25, 3) if max_bm25 > 0 else 0.0
            scored.append({
                **chunk,
                "relevance_score": norm_score,
                "retrieval_metadata": {"strategy": "bm25", "bm25_score": round(bm25_scores[idx], 3)}
            })
        scored.sort(key=lambda x: x["relevance_score"], reverse=True)
        for rank, item in enumerate(scored, 1):
            item["retrieval_metadata"]["rank"] = rank
        return scored[:top_k]

    # --- Dense Semantic Embeddings Ranking ---
    dense_available = True
    dense_scores = [0.0] * num_chunks
    try:
        dense_scores = compute_dense_similarities(
            query=claim_text,
            passages=passages,
            embedder=embedder,
            model_name=settings.embedding_model,
            device=settings.embedding_device
        )
    except (EmbeddingUnavailableError, Exception) as e:
        logger.warning("Dense embedding retrieval unavailable (%s). Falling back to BM25 lexical.", e)
        dense_available = False

    # --- Strategy: Pure Dense ---
    if strat == "dense" and dense_available:
        scored = []
        for idx, chunk in enumerate(chunks):
            scored.append({
                **chunk,
                "relevance_score": round(dense_scores[idx], 3),
                "retrieval_metadata": {"strategy": "dense", "dense_score": round(dense_scores[idx], 3)}
            })
        scored.sort(key=lambda x: x["relevance_score"], reverse=True)
        for rank, item in enumerate(scored, 1):
            item["retrieval_metadata"]["rank"] = rank
        return scored[:top_k]

    # --- Strategy: Hybrid (BM25 + Dense via RRF) ---
    if not dense_available:
        # Documented fallback if dense embeddings fail
        max_bm25 = max(bm25_scores) if max(bm25_scores) > 0 else 1.0
        scored = []
        for idx, chunk in enumerate(chunks):
            norm_score = round(bm25_scores[idx] / max_bm25, 3) if max_bm25 > 0 else 0.0
            scored.append({
                **chunk,
                "relevance_score": norm_score,
                "retrieval_metadata": {
                    "strategy": "bm25_fallback",
                    "bm25_score": round(bm25_scores[idx], 3)
                }
            })
        scored.sort(key=lambda x: x["relevance_score"], reverse=True)
        for rank, item in enumerate(scored, 1):
            item["retrieval_metadata"]["rank"] = rank
        return scored[:top_k]

    dense_sorted_indices = sorted(range(num_chunks), key=lambda i: dense_scores[i], reverse=True)

    ranked_lists = [
        (bm25_sorted_indices, settings.retrieval_bm25_weight),
        (dense_sorted_indices, settings.retrieval_dense_weight)
    ]
    rrf_rankings = reciprocal_rank_fusion(ranked_lists, num_docs=num_chunks, k=settings.rrf_k)

    max_bm25 = max(bm25_scores) if max(bm25_scores) > 0 else 1.0
    scored = []
    for rank_1idx, (doc_idx, rrf_score) in enumerate(rrf_rankings, 1):
        chunk = chunks[doc_idx]
        norm_bm25 = bm25_scores[doc_idx] / max_bm25 if max_bm25 > 0 else 0.0
        d_score = dense_scores[doc_idx]
        
        # Composite calibrated relevance score in [0.0, 1.0]
        # Combining semantic similarity with lexical confirmation
        combined_relevance = 0.60 * d_score + 0.40 * norm_bm25
        
        scored.append({
            **chunk,
            "relevance_score": round(max(0.0, min(1.0, combined_relevance)), 3),
            "retrieval_metadata": {
                "strategy": "hybrid_rrf",
                "rrf_rank": rank_1idx,
                "rrf_score": round(rrf_score, 4),
                "dense_score": round(d_score, 3),
                "bm25_score": round(bm25_scores[doc_idx], 3)
            }
        })

    # Return top_k
    return scored[:top_k]
