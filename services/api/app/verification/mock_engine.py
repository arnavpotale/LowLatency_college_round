import uuid
from typing import List, Dict, Any, Tuple
from app.schemas import (
    VerdictCategory,
    Claim,
    Evidence,
    ConsistencyFinding,
    SafetyFinding,
    AuditSummary,
    Source as SourceSchema,
)
from app.verification.scoring import compute_trust_score, compute_risk_level


def generate_mock_audit_findings(
    original_answer: str,
    sources: List[SourceSchema]
) -> Dict[str, Any]:
    """
    Generates structured mock audit findings that strictly conform to the
    final planned response schema.
    
    IMPORTANT: This is a simulation engine for initial end-to-end development.
    The is_mock flag is set to True. Real verification models (NLI / LLM)
    will be integrated in subsequent milestones by Developer 4.
    """
    source_name = sources[0].filename if sources else "Provided Source Document"
    source_id = sources[0].source_id if sources else "src_mock_default"

    # Pre-built evidence excerpts
    evidence_items: List[Evidence] = [
        Evidence(
            evidence_id=f"ev_{uuid.uuid4().hex[:6]}",
            source_id=source_id,
            source_name=source_name,
            text="Clinical trial protocol section 3.2: Recommended initial dosage is 25mg daily, titrating to a maximum of 50mg daily under supervision.",
            page_or_section="Page 4, Section 3.2",
            relevance_score=0.94
        ),
        Evidence(
            evidence_id=f"ev_{uuid.uuid4().hex[:6]}",
            source_id=source_id,
            source_name=source_name,
            text="Financial disclosure table 12: Total Q3 operating expenditure reached $4.2 million, representing an 8% year-over-year increase.",
            page_or_section="Page 12, Table 12",
            relevance_score=0.89
        ),
        Evidence(
            evidence_id=f"ev_{uuid.uuid4().hex[:6]}",
            source_id=source_id,
            source_name=source_name,
            text="Product documentation: High-availability failover requires at least 3 distributed coordinator nodes to achieve quorum.",
            page_or_section="Section 2.1 (Architecture)",
            relevance_score=0.85
        ),
    ]

    claims: List[Claim] = []
    
    # We dynamically parse claims from original_answer to guarantee correct character offsets
    # while assigning diverse verdict categories for testing the frontend visualization.
    paragraphs = [p.strip() for p in original_answer.split("\n") if p.strip()]
    if not paragraphs:
        paragraphs = [original_answer.strip() or "Sample claim for verification."]

    sample_verdicts: List[Tuple[VerdictCategory, str, float, List[str]]] = [
        (
            VerdictCategory.SUPPORTED,
            "Directly corroborated by source documentation with high confidence.",
            0.96,
            [evidence_items[0].evidence_id]
        ),
        (
            VerdictCategory.CONTRADICTED,
            "Direct conflict: source states maximum dosage is 50mg, whereas answer claims 100mg.",
            0.92,
            [evidence_items[0].evidence_id]
        ),
        (
            VerdictCategory.UNSUPPORTED,
            "No mention of this figure or assertion was found in any of the uploaded source materials.",
            0.35,
            []
        ),
        (
            VerdictCategory.AMBIGUOUS,
            "The source statement can be interpreted in multiple ways without additional technical context.",
            0.60,
            [evidence_items[2].evidence_id]
        ),
        (
            VerdictCategory.INCONCLUSIVE,
            "Evidence retrieved is tangentially related but insufficient to confirm or deny the claim.",
            0.50,
            [evidence_items[1].evidence_id]
        ),
    ]

    verdict_idx = 0
    # Search for sentence spans within the original_answer string
    import re
    sentence_pattern = re.compile(r'([^.!?\n]+[.!?]*)', re.UNICODE)
    matches = list(sentence_pattern.finditer(original_answer))
    
    if matches:
        for match in matches:
            raw_text = match.group(1)
            cleaned = raw_text.strip()
            if len(cleaned) < 10:
                continue
                
            start = match.start(1) + (len(raw_text) - len(raw_text.lstrip()))
            end = start + len(cleaned)
            
            category, expl, conf, ev_ids = sample_verdicts[verdict_idx % len(sample_verdicts)]
            verdict_idx += 1
            
            claims.append(
                Claim(
                    claim_id=f"claim_{uuid.uuid4().hex[:8]}",
                    claim_text=cleaned,
                    start_offset=start,
                    end_offset=end,
                    verdict=category,
                    explanation=f"[Mock Verdict] {expl}",
                    confidence=conf,
                    evidence_ids=ev_ids
                )
            )
    else:
        # Fallback if no sentence matches found
        start = 0
        end = len(original_answer)
        claims.append(
            Claim(
                claim_id=f"claim_{uuid.uuid4().hex[:8]}",
                claim_text=original_answer[:100],
                start_offset=start,
                end_offset=end,
                verdict=VerdictCategory.SUPPORTED,
                explanation="[Mock Verdict] Claim matches evidence baseline.",
                confidence=0.88,
                evidence_ids=[evidence_items[0].evidence_id]
            )
        )

    # Consistency findings
    consistency_findings: List[ConsistencyFinding] = [
        ConsistencyFinding(
            finding_id=f"cf_{uuid.uuid4().hex[:6]}",
            finding_type="numerical_mismatch",
            description="[Mock Finding] Stated percentage increase (15%) conflicts with calculated figure (8%) derived from underlying financial disclosure.",
            severity="high",
            affected_claim_ids=[claims[1].claim_id] if len(claims) > 1 else []
        )
    ]

    # Safety findings
    safety_findings: List[SafetyFinding] = [
        SafetyFinding(
            finding_id=f"sf_{uuid.uuid4().hex[:6]}",
            category="medical_disclaimer_missing",
            severity="medium",
            description="[Mock Finding] Answer recommends specific prescription medication dosage without standard medical disclaimer.",
            recommendation="Insert standard clinical caveat: 'Consult a qualified physician before adjusting dosages.'"
        )
    ]

    # Tally verdicts
    verdict_counts = {
        VerdictCategory.SUPPORTED.value: 0,
        VerdictCategory.CONTRADICTED.value: 0,
        VerdictCategory.UNSUPPORTED.value: 0,
        VerdictCategory.AMBIGUOUS.value: 0,
        VerdictCategory.INCONCLUSIVE.value: 0,
    }
    for c in claims:
        verdict_counts[c.verdict.value] += 1

    total = len(claims)
    sup = verdict_counts[VerdictCategory.SUPPORTED.value]
    cont = verdict_counts[VerdictCategory.CONTRADICTED.value]
    unsup = verdict_counts[VerdictCategory.UNSUPPORTED.value]
    amb = verdict_counts[VerdictCategory.AMBIGUOUS.value]
    inc = verdict_counts[VerdictCategory.INCONCLUSIVE.value]

    trust_score, decisive_claims = compute_trust_score(sup, cont, unsup)
    risk_level = compute_risk_level(cont, unsup, trust_score)

    summary = AuditSummary(
        total_claims=total,
        supported_claims=sup,
        contradicted_claims=cont,
        unsupported_claims=unsup,
        ambiguous_claims=amb,
        inconclusive_claims=inc,
        decisive_claims=decisive_claims,
        trust_score=trust_score,
        risk_level=risk_level,
        key_takeaway=(
            f"[MOCK AUDIT RESULT] Evaluated {total} claims across provided source material. "
            f"Identified {cont} direct contradictions and {unsup} unsupported assertions."
        )
    )

    return {
        "claims": [c.model_dump() for c in claims],
        "evidence": [e.model_dump() for e in evidence_items],
        "verdicts": verdict_counts,
        "consistency_findings": [cf.model_dump() for cf in consistency_findings],
        "safety_findings": [sf.model_dump() for sf in safety_findings],
        "summary": summary.model_dump(),
        "is_mock": True
    }
