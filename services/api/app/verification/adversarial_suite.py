import time
from typing import List, Dict, Any
from app.schemas import Source as SourceSchema, VerdictCategory
from app.verification.verifier import get_verification_engine

ADVERSARIAL_BENCHMARK_CASES = [
    {
        "id": "adv_01_swapped_dosage",
        "title": "Altered Medication Dosage (Hazard)",
        "category": "numerical_manipulation",
        "description": "Tests detection of dangerous numerical inflation beyond safe pharmacological limits.",
        "adversarial_mechanism": "Numerical inflation (150mg vs 10mg threshold)",
        "source_text": "Clinical pharmacology monograph: Lisinopril initial dosage for adult hypertension is 10mg once daily. Dosage may be titrated to 20mg or 40mg daily based on blood pressure response.",
        "source_name": "lisinopril_monograph.pdf",
        "claim_text": "Patients may safely consume an initial dose of 150mg without titration.",
        "expected_verdict": "contradicted"
    },
    {
        "id": "adv_02_rate_period_dilation",
        "title": "Rate Interval Discrepancy",
        "category": "rate_frequency",
        "description": "Tests frequency recognition where identical dollar amounts differ by temporal period.",
        "adversarial_mechanism": "Temporal frequency shift ($500/decade vs $500/year)",
        "source_text": "Enterprise software licenses are strictly billed at $500 per year per workstation.",
        "source_name": "pricing_specification.txt",
        "claim_text": "Enterprise software licenses cost $500 per decade for unlimited corporate workstations.",
        "expected_verdict": "contradicted"
    },
    {
        "id": "adv_03_percentage_direction_reversal",
        "title": "Directional Margin Inversion",
        "category": "directional_reversal",
        "description": "Tests directional contradiction where an expenditure increase is asserted as a decrease.",
        "adversarial_mechanism": "Directional inversion (decreased 15% vs increased 8%)",
        "source_text": "Corporate Q3 filing: Operating expenditures increased by 8% year-over-year to $4.2M due to supply chain inflation.",
        "source_name": "q3_financial_filing.md",
        "claim_text": "Operating expenditures decreased by 15% in Q3 due to automation.",
        "expected_verdict": "contradicted"
    },
    {
        "id": "adv_04_polarity_contraindication",
        "title": "Negation & Safety Inversion",
        "category": "polarity_negation",
        "description": "Tests polar contradiction where a strict contraindication is claimed to have zero restrictions.",
        "adversarial_mechanism": "Explicit negation of strict safety warning",
        "source_text": "Metaproterenol dosing guideline: Standard initial adult dose is 20mg. Strictly contraindicated with non-selective beta-blockers.",
        "source_name": "metaproterenol_guideline.pdf",
        "claim_text": "Metaproterenol has no contraindications with beta-blockers.",
        "expected_verdict": "contradicted"
    },
    {
        "id": "adv_05_cross_source_conflict",
        "title": "Cross-Source Evidence Conflict",
        "category": "conflicting_sources",
        "description": "Tests multi-document conflict where Trial A demonstrates efficacy and Trial B documents failure.",
        "adversarial_mechanism": "Two peer-reviewed trials assert diametrically opposed findings",
        "source_text": "Trial A demonstrated that daily low-dose aspirin reduced ischemic stroke incidence by 18%.\n\nTrial B observed no reduction in stroke incidence, demonstrating placebo equivalence across 5,000 patients.",
        "source_name": "multi_trial_review.txt",
        "claim_text": "Clinical trials demonstrate that low-dose aspirin reduced stroke incidence.",
        "expected_verdict": "ambiguous"
    },
    {
        "id": "adv_06_hallucinated_entity",
        "title": "Hallucinated Entity / Out-of-Scope",
        "category": "missing_evidence",
        "description": "Tests ungrounded assertion containing entities completely absent from all source materials.",
        "adversarial_mechanism": "Fabrication of non-existent cure agent",
        "source_text": "Cardiovascular risk guidelines focus on dietary sodium reduction, aerobic exercise, and statin therapy for LDL reduction.",
        "source_name": "cardiology_guideline.pdf",
        "claim_text": "Extract of elderberry flower permanently cures essential hypertension within two weeks.",
        "expected_verdict": "unsupported"
    },
    {
        "id": "adv_07_insufficient_context",
        "title": "Topical Vocabulary without Evidence",
        "category": "insufficient_context",
        "description": "Tests topic overlap where medical terms appear but the specific assertion is unaddressed.",
        "adversarial_mechanism": "High topical keyword overlap without factual proof",
        "source_text": "Antimicrobial manual: Amoxicillin is widely prescribed for bacterial respiratory infections in adult outpatients.",
        "source_name": "antimicrobial_manual.txt",
        "claim_text": "Pediatric dosing requires 25mg per kilogram daily for acute otitis media.",
        "expected_verdict": "inconclusive"
    },
    {
        "id": "adv_08_grounded_fact",
        "title": "Exact Grounded Corroboration",
        "category": "supported_control",
        "description": "Positive control ensuring factual precision is accurately verified as supported.",
        "adversarial_mechanism": "Verbatim entity, unit, and numerical match",
        "source_text": "PostgreSQL configuration documentation: The default max_connections parameter is set to 100 concurrent connections in postgresql.conf.",
        "source_name": "postgres_config.txt",
        "claim_text": "The default max_connections parameter is set to 100 in postgresql.conf.",
        "expected_verdict": "supported"
    }
]


def run_adversarial_suite() -> Dict[str, Any]:
    """
    Executes live verification against the adversarial stress test suite.
    Uses the real VerificationEngine with DeterministicRuleEvaluator.
    """
    from app.verification.providers import DeterministicRuleEvaluator
    from app.verification.verifier import ClaimVerifier, VerificationEngine

    engine = VerificationEngine(
        use_mock=False,
        claim_verifier=ClaimVerifier(provider=DeterministicRuleEvaluator())
    )
    results = []
    passed_count = 0
    start_time = time.time()

    for case in ADVERSARIAL_BENCHMARK_CASES:
        t0 = time.time()
        # Create synthetic SourceSchema for this test case
        source = SourceSchema(
            source_id=f"src_{case['id']}",
            filename=case["source_name"],
            file_type="txt",
            char_count=len(case["source_text"]),
            content_snippet=case["source_text"][:200],
            raw_content=case["source_text"]
        )

        audit_res = engine.verify_audit(case["claim_text"], [source])
        duration_ms = round((time.time() - t0) * 1000, 1)

        claims = audit_res.get("claims", [])
        actual_verdict = claims[0].get("verdict") if claims else "unsupported"
        explanation = claims[0].get("explanation") if claims else "No claim evaluated"
        autopsy = claims[0].get("autopsy") if claims else None
        conflict = claims[0].get("conflict") if claims else None

        is_passed = (actual_verdict == case["expected_verdict"])
        if is_passed:
            passed_count += 1

        results.append({
            "id": case["id"],
            "case_id": case["id"],
            "title": case["title"],
            "category": case["category"],
            "description": case["description"],
            "adversarial_mechanism": case["adversarial_mechanism"],
            "source_name": case["source_name"],
            "claim_text": case["claim_text"],
            "expected_verdict": case["expected_verdict"],
            "actual_verdict": actual_verdict,
            "passed": is_passed,
            "latency_ms": duration_ms,
            "explanation": explanation,
            "autopsy": autopsy,
            "conflict": conflict
        })

    total = len(ADVERSARIAL_BENCHMARK_CASES)
    total_time_ms = round((time.time() - start_time) * 1000, 1)

    return {
        "total_cases": total,
        "passed_cases": passed_count,
        "failed_cases": total - passed_count,
        "accuracy_pct": round((passed_count / max(1, total)) * 100, 1),
        "total_latency_ms": total_time_ms,
        "test_cases": results
    }
