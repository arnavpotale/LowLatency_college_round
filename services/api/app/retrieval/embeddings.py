import logging
from typing import List, Optional, Callable, Any, Dict
import numpy as np
from app.core.config import settings

logger = logging.getLogger(__name__)

_EMBEDDING_MODEL_CACHE: Dict[str, Any] = {}


class EmbeddingUnavailableError(Exception):
    """Raised when the embedding model or dependencies cannot be loaded."""
    pass


def get_embedding_model(model_name: Optional[str] = None, device: Optional[str] = None) -> Any:
    """
    Lazily loads the SentenceTransformer embedding model once per process.
    """
    m_name = model_name or settings.embedding_model
    dev = device or settings.embedding_device
    cache_key = f"{m_name}_{dev}"

    if cache_key in _EMBEDDING_MODEL_CACHE:
        return _EMBEDDING_MODEL_CACHE[cache_key]

    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as e:
        raise EmbeddingUnavailableError(
            f"SentenceTransformers is not installed ({e}). "
            "Please install sentence-transformers or configure another retrieval provider."
        )

    try:
        logger.info("Loading embedding model '%s' on device '%s'...", m_name, dev)
        model = SentenceTransformer(m_name, device=dev)
        _EMBEDDING_MODEL_CACHE[cache_key] = model
        return model
    except Exception as e:
        raise EmbeddingUnavailableError(f"Failed to load embedding model '{m_name}': {e}")


def compute_dense_similarities(
    query: str,
    passages: List[str],
    embedder: Optional[Callable[[List[str]], Any]] = None,
    model_name: Optional[str] = None,
    device: Optional[str] = None
) -> List[float]:
    """
    Computes cosine similarity between a query and a list of passages using dense embeddings.
    Returns normalized similarities in range [0.0, 1.0].
    """
    if not passages:
        return []

    texts_to_encode = [query] + passages

    if embedder is not None:
        raw_embs = embedder(texts_to_encode)
    else:
        model = get_embedding_model(model_name=model_name, device=device)
        raw_embs = model.encode(texts_to_encode, show_progress_bar=False, normalize_embeddings=True)

    # Convert to numpy array
    if hasattr(raw_embs, "detach"):
        embs = raw_embs.detach().cpu().numpy()
    else:
        embs = np.array(raw_embs)

    query_emb = embs[0]
    passage_embs = embs[1:]

    # Compute dot products (cosine similarity since embeddings are normalized)
    q_norm = np.linalg.norm(query_emb)
    if q_norm > 0:
        query_emb = query_emb / q_norm

    p_norms = np.linalg.norm(passage_embs, axis=1, keepdims=True)
    p_norms[p_norms == 0] = 1.0
    passage_embs = passage_embs / p_norms

    similarities = np.dot(passage_embs, query_emb)
    
    # Scale from [-1, 1] to [0.0, 1.0]
    scaled_sims = [float(max(0.0, min(1.0, (s + 1.0) / 2.0))) for s in similarities]
    return scaled_sims
