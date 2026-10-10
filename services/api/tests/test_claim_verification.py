import pytest
from app.schemas import Evidence, VerdictCategory, Claim, Source
from app.verification import (
    ClaimVerifier,
    VerificationEngine,
    DeterministicRuleEvaluator,
    MockVerificationProvider,
    LLMVerificationProvider,
    ProviderUnavailableError,
)


@pytest.fixture
def sample_evidence_fixtures():
    return {
        "dosage": Evidence(
            evidence_id="ev_dosage_01",
            source_id="src_clinical_01",
            source_name="clinical_trial_protocol.txt",
            text="Recommended initial dosage is 25mg daily, titrating to a maximum of 50mg daily under supervision.",
            page_or_section="Page 4, Section 3.2",
            relevance_score=0.96
        ),
        "contraindication": Evidence(
            evidence_id="ev_contra_01",
            source_id="src_clinical_01",
            source_name="clinical_trial_protocol.txt",
            text="Metaproterenol is strictly contraindicated with concurrent non-selective beta-blockers due to severe risk of hypertensive crisis.",
            page_or_section="Page 8, Section 4.1",
            relevance_score=0.94
        ),
        "financial_q3": Evidence(
            evidence_id="ev_fin_01",
            source_id="src_fin_01",
            source_name="q3_10q_report.txt",
            text="Total Q3 operating expenditure reached $4.2 million, representing an 8% increase year-over-year.",
            page_or_section="Page 12, Table 12",
            relevance_score=0.91
        ),
        "trial_support": Evidence(
            evidence_id="ev_trial_pos",
            source_id="src_clinical_01",
            source_name="trial_outcomes.txt",
            text="Cohort A demonstrated that this therapy reduced symptom severity in 45% of patients.",
            page_or_section="Section 5.1",
            relevance_score=0.88
        ),
        "trial_conflict": Evidence(
            evidence_id="ev_trial_neg",
            source_id="src_clinical_02",
            source_name="trial_rebuttal.txt",
            text="Confirmatory trials observed no reduction in symptom severity, showing statistical equivalence to placebo.",
            page_or_section="Section 6.3",
            relevance_score=0.87
        ),
        "hospital_context": Evidence(
            evidence_id="ev_context_01",
            source_id="src_academic_01",
            source_name="hospital_survey.txt",
            text="The investigation surveyed three regional hospitals in Germany between 2021 and 2023.",
            page_or_section="Introduction",
            relevance_score=0.50
        )
    }


def test_supported_claim_with_evidence(sample_evidence_fixtures):
    verifier = ClaimVerifier(provider=DeterministicRuleEvaluator())
    claim_text = "Recommended initial dosage is 25mg daily under supervision."
    
    result = verifier.verify_claim(
        claim=claim_text,
        candidate_evidence=[sample_evidence_fixtures["dosage"]],
        claim_id="cl_001",
        start_offset=0,
        end_offset=len(claim_text)
    )

    assert result.verdict == VerdictCategory.SUPPORTED
    assert result.confidence >= 0.70
    assert result.evidence_ids == ["ev_dosage_01"]
    assert "ev_dosage_01" in result.evidence_ids
    assert "Page 4, Section 3.2" in result.explanation


def test_contradicted_claim_numerical_conflict(sample_evidence_fixtures):
    verifier = ClaimVerifier(provider=DeterministicRuleEvaluator())
    # Answer claims 100mg, source says max safe is 50mg
    claim_text = "Patients may safely consume 100mg daily of this medication."

    result = verifier.verify_claim(
        claim=claim_text,
        candidate_evidence=[sample_evidence_fixtures["dosage"]],
        claim_id="cl_002"
    )

    assert result.verdict == VerdictCategory.CONTRADICTED
    assert "ev_dosage_01" in result.evidence_ids
    assert "exceeding" in result.explanation.lower() or "contradiction" in result.explanation.lower()


def test_contradicted_claim_polarity_conflict(sample_evidence_fixtures):
    verifier = ClaimVerifier(provider=DeterministicRuleEvaluator())
    claim_text = "The medication is entirely safe and has zero contraindications with beta-blockers."

    result = verifier.verify_claim(
        claim=claim_text,
        candidate_evidence=[sample_evidence_fixtures["contraindication"]],
        claim_id="cl_003"
    )

    assert result.verdict == VerdictCategory.CONTRADICTED
    assert "ev_contra_01" in result.evidence_ids
    assert "contraindicated" in result.explanation.lower()


def test_unsupported_claim_empty_evidence():
    verifier = ClaimVerifier(provider=DeterministicRuleEvaluator())
    claim_text = "The compound accelerates quantum computer compilation speed by 50%."

    result = verifier.verify_claim(
        claim=claim_text,
        candidate_evidence=[],
        claim_id="cl_004"
    )

    # Must NOT declare false / contradicted simply because no evidence was found
    assert result.verdict == VerdictCategory.UNSUPPORTED
    assert result.evidence_ids == []
    assert "no relevant evidence" in result.explanation.lower()


def test_unsupported_claim_unrelated_evidence(sample_evidence_fixtures):
    verifier = ClaimVerifier(provider=DeterministicRuleEvaluator())
    claim_text = "The compound accelerates quantum computer compilation speed."

    # Provide unrelated financial evidence
    result = verifier.verify_claim(
        claim=claim_text,
        candidate_evidence=[sample_evidence_fixtures["financial_q3"]],
        claim_id="cl_005"
    )

    assert result.verdict == VerdictCategory.UNSUPPORTED
    assert result.evidence_ids == []


def test_ambiguous_claim_conflicting_evidence(sample_evidence_fixtures):
    verifier = ClaimVerifier(provider=DeterministicRuleEvaluator())
    claim_text = "Clinical trials demonstrated that this therapy reduced symptom severity."

    # Both positive and negative trial outcomes provided
    candidate_pool = [
        sample_evidence_fixtures["trial_support"],
        sample_evidence_fixtures["trial_conflict"]
    ]

    result = verifier.verify_claim(
        claim=claim_text,
        candidate_evidence=candidate_pool,
        claim_id="cl_006"
    )

    assert result.verdict == VerdictCategory.AMBIGUOUS
    # Must cite both conflicting passages
    assert "ev_trial_pos" in result.evidence_ids
    assert "ev_trial_neg" in result.evidence_ids
    assert "conflicting evidence" in result.explanation.lower()


def test_inconclusive_claim_insufficient_context(sample_evidence_fixtures):
    verifier = ClaimVerifier(provider=DeterministicRuleEvaluator())
    claim_text = "Patients in German hospitals exhibited rapid cognitive recovery."

    # Evidence mentions German hospitals but says nothing about cognitive recovery
    result = verifier.verify_claim(
        claim=claim_text,
        candidate_evidence=[sample_evidence_fixtures["hospital_context"]],
        claim_id="cl_007"
    )

    assert result.verdict in [VerdictCategory.INCONCLUSIVE, VerdictCategory.UNSUPPORTED]
    if result.verdict == VerdictCategory.INCONCLUSIVE:
        assert "insufficient context" in result.explanation.lower()


def test_citations_strictly_refer_to_supplied_evidence(sample_evidence_fixtures):
    verifier = ClaimVerifier(provider=DeterministicRuleEvaluator())
    pool = [
        sample_evidence_fixtures["dosage"],
        sample_evidence_fixtures["financial_q3"]
    ]
    supplied_ids = {e.evidence_id for e in pool}

    claim_text = "Recommended initial dosage is 25mg daily."
    result = verifier.verify_claim(claim=claim_text, candidate_evidence=pool)

    # Every returned citation MUST exist in supplied_ids
    for eid in result.evidence_ids:
        assert eid in supplied_ids

    assert not any(eid.startswith("hallucinated_") for eid in result.evidence_ids)


def test_chunk_dictionary_compatibility():
    verifier = ClaimVerifier(provider=DeterministicRuleEvaluator())
    dict_chunks = [
        {
            "evidence_id": "chunk_99",
            "source_id": "src_1",
            "source_name": "manual.txt",
            "text": "Cluster high availability requires at least 3 distributed coordinator nodes.",
            "page_or_section": "Section 2.1",
            "relevance_score": 0.90
        }
    ]

    claim_text = "High availability requires at least 3 coordinator nodes."
    result = verifier.verify_claim(claim=claim_text, candidate_evidence=dict_chunks)

    assert result.verdict == VerdictCategory.SUPPORTED
    assert "chunk_99" in result.evidence_ids


def test_mock_provider_test_double():
    mock_prov = MockVerificationProvider(fixed_verdict=VerdictCategory.SUPPORTED)
    verifier = ClaimVerifier(provider=mock_prov)

    ev = Evidence(
        evidence_id="ev_mock",
        source_id="src_mock",
        source_name="mock.txt",
        text="Mock passage text.",
        page_or_section="Page 1",
        relevance_score=0.9
    )

    result = verifier.verify_claim("Any test claim statement.", [ev])
    assert result.verdict == VerdictCategory.SUPPORTED
    assert result.evidence_ids == ["ev_mock"]
    assert "[Mock Verdict]" in result.explanation


def test_llm_provider_unavailable_failure():
    llm_prov = LLMVerificationProvider(api_key=None, model="gpt-4o-mini")
    verifier = ClaimVerifier(provider=llm_prov)

    ev = Evidence(
        evidence_id="ev_test",
        source_id="src_test",
        source_name="test.txt",
        text="Sample source text.",
        page_or_section="Page 1",
        relevance_score=0.9
    )

    # Must fail clearly with ProviderUnavailableError instead of crashing or silent fake
    with pytest.raises(ProviderUnavailableError) as exc_info:
        verifier.verify_claim("A claim to verify.", [ev])

    assert "Missing API key" in str(exc_info.value)


def test_verification_engine_real_pipeline():
    # Test VerificationEngine with use_mock=False
    engine = VerificationEngine(
        use_mock=False,
        claim_verifier=ClaimVerifier(provider=DeterministicRuleEvaluator())
    )

    sources = [
        Source(
            source_id="src_01",
            filename="clinical_protocol.txt",
            file_type="txt",
            char_count=200,
            content_snippet="Standard dosage is 25mg daily. Maximum dose is 50mg daily.",
            raw_content="Standard dosage is 25mg daily. Maximum dose is 50mg daily under supervision."
        )
    ]

    answer = "The standard dosage is 25mg daily. Patients may safely consume 100mg daily."
    findings = engine.verify_audit(original_answer=answer, sources=sources)

    assert findings["is_mock"] is False
    assert len(findings["claims"]) == 2
    assert findings["summary"]["total_claims"] == 2
    
    # Check that claims have valid verdicts and explanations
    claim_verdicts = [c["verdict"] for c in findings["claims"]]
    assert VerdictCategory.SUPPORTED.value in claim_verdicts
    assert VerdictCategory.CONTRADICTED.value in claim_verdicts


def test_directional_percentage_contradiction(sample_evidence_fixtures):
    verifier = ClaimVerifier(provider=DeterministicRuleEvaluator())
    claim_text = "Operating expenditure dropped by 15% in Q3."

    result = verifier.verify_claim(
        claim=claim_text,
        candidate_evidence=[sample_evidence_fixtures["financial_q3"]],
        claim_id="cl_percent_01"
    )

    assert result.verdict == VerdictCategory.CONTRADICTED
    assert "ev_fin_01" in result.evidence_ids
    assert "contradiction" in result.explanation.lower() or "increase" in result.explanation.lower()


def test_verify_claim_model_input(sample_evidence_fixtures):
    verifier = ClaimVerifier(provider=DeterministicRuleEvaluator())
    claim_obj = Claim(
        claim_id="cl_preserves_id",
        claim_text="Recommended initial dosage is 25mg daily.",
        start_offset=12,
        end_offset=54,
        verdict=VerdictCategory.INCONCLUSIVE,  # Initial placeholder
        explanation="",
        confidence=0.5,
        evidence_ids=[]
    )

    verified = verifier.verify_claim(
        claim=claim_obj,
        candidate_evidence=[sample_evidence_fixtures["dosage"]]
    )

    assert verified.claim_id == "cl_preserves_id"
    assert verified.start_offset == 12
    assert verified.end_offset == 54
    assert verified.verdict == VerdictCategory.SUPPORTED
    assert verified.evidence_ids == ["ev_dosage_01"]


def test_batch_verification(sample_evidence_fixtures):
    verifier = ClaimVerifier(provider=DeterministicRuleEvaluator())
    claims = [
        Claim(
            claim_id="c1",
            claim_text="Recommended initial dosage is 25mg daily.",
            start_offset=0,
            end_offset=42,
            verdict=VerdictCategory.INCONCLUSIVE,
            explanation="",
            confidence=0.5
        ),
        Claim(
            claim_id="c2",
            claim_text="The medication has zero contraindications with beta-blockers.",
            start_offset=43,
            end_offset=104,
            verdict=VerdictCategory.INCONCLUSIVE,
            explanation="",
            confidence=0.5
        )
    ]

    evidence_pool = [
        sample_evidence_fixtures["dosage"],
        sample_evidence_fixtures["contraindication"]
    ]

    batch_results = verifier.verify_claims_batch(claims, evidence_pool)
    assert len(batch_results) == 2
    assert batch_results[0].verdict == VerdictCategory.SUPPORTED
    assert batch_results[1].verdict == VerdictCategory.CONTRADICTED


def test_fabricated_citation_scrubbed(sample_evidence_fixtures):
    from app.verification.rules import validate_citations
    
    valid_ids = {sample_evidence_fixtures["dosage"].evidence_id}
    # Simulate a provider attempting to cite an invented ID
    citations = ["ev_dosage_01", "ev_invented_ghost_id"]
    scrubbed = validate_citations(citations, valid_ids)

    assert scrubbed == ["ev_dosage_01"]
    assert "ev_invented_ghost_id" not in scrubbed

