"""
Canonical trust score calculation module for Second Opinion.

Defines the normalized formula:
    trust_score = supported / (supported + contradicted + unsupported) * 100

Rules:
- Include supported, contradicted, and unsupported assertions in the denominator.
- Exclude ambiguous and inconclusive assertions because they lack a decisive verdict.
- Return None if there are no decisively evaluated assertions (displays as N/A).
- Return exact float (0.0 - 100.0) rounded to 1 decimal place.
"""

from typing import Optional, Tuple


def compute_trust_score(
    supported: int,
    contradicted: int,
    unsupported: int
) -> Tuple[Optional[float], int]:
    """
    Calculates the normalized trust score and decisive claim count.

    Args:
        supported: Number of corroborated / supported assertions.
        contradicted: Number of contradicted assertions.
        unsupported: Number of ungrounded / unsupported assertions.

    Returns:
        tuple (score, decisive_count):
            - score: float in [0.0, 100.0] rounded to 1 decimal place, or None if decisive_count == 0.
            - decisive_count: total count of decisive claims evaluated (supported + contradicted + unsupported).
    """
    sup = max(0, int(supported))
    cont = max(0, int(contradicted))
    unsup = max(0, int(unsupported))

    decisive_count = sup + cont + unsup
    if decisive_count == 0:
        return None, 0

    score = round((sup / decisive_count) * 100.0, 1)
    return score, decisive_count


def compute_risk_level(
    contradicted: int,
    unsupported: int,
    trust_score: Optional[float]
) -> str:
    """
    Determines governance risk level:
    - 'high': Any direct factual contradictions OR trust_score < 50
    - 'medium': Any unsupported claims OR trust_score < 75
    - 'low': High reliability / clean audit
    """
    cont = max(0, int(contradicted))
    unsup = max(0, int(unsupported))

    if cont > 0:
        return "high"
    if trust_score is not None and trust_score < 50.0:
        return "high"
    if unsup > 0:
        return "medium"
    if trust_score is not None and trust_score < 75.0:
        return "medium"
    return "low"
