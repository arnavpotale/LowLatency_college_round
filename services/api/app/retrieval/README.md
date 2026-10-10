# Module: Document Retrieval and Evidence Ranking

**Owner:** Developer 3 — Document Intelligence and Retrieval

## Purpose
This module matches extracted claims against the indexed document chunks to find relevant source passages (evidence).

## Architecture
- **Lexical Layer:** BM25 (`rank-bm25`) for exact terminology, numerical figures, and named entities.
- **Semantic Layer:** Dense vector embeddings (SentenceTransformers `all-MiniLM-L6-v2`) with cosine distance indexing via FAISS or Chroma.
- **Hybrid Fusion:** Reciprocal Rank Fusion (RRF) combining keyword and dense scores.

## Module Interface
- `retrieve_evidence(claim_text: str, chunks: List[Dict[str, Any]], top_k: int) -> List[Dict[str, Any]]`: Returns top evidence items with relevance scores.
