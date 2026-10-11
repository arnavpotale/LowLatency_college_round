# Second Opinion — Five-Minute Presentation & Demonstration Script

> **Competition / Evaluation Presentation**  
> **Target Duration:** 5 Minutes (300 seconds)  
> **Platform:** Second Opinion — AI Answer Verification Platform  
> **Presenter:** Project Lead / Engineering Team  

---

## Presentation Overview & Timeline

| Timestamp | Phase | Topic | Key Visual / Action |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:45** | **The Problem** | The LLM Reliability & Hallucination Crisis | Problem Statement & Industry Risks |
| **0:45 – 1:45** | **Architecture** | End-to-End Auditing Pipeline | System Architecture & Monorepo Design |
| **1:45 – 3:15** | **Live Demo** | Verification Workflow & Split Workspace | Metaproterenol Clinical & Acme Case Studies |
| **3:15 – 4:00** | **Trust Score** | Normalized Scoring & Forensic Diagnostics | 5-Category Verdicts, Autopsy & Conflict Map |
| **4:00 – 4:30** | **Stress Testing** | Adversarial Benchmark Lab & Multi-Format Reports | 10 Adversarial Edge Cases, PDF/DOCX/MD Export |
| **4:30 – 5:00** | **Conclusion** | Quality Assurance, Metrics & Q&A | 158 Backend Tests, 26 Web Tests, Production Build |

---

## Speaker Script & Step-by-Step Walkthrough

### Part 1: The Problem — The LLM Reliability Crisis (0:00 – 0:45)
* **Screen:** Dashboard (`/#/`) — Clean Light or Dark Theme
* **Spoken Script:**
  > "Good morning, judges and colleagues.
  > 
  > Large Language Models are increasingly deployed to answer critical queries in healthcare, finance, legal compliance, and engineering. But LLMs suffer from a fatal flaw: they hallucinate, invert numerical data, contradict their own reference materials, and output dangerous advice with deceptive fluency and 99% self-reported confidence.
  > 
  > Standard RAG and chat interfaces only give users a single text block. When an AI answer is wrong, the user cannot see which specific sentence is fabricated, where the factual conflict lies, or whether the source text was ever actually consulted.
  > 
  > We built **Second Opinion** to solve this. Second Opinion is an automated, evidence-grounded audit and forensic verification platform. It doesn't generate conversational filler — it audits another AI's output down to the exact sentence and character offset."

---

### Part 2: Architecture & Verification Pipeline (0:45 – 1:45)
* **Screen:** Settings & System Diagnostics (`/#/settings`) or Architecture Overview
* **Spoken Script:**
  > "Under the hood, Second Opinion is engineered as a high-performance, modular monorepo:
  > 
  > 1. **Ingestion & In-Memory Indexing**: Supports PDF (via PyMuPDF), DOCX, TXT, and Markdown documents. Documents are chunked using sentence-boundary sliding windows and indexed with a hybrid BM25 lexical retriever combined with dense neural semantic embeddings.
  > 2. **Atomic Claim Decomposition**: Answers are decomposed into atomic, independently verifiable assertions while strictly preserving exact Unicode character offsets `[start:end]` to guarantee byte-for-byte highlight fidelity even across emojis and multibyte sequences.
  > 3. **Verification & Multi-Passage Reasoning**: Our verification engine tests candidate evidence passages against each atomic claim using deterministic logical rule evaluation, directional polarity validation, numerical mismatch detection, and CrossEncoder NLI inference.
  > 4. **Five-Category Verdict System**: Rather than crude binary true/false, we classify claims into: `Supported`, `Contradicted`, `Unsupported`, `Ambiguous`, and `Inconclusive`.
  > 
  > Let's see this in action."

---

### Part 3: Live Demonstration — Clinical & Workplace Case Studies (1:45 – 3:15)
* **Screen:** Investigation Workspace (`/#/audits/72e64a77-3820-4945-9079-99d62a2c6df1/investigate` or clicking **Explore Demo Case**)
* **Spoken Script:**
  > "Here is our **Investigation Workspace**, featuring a cohesive, research-grade design system supporting instant Light, Dark, and System modes.
  > 
  > On the left, you see the submitted AI answer. Notice the interactive sentence spans highlighted according to their verification verdict:
  > - **Claim #1**: The AI claims *'The recommended dosage for Metaproterenol in adult patients is 100mg twice daily with meals.'*
  > - When we click this claim, the right panel instantly locks onto **Claim Dossier #1**: It is classified as **Contradicted** with 95% confidence.
  > - Our **Forensic Claim Autopsy** diagnoses this as a hazardous *quantity mismatch*: The primary protocol strictly mandates an initial dosage of 20mg tid, with daily administration never exceeding 50mg. The AI's claim is an alarming 400% dosage inflation!
  > 
  > Notice the bidirectional citation linking: clicking the evidence passage immediately highlights the exact line in Section 2.3 of the protocol text.
  > 
  > Next, inspect **Claim #3**: The AI claimed the drug *'possesses zero contraindications with common beta-blockers'*. Our engine flags this as a **Polarity Negation**: Section 4.1 explicitly warns it is strictly contraindicated due to hypertensive crisis risks."

---

### Part 4: Normalized Trust Score & Human-in-the-Loop Governance (3:15 – 4:00)
* **Screen:** Audit Overview (`/#/audits/3e705c9f-1d6a-41bc-8777-3f31e6c0a2cb/overview` — Acme Leave Policy)
* **Spoken Script:**
  > "Let's examine how Second Opinion quantifies risk.
  > 
  > Here is a complex audit of a company leave policy with 12 extracted claims:
  > - 4 claims are **Supported**
  > - 4 claims are **Contradicted**
  > - 0 claims are **Unsupported**
  > - 4 claims are non-decisive (**Ambiguous** or **Inconclusive**)
  > 
  > Instead of arbitrary heuristic penalties that produce negative totals and misleading zeroes, Second Opinion implements a mathematically rigorous, normalized metric:
  > 
  > $$\text{Trust Score} = \frac{\text{Supported}}{\text{Supported} + \text{Contradicted} + \text{Unsupported}} \times 100$$
  > 
  > For this audit, 4 supported out of 8 decisive assertions yields an exact **50% Trust Score**, clearly displayed alongside the coverage badge showing *'8 decisive claims evaluated'*. If an audit contains only exploratory, ambiguous claims, the system transparently indicates **N/A** rather than a false 0%.
  > 
  > Furthermore, we support **Human-in-the-Loop Governance**: through the Human Review drawer, compliance officers can attach audit notes and record formal verdict overrides without mutating the underlying machine audit trail."

---

### Part 5: Adversarial Lab & Multi-Format Enterprise Reporting (4:00 – 4:30)
* **Screen:** Adversarial Lab (`/#/adversarial-lab`) & Export Report Modal (`/#/reports`)
* **Spoken Script:**
  > "To ensure the engine cannot be easily fooled, we built the **Adversarial Stress Test Lab**. It runs 10 curated benchmark edge cases testing:
  > - Negation trapping
  > - Temporal drift and outdated facts
  > - Numerical unit mismatches
  > - False entailment and cross-document contradictions
  > 
  > Finally, enterprise compliance requires audit trails. Clicking **Export Report** provides one-click generation of:
  > - Formal **Markdown** reports with embedded citations
  > - Standard **TXT** files for terminal ingestion
  > - Executive and detailed **DOCX** documents with sanitized tables
  > - Publication-ready **PDF** regulatory artifacts."

---

### Part 6: Engineering Rigor & Closing (4:30 – 5:00)
* **Screen:** Dashboard / GitHub Repository
* **Spoken Script:**
  > "In summary, Second Opinion is not a mockup or a wrapper. It is a fully verified, production-grade platform:
  > 
  > - **Backend Test Suite**: 158 automated pytest tests covering ingestion, retrieval, rules, scoring, and adversarial edge cases passing with 100% success.
  > - **Frontend Test Suite**: 26 domain logic tests verifying Unicode offset slicing, claim navigation, and trust score normalization.
  > - **Zero-error production build** verified via TypeScript and Vite.
  > - **Restrained, accessible design system** with full Light, Dark, and OS System preference support.
  > 
  > Second Opinion transforms AI verification from a black box into a transparent, reproducible, and verifiable science.
  > 
  > Thank you! We welcome any questions from the judges."

---

## Presenter Quick Checklist & Rehearsal Notes

1. **Before Starting:**
   - Ensure backend is active on `http://127.0.0.1:8000` (`curl http://127.0.0.1:8000/api/health` returns `healthy`).
   - Ensure frontend is active on `http://127.0.0.1:5173`.
   - Set browser zoom to comfortable reading scale (100% or 110%).
2. **Demo URLs to Bookmark:**
   - Dashboard: `http://127.0.0.1:5173/#/`
   - Clinical Investigation Workspace: `http://127.0.0.1:5173/#/audits/72e64a77-3820-4945-9079-99d62a2c6df1/investigate`
   - 50% Acme Audit Overview: `http://127.0.0.1:5173/#/audits/3e705c9f-1d6a-41bc-8777-3f31e6c0a2cb/overview`
   - Adversarial Benchmark Lab: `http://127.0.0.1:5173/#/adversarial-lab`
   - All Audits: `http://127.0.0.1:5173/#/audits`
3. **Key Talking Points if Judges Ask Questions:**
   - *Q: Why 5 verdict categories?* A: Binary classification hides missing evidence. Categorizing unsupported claims separately from direct contradictions allows distinguishing between hallucinations and factual falsehoods.
   - *Q: Why exclude ambiguous claims from trust score denominator?* A: Ambiguous claims reflect incomplete or conflicting source material; penalizing or rewarding them distorts the reliability of decisively corroborated facts.
