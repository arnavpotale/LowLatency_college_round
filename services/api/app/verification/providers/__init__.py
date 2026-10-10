from typing import Optional
from app.core.config import settings
from app.verification.providers.base import VerificationProvider
from app.verification.providers.deterministic import DeterministicRuleEvaluator
from app.verification.providers.mock import MockVerificationProvider
from app.verification.providers.llm import LLMVerificationProvider


from app.verification.providers.nli import NLIVerificationProvider


def get_verification_provider(provider_type: Optional[str] = None) -> VerificationProvider:
    """
    Factory function returning the configured verification provider instance.
    Supported types: 'deterministic', 'nli', 'mock', 'llm'.
    """
    choice = (provider_type or settings.resolved_verification_provider).lower().strip()

    if choice in ["deterministic", "rules", "rule_based"]:
        return DeterministicRuleEvaluator()
    elif choice in ["nli", "neural", "deberta"]:
        return NLIVerificationProvider()
    elif choice in ["mock", "simulation"]:
        return MockVerificationProvider()
    elif choice in ["llm", "openai"]:
        return LLMVerificationProvider()
    else:
        # Default to robust deterministic evaluator
        return DeterministicRuleEvaluator()


__all__ = [
    "VerificationProvider",
    "DeterministicRuleEvaluator",
    "NLIVerificationProvider",
    "MockVerificationProvider",
    "LLMVerificationProvider",
    "get_verification_provider",
]
