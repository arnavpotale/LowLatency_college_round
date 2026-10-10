import pytest
from app.schemas import Evidence, VerdictCategory
from app.verification.verifier import ClaimVerifier
from app.verification.providers.deterministic import DeterministicRuleEvaluator
from app.verification.rules import PairRelation


@pytest.fixture
def verifier():
    return ClaimVerifier(provider=DeterministicRuleEvaluator())


def test_one_passage_supports_and_another_contradicts(verifier):
    """
    Case 1: Conflicting evidence across passages yields AMBIGUOUS
    with all conflicting citation IDs retained.
    """
    ev_sup = Evidence(
        evidence_id="ev_study_alpha",
        source_id="src_1",
        source_name="Clinical Trial Alpha",
        text="Clinical Trial Alpha observed that daily low-dose aspirin reduced secondary ischemic stroke incidence by 18%.",
        page_or_section="Results Section",
        relevance_score=0.92
    )
    ev_cont = Evidence(
        evidence_id="ev_study_beta",
        source_id="src_2",
        source_name="Clinical Trial Beta",
        text="Confirmatory Trial Beta observed no reduction in stroke incidence, demonstrating secondary ischemic stroke placebo equivalence across 5,000 patients.",
        page_or_section="Conclusions",
        relevance_score=0.90
    )

    claim_text = "Daily low-dose aspirin reduced secondary ischemic stroke incidence."
    result = verifier.verify_claim(claim=claim_text, candidate_evidence=[ev_sup, ev_cont])

    assert result.verdict == VerdictCategory.AMBIGUOUS
    assert "ev_study_alpha" in result.evidence_ids
    assert "ev_study_beta" in result.evidence_ids
    assert len(result.evidence_ids) == 2
    assert "Conflicting evidence" in result.explanation


def test_different_passages_support_different_compound_propositions(verifier):
    """
    Case 2: Decomposed compound claims retrieve distinct evidence passages:
    Proposition 1 is supported by Passage 1; Proposition 2 is supported by Passage 2.
    """
    ev_1 = Evidence(
        evidence_id="ev_q1_revenue",
        source_id="src_sec_filing",
        source_name="Q1 10-Q Filing",
        text="Enterprise revenue increased by 12% in Q1 driven by cloud subscription renewals.",
        page_or_section="Page 4",
        relevance_score=0.95
    )
    ev_2 = Evidence(
        evidence_id="ev_q2_revenue",
        source_id="src_sec_filing",
        source_name="Q2 10-Q Filing",
        text="Due to macro budget headwinds, enterprise revenue declined by 5% in Q2.",
        page_or_section="Page 12",
        relevance_score=0.94
    )

    # Proposition 1
    c1 = verifier.verify_claim(
        claim="Revenue increased by 12% in Q1",
        candidate_evidence=[ev_1, ev_2]
    )
    assert c1.verdict == VerdictCategory.SUPPORTED
    assert c1.evidence_ids == ["ev_q1_revenue"]

    # Proposition 2 with inherited subject
    c2 = verifier.verify_claim(
        claim="declined by 5% in Q2.",
        verifiable_text="Revenue declined by 5% in Q2.",
        candidate_evidence=[ev_1, ev_2]
    )
    assert c2.verdict == VerdictCategory.SUPPORTED
    assert c2.evidence_ids == ["ev_q2_revenue"]


def test_paraphrased_evidence_with_same_meaning(verifier):
    """
    Case 3: Evidence uses synonymous phrasing but establishes the factual claim.
    """
    ev = Evidence(
        evidence_id="ev_renal_guideline",
        source_id="src_med",
        source_name="Nephrology Manual",
        text="In patients with severe renal impairment (glomerular filtration rate under 30 mL/min), a 50% maintenance dose reduction is strictly advised to avoid acute toxicity.",
        page_or_section="Section 4.2",
        relevance_score=0.88
    )

    claim = "In patients with severe renal impairment, a 50% maintenance dose reduction is strictly advised."
    result = verifier.verify_claim(claim=claim, candidate_evidence=[ev])

    assert result.verdict == VerdictCategory.SUPPORTED
    assert result.evidence_ids == ["ev_renal_guideline"]


def test_relevant_evidence_does_not_logically_establish_claim(verifier):
    """
    Case 4: Passage mentions topic entities but does not substantiate the specific assertion -> INCONCLUSIVE.
    """
    ev = Evidence(
        evidence_id="ev_preclinical_metformin",
        source_id="src_care",
        source_name="Neurological Monograph",
        text="Preclinical laboratory studies evaluated metformin in rodent brain models, but observations regarding neurogenesis and traumatic injury reversal were statistically unconfirmed.",
        page_or_section="Section 4",
        relevance_score=0.85
    )

    claim = "Metformin accelerates neurogenesis and reverses severe traumatic brain injuries in mice."
    result = verifier.verify_claim(claim=claim, candidate_evidence=[ev])

    assert result.verdict == VerdictCategory.INCONCLUSIVE
    assert "insufficient evidence" in result.explanation.lower() or "related" in result.explanation.lower()


def test_no_evidence_supports_claim_without_disproving_it(verifier):
    """
    Case 5: Missing evidence produces UNSUPPORTED with strictly empty citations.
    """
    claim = "The server uses quantum annealing for real-time load balancing."
    result = verifier.verify_claim(claim=claim, candidate_evidence=[])

    assert result.verdict == VerdictCategory.UNSUPPORTED
    assert result.evidence_ids == []
    assert "No relevant evidence passages" in result.explanation


def test_context_mismatch_different_temporal_date(verifier):
    """
    Case 6: Passage concerns a different year/time period -> INCONCLUSIVE.
    """
    ev = Evidence(
        evidence_id="ev_historical_audit",
        source_id="src_hist",
        source_name="Historical Report",
        text="In fiscal year 2021, the company maintained 450 active enterprise cloud contracts.",
        page_or_section="Archive",
        relevance_score=0.80
    )

    claim = "The company maintained 450 active enterprise cloud contracts in fiscal year 2025."
    result = verifier.verify_claim(claim=claim, candidate_evidence=[ev])

    assert result.verdict == VerdictCategory.INCONCLUSIVE
    assert "temporal discrepancy" in result.explanation.lower()


def test_context_mismatch_pediatric_versus_adult(verifier):
    """
    Case 7: Passage documents adult care, while claim asserts pediatric safety -> INCONCLUSIVE.
    """
    ev = Evidence(
        evidence_id="ev_adult_trial",
        source_id="src_trial",
        source_name="Adult Trial Monograph",
        text="The clinical trial evaluated adult patients aged 18 to 65 with uncomplicated hypertension. Dosing was titrated to 20mg daily.",
        page_or_section="Methods",
        relevance_score=0.82
    )

    claim = "The clinical trial established safe 20mg dosing in pediatric patients and infants."
    result = verifier.verify_claim(claim=claim, candidate_evidence=[ev])

    assert result.verdict == VerdictCategory.INCONCLUSIVE
    assert "demographic cohort discrepancy" in result.explanation.lower()


def test_strict_citation_scrubbing_and_valid_provenance(verifier):
    """
    Case 8: Citations only reference candidate evidence that was actually supplied.
    """
    ev_legit = Evidence(
        evidence_id="ev_supplied_001",
        source_id="src_valid",
        source_name="Legitimate Document",
        text="The system architecture utilizes AES-256 encryption for all data at rest.",
        page_or_section="Security Spec",
        relevance_score=0.90
    )

    result = verifier.verify_claim(
        claim="The system architecture utilizes AES-256 encryption for all data at rest.",
        candidate_evidence=[ev_legit]
    )

    assert result.verdict == VerdictCategory.SUPPORTED
    assert result.evidence_ids == ["ev_supplied_001"]
    for eid in result.evidence_ids:
        assert eid in {"ev_supplied_001"}
