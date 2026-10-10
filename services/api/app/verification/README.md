# Module: Verification Engine

**Owner:** Developer 4 — Verification and Evaluation

## Purpose
This module compares extracted claims against retrieved evidence passages to render evidence-grounded verdicts.

## Verdict Categories
- `supported`: Evidence explicitly entails and verifies the claim.
- `contradicted`: Evidence directly refutes or provides contrary facts.
- `unsupported`: No evidence was found confirming the assertion.
- `ambiguous`: The claim or evidence is open to multiple interpretations.
- `inconclusive`: Retrieved evidence is insufficient or conflicting.

## Module Interface
- `default_verifier.verify_audit(original_answer: str, sources: List[Source]) -> Dict[str, Any]`

## Planned Implementation (Phase 2 & 3)
1. Natural Language Inference (NLI) model (e.g., DeBERTa-v3-large MNLI).
2. Evidence-grounded chain-of-thought LLM verifier (using OpenAI / Anthropic / Hugging Face).
3. Uncertainty calibration (conformal prediction or temperature-scaled confidence).
