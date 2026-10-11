import uuid
from typing import List, Dict, Any, Union, Optional
from app.core.config import settings
from app.schemas import (
    Claim,
    Evidence,
    VerdictCategory,
    Source as SourceSchema,
    AuditSummary,
    PairResultSchema,
    ConflictDetail,
    ClaimAutopsySchema,
)
from app.verification.providers import (
    VerificationProvider,
    DeterministicRuleEvaluator,
    get_verification_provider,
)
from app.verification.types import (
    ClaimVerificationResult,
    ProviderUnavailableError,
)
from app.verification.mock_engine import generate_mock_audit_findings
from app.verification.rules import validate_citations
from app.verification.scoring import compute_trust_score, compute_risk_level


class ClaimVerifier:
    """
    Primary evidence-grounded claim verification interface.
    Accepts an atomic claim and candidate evidence passages and returns
    a validated Claim model adhering to the shared data contract.
    """

    def __init__(self, provider: Optional[VerificationProvider] = None):
        self.provider = provider or get_verification_provider()

    def verify_claim(
        self,
        claim: Union[Claim, str],
        candidate_evidence: List[Union[Evidence, Dict[str, Any]]],
        claim_id: Optional[str] = None,
        start_offset: int = 0,
        end_offset: int = 0,
        verifiable_text: Optional[str] = None
    ) -> Claim:
        """
        Evaluates an individual claim against candidate evidence passages.
        
        Args:
            claim: Claim Pydantic model or atomic claim text string.
            candidate_evidence: List of Evidence models or evidence chunk dictionaries.
            claim_id: Optional claim ID if claim is passed as a string.
            start_offset: Unicode start offset in original answer (default 0).
            end_offset: Unicode end offset in original answer (default len(claim_text)).
            
        Returns:
            Validated Claim model with verdict, explanation, confidence, and validated citations.
        """
        # 1. Normalize claim input
        if isinstance(claim, Claim):
            c_text = claim.claim_text
            c_id = claim.claim_id
            c_start = claim.start_offset
            c_end = claim.end_offset
        else:
            c_text = str(claim)
            c_id = claim_id or f"claim_{uuid.uuid4().hex[:8]}"
            c_start = start_offset
            c_end = end_offset if end_offset > 0 else len(c_text)

        # 2. Normalize candidate evidence input (support both Evidence models and chunk dicts)
        normalized_evidence: List[Evidence] = []
        for idx, item in enumerate(candidate_evidence):
            if isinstance(item, Evidence):
                normalized_evidence.append(item)
            elif isinstance(item, dict):
                ev_id = str(item.get("evidence_id") or f"ev_{idx}_{uuid.uuid4().hex[:6]}")
                loc_tag = str(item.get("page_or_section", "General"))
                l_start = item.get("line_start")
                l_end = item.get("line_end")
                if l_start and l_end and "lines" not in loc_tag.lower():
                    loc_tag = f"{loc_tag} (Lines {l_start}-{l_end})"

                normalized_evidence.append(
                    Evidence(
                        evidence_id=ev_id,
                        source_id=str(item.get("source_id", "src_default")),
                        source_name=str(item.get("source_name", "Source Document")),
                        text=str(item.get("text", "")),
                        page_or_section=loc_tag,
                        relevance_score=float(item.get("relevance_score", 0.85))
                    )
                )

        # 3. Filter out completely empty or zero-relevance candidate passages
        filtered_evidence = [
            e for e in normalized_evidence
            if e.relevance_score > 0.0 and e.text.strip()
        ]

        # 4. Delegate to verification provider
        eval_text = verifiable_text or c_text
        result: ClaimVerificationResult = self.provider.evaluate_claim(
            claim_text=eval_text,
            candidate_evidence=filtered_evidence
        )

        # 5. Enforce strict citation validation (Rule 7: Never invent citations)
        valid_ids = {e.evidence_id for e in filtered_evidence}
        validated_evidence_ids = validate_citations(result.evidence_ids, valid_ids)

        # If verdict is UNSUPPORTED, citations MUST be empty
        if result.verdict == VerdictCategory.UNSUPPORTED:
            validated_evidence_ids = []

        # 6. Build structured evaluation trail
        trail_schemas: List[PairResultSchema] = []
        for pr in result.pair_results:
            rel_str = pr.relation.value if hasattr(pr.relation, "value") else str(pr.relation)
            trail_schemas.append(
                PairResultSchema(
                    evidence_id=pr.evidence_id,
                    relation=rel_str,
                    score=pr.score,
                    rationale=pr.rationale,
                    contradiction_detail=pr.contradiction_detail,
                    numerical_finding=pr.numerical_finding,
                    source_name=pr.source_name,
                    page_or_section=pr.page_or_section,
                    excerpt=pr.excerpt
                )
            )

        return Claim(
            claim_id=c_id,
            claim_text=c_text,
            start_offset=c_start,
            end_offset=c_end,
            verdict=result.verdict,
            explanation=result.explanation,
            confidence=result.confidence,
            evidence_ids=validated_evidence_ids,
            evaluation_trail=trail_schemas,
            conflict=result.conflict,
            autopsy=result.autopsy
        )

    def verify_claims_batch(
        self,
        claims: List[Claim],
        candidate_evidence: List[Union[Evidence, Dict[str, Any]]]
    ) -> List[Claim]:
        """Evaluates a batch of claims against the provided evidence pool."""
        return [self.verify_claim(claim=c, candidate_evidence=candidate_evidence) for c in claims]


class VerificationEngine:
    """
    Core verification orchestrator.
    Dispatches to real evidence-grounded verification engine or returns
    explicit mock simulation findings based on configuration.
    """

    def __init__(
        self,
        use_mock: Optional[bool] = None,
        claim_verifier: Optional[ClaimVerifier] = None
    ):
        self._use_mock = use_mock
        self._claim_verifier = claim_verifier

    @property
    def is_mock(self) -> bool:
        if self._use_mock is not None:
            return self._use_mock
        return settings.is_mock_active

    @property
    def claim_verifier(self) -> ClaimVerifier:
        if self._claim_verifier is not None:
            return self._claim_verifier
        return ClaimVerifier()

    def verify_audit(
        self,
        original_answer: str,
        sources: List[SourceSchema]
    ) -> Dict[str, Any]:
        """
        Executes audit verification.
        If is_mock=True, uses the explicit test double simulation.
        If is_mock=False, uses the real claim verifier pipeline with document evidence.
        """
        if self.is_mock:
            return generate_mock_audit_findings(original_answer, sources)

        # Real verification pipeline:
        from app.extraction.extractor import extract_claims
        from app.ingestion.chunker import chunk_document
        from app.retrieval.retriever import retrieve_evidence
        from app.consistency.checker import check_numerical_consistency
        from app.safety.guardrails import evaluate_safety_risks

        # 1. Extract atomic claims from original answer with character offsets
        raw_claims = extract_claims(original_answer)
        if not raw_claims:
            return {
                "claims": [],
                "evidence": [],
                "verdicts": {v.value: 0 for v in VerdictCategory},
                "consistency_findings": [],
                "safety_findings": [],
                "summary": AuditSummary().model_dump(),
                "conflict_map": [],
                "is_mock": False
            }

        # 2. Chunk source documents into candidate passages
        all_candidate_evidence: List[Evidence] = []
        for src in sources:
            src_text = src.raw_content or src.content_snippet or ""
            if not src_text:
                continue
            chunks = chunk_document(src_text, source_id=src.source_id)
            for i, chunk in enumerate(chunks):
                loc_tag = chunk.get("page_or_section", f"Chunk {i+1}")
                l_start = chunk.get("line_start")
                l_end = chunk.get("line_end")
                if l_start and l_end and "lines" not in loc_tag.lower():
                    loc_tag = f"{loc_tag} (Lines {l_start}-{l_end})"

                ev = Evidence(
                    evidence_id=f"ev_{src.source_id[:6]}_{i}",
                    source_id=src.source_id,
                    source_name=src.filename,
                    text=chunk["text"],
                    page_or_section=loc_tag,
                    relevance_score=0.90,
                    start_offset=chunk.get("start_offset"),
                    end_offset=chunk.get("end_offset")
                )
                all_candidate_evidence.append(ev)

        # 3. Verify each extracted claim against retrieved evidence
        verified_claims: List[Claim] = []
        used_evidence_map: Dict[str, Evidence] = {}
        candidate_dict_chunks = [
            {
                "evidence_id": e.evidence_id,
                "source_id": e.source_id,
                "source_name": e.source_name,
                "text": e.text,
                "page_or_section": e.page_or_section
            }
            for e in all_candidate_evidence
        ]

        for rc in raw_claims:
            claim_text = rc["claim_text"]
            eval_query = rc.get("verifiable_text") or claim_text
            # Retrieve top candidate evidence chunks for this claim using full semantic query
            top_chunks = retrieve_evidence(eval_query, candidate_dict_chunks, top_k=3)
            
            top_evidence_items: List[Evidence] = []
            for tc in top_chunks:
                matched_ev = next((e for e in all_candidate_evidence if e.evidence_id == tc["evidence_id"]), None)
                if matched_ev and tc.get("relevance_score", 0.0) > 0:
                    top_evidence_items.append(
                        Evidence(
                            evidence_id=matched_ev.evidence_id,
                            source_id=matched_ev.source_id,
                            source_name=matched_ev.source_name,
                            text=matched_ev.text,
                            page_or_section=matched_ev.page_or_section,
                            relevance_score=float(tc.get("relevance_score", 0.80)),
                            start_offset=matched_ev.start_offset,
                            end_offset=matched_ev.end_offset
                        )
                    )

            # Verify claim with ClaimVerifier
            verified_claim = self.claim_verifier.verify_claim(
                claim=claim_text,
                candidate_evidence=top_evidence_items,
                claim_id=rc["claim_id"],
                start_offset=rc["start_offset"],
                end_offset=rc["end_offset"],
                verifiable_text=rc.get("verifiable_text")
            )
            verified_claims.append(verified_claim)

            # Track evidence used in citations
            for eid in verified_claim.evidence_ids:
                matched_ev = next((e for e in all_candidate_evidence if e.evidence_id == eid), None)
                if matched_ev:
                    used_evidence_map[eid] = matched_ev

        # 4. Tally verdicts and calculate trust score
        verdict_counts = {v.value: 0 for v in VerdictCategory}
        for c in verified_claims:
            verdict_counts[c.verdict.value] += 1

        total = len(verified_claims)
        sup = verdict_counts[VerdictCategory.SUPPORTED.value]
        cont = verdict_counts[VerdictCategory.CONTRADICTED.value]
        unsup = verdict_counts[VerdictCategory.UNSUPPORTED.value]
        amb = verdict_counts[VerdictCategory.AMBIGUOUS.value]
        inc = verdict_counts[VerdictCategory.INCONCLUSIVE.value]

        trust_score, decisive_claims = compute_trust_score(sup, cont, unsup)
        risk_level = compute_risk_level(cont, unsup, trust_score)

        # Label takeaway clearly according to the active provider
        provider_name = self.claim_verifier.provider.name
        if provider_name == "deterministic_rules":
            takeaway = (
                f"[DETERMINISTIC RULE-BASED AUDIT] Evaluated {total} claims across source evidence "
                f"using deterministic verification rules (numerical checks, directional conflict, "
                f"and evidence grounding). Identified {sup} supported, {cont} contradicted, "
                f"and {unsup} unsupported assertions."
            )
        elif provider_name.startswith("llm"):
            takeaway = (
                f"[LLM-GROUNDED AUDIT] Evaluated {total} claims across source evidence "
                f"using structured LLM assessment ({provider_name}). Identified {sup} supported, "
                f"{cont} contradicted, and {unsup} unsupported assertions."
            )
        elif provider_name.startswith("nli"):
            takeaway = (
                f"[NEURAL NLI AUDIT] Evaluated {total} claims across source evidence "
                f"using pretrained CrossEncoder NLI inference ({provider_name}). Identified {sup} supported, "
                f"{cont} contradicted, and {unsup} unsupported assertions."
            )
        else:
            takeaway = (
                f"[AUDIT COMPLETE] Evaluated {total} claims across source evidence. "
                f"Identified {sup} supported, {cont} contradicted, and {unsup} unsupported assertions."
            )

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
            key_takeaway=takeaway
        )

        # 5. Extract consistency and safety findings independently
        claim_dicts = [c.model_dump() for c in verified_claims]
        consistency_findings = check_numerical_consistency(original_answer, claims=claim_dicts)
        safety_findings = evaluate_safety_risks(original_answer, claims=claim_dicts)

        # Flag any verified claims that identified numerical contradictions in consistency findings
        for c in verified_claims:
            if c.verdict == VerdictCategory.CONTRADICTED and ("numerical" in c.explanation.lower() or "exceeding" in c.explanation.lower()):
                consistency_findings.append({
                    "finding_id": f"cf_{uuid.uuid4().hex[:6]}",
                    "finding_type": "numerical_mismatch",
                    "description": f"Numerical conflict in claim '{c.claim_text[:60]}...': {c.explanation}",
                    "severity": "high",
                    "affected_claim_ids": [c.claim_id]
                })

        # 6. Aggregate cross-source evidence conflicts
        conflict_map = []
        for c in verified_claims:
            if c.conflict:
                conf_dict = c.conflict.model_dump() if hasattr(c.conflict, "model_dump") else c.conflict
                conf_dict["claim_id"] = c.claim_id
                conflict_map.append(conf_dict)

        return {
            "claims": [c.model_dump() for c in verified_claims],
            "evidence": [e.model_dump() for e in used_evidence_map.values()],
            "verdicts": verdict_counts,
            "consistency_findings": consistency_findings,
            "safety_findings": safety_findings,
            "summary": summary.model_dump(),
            "conflict_map": conflict_map,
            "is_mock": False
        }


def get_verification_engine(use_mock: Optional[bool] = None) -> VerificationEngine:
    """Factory creating a VerificationEngine honoring current settings."""
    return VerificationEngine(use_mock=use_mock)


# Default verifier instance dynamically checking settings
default_verifier = VerificationEngine()
