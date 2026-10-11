import pytest
from app.schemas import Evidence, VerdictCategory
from app.verification.providers import DeterministicRuleEvaluator
from app.verification.verifier import ClaimVerifier


@pytest.fixture
def verifier():
    return ClaimVerifier(provider=DeterministicRuleEvaluator())


def test_identical_topic_words_different_factual_assertion(verifier):
    """
    Scenario: Claim shares most topic words with evidence, but asserts an unmentioned fact.
    Previously, overlap_ratio >= 0.50 would falsely mark this as SUPPORTED.
    Now, it must NOT be marked supported (should be INCONCLUSIVE or UNSUPPORTED).
    """
    evidence = [
        Evidence(
            evidence_id="ev_0",
            source_id="src_1",
            source_name="oncology.txt",
            text="Dr. Smith conducted clinical oncology trials at Boston Hospital in 2021, examining patient blood panels.",
            page_or_section="Page 1",
            relevance_score=0.85
        )
    ]
    # Shares 'Dr.', 'Smith', 'clinical', 'trials', 'patient', 'hospital', '2021'
    claim = "Dr. Smith conducted clinical trials in 2021 and proved that green tea permanently cures leukemia in patients."
    result = verifier.verify_claim(claim, evidence)

    assert result.verdict != VerdictCategory.SUPPORTED
    assert result.verdict in [VerdictCategory.INCONCLUSIVE, VerdictCategory.UNSUPPORTED]
    assert "cures leukemia" not in result.explanation.lower() or "insufficient" in result.explanation.lower()


def test_high_lexical_overlap_unsubstantiated_cure_claim(verifier):
    """
    Scenario: Elderberry hypertension claim sharing medical vocabulary with guidelines.
    Must not be marked supported without explicit corroboration.
    """
    evidence = [
        Evidence(
            evidence_id="ev_0",
            source_id="src_1",
            source_name="cardio.txt",
            text="Cardiovascular guidelines focus on dietary sodium reduction and statin therapy for LDL reduction. Clinical trials evaluated essential hypertension management across two weeks of observation.",
            page_or_section="Section 2",
            relevance_score=0.75
        )
    ]
    claim = "Extract of elderberry flower permanently cures essential hypertension within two weeks."
    result = verifier.verify_claim(claim, evidence)

    assert result.verdict != VerdictCategory.SUPPORTED
    assert result.verdict in [VerdictCategory.INCONCLUSIVE, VerdictCategory.UNSUPPORTED]


def test_negation_and_reversed_conditions(verifier):
    """
    Scenario: Claim asserts safety, but evidence warns of severe risk or strict prohibition.
    Must be CONTRADICTED.
    """
    evidence = [
        Evidence(
            evidence_id="ev_0",
            source_id="src_1",
            source_name="safety.txt",
            text="Direct human exposure to hydrothermal vent fluids is toxic, harmful, and strictly prohibited due to severe risk.",
            page_or_section="Page 8",
            relevance_score=0.90
        )
    ]
    claim = "Direct human contact with hydrothermal vent fluids is completely safe and harmless."
    result = verifier.verify_claim(claim, evidence)

    assert result.verdict == VerdictCategory.CONTRADICTED
    assert "ev_0" in result.evidence_ids
    assert "safe" in result.explanation.lower() or "prohibit" in result.explanation.lower()


def test_different_quantities_and_incompatible_units(verifier):
    """
    Scenario: Number mismatch (100mg vs 25mg) or opposing trend (15% drop vs 8% increase).
    Must be CONTRADICTED.
    """
    evidence = [
        Evidence(
            evidence_id="ev_0",
            source_id="src_1",
            source_name="dosing.txt",
            text="Maximum daily dosage of medication is 25mg under supervision.",
            page_or_section="Page 2",
            relevance_score=0.95
        )
    ]
    claim = "Patients should safely take 100mg daily."
    result = verifier.verify_claim(claim, evidence)

    assert result.verdict == VerdictCategory.CONTRADICTED
    assert "100" in result.explanation or "25" in result.explanation


def test_adult_versus_pediatric_cohort_mismatch(verifier):
    """
    Scenario: Numbers match (25mg) but demographic cohort differs (pediatric vs adult).
    Must NOT be labeled SUPPORTED.
    """
    evidence = [
        Evidence(
            evidence_id="ev_0",
            source_id="src_1",
            source_name="pharma.txt",
            text="Standard adult dosing guideline: Recommended adult dose is 25mg daily.",
            page_or_section="Section 1",
            relevance_score=0.85
        )
    ]
    claim = "Pediatric dosing guidelines require 25mg daily for children."
    result = verifier.verify_claim(claim, evidence)

    assert result.verdict != VerdictCategory.SUPPORTED
    assert result.verdict in [VerdictCategory.INCONCLUSIVE, VerdictCategory.UNSUPPORTED]
    assert "demographic" in result.explanation.lower() or "pediatric" in result.explanation.lower() or "insufficient" in result.explanation.lower()


def test_different_jurisdictions_mismatch(verifier):
    """
    Scenario: Claim cites California CCPA statutory damages, but evidence only covers EU GDPR.
    Must NOT be labeled SUPPORTED.
    """
    evidence = [
        Evidence(
            evidence_id="ev_0",
            source_id="src_1",
            source_name="eu_law.txt",
            text="The European Union General Data Protection Regulation (GDPR) establishes fines up to 20 million euros.",
            page_or_section="Article 83",
            relevance_score=0.70
        )
    ]
    claim = "The California Consumer Privacy Act (CCPA) imposes statutory damages of $750 per consumer per incident."
    result = verifier.verify_claim(claim, evidence)

    assert result.verdict != VerdictCategory.SUPPORTED
    assert result.verdict in [VerdictCategory.INCONCLUSIVE, VerdictCategory.UNSUPPORTED]


def test_genuinely_supported_verbatim_assertion(verifier):
    """
    Scenario: Fact is directly stated in source and corroborated by contiguous phrasing.
    Must be SUPPORTED.
    """
    evidence = [
        Evidence(
            evidence_id="ev_0",
            source_id="src_1",
            source_name="redis.txt",
            text="Redis uses asynchronous replication by default between primary and replica instances.",
            page_or_section="Section 2.1",
            relevance_score=0.92
        )
    ]
    claim = "Redis uses asynchronous replication by default."
    result = verifier.verify_claim(claim, evidence)

    assert result.verdict == VerdictCategory.SUPPORTED
    assert "ev_0" in result.evidence_ids


def test_genuinely_supported_numerical_assertion(verifier):
    """
    Scenario: Quantities, units, and terms align accurately.
    Must be SUPPORTED.
    """
    evidence = [
        Evidence(
            evidence_id="ev_0",
            source_id="src_1",
            source_name="finance.txt",
            text="Corporate Q3 10-Q filing: Operating expenditures reached $4.2M.",
            page_or_section="Page 12",
            relevance_score=0.94
        )
    ]
    claim = "The total spend reached $4.2M."
    result = verifier.verify_claim(claim, evidence)

    assert result.verdict == VerdictCategory.SUPPORTED
    assert "ev_0" in result.evidence_ids


def test_missing_evidence_versus_contradictory_evidence(verifier):
    """
    Scenario: Claim with zero evidence -> UNSUPPORTED with empty citations.
    Claim with conflicting evidence -> CONTRADICTED with cited evidence.
    """
    # 1. Zero evidence
    res_unsupported = verifier.verify_claim("Completely unmentioned statement.", [])
    assert res_unsupported.verdict == VerdictCategory.UNSUPPORTED
    assert res_unsupported.evidence_ids == []

    # 2. Contradictory evidence
    res_contradicted = verifier.verify_claim(
        "Raft commits entries with 1 node in a 5-node cluster.",
        [
            Evidence(
                evidence_id="ev_raft",
                source_id="src_raft",
                source_name="raft.txt",
                text="A cluster of 5 nodes requires a quorum of 3 nodes.",
                page_or_section="Section 5",
                relevance_score=0.90
            )
        ]
    )
    assert res_contradicted.verdict == VerdictCategory.CONTRADICTED
    assert "ev_raft" in res_contradicted.evidence_ids


def test_adversarial_temporal_mismatch_date(verifier):
    """
    Scenario: Quantities match ($50M) but temporal timeframe conflicts (2022 vs 2024).
    Must NOT be labeled SUPPORTED.
    """
    evidence = [
        Evidence(
            evidence_id="ev_0",
            source_id="src_1",
            source_name="financials.txt",
            text="In the second fiscal quarter of 2024, company operating revenue was $50M.",
            page_or_section="Page 3",
            relevance_score=0.88
        )
    ]
    claim = "In the second fiscal quarter of 2022, operating revenue was $50M."
    result = verifier.verify_claim(claim, evidence)

    assert result.verdict != VerdictCategory.SUPPORTED
    assert result.verdict in [VerdictCategory.INCONCLUSIVE, VerdictCategory.UNSUPPORTED, VerdictCategory.CONTRADICTED]


def test_adversarial_percentage_direction_reversal(verifier):
    """
    Scenario: Exact numbers match (2.5%) but directional vector is inverted (decreased vs rose).
    Must be CONTRADICTED.
    """
    evidence = [
        Evidence(
            evidence_id="ev_0",
            source_id="src_1",
            source_name="econ.txt",
            text="Annual consumer price inflation decreased by 2.5% over the observation window.",
            page_or_section="Section 1.2",
            relevance_score=0.91
        )
    ]
    claim = "Annual consumer price inflation rose by 2.5% over the observation window."
    result = verifier.verify_claim(claim, evidence)

    assert result.verdict == VerdictCategory.CONTRADICTED
    assert "ev_0" in result.evidence_ids


def test_adversarial_irrelevant_high_frequency_words(verifier):
    """
    Scenario: Shared high-frequency tech terms (throughput, system, safely), but asserts cryptocurrency mining.
    Must NOT be labeled SUPPORTED.
    """
    evidence = [
        Evidence(
            evidence_id="ev_0",
            source_id="src_1",
            source_name="cluster.txt",
            text="The distributed database system maintains high-throughput streaming and ensures all customer records are safely stored.",
            page_or_section="Overview",
            relevance_score=0.72
        )
    ]
    claim = "The distributed system operates high-throughput cryptocurrency mining and ensures all Bitcoin is safely cashed out."
    result = verifier.verify_claim(claim, evidence)

    assert result.verdict != VerdictCategory.SUPPORTED
    assert result.verdict in [VerdictCategory.INCONCLUSIVE, VerdictCategory.UNSUPPORTED]


def test_adversarial_partial_numerical_truth_with_fabricated_multiplier(verifier):
    """
    Scenario: Base number matches ($500), but time horizon and scope are altered.
    Must be CONTRADICTED or UNSUPPORTED.
    """
    evidence = [
        Evidence(
            evidence_id="ev_0",
            source_id="src_1",
            source_name="pricing.txt",
            text="Enterprise software licenses are strictly billed at $500 per year per workstation.",
            page_or_section="Pricing Table",
            relevance_score=0.90
        )
    ]
    claim = "Enterprise software licenses cost $500 per decade for unlimited corporate workstations."
    result = verifier.verify_claim(claim, evidence)
    assert result.verdict != VerdictCategory.SUPPORTED
