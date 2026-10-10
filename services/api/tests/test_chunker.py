import pytest
from app.ingestion.chunker import chunk_document, estimate_token_count


def test_chunker_short_source_preserves_single_chunk():
    text = "Clinical pharmacology monograph: Lisinopril initial dosage for adult hypertension is 10mg once daily."
    chunks = chunk_document(text, chunk_size=300, overlap=50)

    assert len(chunks) == 1
    assert chunks[0]["chunk_id"] == "chunk_0"
    assert chunks[0]["text"] == text
    assert chunks[0]["start_offset"] == 0
    assert chunks[0]["end_offset"] == len(text)
    assert chunks[0]["page_or_section"] == "Section 1"
    assert chunks[0]["token_count"] > 0
    assert text[chunks[0]["start_offset"]:chunks[0]["end_offset"]] == chunks[0]["text"]


def test_chunker_multiple_paragraphs_retains_boundaries():
    text = "First paragraph discussing trial methodology.\n\nSecond paragraph detailing patient cohort."
    chunks = chunk_document(text, chunk_size=300, overlap=50)

    assert len(chunks) == 2
    assert chunks[0]["chunk_id"] == "chunk_0"
    assert chunks[1]["chunk_id"] == "chunk_1"
    assert chunks[0]["text"] == "First paragraph discussing trial methodology."
    assert chunks[1]["text"] == "Second paragraph detailing patient cohort."
    for c in chunks:
        assert text[c["start_offset"]:c["end_offset"]] == c["text"]


def test_chunker_long_paragraph_splits_into_overlapping_windows():
    # Construct a paragraph of ~1000 characters
    sentences = [
        f"This is sentence number {i} containing important technical facts about node replication."
        for i in range(12)
    ]
    long_para = " ".join(sentences)
    assert len(long_para) > 900

    chunks = chunk_document(long_para, chunk_size=350, overlap=80)

    assert len(chunks) >= 3
    # Verify each chunk is bounded by chunk_size
    for c in chunks:
        assert len(c["text"]) <= 420  # allowed padding for safe word boundaries
        assert c["token_count"] <= 120
        # Character offsets must match exact original slice
        assert long_para[c["start_offset"]:c["end_offset"]] == c["text"]

    # Verify consecutive chunks have overlapping content
    for i in range(len(chunks) - 1):
        c_curr = chunks[i]["text"]
        c_next = chunks[i + 1]["text"]
        # There should be shared words between c_curr tail and c_next head
        words_curr = set(c_curr.split()[-6:])
        words_next = set(c_next.split()[:8])
        assert len(words_curr.intersection(words_next)) >= 1


def test_chunker_unicode_and_special_characters():
    text = "--- [Page 1] ---\nInternational study: β-blocker efficacy was evaluated in São Paulo (temp: 35.5°C) 🚀.\n\n--- [Page 2] ---\nSummary: Résumé of Tokyo cohort: 東京試験結果."
    chunks = chunk_document(text, chunk_size=400, overlap=60)

    assert len(chunks) == 2
    assert chunks[0]["page_or_section"] == "Page 1"
    assert chunks[1]["page_or_section"] == "Page 2"
    assert "São Paulo" in chunks[0]["text"]
    assert "🚀" in chunks[0]["text"]
    assert "東京試験結果" in chunks[1]["text"]
    for c in chunks:
        assert text[c["start_offset"]:c["end_offset"]] == c["text"]


def test_chunker_page_markers_updates_metadata():
    text = "--- [Page 1] ---\nPage one information.\n\n--- [Page 2] ---\nPage two content.\n\n--- [Page 3] ---\nPage three conclusion."
    chunks = chunk_document(text)

    assert len(chunks) == 3
    assert chunks[0]["page_or_section"] == "Page 1"
    assert chunks[1]["page_or_section"] == "Page 2"
    assert chunks[2]["page_or_section"] == "Page 3"
    for c in chunks:
        assert text[c["start_offset"]:c["end_offset"]] == c["text"]


def test_chunker_token_limit_estimation():
    short_text = "Simple short sentence."
    assert estimate_token_count(short_text) < 10

    long_text = " ".join(["distributed"] * 250)
    tok_est = estimate_token_count(long_text)
    assert 250 <= tok_est <= 400

    chunks = chunk_document(long_text, chunk_size=400, overlap=50, max_tokens=150)
    for c in chunks:
        assert c["token_count"] <= 150


def test_chunker_empty_and_whitespace_sources():
    assert chunk_document("") == []
    assert chunk_document("    \n\n   ") == []
