# Second Opinion — Evaluation Framework

**Primary Owner:** Developer 4 — Verification and Evaluation

## Purpose
This directory houses ground-truth evaluation datasets, annotation guidelines, and automated benchmarking scripts to evaluate:
1. **Claim Extraction:** Precision and recall of atomic claims extracted from AI answers.
2. **Retrieval Grounding:** MRR (Mean Reciprocal Rank) and Recall@K of evidence passages retrieved from source documents.
3. **Verdict Classification:** Macro F1 and Contradiction Recall across verdict categories (`supported`, `contradicted`, `unsupported`, `ambiguous`, `inconclusive`).
4. **Consistency & Safety:** Detection rate of numerical calculation errors and hazardous advice.

## Benchmark Test Cases
- File: `test_cases.jsonl`
- Run evaluation:
  ```bash
  python3 evaluation/evaluate.py
  ```

## Structure
- `datasets/`: Raw source documents and multi-domain test corpora.
- `annotations/`: Human and consensus annotations marking true claims, exact offsets, and evidence passages.
- `test_cases.jsonl`: Formatted test cases for end-to-end evaluation.
- `evaluate.py`: Automated benchmarking CLI.
