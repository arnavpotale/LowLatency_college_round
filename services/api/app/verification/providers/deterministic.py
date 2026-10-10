from typing import List
from app.schemas import Evidence
from app.verification.providers.base import VerificationProvider
from app.verification.types import PairNLIResult, ClaimVerificationResult
from app.verification.rules import compute_pair_relation, aggregate_verdicts


class DeterministicRuleEvaluator(VerificationProvider):
    """
    Deterministic verification engine utilizing numerical consistency checks,
    polarity/antonym conflict detection, and lexical-semantic overlap rules.
    
    Zero external dependencies, fast, deterministic, and fully reproducible.
    """

    @property
    def name(self) -> str:
        return "deterministic_rules"

    def evaluate_pair(self, claim_text: str, evidence: Evidence) -> PairNLIResult:
        return compute_pair_relation(claim_text, evidence)

    def evaluate_claim(
        self,
        claim_text: str,
        candidate_evidence: List[Evidence]
    ) -> ClaimVerificationResult:
        pair_results = [self.evaluate_pair(claim_text, ev) for ev in candidate_evidence]
        return aggregate_verdicts(claim_text, pair_results, candidate_evidence)
