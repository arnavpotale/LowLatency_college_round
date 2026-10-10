import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.schemas import VerdictCategory, Evidence
from app.verification.providers import DeterministicRuleEvaluator
from app.verification.verifier import ClaimVerifier
from app.verification.adversarial_suite import run_adversarial_suite, ADVERSARIAL_BENCHMARK_CASES


client = TestClient(app)


@pytest.fixture
def verifier():
    return ClaimVerifier(provider=DeterministicRuleEvaluator())


def test_claim_autopsy_numerical_discrepancy(verifier):
    """Autopsy accurately isolates the diverging number and assigns quantity_mismatch."""
    evidence = [
        Evidence(
            evidence_id="ev_1",
            source_id="src_1",
            source_name="drug_label.txt",
            text="Initial clinical dosage is 10mg once daily. Maximum titrated dose is 40mg.",
            page_or_section="Dosage Section",
            relevance_score=0.90
        )
    ]
    claim_text = "Patients may safely consume an initial dose of 150mg without titration."
    result = verifier.verify_claim(claim_text, evidence)

    assert result.verdict == VerdictCategory.CONTRADICTED
    assert result.autopsy is not None
    assert result.autopsy.issue_type == "quantity_mismatch"
    assert "150mg" in result.autopsy.problematic_phrase
    assert "150mg" in result.autopsy.claim_elements
    assert any("10mg" in el or "40mg" in el for el in result.autopsy.evidence_elements)


def test_claim_autopsy_rate_frequency_discrepancy(verifier):
    """Autopsy identifies rate interval shifts between per decade and per year."""
    evidence = [
        Evidence(
            evidence_id="ev_1",
            source_id="src_1",
            source_name="pricing.txt",
            text="Software license cost is $500 per year per seat.",
            page_or_section="Pricing",
            relevance_score=0.90
        )
    ]
    claim_text = "Software license costs $500 per decade per seat."
    result = verifier.verify_claim(claim_text, evidence)

    assert result.verdict == VerdictCategory.CONTRADICTED
    assert result.autopsy is not None
    assert result.autopsy.issue_type == "rate_frequency"
    assert "decade" in result.autopsy.problematic_phrase.lower()


def test_claim_autopsy_polarity_negation(verifier):
    """Autopsy detects polarity conflict and isolates the negated phrase."""
    evidence = [
        Evidence(
            evidence_id="ev_1",
            source_id="src_1",
            source_name="safety_sheet.txt",
            text="The compound is strictly contraindicated with beta-blockers.",
            page_or_section="Contraindications",
            relevance_score=0.90
        )
    ]
    claim_text = "The compound has no contraindications with beta-blockers."
    result = verifier.verify_claim(claim_text, evidence)

    assert result.verdict == VerdictCategory.CONTRADICTED
    assert result.autopsy is not None
    assert result.autopsy.issue_type == "polarity_negation"
    assert "no contraindication" in result.autopsy.problematic_phrase.lower()


def test_proof_of_verdict_trail_fidelity(verifier):
    """Evaluation trail preserves candidate passages, relations, and rationale."""
    evidence = [
        Evidence(
            evidence_id="ev_trial",
            source_id="src_trial",
            source_name="phase3_results.pdf",
            text="Trial demonstrated 24.5% reduction in secondary cardiovascular events.",
            page_or_section="Page 4, Table 2",
            relevance_score=0.92
        )
    ]
    claim_text = "The trial achieved a 24.5% reduction in cardiovascular events."
    result = verifier.verify_claim(claim_text, evidence)

    assert result.verdict == VerdictCategory.SUPPORTED
    assert len(result.evaluation_trail) == 1
    trail_item = result.evaluation_trail[0]
    assert trail_item.evidence_id == "ev_trial"
    assert trail_item.relation == "entails"
    assert trail_item.source_name == "phase3_results.pdf"
    assert trail_item.page_or_section == "Page 4, Table 2"
    assert "24.5%" in trail_item.rationale


def test_cross_source_conflict_detection(verifier):
    """When sources disagree, an explicit conflict detail is surfaced and verdict is ambiguous."""
    evidence = [
        Evidence(
            evidence_id="ev_trial_a",
            source_id="src_a",
            source_name="Trial_A_Report.pdf",
            text="Aspirin therapy reduced ischemic stroke incidence by 18% across the cohort.",
            page_or_section="Section 3.1",
            relevance_score=0.90
        ),
        Evidence(
            evidence_id="ev_trial_b",
            source_id="src_b",
            source_name="Trial_B_Report.pdf",
            text="Trial B observed no reduction in stroke incidence, establishing equivalence to placebo.",
            page_or_section="Section 4.2",
            relevance_score=0.88
        )
    ]
    claim_text = "Clinical trials demonstrate that aspirin reduced stroke incidence."
    result = verifier.verify_claim(claim_text, evidence)

    assert result.verdict == VerdictCategory.AMBIGUOUS
    assert result.conflict is not None
    assert result.conflict.supporting_evidence_id == "ev_trial_a"
    assert result.conflict.contradicting_evidence_id == "ev_trial_b"
    assert "Trial_A_Report.pdf" in result.conflict.supporting_source_name
    assert "Trial_B_Report.pdf" in result.conflict.contradicting_source_name


def test_human_review_and_verdict_override_api(monkeypatch):
    """Human auditor can review, record notes, and override a machine verdict via API."""
    monkeypatch.setattr(settings, "enable_mock_verification", False)
    monkeypatch.setattr(settings, "verification_provider", "deterministic")

    # 1. Create audit
    create_resp = client.post("/api/audits", json={"title": "Human Review Test Audit"})
    assert create_resp.status_code == 201
    audit_id = create_resp.json()["audit_id"]

    # 2. Add source
    source_resp = client.post(
        f"/api/audits/{audit_id}/sources",
        data={"text_title": "protocol.txt", "text_content": "Recommended safe operating temperature is 45°C."}
    )
    assert source_resp.status_code == 201

    # 3. Submit answer and run analysis
    client.post(
        f"/api/audits/{audit_id}/answer",
        json={"original_answer": "Recommended safe operating temperature is 95°C."}
    )
    analyze_resp = client.post(f"/api/audits/{audit_id}/analyze")
    assert analyze_resp.status_code == 200
    audit_data = analyze_resp.json()
    assert len(audit_data["claims"]) > 0
    claim_id = audit_data["claims"][0]["claim_id"]
    assert audit_data["claims"][0]["verdict"] == "contradicted"

    # 4. Human auditor overrides verdict with reason
    review_resp = client.post(
        f"/api/audits/{audit_id}/claims/{claim_id}/review",
        json={
            "action": "override_supported",
            "notes": "Verified secondary engineering appendix allows 95°C for short bursts.",
            "reviewer": "Senior Compliance Auditor"
        }
    )
    assert review_resp.status_code == 200
    updated_audit = review_resp.json()
    updated_claim = next(c for c in updated_audit["claims"] if c["claim_id"] == claim_id)

    # Machine verdict was overridden to supported, but original verdict is preserved in human_review
    assert updated_claim["verdict"] == "supported"
    assert updated_claim["human_review"] is not None
    assert updated_claim["human_review"]["action"] == "override_supported"
    assert updated_claim["human_review"]["original_verdict"] == "contradicted"
    assert "Senior Compliance Auditor" in updated_claim["human_review"]["reviewer"]


def test_adversarial_lab_endpoints():
    """Adversarial Lab returns curated cases and runs live execution correctly."""
    # Test GET cases
    cases_resp = client.get("/api/audits/adversarial-lab/cases")
    assert cases_resp.status_code == 200
    cases_data = cases_resp.json()
    assert len(cases_data["cases"]) == len(ADVERSARIAL_BENCHMARK_CASES)

    # Test POST run
    run_resp = client.post("/api/audits/adversarial-lab/run")
    assert run_resp.status_code == 200
    run_data = run_resp.json()
    assert run_data["total_cases"] == len(ADVERSARIAL_BENCHMARK_CASES)
    assert run_data["passed_cases"] >= 7  # At least 7 out of 8 cases pass
    assert run_data["accuracy_pct"] >= 80.0
