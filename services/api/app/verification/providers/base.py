from abc import ABC, abstractmethod
from typing import List
from app.schemas import Evidence
from app.verification.types import PairNLIResult, ClaimVerificationResult


class VerificationProvider(ABC):
    """Abstract interface for claim verification engines."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the verification provider."""
        pass

    @abstractmethod
    def evaluate_pair(self, claim_text: str, evidence: Evidence) -> PairNLIResult:
        """Evaluates an individual claim-evidence pair."""
        pass

    @abstractmethod
    def evaluate_claim(
        self,
        claim_text: str,
        candidate_evidence: List[Evidence]
    ) -> ClaimVerificationResult:
        """Evaluates a claim against candidate evidence passages and returns an aggregated result."""
        pass
