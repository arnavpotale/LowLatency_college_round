import pytest
from app.extraction.extractor import extract_claims, _split_into_sentences


def test_revenue_coordinate_contrast():
    text = "Revenue increased by 12% in Q1 but declined by 5% in Q2."
    claims = extract_claims(text)
    assert len(claims) == 2

    c1, c2 = claims[0], claims[1]
    assert c1["claim_text"] == "Revenue increased by 12% in Q1"
    assert c2["claim_text"] == "declined by 5% in Q2."
    assert c2["verifiable_text"] == "Revenue declined by 5% in Q2."
    assert c2["inherited_subject"] == "Revenue"

    # Exact offset invariant
    assert text[c1["start_offset"]:c1["end_offset"]] == c1["claim_text"]
    assert text[c2["start_offset"]:c2["end_offset"]] == c2["claim_text"]


def test_security_coordinate_and():
    text = "The service supports encryption, and it stores passwords in plaintext."
    claims = extract_claims(text)
    assert len(claims) == 2

    c1, c2 = claims[0], claims[1]
    assert c1["claim_text"] == "The service supports encryption"
    assert c2["claim_text"] == "it stores passwords in plaintext."
    assert text[c1["start_offset"]:c1["end_offset"]] == c1["claim_text"]
    assert text[c2["start_offset"]:c2["end_offset"]] == c2["claim_text"]


def test_clinical_treatment_recurrence():
    text = "The treatment may reduce symptoms but has not been shown to prevent recurrence."
    claims = extract_claims(text)
    assert len(claims) == 2

    c1, c2 = claims[0], claims[1]
    assert c1["claim_text"] == "The treatment may reduce symptoms"
    assert c2["claim_text"] == "has not been shown to prevent recurrence."
    assert c2["verifiable_text"] == "The treatment has not been shown to prevent recurrence."
    assert text[c1["start_offset"]:c1["end_offset"]] == c1["claim_text"]
    assert text[c2["start_offset"]:c2["end_offset"]] == c2["claim_text"]


def test_regulatory_qualified_claim_remains_intact():
    text = "The regulation applies to businesses in California from January 2025."
    claims = extract_claims(text)
    # Does not contain a coordinate clause with predicate; must not be split arbitrarily
    assert len(claims) == 1
    assert claims[0]["claim_text"] == text
    assert text[claims[0]["start_offset"]:claims[0]["end_offset"]] == text


def test_conditional_statement_preserved_intact():
    text = "If the server temperature exceeds 80°C, the cooling fan automatically engages."
    claims = extract_claims(text)
    assert len(claims) == 1
    assert claims[0]["claim_text"] == text
    assert claims[0]["decomposition_type"] == "conditional_dependency_preserved"
    assert text[claims[0]["start_offset"]:claims[0]["end_offset"]] == text


def test_unless_condition_preserved_intact():
    text = "Unless explicitly approved by an administrator, remote root login is disabled."
    claims = extract_claims(text)
    assert len(claims) == 1
    assert claims[0]["claim_text"] == text
    assert claims[0]["decomposition_type"] == "conditional_dependency_preserved"
    assert text[claims[0]["start_offset"]:claims[0]["end_offset"]] == text


def test_semicolon_clause_decomposition():
    text = "PostgreSQL allocates shared memory; Redis uses an in-memory single-threaded event loop."
    claims = extract_claims(text)
    assert len(claims) == 2
    c1, c2 = claims[0], claims[1]
    assert c1["claim_text"] == "PostgreSQL allocates shared memory"
    assert c2["claim_text"] == "Redis uses an in-memory single-threaded event loop."
    assert text[c1["start_offset"]:c1["end_offset"]] == c1["claim_text"]
    assert text[c2["start_offset"]:c2["end_offset"]] == c2["claim_text"]


def test_unicode_and_special_characters():
    text = "“L’échantillon A a augmenté de 15 % en 2024 ; l’échantillon B a diminué de 8 %.”"
    claims = extract_claims(text)
    assert len(claims) >= 1
    for c in claims:
        assert text[c["start_offset"]:c["end_offset"]] == c["claim_text"]


def test_repeated_sentences_distinct_offsets():
    text = "System alert triggered. System alert triggered."
    claims = extract_claims(text)
    assert len(claims) == 2
    assert claims[0]["start_offset"] == 0
    assert claims[0]["end_offset"] == 23
    assert claims[1]["start_offset"] == 24
    assert claims[1]["end_offset"] == 47
    assert claims[0]["claim_id"] != claims[1]["claim_id"]
    assert text[claims[0]["start_offset"]:claims[0]["end_offset"]] == claims[0]["claim_text"]
    assert text[claims[1]["start_offset"]:claims[1]["end_offset"]] == claims[1]["claim_text"]


def test_empty_and_whitespace_input():
    assert extract_claims("") == []
    assert extract_claims("   \n\t  ") == []
    assert extract_claims("no") == []
