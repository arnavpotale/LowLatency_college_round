from typing import List, Dict, Any
from app.core.config import settings
from app.schemas import Source as SourceSchema
from app.verification.mock_engine import generate_mock_audit_findings


class VerificationEngine:
    """
    Core verification orchestrator.
    Dispatches to real NLI/LLM evaluation when configured,
    or returns clearly labeled mock verification findings during early milestones.
    """
    def __init__(self, use_mock: bool = True):
        self.use_mock = use_mock

    def verify_audit(
        self,
        original_answer: str,
        sources: List[SourceSchema]
    ) -> Dict[str, Any]:
        if self.use_mock:
            return generate_mock_audit_findings(original_answer, sources)
        
        # Future real verification pipeline will be implemented here by Developer 4
        raise NotImplementedError("Real AI verification engine is in development (Roadmap Phase 2).")


default_verifier = VerificationEngine(use_mock=settings.enable_mock_verification)
