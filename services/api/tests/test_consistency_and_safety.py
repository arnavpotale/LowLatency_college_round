import pytest
from app.consistency.checker import check_numerical_consistency
from app.safety.guardrails import evaluate_safety_risks


def test_percentage_sum_exceeding_100():
    text = "Survey findings: 45% of users chose option A, 40% of users chose option B, and 30% of users chose option C."
    findings = check_numerical_consistency(text)
    assert len(findings) == 1
    assert findings[0]["finding_type"] == "numerical_mismatch"
    assert "115.0%" in findings[0]["description"]
    assert findings[0]["severity"] == "medium"


def test_internal_directional_contradiction():
    text = "Corporate review: Operating expenditures increased by 8% in Q1. However, operating expenditures decreased by 15% during the same initial interval."
    findings = check_numerical_consistency(text)
    assert len(findings) == 1
    assert findings[0]["finding_type"] == "internal_contradiction"
    assert "operating expenditures" in findings[0]["description"].lower()
    assert findings[0]["severity"] == "high"


def test_temporal_inversion():
    text = "Corporate profile: Founded in 2025, the enterprise launched its core platform in 2020."
    findings = check_numerical_consistency(text)
    assert len(findings) == 1
    assert findings[0]["finding_type"] == "temporal_inconsistency"
    assert "2025" in findings[0]["description"]
    assert "2020" in findings[0]["description"]


def test_clean_text_no_consistency_issues():
    text = "The system achieved 99.9% uptime during fiscal year 2023 with $1.2M in operating expenditure."
    findings = check_numerical_consistency(text)
    assert findings == []


def test_safety_harmful_medication_discontinuation():
    text = "If you experience nausea, discontinue taking your prescribed insulin immediately."
    findings = evaluate_safety_risks(text)
    assert len(findings) == 1
    assert findings[0]["category"] == "harmful_advice"
    assert findings[0]["severity"] == "critical"
    assert "discontinuation of prescribed medication" in findings[0]["description"].lower()


def test_safety_unverified_miracle_cure():
    text = "Extract of elderberry flower is a miracle cure that permanently cures hypertension within two weeks."
    findings = evaluate_safety_risks(text)
    assert len(findings) == 1
    assert findings[0]["category"] == "harmful_advice"
    assert findings[0]["severity"] == "high"
    assert "cure" in findings[0]["description"].lower()


def test_safety_hazardous_dosage_without_titration():
    text = "Patients may safely consume an initial dose of 150mg without titration."
    findings = evaluate_safety_risks(text)
    assert len(findings) == 1
    assert findings[0]["category"] == "harmful_advice"
    assert findings[0]["severity"] == "high"
    assert "dosage" in findings[0]["description"].lower()


def test_safety_unsubstantiated_financial_guarantee():
    text = "Our algorithmic strategy provides a guaranteed profit of 35% monthly as a risk-free investment."
    findings = evaluate_safety_risks(text)
    assert len(findings) == 1
    assert findings[0]["category"] == "financial_risk"
    assert findings[0]["severity"] == "high"
    assert "financial guarantee" in findings[0]["description"].lower()


def test_safety_plaintext_password_recommendation():
    text = "The backend service supports encryption, and it stores passwords in plaintext."
    findings = evaluate_safety_risks(text)
    assert len(findings) == 1
    assert findings[0]["category"] == "security_risk"
    assert findings[0]["severity"] == "high"
    assert "plaintext" in findings[0]["description"].lower()


def test_benign_text_no_safety_risks():
    text = "The patient was prescribed standard lisinopril 10mg daily with regular blood pressure follow-ups."
    findings = evaluate_safety_risks(text)
    assert findings == []
