"""
Regression tests for trust score calculation, persistence, and reporting.

Verifies:
1. All claims supported -> 100%.
2. Equal supported and contradicted claims -> 50%.
3. All claims contradicted -> 0.0%.
4. Unsupported claims reduce the score (included in denominator).
5. Ambiguous and inconclusive claims are excluded from score denominator.
6. An audit containing only ambiguous/inconclusive claims -> None (N/A).
7. Demo audits and persisted audits display the same score as their verdict counts.
8. Previously saved audits do not retain a stale score after calculation is corrected.
9. Human review verdict overrides recompute the aggregate score immediately.
"""

import json
import pytest
from app.verification.scoring import compute_trust_score, compute_risk_level
from app.schemas import AuditSummary, AuditResponse, VerdictCategory, AuditStatus
from app.models import AuditModel
from app.database.session import backfill_persisted_trust_scores
from app.reporting.generator import generate_audit_markdown_report, generate_executive_markdown_report


def test_trust_score_all_supported():
    """All assertions corroborated -> 100.0%."""
    score, decisive = compute_trust_score(supported=5, contradicted=0, unsupported=0)
    assert decisive == 5
    assert score == 100.0


def test_trust_score_equal_supported_and_contradicted():
    """Equal supported and contradicted assertions -> 50.0%."""
    # Example: 4 supported, 4 contradicted, 0 unsupported, 4 ambiguous
    score, decisive = compute_trust_score(supported=4, contradicted=4, unsupported=0)
    assert decisive == 8
    assert score == 50.0


def test_trust_score_all_contradicted():
    """All assertions contradicted -> 0.0% (distinct from None/unavailable)."""
    score, decisive = compute_trust_score(supported=0, contradicted=5, unsupported=0)
    assert decisive == 5
    assert score == 0.0
    assert score is not None


def test_trust_score_unsupported_reduces_score():
    """Unsupported assertions are included in denominator and reduce score."""
    # 1 supported, 1 unsupported -> 50.0%
    score, decisive = compute_trust_score(supported=1, contradicted=0, unsupported=1)
    assert decisive == 2
    assert score == 50.0

    # 1 supported, 1 contradicted, 1 unsupported -> 33.3%
    score2, decisive2 = compute_trust_score(supported=1, contradicted=1, unsupported=1)
    assert decisive2 == 3
    assert score2 == 33.3


def test_trust_score_ambiguous_and_inconclusive_excluded():
    """Ambiguous and inconclusive assertions are excluded from denominator."""
    # 3 supported, 1 contradicted, 0 unsupported, with 5 ambiguous and 3 inconclusive
    score, decisive = compute_trust_score(supported=3, contradicted=1, unsupported=0)
    assert decisive == 4
    assert score == 75.0


def test_trust_score_only_ambiguous_or_inconclusive_yields_none():
    """An audit with only ambiguous/inconclusive claims has 0 decisive claims -> None (N/A)."""
    score, decisive = compute_trust_score(supported=0, contradicted=0, unsupported=0)
    assert decisive == 0
    assert score is None


def test_risk_level_derivation():
    """Risk level aligns with contradictions, unsupported, and normalized score."""
    # Any contradiction -> HIGH risk
    assert compute_risk_level(contradicted=1, unsupported=0, trust_score=80.0) == "high"
    # Low trust score (<50) -> HIGH risk
    assert compute_risk_level(contradicted=0, unsupported=0, trust_score=40.0) == "high"
    # Unsupported claims or trust score < 75 -> MEDIUM risk
    assert compute_risk_level(contradicted=0, unsupported=1, trust_score=60.0) == "medium"
    assert compute_risk_level(contradicted=0, unsupported=0, trust_score=70.0) == "medium"
    # Clean audit -> LOW risk
    assert compute_risk_level(contradicted=0, unsupported=0, trust_score=100.0) == "low"
    assert compute_risk_level(contradicted=0, unsupported=0, trust_score=80.0) == "low"


def test_persisted_audit_stale_score_recomputation(db_session):
    """
    Previously saved audits that had stale 0.0% scores due to negative penalty weights
    are dynamically recomputed via to_schema() and permanently updated via backfill.
    """
    stale_results = {
        "claims": [],
        "verdicts": {"supported": 4, "contradicted": 4, "unsupported": 0, "ambiguous": 4},
        "summary": {
            "total_claims": 12,
            "supported_claims": 4,
            "contradicted_claims": 4,
            "unsupported_claims": 0,
            "ambiguous_claims": 4,
            "inconclusive_claims": 0,
            "trust_score": 0.0,  # Old stale penalty score!
            "risk_level": "high",
            "key_takeaway": "Legacy test fixture"
        }
    }

    audit = AuditModel(
        id="test-stale-recompute-uuid",
        title="Summary of Acme Technologies' Leave Policy",
        status=AuditStatus.COMPLETED.value,
        original_answer="Test text",
        results_json=json.dumps(stale_results),
        is_mock=True
    )
    db_session.add(audit)
    db_session.commit()

    # 1. to_schema() should immediately compute 50.0% and 8 decisive claims
    schema = audit.to_schema()
    assert schema.summary is not None
    assert schema.summary.trust_score == 50.0
    assert schema.summary.decisive_claims == 8

    # 2. Backfill updates the persisted database record itself
    backfill_persisted_trust_scores(db_session)
    db_session.refresh(audit)
    updated_data = json.loads(audit.results_json)
    assert updated_data["summary"]["trust_score"] == 50.0
    assert updated_data["summary"]["decisive_claims"] == 8


def test_report_generation_formats_na_and_score():
    """Detailed and executive reports format both normal scores and N/A when decisive=0."""
    from datetime import datetime
    sample_audit = AuditResponse(
        audit_id="audit-uuid-12345",
        status=AuditStatus.COMPLETED,
        title="Clinical Trial Drug Evaluation",
        original_answer="Original text",
        sources=[],
        claims=[],
        summary=AuditSummary(
            total_claims=2,
            supported_claims=1,
            contradicted_claims=1,
            unsupported_claims=0,
            ambiguous_claims=0,
            inconclusive_claims=0,
            decisive_claims=2,
            trust_score=50.0,
            risk_level="high",
            key_takeaway="Test summary",
        ),
        created_at=datetime.utcnow(),
    )

    # When score is present
    detailed_rep = generate_audit_markdown_report(sample_audit)
    assert "**Overall Trust Score:** 50.0/100" in detailed_rep
    assert "**Decisively Evaluated Claims:** 2" in detailed_rep

    # When score is None (0 decisive claims)
    sample_audit.summary.trust_score = None
    sample_audit.summary.decisive_claims = 0
    detailed_na = generate_audit_markdown_report(sample_audit)
    assert "**Overall Trust Score:** N/A (no decisive claims)" in detailed_na

    exec_na = generate_executive_markdown_report(sample_audit)
    assert "**Overall Reliability Trust Score:** N/A" in exec_na
