from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas import VerdictCategory


class PairRelation(str, Enum):
    """Relation between an atomic claim and a specific evidence passage."""
    ENTAILS = "entails"
    CONTRADICTS = "contradicts"
    NEUTRAL = "neutral"
    CONFLICTING = "conflicting"
    INSUFFICIENT = "insufficient"


class PairNLIResult(BaseModel):
    """Assessment of a single (claim, evidence) pair."""
    evidence_id: str = Field(..., description="ID of the evaluated evidence passage")
    relation: PairRelation = Field(..., description="Inferred relation to the claim")
    score: float = Field(..., ge=0.0, le=1.0, description="Confidence or similarity score for this pair")
    rationale: str = Field(..., description="Short justification grounded in the passage")
    contradiction_detail: Optional[str] = Field(None, description="Details if contradiction detected")
    numerical_finding: Optional[str] = Field(None, description="Numerical/quantity check finding if applicable")


class ClaimVerificationResult(BaseModel):
    """Structured result of evaluating an atomic claim against candidate evidence."""
    claim_id: Optional[str] = Field(None, description="Claim identifier")
    claim_text: str = Field(..., description="Atomic claim statement")
    verdict: VerdictCategory = Field(..., description="Aggregated verdict category")
    explanation: str = Field(..., description="Evidence-grounded rationale for the verdict")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Calibrated confidence score")
    evidence_ids: List[str] = Field(default_factory=list, description="IDs of source evidence actually used")
    pair_results: List[PairNLIResult] = Field(default_factory=list, description="Detailed pair-level assessments")


class VerificationError(Exception):
    """Base exception for claim verification failures."""
    pass


class ProviderUnavailableError(VerificationError):
    """Raised when an external verification model or provider is not configured or unreachable."""
    pass


class InvalidCitationError(VerificationError):
    """Raised when a verification result references non-existent evidence."""
    pass
