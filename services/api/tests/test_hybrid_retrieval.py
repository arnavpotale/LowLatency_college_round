import pytest
import numpy as np
from app.retrieval.retriever import retrieve_evidence, simple_token_overlap_score
from app.retrieval.bm25 import BM25Scorer, tokenize_for_bm25
from app.retrieval.fusion import reciprocal_rank_fusion
from app.retrieval.embeddings import EmbeddingUnavailableError


def test_bm25_exact_keyword_and_number_ranking():
    corpus = [
        "Clinical pharmacology: Lisinopril dosage for hypertension is 10mg daily.",
        "Corporate earnings report: Total operating expenses reached $4.2M in Q3.",
        "Architecture overview: Raft consensus requires a quorum of 3 nodes out of 5."
    ]
    scorer = BM25Scorer(corpus)
    scores = scorer.get_scores("Lisinopril 10mg")
    
    assert scores[0] > scores[1]
    assert scores[0] > scores[2]
    assert scores[1] == 0.0 or scores[1] < scores[0]


def test_reciprocal_rank_fusion_logic():
    # doc 0 is rank 1 in list A and rank 2 in list B
    # doc 1 is rank 2 in list A and rank 1 in list B
    # doc 2 is rank 3 in both
    list_a = [0, 1, 2]
    list_b = [1, 0, 2]
    ranked_lists = [(list_a, 0.5), (list_b, 0.5)]

    results = reciprocal_rank_fusion(ranked_lists, num_docs=3, k=60)
    assert len(results) == 3
    # Top two should have identical score since symmetric
    assert abs(results[0][1] - results[1][1]) < 1e-6
    # doc 2 should be lowest rank
    assert results[2][0] == 2
    assert results[2][1] < results[0][1]


def test_hybrid_retrieval_with_fake_embedder():
    chunks = [
        {"evidence_id": "ev_0", "source_name": "med.txt", "text": "Lisinopril 10mg treats high blood pressure in adults."},
        {"evidence_id": "ev_1", "source_name": "fin.txt", "text": "Operating expenses rose 8% year-over-year to $4.2M."},
        {"evidence_id": "ev_2", "source_name": "sys.txt", "text": "Raft distributed consensus requires 3 nodes for quorum."}
    ]

    # Fake embedder that simulates semantic vector similarity
    def fake_embedder(texts):
        vecs = []
        for t in texts:
            tl = t.lower()
            if "blood pressure" in tl or "hypertension" in tl or "lisinopril" in tl:
                vecs.append([1.0, 0.0, 0.0])
            elif "expense" in tl or "4.2m" in tl or "financial" in tl:
                vecs.append([0.0, 1.0, 0.0])
            elif "raft" in tl or "consensus" in tl or "nodes" in tl:
                vecs.append([0.0, 0.0, 1.0])
            else:
                vecs.append([0.33, 0.33, 0.33])
        return np.array(vecs)

    # Paraphrased query with no direct keyword match for "high blood pressure"
    query = "Lisinopril treats elevated arterial pressure"
    results = retrieve_evidence(query, chunks, top_k=2, strategy="hybrid", embedder=fake_embedder)

    assert len(results) == 2
    assert results[0]["evidence_id"] == "ev_0"
    assert results[0]["relevance_score"] > 0.0
    assert results[0]["retrieval_metadata"]["strategy"] == "hybrid_rrf"
    assert "rrf_rank" in results[0]["retrieval_metadata"]


def test_hybrid_retrieval_falls_back_to_bm25_when_dense_fails(monkeypatch):
    chunks = [
        {"evidence_id": "ev_0", "text": "Lisinopril 10mg daily for hypertension."},
        {"evidence_id": "ev_1", "text": "Unrelated financial text discussing 10-Q filing."}
    ]

    # Force compute_dense_similarities to fail
    def failing_embedder(texts):
        raise EmbeddingUnavailableError("Simulated missing sentence-transformers model")

    results = retrieve_evidence("Lisinopril 10mg", chunks, top_k=1, strategy="hybrid", embedder=failing_embedder)

    assert len(results) == 1
    assert results[0]["evidence_id"] == "ev_0"
    assert results[0]["retrieval_metadata"]["strategy"] == "bm25_fallback"
    assert results[0]["relevance_score"] > 0.0


def test_retrieval_preserves_all_chunk_metadata():
    chunks = [
        {
            "evidence_id": "ev_test_123",
            "chunk_id": "chunk_0",
            "source_id": "src_99",
            "source_name": "protocol.pdf",
            "page_or_section": "Page 4",
            "start_offset": 100,
            "end_offset": 250,
            "text": "Standard initial dose is 25mg daily."
        }
    ]

    results = retrieve_evidence("dose 25mg", chunks, top_k=1)
    assert len(results) == 1
    res = results[0]
    assert res["evidence_id"] == "ev_test_123"
    assert res["chunk_id"] == "chunk_0"
    assert res["source_id"] == "src_99"
    assert res["source_name"] == "protocol.pdf"
    assert res["page_or_section"] == "Page 4"
    assert res["start_offset"] == 100
    assert res["end_offset"] == 250
    assert res["relevance_score"] > 0.0


def test_retrieval_empty_and_zero_overlap():
    assert retrieve_evidence("query", []) == []
