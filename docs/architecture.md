# Second Opinion — System Architecture

## 1. Overview & High-Level System Architecture

Second Opinion is an AI-powered verification platform designed to audit AI-generated answers against primary ground-truth source documents. The platform identifies hallucinations, factual contradictions, unsupported extrapolations, numerical errors, and unsafe recommendations.

```mermaid
graph TD
    User([User / Auditor])
    
    subgraph Frontend ["apps/web (Developer 1)"]
        UI[React + Vite Interface]
        UploadUI[Source File & Text Uploader]
        AnswerUI[Answer Input & Workspace]
        HighlightUI[Interactive Unicode Offset Highlighter]
        ClaimViewer[Claim & Verdict Cards]
        EvidenceView[Evidence Grounding Viewer]
        ReportModal[Audit Report Preview & Export]
    end

    subgraph Backend ["services/api (Developer 2)"]
        API[FastAPI Router & Lifecycle]
        DB[(SQLAlchemy / SQLite / PostgreSQL)]
        Orchestrator[Audit Orchestration Engine]
    end

    subgraph DocumentIntelligence ["Ingestion & Retrieval (Developer 3)"]
        Parser[PyMuPDF / Text Parser]
        Chunker[Offset-Preserving Chunker]
        BM25[BM25 Lexical Search]
        DenseRetriever[SentenceTransformers + FAISS]
        RRF[Hybrid Ranker / RRF]
    end

    subgraph VerificationEngine ["Verification & Safety (Developer 4)"]
        Extractor[Claim Extractor]
        NLI[Natural Language Inference / NLI]
        LLMVerifier[Evidence-Grounded Verifier]
        ConsistencyCheck[Deterministic Numerical Checker]
        SafetyGuard[Risk & Policy Guardrails]
    end

    User --> UI
    UI --> UploadUI
    UI --> AnswerUI
    UploadUI -->|POST /api/audits/{id}/sources| API
    AnswerUI -->|POST /api/audits/{id}/answer| API
    UI -->|POST /api/audits/{id}/analyze| Orchestrator

    API --> DB
    Orchestrator --> Parser
    Parser --> Chunker
    Chunker --> BM25
    Chunker --> DenseRetriever

    Orchestrator --> Extractor
    Extractor -->|Extracted Claims| RRF
    BM25 & DenseRetriever --> RRF
    RRF -->|Top Evidence Passages| NLI
    RRF --> LLMVerifier
    
    Orchestrator --> ConsistencyCheck
    Orchestrator --> SafetyGuard

    NLI & LLMVerifier --> Orchestrator
    ConsistencyCheck & SafetyGuard --> Orchestrator
    Orchestrator -->|Compiled AuditResponse| DB
    DB --> UI
    
    UI --> HighlightUI
    UI --> ClaimViewer
    UI --> EvidenceView
    UI --> ReportModal
```

---

## 2. Component Breakdown

### 2.1 Frontend (`apps/web/`) — Developer 1
- **React 18 + TypeScript + Vite**: Fast SPA rendering with strict typing.
- **Tailwind CSS**: Dark-mode aesthetic with custom verdict color systems:
  - Supported: `#10b981` (Emerald)
  - Contradicted: `#ef4444` (Rose/Red)
  - Unsupported: `#f59e0b` (Amber)
  - Ambiguous: `#8b5cf6` (Purple)
  - Inconclusive: `#64748b` (Slate)
- **Interactive Character Offset Highlighter**: Splices the raw `original_answer` text using Unicode offsets `[start_offset:end_offset]`, enabling interactive claim inspection without desynchronization.
- **Evidence Card Viewer**: Provides click-through citations to source sections.

### 2.2 Backend & Data Persistence (`services/api/`) — Developer 2
- **FastAPI**: Asynchronous HTTP framework providing automated OpenAPI documentation and validation.
- **SQLAlchemy 2.0 ORM**: Manages `AuditModel` and `SourceModel`. Defaults to SQLite for local development; fully compatible with PostgreSQL via `DATABASE_URL`.
- **Validation**: Strict Pydantic models ensuring data integrity across frontend and backend boundaries.

### 2.3 Document Intelligence & Retrieval — Developer 3
- **Ingestion (`app/ingestion/`)**: Extracts clean text from `.pdf`, `.txt`, and `.md` files using `PyMuPDF` (`fitz`), preserving page and section citations.
- **Chunking**: Passages chunked with sentence boundary awareness and character offset tracking.
- **Hybrid Retrieval (`app/retrieval/`)**:
  - Lexical Layer: BM25 index for exact terms, names, and numerical tokens.
  - Dense Semantic Layer: SentenceTransformers (`all-MiniLM-L6-v2`) with FAISS vector similarity.
  - Hybrid Fusion: Reciprocal Rank Fusion (RRF) to merge keyword and semantic rankings.

### 2.4 Verification, Consistency & Safety — Developer 4
- **Claim Extraction (`app/extraction/`)**: Decomposes answers into atomic assertions while maintaining exact character offsets.
- **Verification Engine (`app/verification/`)**:
  - Phase 1: High-fidelity mock verification generator adhering strictly to the contract.
  - Phase 2: DeBERTa-v3 cross-encoder NLI and calibrated LLM reasoning.
- **Consistency Engine (`app/consistency/`)**: Rule-based regex/AST logic detecting numerical calculation errors and temporal contradictions.
- **Safety Engine (`app/safety/`)**: Identifies hazardous advice, prescription medication risks, and missing professional disclaimers.

---

## 3. Latency vs. Accuracy Trade-Offs

| Pipeline Stage | Fast Baseline | High-Accuracy Production | Trade-off Rationale |
|---|---|---|---|
| **Parsing** | Direct text extraction | Layout-aware OCR | Scanned PDFs require OCR; text PDFs process in < 15ms |
| **Retrieval** | BM25 only | Hybrid (BM25 + FAISS + Cross-Encoder) | Hybrid captures semantic synonyms but adds ~80ms |
| **Claim Extraction** | Sentence boundary regex | Structured JSON LLM decomposition | Regex runs in < 2ms; LLM decomposes compound claims |
| **Verification** | Mock / DeBERTa NLI | Calibrated LLM with CoT + Self-Consistency | NLI is ~50ms per claim; LLM CoT is ~800ms per claim |

---

## 4. Security & Data Protection
- **File Validation**: Strict file type (`pdf, txt, md`) and size (10 MB) limits prevent resource exhaustion and arbitrary code execution.
- **No External Data Leakage**: Source documents and answers stay strictly within local/configured boundaries.
- **Secrets Management**: Provider API keys configured strictly via environment variables, never committed to git.
