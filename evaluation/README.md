# Second Opinion — Evaluation Framework & Verification Benchmark Audit

**Primary Owner:** Developer 4 — Verification and Evaluation

## 1. Purpose & Overview
This directory houses ground-truth evaluation datasets, multi-domain benchmark cases, and automated evaluation harnesses to measure verification quality, retrieval precision, citation validity, and claim offset integrity across all verdict categories.

---

## 2. Benchmark Dataset Composition & Audit

The benchmark dataset in [`test_cases.jsonl`](file:///Users/arnavpotale/Code/bnb/LowLatency_college_round/evaluation/test_cases.jsonl) comprises **43 benchmark test cases** containing **76 manually annotated and verified atomic claims**.

### Case & Domain Distribution
| Domain Key | Category Description | Cases | Claims |
|:---|:---|:---:|:---:|
| `clinical` | Pharmacology, dosages, contraindications, pediatric guidelines, split trials | 7 | 12 |
| `financial` | 10-Q disclosures, operating expenses, revenue guidance, billing metrics | 7 | 13 |
| `technical` | Distributed consensus (Raft), replication, connection pools, eviction, storage | 8 | 14 |
| `regulatory` | GDPR breach notification SLAs, Right to Erasure, HIPAA, SOC2, CCPA | 8 | 14 |
| `scientific` | Carbon capture, hydrothermal vents, coral bleaching, perovskite stability | 5 | 10 |
| `engineering` | Falcon 9 payload capacity, turbine inlet temperatures, FAA drone ceilings | 3 | 6 |
| `consumer_safety` | Pediatric car seat guidelines, infant botulism warnings, food refrigeration | 3 | 6 |
| `academic` | Clinical study cohort size and unverified memory retention claims | 1 | 2 |
| `general` | Botanical soothing tea vs false cancer cure (source-grounded audit) | 1 | 1 |
| **Total** | | **43** | **76** |

### Verdict Category Distribution
| Category | Total Claims | Description |
|:---|:---:|:---|
| `supported` | 31 | Factual assertion directly corroborated and entailed by primary source evidence. |
| `contradicted` | 20 | Direct numerical conflict, directional contradiction, or explicit antonym/negation against evidence. |
| `unsupported` | 13 | Assertion unmentioned in source material; citations strictly empty (`[]`). |
| `ambiguous` | 6 | Source evidence contains mutually contradictory statements across passages or trials. |
| `inconclusive` | 6 | Candidate passages mention related terminology but provide insufficient context to substantiate or refute. |
| **Total** | **76** | |

---

## 3. Source-Grounded Verification Policy & Fixture Classification

### Source-Grounded Audit vs. External Fact-Checking
A critical principle of Second Opinion is that **source-grounded claim auditing** is strictly distinct from **external fact-checking**:
1. **Source Grounding Invariant:**
   A claim is evaluated exclusively against the provided source passages.
   - If a claim is factually false in the outside world (e.g., *"Chamomile tea permanently cures metastatic lung cancer within 48 hours"* in `eval_038`), but the provided source document only discusses chamomile as a soothing herbal tea before bed, the verdict under source-grounded auditing is **`unsupported`**, **not** `contradicted`. The source text contains no facts addressing or refuting oncology.
   - Direct contradiction strictly requires an **explicit source counter-statement** or direct numerical/directional conflict (e.g. `eval_037` where the source explicitly warns *"Thalidomide is strictly contraindicated and prohibited during pregnancy"* against the claim that it is safe).
2. **Context and Population Divergence:**
   When a source document specifies a condition for a specific population or jurisdiction:
   - In `eval_039`, the clinical trial established safety and efficacy in *adult patients aged 18 to 65*, while the AI answer claimed efficacy in *pediatric patients under 12*. Under source-grounded policy, this is classified as **`inconclusive`** because pediatric endpoints were not studied.
   - In `eval_040`, the source specifies EU GDPR breach notification rules, while the AI answer claims California CCPA mandates the same rules. Under source-grounded policy, this is classified as **`unsupported`** under California law because the provided corpus only governs GDPR.
3. **Fixture Classification (Synthetic vs. Authoritative Real-World):**
   The 43 cases are split into two transparent categories:
   - **Synthetic Controlled Fixtures (9 cases):** Designed specifically to isolate boundary edge cases, conflicting multi-source reports, and unit collisions:
     - `eval_003`: Academic cohort size boundary (450 vs 4500).
     - `eval_006`: Split multicenter trials with contradictory clinical outcomes.
     - `eval_010`: Management guidance split between optimistic and conservative segments.
     - `eval_018`: Microservice architecture standards v1 vs v2 contradiction.
     - `eval_025`: Corporate policy handbook internal contradiction on remote work.
     - `eval_029`: National Renewable Laboratory contradictory solar cell stability reports.
     - `eval_041`: Quantity unit collision ($50 monthly fee vs. 50-day window vs. $500).
     - `eval_042`: Cross-source disagreement between Analyst Report Alpha and Beta.
     - `eval_043`: Irrelevant citation rejection (PostgreSQL write-ahead log vs two-phase commit).
   - **Authoritative Real-World Grounded Cases (34 cases):** Excerpts adapted directly from verified external regulatory standards, technical specifications, and clinical guidelines:
     - Clinical Pharmacology: FDA Metaproterenol monograph (`eval_001`), FDA Lisinopril package insert (`eval_004`), CDC/AAP infant botulism warnings (`eval_035`), FDA/EMA Thalidomide pregnancy contraindication (`eval_037`).
     - Regulatory Standards: GDPR Article 33 breach SLAs (`eval_019`), GDPR Article 17 erasure exemptions (`eval_020`), HIPAA Security Rule 45 CFR § 164.312 (`eval_021`), AICPA SOC 2 Type II audit examination periods (`eval_022`), ISO/IEC 27001 surveillance cycles (`eval_024`), FAA 14 CFR Part 107.51 drone altitude ceilings (`eval_033`).
     - Engineering & Systems: Raft consensus paper by Ongaro & Ousterhout (`eval_012`), Redis asynchronous replication specification (`eval_013`), PostgreSQL connection pool documentation (`eval_014`), Kubernetes pod eviction timeout (`eval_015`), SpaceX Falcon 9 User's Guide payload capacity (`eval_031`).
     - Financial Disclosures: SEC Form 10-Q operating expense filings (`eval_002`), GAAP cash and cash equivalents disclosures (`eval_009`), corporate 10-K headcount filings (`eval_011`).

---

## 4. Evaluation Commands

Run evaluation benchmarks using the project's virtual environment:

```bash
# Run deterministic rule-based evaluation (both isolated and end-to-end pipeline)
./services/api/.venv/bin/python3 evaluation/evaluate.py --mode deterministic

# Compare deterministic engine against mock double
./services/api/.venv/bin/python3 evaluation/evaluate.py --mode both

# Run standard backend pytest suite (35 passing tests including metric regressions)
PYTHONPATH=services/api ./services/api/.venv/bin/pytest services/api/tests -v

# Run frontend production build validation
cd apps/web && npm run build
```

---

## 5. Actual Evaluation Benchmark Results

Evaluating the full 76-claim benchmark with `./services/api/.venv/bin/python3 evaluation/evaluate.py --mode both`:

### Confusion Matrix (Deterministic Rule-Based Engine)
```
Actual         | suppo | contr | unsup | ambig | incon | Total
--------------------------------------------------------------
supported      | 31    | 0     | 0     | 0     | 0     | 31
contradicted   | 1     | 19    | 0     | 0     | 0     | 20
unsupported    | 2     | 1     | 8     | 0     | 2     | 13
ambiguous      | 0     | 0     | 0     | 6     | 0     | 6
inconclusive   | 1     | 0     | 2     | 0     | 3     | 6
--------------------------------------------------------------
Pred Total     | 35    | 20    | 10    | 6     | 5     | 76
```

### Classification Metrics with Exact Denominators
| Category | Precision | Recall | F1-Score | Support |
|:---|:---:|:---:|:---:|:---:|
| `supported` | **0.886** (31/35) | **1.000** (31/31) | **0.939** | 31 |
| `contradicted` | **0.950** (19/20) | **0.950** (19/20) | **0.950** | 20 |
| `unsupported` | **0.800** (8/10) | **0.615** (8/13) | **0.696** | 13 |
| `ambiguous` | **1.000** (6/6) | **1.000** (6/6) | **1.000** | 6 |
| `inconclusive` | **0.600** (3/5) | **0.500** (3/6) | **0.545** | 6 |
| **Macro Average** | **0.847** | **0.813** | **0.826** | **76** |
| **Micro Average (Accuracy)** | **0.882** (67/76) | **0.882** (67/76) | **0.882** | **67/76** |

### Supported Class Binary Breakdown (FPR Correction)
To accurately monitor verification safety, the `supported` class is evaluated as a binary one-vs-rest classifier:
- **True Positives (TP):** **31** (actual supported, predicted supported).
- **False Positives (FP):** **4** (actual non-supported, predicted supported: 1 from `contradicted`, 2 from `unsupported`, 1 from `inconclusive`).
- **False Negatives (FN):** **0** (actual supported, predicted non-supported).
- **True Negatives (TN):** **41** (actual non-supported, predicted non-supported: 19 contradicted, 11 unsupported, 6 ambiguous, 5 inconclusive).
- **Actual Positives (TP + FN):** **31**.
- **Actual Negatives (FP + TN):** **45**.

| Metric Name | Formula | Actual Value | Interpretation |
|:---|:---|:---:|:---|
| **Supported Precision** | $TP / (TP + FP)$ | **88.6%** (31/35) | Of all claims declared supported, 88.6% are truly supported. |
| **Supported Recall (TPR)** | $TP / (TP + FN)$ | **100.0%** (31/31) | All true supported claims were successfully identified. |
| **Supported False-Negative Rate (FNR)** | $FN / (TP + FN)$ | **0.0%** (0/31) | No truly supported claims were missed. |
| **Supported False-Positive Rate (FPR)** | $FP / (FP + TN)$ | **8.9%** (4/45) | **4 out of 45 non-supported claims** were incorrectly declared supported. |

> [!IMPORTANT]
> **Audit Correction on FPR:** Earlier benchmark reports stated a `0.0% (0/31)` false-positive rate. That calculation was mathematically the **False-Negative Rate** ($FN / (TP + FN) = 0/31$). The actual **False-Positive Rate** ($FP / (FP + TN)$) is **8.9% (4/45)** because 4 non-supported claims were predicted as supported by the deterministic rule engine.

### System Grounding & Integrity Metrics
| Metric | Result | Standard & Annotation Field Used |
|:---|:---:|:---|
| **Claim Offset Integrity** | **100.0%** (76/76) | Verified exact character slice `ai_answer[start:end] == claim_text`. |
| **Citation-ID Validity (Syntactic)** | **100.0%** (76/76) | Evaluates well-formedness: every cited ID exists in supplied chunks, and `unsupported` claims strictly cite `[]`. |
| **Evidence Support Acc. (Semantic)** | **90.8%** (69/76) | Evaluates grounding truth: checks whether cited IDs match the human-annotated `acceptable_evidence_ids` field. Prevents awarding credit for citing irrelevant chunks. |
| **Supported False-Positive Rate (FPR)** | **8.9%** (4/45) | Proportion of non-supported claims incorrectly classified as supported. |
| **Supported False-Negative Rate (FNR)** | **0.0%** (0/31) | Proportion of truly supported claims mistakenly rejected. |
| **Evidence Retrieval Recall@3** | **100.0%** (63/63) | Evaluated exclusively on claims with non-empty `acceptable_evidence_ids`. |
| **Retrieval MRR** | **1.000** (63.00/63) | Mean Reciprocal Rank against annotated `acceptable_evidence_ids`. |
| **Explanation Criteria Match** | **81.6%** (62/76) | Verifies explanation contains diagnostic keywords from `expected_explanation_criteria`. |

### Comparative Performance: Deterministic Rules vs. Neural NLI vs. Mock Double

#### Development Benchmark (76 Claims, 43 Cases)
| Provider | Macro F1 | Micro Accuracy | Supported FPR | Supported Precision | Contradiction Recall | Ambiguity F1 | Latency / Claim |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Deterministic Rules** | **0.826** | **88.2%** (67/76) | **8.9%** (4/45) | **88.6%** (31/35) | **95.0%** (19/20) | **1.000** | **< 0.2 ms** |
| **Neural NLI CrossEncoder** | **0.608** | **72.4%** (55/76) | **2.2%** (1/45) | **96.4%** (27/28) | **90.0%** (18/20) | **0.909** | **~27.1 ms** |
| **Mock Double** | **0.116** | **40.8%** (31/76) | **100.0%** (45/45) | **40.8%** (31/76) | **0.0%** (0/20) | **0.000** | **< 0.1 ms** |

#### Held-Out Generalization Benchmark (16 Claims, 10 Cases — `test_cases_heldout.jsonl`)
| Provider | Macro F1 | Micro Accuracy | Supported FPR | Supported Precision | Contradiction Recall | Ambiguity F1 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Deterministic Rules** | **0.350** | **50.0%** (8/16) | **40.0%** (4/10) | **60.0%** (6/10) | **0.0%** (0/4) | **1.000** |
| **Neural NLI CrossEncoder** | **0.420** | **56.2%** (9/16) | **10.0%** (1/10) | **83.3%** (5/6) | **75.0%** (3/4) | **0.667** |
| **Mock Double** | **0.109** | **37.5%** (6/16) | **100.0%** (10/10) | **37.5%** (6/16) | **0.0%** (0/4) | **0.000** |

---

## 6. Known Limitations & Realistic Evaluation Scope

1. **Trade-offs Between Rule-Based and Neural NLI Verification:**
   - **Development Set Overfitting:** The deterministic rule engine achieves high Macro F1 (`0.826`) on the 76-claim development set because specific polarity dictionaries and numerical patterns were developed around those fixtures.
   - **Out-of-Distribution Generalization:** When evaluated on unseen test fixtures (`test_cases_heldout.jsonl`), deterministic contradiction recall drops to `0.0% (0/4)` because unseen phrasing misses hardcoded regexes. The Neural NLI model (`cross-encoder/nli-deberta-v3-small`) successfully generalizes to unseen semantic contradictions (`75.0% (3/4)` recall) and reduces supported false-positive rate from `40.0%` down to `10.0%`.
2. **NLI Open-Domain Priors vs. Closed-Corpus Audits:**
   Pretrained NLI models trained on SNLI/MNLI sometimes interpret topical divergence or extreme factual incompatibility as a direct contradiction rather than a lack of evidence (`unsupported`). Threshold tuning and combining lexical retrieval scores are essential to prevent over-predicting contradiction when evidence is simply absent.
3. **Inference Latency Profile:**
   - Model loading: ~5.2–5.6 seconds on CPU (cached once per process).
   - Inference latency: ~27–44 ms per claim on Apple Silicon CPU (using batched sequence classification), compared to <0.2 ms for deterministic regexes.
4. **Controlled Retrieval vs. General Accuracy:**
   Across unit fixtures with 1–2 passages, retrieval Recall@3 is 100.0% by construction. This validates retrieval interface plumbing, but does not prove retrieval accuracy in multi-document enterprise knowledge bases.
