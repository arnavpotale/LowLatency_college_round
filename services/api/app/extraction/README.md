# Module: Claim Extraction

**Owner:** Developer 3 — Document Intelligence and Retrieval

## Purpose
This module is responsible for decomposing the input AI-generated answer into verifiable atomic claims.

## Critical Requirements
- **Unicode Offset Accuracy**: Every claim MUST record `start_offset` and `end_offset` as exact 0-indexed Unicode character positions in the unmodified `original_answer`.
- **Atomic Statements**: Complex compound sentences must be broken into independent factual assertions where possible.

## Module Interface
- `extract_claims(original_answer: str) -> List[Dict[str, Any]]`: Returns claims with offsets.

## Planned Enhancements
- LLM adapter with Pydantic JSON function calling / structured schema mode.
- Co-reference resolution (e.g. converting "He won" to "Albert Einstein won").
