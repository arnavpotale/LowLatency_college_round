from typing import List
from app.schemas import VerdictCategory, Evidence
from app.verification.providers.base import VerificationProvider
from app.verification.types import PairRelation, PairNLIResult, ClaimVerificationResult


class MockVerificationProvider(VerificationProvider):
    """
    Test double verification provider for integration testing and simulated runs.
    Guarantees deterministic, reproducible outputs while enforcing citation integrity.
    """

    def __init__(self, fixed_verdict: VerdictCategory | None = None):
        self.fixed_verdict = fixed_verdict

    @property
    def name(self) -> str:
        return "mock"

    def evaluate_pair(self, claim_text: str, evidence: Evidence) -> PairNLIResult:
        return PairNLIResult(
            evidence_id=evidence.evidence_id,
            relation=PairRelation.ENTAILS,
            score=0.90,
            rationale=f"[Mock Evaluation] Simulated assessment of evidence at {evidence.page_or_section}."
        )

    def evaluate_claim(
        self,
        claim_text: str,
        candidate_evidence: List[Evidence]
    ) -> ClaimVerificationResult:
        if self.fixed_verdict is not None:
            verdict = self.fixed_verdict
        elif not candidate_evidence:
            verdict = VerdictCategory.UNSUPPORTED
        else:
            verdict = VerdictCategory.SUPPORTED

        used_ids = [candidate_evidence[0].evidence_id] if candidate_evidence and verdict != VerdictCategory.UNSUPPORTED else []

        return ClaimVerificationResult(
            claim_text=claim_text,
            verdict=verdict,
            explanation=f"[Mock Verdict] Evaluated claim under simulated test conditions.",
            confidence=0.88 if verdict != VerdictCategory.UNSUPPORTED else 0.30,
            evidence_ids=used_ids,
            pair_results=[self.evaluate_pair(claim_text, ev) for ev in candidate_evidence]
        )
