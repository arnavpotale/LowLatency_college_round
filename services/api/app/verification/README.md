# Module: Claim Verification Engine

**Owner:** Developer 4 — Verification and Evaluation

## Purpose
This module provides an evidence-grounded claim verification engine that evaluates atomic claims against candidate evidence passages to produce validated, auditable verdicts and citations.

## Verdict Categories
- `supported`: The claim is directly corroborated and verified by primary source evidence.
- `contradicted`: The claim directly conflicts with or is refuted by source evidence.
- `unsupported`: The evidence base contains no facts confirming or denying the assertion (does NOT declare claim false).
- `ambiguous`: Conflicting evidence exists across source passages, or evidence statements are mutually contradictory.
- `inconclusive`: Retrieved evidence is tangentially related or provides insufficient context to substantiate or refute the claim.

## Verification Interface
```python
from app.verification import ClaimVerifier
from app.schemas import Evidence

verifier = ClaimVerifier()

candidate_evidence = [
    Evidence(
        evidence_id="ev_01",
        source_id="src_01",
        source_name="clinical_trial.pdf",
        text="Standard initial dosage is 25mg daily. Maximum dose under supervision is 50mg daily.",
        page_or_section="Page 4, Section 3.2",
        relevance_score=0.95
    )
]

# 1. Supported Claim
result = verifier.verify_claim(
    claim="Standard initial dosage is 25mg daily.",
    candidate_evidence=candidate_evidence
)
# result.verdict == VerdictCategory.SUPPORTED
# result.evidence_ids == ["ev_01"]

# 2. Contradicted Claim (e.g. Dosage inflation)
result = verifier.verify_claim(
    claim="Patients should take 100mg twice daily.",
    candidate_evidence=candidate_evidence
)
# result.verdict == VerdictCategory.CONTRADICTED

# 3. Unsupported Claim (No evidence)
result = verifier.verify_claim(
    claim="The medicine improves chess playing performance by 40%.",
    candidate_evidence=[]
)
# result.verdict == VerdictCategory.UNSUPPORTED
# result.evidence_ids == []
```

## Provider Architecture
The engine is provider-neutral via `VerificationProvider`:
- `DeterministicRuleEvaluator`: Fast, deterministic, zero-dependency NLI rule engine for numerical consistency, directional polarity, and semantic overlap checks.
- `MockVerificationProvider`: Deterministic test double for integration tests and offline development.
- `LLMVerificationProvider`: Evidence-grounded structured LLM assessment (OpenAI, Anthropic, or OpenAI-compatible endpoints) with strict JSON output schemas.

## Strict Citation & Grounding Rules
- **Citation Invariant:** Every `evidence_id` in `claim.evidence_ids` is strictly verified against candidate evidence. Fabricated citations are rejected.
- **Unsupported Claims:** When a claim is `unsupported`, `evidence_ids` is guaranteed to be empty.
- **Evidence vs Safety:** Safety findings are treated as distinct risk advisories and never conflated with factual truth.

## Configuration Precedence

The verification provider is governed by environment settings in `app.core.config.Settings`:
1. `ENABLE_MOCK_VERIFICATION=true`: Forces the mock engine (`is_mock=True`) regardless of `VERIFICATION_PROVIDER`.
2. `ENABLE_MOCK_VERIFICATION=false` and `VERIFICATION_PROVIDER=mock`: Selects mock mode (`is_mock=True`).
3. `ENABLE_MOCK_VERIFICATION=false` and `VERIFICATION_PROVIDER=deterministic`: Dispatches to `DeterministicRuleEvaluator` (`is_mock=False`).
4. `ENABLE_MOCK_VERIFICATION=false` and `VERIFICATION_PROVIDER=llm`: Dispatches to `LLMVerificationProvider` (`is_mock=False`). If provider credentials or endpoints fail, the system raises HTTP 502 Bad Gateway and sets audit status to `failed` without falling back to mock output.

