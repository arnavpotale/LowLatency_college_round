# Module: Safety Guardrails

**Owner:** Developer 4 — Verification and Evaluation

## Purpose
This module identifies potentially unsafe or hazardous recommendations within the AI-generated answer.

## Key Principle
Safety findings represent an additional risk dimension and are NOT a substitute for factual verification. Even if an assertion is factually accurate, it may still carry significant liability or safety risk (e.g., self-medication recommendations).

## Module Interface
- `evaluate_safety_risks(answer_text: str) -> List[Dict[str, Any]]`
