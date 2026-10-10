import pytest
from typing import List, Tuple
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import Evidence, VerdictCategory
from app.verification.providers.nli import NLIVerificationProvider, _softmax
from app.verification.verifier import ClaimVerifier, VerificationEngine
from app.verification.types import (
    PairRelation,
    ProviderUnavailableError,
    VerificationError,
)

client = TestClient(app)


def make_fake_predictor(responses: List[List[float]]):
    """
    Factory creating a test double predictor returning predetermined
    [contradiction, entailment, neutral] outputs for test pairs.
    """
    call_idx = [0]

    def _predict(pairs: List[Tuple[str, str]]):
        batch = []
        for _ in pairs:
            idx = call_idx[0] % len(responses)
            call_idx[0] += 1
            batch.append(responses[idx])
        return batch

    return _predict


def test_softmax_normalization():
    # Already normalized
    c, e, n = _softmax([0.1, 0.8, 0.1])
    assert pytest.approx(c) == 0.1
    assert pytest.approx(e) == 0.8
    assert pytest.approx(n) == 0.1

    # Raw unnormalized logits
    c, e, n = _softmax([0.0, 5.0, 0.0])
    assert e > 0.98
    assert c < 0.01
    assert n < 0.01

    # Invalid lengths or NaN
    with pytest.raises(VerificationError):
        _softmax([1.0, 2.0])

    with pytest.raises(VerificationError):
        _softmax([float("nan"), 1.0, 0.0])


def test_nli_supported_claim_high_entailment():
    # [contradiction, entailment, neutral] -> high entailment
    predictor = make_fake_predictor([[0.05, 0.90, 0.05]])
    provider = NLIVerificationProvider(predictor=predictor)
    verifier = ClaimVerifier(provider=provider)

    evidence = [
        Evidence(
            evidence_id="ev_101",
            source_id="src_1",
            source_name="doc.txt",
            text="Metformin is the first-line medication for type 2 diabetes.",
            page_or_section="Section 1",
            relevance_score=0.90
        )
    ]

    res = verifier.verify_claim("Metformin is the first-line medication for type 2 diabetes.", evidence)
    assert res.verdict == VerdictCategory.SUPPORTED
    assert res.confidence >= 0.85
    assert res.evidence_ids == ["ev_101"]
    assert "directly corroborated" in res.explanation.lower() or "entailed" in res.explanation.lower()


def test_nli_contradicted_claim_high_contradiction():
    # [contradiction, entailment, neutral] -> high contradiction
    predictor = make_fake_predictor([[0.88, 0.02, 0.10]])
    provider = NLIVerificationProvider(predictor=predictor)
    verifier = ClaimVerifier(provider=provider)

    evidence = [
        Evidence(
            evidence_id="ev_202",
            source_id="src_1",
            source_name="doc.txt",
            text="Thalidomide is strictly contraindicated and prohibited during pregnancy.",
            page_or_section="Section 2",
            relevance_score=0.95
        )
    ]

    res = verifier.verify_claim("Thalidomide is safe and recommended during pregnancy.", evidence)
    assert res.verdict == VerdictCategory.CONTRADICTED
    assert res.confidence >= 0.85
    assert res.evidence_ids == ["ev_202"]
    assert "refuted" in res.explanation.lower()


def test_nli_neutral_inconclusive_claim():
    # [contradiction, entailment, neutral] -> high neutral
    predictor = make_fake_predictor([[0.10, 0.10, 0.80]])
    provider = NLIVerificationProvider(predictor=predictor)
    verifier = ClaimVerifier(provider=provider)

    evidence = [
        Evidence(
            evidence_id="ev_303",
            source_id="src_1",
            source_name="doc.txt",
            text="The trial evaluated elderly cohorts aged 65 to 80.",
            page_or_section="Section 3",
            relevance_score=0.85
        )
    ]

    res = verifier.verify_claim("The compound demonstrates safety in pediatric children.", evidence)
    assert res.verdict == VerdictCategory.INCONCLUSIVE
    assert res.evidence_ids == ["ev_303"]
    assert "insufficient evidence" in res.explanation.lower()


def test_nli_conflicting_evidence_ambiguous():
    # Pair 1: entails, Pair 2: contradicts
    predictor = make_fake_predictor([
        [0.05, 0.92, 0.03],  # Pair 1: entails
        [0.89, 0.03, 0.08],  # Pair 2: contradicts
    ])
    provider = NLIVerificationProvider(predictor=predictor)
    verifier = ClaimVerifier(provider=provider)

    evidence = [
        Evidence(
            evidence_id="ev_sup",
            source_id="src_1",
            source_name="doc1.txt",
            text="Trial A showed significant positive blood pressure reduction.",
            page_or_section="Trial A",
            relevance_score=0.90
        ),
        Evidence(
            evidence_id="ev_cont",
            source_id="src_2",
            source_name="doc2.txt",
            text="Trial B concluded no statistically significant blood pressure reduction was observed.",
            page_or_section="Trial B",
            relevance_score=0.90
        )
    ]

    res = verifier.verify_claim("The drug significantly lowers blood pressure.", evidence)
    assert res.verdict == VerdictCategory.AMBIGUOUS
    assert "ev_sup" in res.evidence_ids
    assert "ev_cont" in res.evidence_ids
    assert "conflicting" in res.explanation.lower()


def test_nli_no_relevant_evidence_unsupported():
    predictor = make_fake_predictor([[0.33, 0.33, 0.34]])
    provider = NLIVerificationProvider(predictor=predictor)
    verifier = ClaimVerifier(provider=provider)

    # Completely empty candidate evidence
    res = verifier.verify_claim("Unrelated statement without evidence.", [])
    assert res.verdict == VerdictCategory.UNSUPPORTED
    assert res.evidence_ids == []

    # Evidence below minimum relevance threshold
    low_rel_evidence = [
        Evidence(
            evidence_id="ev_irrelevant",
            source_id="src_x",
            source_name="doc.txt",
            text="Unrelated text about furniture assembly.",
            page_or_section="Page 1",
            relevance_score=0.05  # below 0.20
        )
    ]
    res2 = verifier.verify_claim("Quantum computing entanglement.", low_rel_evidence)
    assert res2.verdict == VerdictCategory.UNSUPPORTED
    assert res2.evidence_ids == []


def test_nli_strict_citation_validation():
    predictor = make_fake_predictor([[0.05, 0.90, 0.05]])
    provider = NLIVerificationProvider(predictor=predictor)
    verifier = ClaimVerifier(provider=provider)

    evidence = [
        Evidence(
            evidence_id="ev_real",
            source_id="src_1",
            source_name="doc.txt",
            text="Real source passage.",
            page_or_section="Section 1",
            relevance_score=0.90
        )
    ]

    res = verifier.verify_claim("Test claim.", evidence)
    # Citations must strictly contain only real candidate evidence
    assert res.evidence_ids == ["ev_real"]
    assert "ev_fabricated" not in res.evidence_ids


def test_nli_provider_unavailable_on_invalid_model():
    provider = NLIVerificationProvider(model_name="nonexistent/model-that-does-not-exist-xyz123")
    with pytest.raises(ProviderUnavailableError) as exc_info:
        provider.evaluate_pair("Claim text", Evidence(
            evidence_id="ev_1",
            source_id="src_1",
            source_name="doc.txt",
            text="Premise text",
            page_or_section="Section 1",
            relevance_score=0.90
        ))
    assert "Failed to load NLI model" in str(exc_info.value)


def test_nli_audit_workflow_and_response_contract(monkeypatch):
    """
    Validates end-to-end audit lifecycle using the NLI provider with a fake predictor.
    """
    fake_predictor = make_fake_predictor([[0.05, 0.92, 0.03]])
    nli_provider = NLIVerificationProvider(predictor=fake_predictor)
    custom_engine = VerificationEngine(
        use_mock=False,
        claim_verifier=ClaimVerifier(provider=nli_provider)
    )

    monkeypatch.setattr("app.api.audits.get_verification_engine", lambda: custom_engine)
    monkeypatch.setattr("app.core.config.settings.enable_mock_verification", False)
    monkeypatch.setattr("app.core.config.settings.verification_provider", "nli")

    # 1. Create audit
    create_resp = client.post("/api/audits", json={"title": "NLI Integration Test Audit"})
    assert create_resp.status_code == 201
    audit_id = create_resp.json()["audit_id"]

    # 2. Add source
    src_resp = client.post(
        f"/api/audits/{audit_id}/sources",
        data={"text_title": "Guidelines.txt", "text_content": "Metformin is standard initial therapy for diabetes."}
    )
    assert src_resp.status_code == 201

    # 3. Submit answer
    ans_resp = client.post(
        f"/api/audits/{audit_id}/answer",
        json={"original_answer": "Metformin is standard initial therapy for diabetes."}
    )
    assert ans_resp.status_code == 200

    # 4. Analyze audit
    analyze_resp = client.post(f"/api/audits/{audit_id}/analyze")
    assert analyze_resp.status_code == 200
    data = analyze_resp.json()

    assert data["status"] == "completed"
    assert data["is_mock"] is False
    assert "[NEURAL NLI AUDIT]" in data["summary"]["key_takeaway"]
    assert len(data["claims"]) >= 1
    assert data["claims"][0]["verdict"] == "supported"


def test_nli_failure_does_not_fall_back_to_mock(monkeypatch):
    """
    Asserts that a failed NLI provider raises HTTP 502 Bad Gateway and never falls back to mock.
    """
    def broken_engine():
        class BrokenVerifier:
            def verify_audit(self, answer, sources):
                raise ProviderUnavailableError("Simulated neural model weights unavailable.")
        return BrokenVerifier()

    monkeypatch.setattr("app.api.audits.get_verification_engine", broken_engine)
    monkeypatch.setattr("app.core.config.settings.enable_mock_verification", False)

    create_resp = client.post("/api/audits", json={"title": "NLI Failure Audit"})
    audit_id = create_resp.json()["audit_id"]

    client.post(
        f"/api/audits/{audit_id}/answer",
        json={"original_answer": "Test answer for broken provider."}
    )

    analyze_resp = client.post(f"/api/audits/{audit_id}/analyze")
    assert analyze_resp.status_code == 502
    assert "Verification provider failed" in analyze_resp.json()["detail"]

    # Verify audit status is FAILED in the database
    get_resp = client.get(f"/api/audits/{audit_id}")
    assert get_resp.json()["status"] == "failed"
