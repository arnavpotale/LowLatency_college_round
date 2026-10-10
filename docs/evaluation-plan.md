# Second Opinion — Evaluation Plan

**Owner:** Developer 4 — Verification and Evaluation

## 1. Objectives

The evaluation suite ensures that Second Opinion accurately detects factual inaccuracies without hallucinating false contradictions or failing to surface critical risks.

### Core Targets
- **Contradiction Recall >= 90%**: High sensitivity to direct factual errors, especially in safety-critical domains (medical, legal, financial).
- **False Alarm (Type I Error) Rate <= 10%**: Avoiding flagging true, supported statements as unsupported or contradicted.
- **Calibrated Uncertainty**: Ensuring low-confidence claims are labeled `ambiguous` or `inconclusive` rather than generating dogmatic incorrect verdicts.

---

## 2. Evaluation Metrics

| Metric | Target | Formula / Description |
|---|---|---|
| **Claim Offset Accuracy** | 100% | Percentage of extracted claims whose `[start_offset:end_offset]` matches `original_answer` exactly. |
| **Evidence Recall@3** | >= 85% | Percentage of test claims where ground-truth source passage appears in top-3 retrieved chunks. |
| **Verdict Macro F1** | >= 85% | Unweighted mean of F1 scores across `supported`, `contradicted`, `unsupported`, `ambiguous`, and `inconclusive`. |
| **Contradiction Sensitivity** | >= 92% | Recall specifically on claims labeled `contradicted` by human annotators. |
| **Expected Calibration Error (ECE)** | <= 0.08 | Alignment between reported confidence scores and empirical correctness. |

---

## 3. Test Corpus Composition

The benchmark suite in `evaluation/test_cases.jsonl` contains curated, multi-domain edge cases:

1. **Clinical & Pharmacological (`clinical`)**:
   - Dosage inflation / incorrect titration schedules.
   - Omission of contraindicated drug interactions.
   - Fabricated clinical trial success rates.

2. **Corporate & Financial Disclosures (`financial`)**:
   - Directional contradictions (e.g. "dropped 15%" vs "increased 8%").
   - Entity misattributions (e.g. attributing Subsidiary A revenue to Subsidiary B).
   - Numerical balance sheet calculation errors.

3. **Academic & Research Citations (`academic`)**:
   - Hallucinated author attributions and non-existent paper titles.
   - Over-generalized conclusions not supported by statistical data.

4. **Distributed Systems & Technical Specifications (`distributed_systems`)**:
   - Quorum calculations ($2F + 1$ vs $F + 1$).
   - Consistency model guarantees (Linearizability vs Eventual consistency).

---

## 4. Execution Workflow

To run the automated benchmark evaluation:
```bash
python3 evaluation/evaluate.py
```
Outputs report breakdown of claim coverage, verdict distribution, and baseline accuracy metrics.
