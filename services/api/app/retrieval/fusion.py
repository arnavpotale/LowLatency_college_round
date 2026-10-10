from typing import List, Dict, Any, Tuple


def reciprocal_rank_fusion(
    ranked_lists: List[Tuple[List[int], float]],  # List of (list_of_doc_indices_sorted_by_score, weight)
    num_docs: int,
    k: int = 60
) -> List[Tuple[int, float]]:
    """
    Computes Reciprocal Rank Fusion (RRF) scores across multiple ranked lists.
    
    Args:
        ranked_lists: Each tuple contains (doc_indices_in_ranked_order, weight).
        num_docs: Total number of documents.
        k: Smoothing constant (default: 60).
        
    Returns:
        List of (doc_idx, rrf_score) sorted descending by rrf_score.
    """
    rrf_scores = {idx: 0.0 for idx in range(num_docs)}

    for doc_indices, weight in ranked_lists:
        for rank_zero, doc_idx in enumerate(doc_indices):
            rank = rank_zero + 1  # 1-indexed rank
            rrf_scores[doc_idx] += weight * (1.0 / (k + rank))

    sorted_results = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)
    return sorted_results
