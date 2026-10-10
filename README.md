# Second Opinion — AI Answer Verification Platform

> An automated auditing and evidence-grounded verification platform that evaluates AI-generated answers against primary source documents, detecting hallucinations, contradictions, numerical errors, and safety risks.

[![Backend Tests](https://img.shields.io/badge/backend%20tests-passing-emerald.svg)](#13-testing-and-build-commands)
[![Frontend Build](https://img.shields.io/badge/frontend%20build-passing-emerald.svg)](#13-testing-and-build-commands)
[![Python Version](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://www.python.org/)
[![Node Version](https://img.shields.io/badge/node-20%2B-green.svg)](https://nodejs.org/)
[![Architecture](https://img.shields.io/badge/architecture-modular%20monorepo-indigo.svg)](docs/architecture.md)

---

## 1. Project Title & Short Description

**Second Opinion** is a full-stack AI audit system developed for the college round competition. It solves the critical problem of LLM unreliability in high-stakes domains (clinical healthcare, legal compliance, financial reporting, and engineering specifications) by decomposing AI-generated text into discrete factual claims, retrieving relevant source passages, and producing evidence-backed verification verdicts with calibrated uncertainty.

---

## 2. Problem Statement & Motivation

Generative AI models and Large Language Models (LLMs) frequently hallucinate facts, generate subtle contradictions, make basic numerical calculation errors, and give unsafe recommendations with misleading confidence. In professional domains, relying on unverified LLM answers can result in regulatory penalties, financial losses, or clinical hazards.

Current RAG (Retrieval-Augmented Generation) systems lack transparent verification:
- Users cannot easily verify if a specific sentence is true or fabricated.
- LLMs often contradict the very context documents they were provided.
- Binary "True/False" judgments fail to capture ambiguous statements, partial truths, or missing evidence.

**Second Opinion** provides an objective, transparent, and evidence-grounded audit trail for any AI answer.

---

## 3. Key Features (CRCE Problem Statement Alignment)

1. **Atomic Claim Decomposition**: Automatically parses complex, compound AI answers into atomic factual claims while preserving exact Unicode character offsets `[start_offset:end_offset]`.
2. **Multi-Category Evidence Verdicts**: Categorizes each claim into one of five distinct categories:
   - `supported`: Directly corroborated by primary source text.
   - `contradicted`: Directly refuted by verified source facts.
   - `unsupported`: Extrapolations or assertions absent from the evidence base.
   - `ambiguous`: Statements with multiple conflicting interpretations.
   - `inconclusive`: Evidence is tangentially relevant but insufficient.
3. **Interactive Answer Offset Highlighter**: Visualizes verdicts directly within the original AI answer text using color-coded spans anchored to character positions.
4. **Primary Source Grounding & Citation**: Links every verdict to specific source documents, page numbers, and exact text excerpts.
5. **Deterministic Consistency & Numerical Validation**: Detects arithmetic errors, percentage discrepancies, and internal self-contradictions.
6. **Safety & Liability Guardrails**: Flags high-risk advice (e.g., unauthorized drug dosages, financial guarantees) as independent risk warnings rather than conflating safety with factual truth.
7. **Comprehensive Audit Reporting**: Compiles executive summaries, trust scores (0–100), risk levels, and exportable markdown audit reports.

---

## 4. Proposed Solution & User Workflow

```
[1. Create Audit Session] ──> [2. Attach Sources (.pdf, .txt, .md)] ──> [3. Submit AI Answer]
                                                                                │
                                                                                ▼
[6. Export Audit Report] <── [5. Inspect Interactive Findings] <── [4. Execute Audit Analysis]
                             - Verdicts & Confidence Pills           - Claim extraction
                             - Exact Unicode Highlight Spans         - Hybrid evidence retrieval
                             - Ground-truth Citations                - Verdict classification
                             - Numerical & Safety Advisories         - Trust score calculation
```

1. **Create an Audit Session**: Initialize an isolated audit workspace.
2. **Add Primary Source Materials**: Upload PDF manuals, reports, or text guidelines via drag-and-drop or direct text paste.
3. **Submit the AI Answer**: Input the LLM-generated response under investigation.
4. **Run Verification**: Execute the auditing pipeline (or simulated mock harness during initial milestones).
5. **Inspect Findings**: Review claim breakdowns, click highlighted text spans to jump to corresponding citations, and view safety warnings.
6. **Preview & Export**: Inspect the formal audit report and export as Markdown.

---

## 5. System Architecture

```mermaid
graph LR
    subgraph Frontend ["apps/web (Developer 1)"]
        UI[React 18 + Vite]
        Highlighter[Unicode Offset Highlighter]
        ClaimViewer[Claim & Evidence Viewer]
    end

    subgraph Backend ["services/api (Developer 2)"]
        API[FastAPI REST API]
        DB[(SQLite / PostgreSQL)]
        Orchestrator[Audit Orchestrator]
    end

    subgraph DocIntel ["app/ingestion & retrieval (Developer 3)"]
        PyMuPDF[Document Parser]
        BM25[BM25 Lexical Search]
        Dense[SentenceTransformers / FAISS]
    end

    subgraph Verification ["app/verification & safety (Developer 4)"]
        Extractor[Claim Extractor]
        NLI[NLI Verifier / Mock Engine]
        Consistency[Numerical Checker]
        Safety[Safety Guardrails]
    end

    UI -->|API Requests| API
    API --> DB
    API --> Orchestrator
    Orchestrator --> PyMuPDF
    Orchestrator --> BM25
    Orchestrator --> Dense
    Orchestrator --> Extractor
    Orchestrator --> NLI
    Orchestrator --> Consistency
    Orchestrator --> Safety
    Orchestrator -->|Structured AuditResponse| DB
    DB --> UI
    UI --> Highlighter
    UI --> ClaimViewer
```

Detailed architecture specifications are available in [docs/architecture.md](docs/architecture.md).

---

## 6. Technology Stack & Component Responsibilities

| Tier | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | Fast, responsive single-page application with strict type safety. |
| **Styling** | Tailwind CSS | Sleek dark-mode aesthetic with custom verdict color palettes. |
| **Icons** | Lucide React | High-clarity system iconography. |
| **Backend API** | Python 3.11+, FastAPI | Asynchronous high-performance REST endpoints with automated OpenAPI docs. |
| **Data Validation**| Pydantic v2 | Strict request/response validation matching shared contract. |
| **Database** | SQLAlchemy 2.0 | ORM supporting SQLite (zero-config local dev) and PostgreSQL (production). |
| **Document Ingestion**| PyMuPDF (`fitz`) | High-speed PDF text parsing with page-level metadata tracking. |
| **Retrieval (Planned)**| BM25 & SentenceTransformers | Hybrid lexical + dense vector evidence retrieval. |
| **Testing** | Pytest, Vite Build / TSC | Comprehensive unit, integration, and type checks. |
| **Containerization**| Docker & Docker Compose | Multi-container reproducible development and deployment. |

---

## 7. Repository Structure & Four-Developer Ownership

```
second-opinion/
├── apps/
│   └── web/                                # [DEVELOPER 1] Frontend Application
│       ├── src/
│       │   ├── components/                 # Shared UI components (Navbar, VerdictBadge)
│       │   ├── features/
│       │   │   ├── audit/                  # Audit inputs, summary card, trust score
│       │   │   ├── claims/                 # Answer highlighter, claim cards, filter list
│       │   │   ├── evidence/               # Evidence excerpt citations & relevance scores
│       │   │   ├── reports/                # Report preview modal & markdown export
│       │   │   └── sources/                # File uploader (PDF/TXT/MD) & text paste
│       │   ├── mocks/                      # Sample demo cases & offline mock fallbacks
│       │   ├── services/                   # Backend API client with graceful fallbacks
│       │   ├── types/                      # Shared contract TypeScript definitions
│       │   ├── App.tsx                     # Main interactive application
│       │   ├── index.css                   # Tailwind styling
│       │   └── main.tsx                    # Vite entrypoint
│       ├── package.json
│       ├── tailwind.config.js
│       └── vite.config.ts
├── services/
│   └── api/                                # [DEVELOPER 2] Backend & API Integration
│       ├── app/
│       │   ├── api/                        # REST endpoints (health, audits)
│       │   ├── core/                       # Settings & configuration (pydantic-settings)
│       │   ├── database/                   # SQLAlchemy engine, session, Base
│       │   ├── models/                     # Database models (AuditModel, SourceModel)
│       │   ├── schemas/                    # Pydantic models (Shared Data Contract)
│       │   ├── ingestion/                  # [DEVELOPER 3] Document parsing & chunking
│       │   ├── extraction/                 # [DEVELOPER 3] Claim extraction & offset logic
│       │   ├── retrieval/                  # [DEVELOPER 3] BM25 & vector retrieval
│       │   ├── verification/               # [DEVELOPER 4] Claim verification & mock engine
│       │   ├── consistency/                # [DEVELOPER 4] Numerical & logic checkers
│       │   ├── safety/                     # [DEVELOPER 4] Safety guardrails & policy flags
│       │   ├── reporting/                  # Audit markdown report generation
│       │   └── main.py                     # FastAPI application entrypoint
│       ├── tests/                          # Pytest integration tests
│       ├── pyproject.toml
│       └── requirements.txt
├── evaluation/                             # [DEVELOPER 4] Benchmarks & Test Cases
│   ├── datasets/                           # Multi-domain raw evaluation corpora
│   ├── annotations/                        # Ground-truth annotations
│   ├── test_cases.jsonl                    # Curated benchmark test cases
│   ├── evaluate.py                         # Evaluation runner CLI
│   └── README.md
├── docs/                                   # Architectural & Contract Documentation
│   ├── architecture.md                     # System architecture & latency trade-offs
│   ├── api-contract.md                     # Shared API specifications & schema contracts
│   ├── evaluation-plan.md                  # Metrics, targets, and evaluation strategy
│   └── development-workflow.md             # 4-developer Git branch & PR guidelines
├── .env.example                            # Configuration environment template
├── .gitignore                              # Git exclusion rules
├── docker-compose.yml                      # Local multi-service orchestrator
└── README.md                               # Project documentation
```

### Module Ownership Matrix
- **Developer 1 (Frontend):** Owns `apps/web/`. Responsible for UI layout, claim highlighting, evidence viewer, and report modal.
- **Developer 2 (Backend & Integration):** Owns `services/api/app/` (API routes, database models, lifecycle orchestration, reporting).
- **Developer 3 (Document Intelligence & Retrieval):** Owns `services/api/app/ingestion/`, `services/api/app/extraction/`, and `services/api/app/retrieval/`.
- **Developer 4 (Verification & Evaluation):** Owns `services/api/app/verification/`, `services/api/app/consistency/`, `services/api/app/safety/`, and `evaluation/`.

---

## 8. Prerequisites & Local Setup

### System Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Python**: 3.11 or higher
- **npm**: 9.0.0 or higher
- **Docker & Docker Compose** (Optional, for containerized run)

### Cloning the Repository
```bash
git clone https://github.com/arnavpotale/LowLatency_college_round.git second-opinion
cd second-opinion
cp .env.example .env
```

---

## 9. Environment Variable Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Default Value | Description |
|---|---|---|
| `APP_ENV` | `development` | Environment mode (`development`, `production`). |
| `PORT` | `8000` | Port for FastAPI backend service. |
| `HOST` | `0.0.0.0` | Host bind address. |
| `DATABASE_URL` | `sqlite:///./second_opinion.db` | Database connection string. Use SQLite for instant setup; PostgreSQL for production. |
| `UPLOAD_DIR` | `./uploads` | Directory for temporarily stored source documents. |
| `MAX_UPLOAD_SIZE_BYTES` | `10485760` (10MB) | Maximum file size allowed for source uploads. |
| `ENABLE_MOCK_VERIFICATION` | `true` | When true, returns structured mock verification results adhering strictly to the schema. |
| `VITE_API_URL` | `http://localhost:8000/api` | API URL for frontend client. |
| `OPENAI_API_KEY` | *(Empty)* | Optional: Required when activating LLM-based verification in Phase 2. Obtain at [platform.openai.com](https://platform.openai.com). |
| `ANTHROPIC_API_KEY` | *(Empty)* | Optional: Anthropic API key. Obtain at [console.anthropic.com](https://console.anthropic.com). |
| `HUGGINGFACE_API_KEY` | *(Empty)* | Optional: For hosted Hugging Face inference models. Obtain at [huggingface.co](https://huggingface.co). |

---

## 10. Frontend and Backend Run Commands

### Backend Service (Terminal 1)
```bash
cd services/api

# 1. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Base: [http://localhost:8000](http://localhost:8000)
- Swagger OpenAPI Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Frontend Web Application (Terminal 2)
```bash
cd apps/web

# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

### Running with Docker Compose
```bash
docker compose up --build
```
This launches the FastAPI backend on port 8000 and the Vite frontend on port 5173 simultaneously.

---

## 11. Database & Persistence Instructions

Second Opinion uses SQLAlchemy 2.0 with automatic table initialization on application startup.

### SQLite (Default)
No additional installation required. The database file `second_opinion.db` will be created automatically in `services/api/` on server boot.

### PostgreSQL (Optional)
To use PostgreSQL:
1. Update `DATABASE_URL` in `.env`:
   ```bash
   DATABASE_URL=postgresql+psycopg2://postgres:postgrespassword@localhost:5432/second_opinion
   ```
2. Start the PostgreSQL container via Docker Compose:
   ```bash
   docker compose --profile full-stack up -d postgres
   ```

---

## 12. API Endpoints & Contract Examples

Full contract specifications are in [docs/api-contract.md](docs/api-contract.md).

### 12.1 Health Check
`GET /api/health`
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "timestamp": "2026-10-10T09:15:00Z",
  "database": "connected",
  "mock_verification_enabled": true
}
```

### 12.2 Create Audit Session
`POST /api/audits`
```json
// Request Body
{
  "title": "Clinical Dosage Audit",
  "notes": "Testing against prescribing guidelines"
}
```

### 12.3 Attach Source Document
`POST /api/audits/{audit_id}/sources`
- Form/Multipart: `file` (.pdf, .txt, .md) OR `text_title` and `text_content`.

### 12.4 Submit AI Answer
`POST /api/audits/{audit_id}/answer`
```json
{
  "original_answer": "Metaproterenol should be taken at 100mg twice daily with meals. It has no contraindications with beta-blockers."
}
```

### 12.5 Analyze Audit
`POST /api/audits/{audit_id}/analyze`
```json
{
  "audit_id": "aud_01j7b9...",
  "status": "completed",
  "title": "Clinical Dosage Audit",
  "original_answer": "Metaproterenol should be taken at 100mg twice daily with meals. It has no contraindications with beta-blockers.",
  "is_mock": true,
  "claims": [
    {
      "claim_id": "claim_01",
      "claim_text": "Metaproterenol should be taken at 100mg twice daily with meals.",
      "start_offset": 0,
      "end_offset": 62,
      "verdict": "contradicted",
      "explanation": "Direct conflict: Source protocol specifies maximum safe daily dosage is 50mg.",
      "confidence": 0.98,
      "evidence_ids": ["ev_01"]
    }
  ],
  "evidence": [
    {
      "evidence_id": "ev_01",
      "source_id": "src_01",
      "source_name": "prescribing_information.txt",
      "text": "Maximum safe daily dosage is 50mg under cardiac supervision.",
      "page_or_section": "Section 2.3",
      "relevance_score": 0.96
    }
  ],
  "verdicts": {
    "supported": 0,
    "contradicted": 1,
    "unsupported": 0,
    "ambiguous": 0,
    "inconclusive": 0
  },
  "summary": {
    "total_claims": 1,
    "supported_claims": 0,
    "contradicted_claims": 1,
    "unsupported_claims": 0,
    "ambiguous_claims": 0,
    "inconclusive_claims": 0,
    "trust_score": 0.0,
    "risk_level": "high",
    "key_takeaway": "Critical contradictions identified in medication dosage."
  }
}
```

---

## 13. Testing and Build Commands

### Backend Automated Tests
```bash
# From workspace root:
PYTHONPATH=services/api ./services/api/.venv/bin/pytest services/api/tests -v

# Or from inside services/api:
cd services/api
pytest tests/ -v
```
**Test Coverage Includes:**
- System health & root endpoints (`test_health.py`)
- Full audit session lifecycle (`test_audits.py`)
- Source upload validation (file size and format checks)
- Character offset slice integrity checks
- Error handling for missing inputs and unsupported extensions

### Frontend Build & Typechecking
```bash
cd apps/web
npm run build
```
Executes TypeScript compilation (`tsc`) and Vite production bundle optimization.

### Evaluation Benchmark Harness
```bash
python3 evaluation/evaluate.py
```
Validates the benchmark test dataset, claim coverage, and baseline evaluation metrics.

---

## 14. Development Branch and Pull-Request Workflow

We follow a structured Git feature branch workflow:

1. **Main Branches**:
   - `main`: Production-ready, verified releases.
   - `dev`: Primary integration branch.
2. **Feature Branches**:
   - Developers branch off `dev`: `feature/<dev-id>-<feature-name>`
   - Example: `feature/dev3-faiss-retriever`
3. **Pull Request Protocol**:
   - Target branch: `dev`.
   - Requires PR approval from the corresponding module owner.
   - All tests (`pytest` and `npm run build`) must pass before merge.
   - Review complete workflow guidelines in [docs/development-workflow.md](docs/development-workflow.md).

---

## 15. AI/ML Feature Roadmap

### Phase 1: Foundation Skeleton & Shared Contract (Current Status: ✅ Complete)
- [x] Full-stack modular monorepo structure with 4-developer ownership boundaries.
- [x] Shared Pydantic models & TypeScript contracts with exact Unicode character offsets.
- [x] FastAPI REST endpoints (health, audits, source uploads, answer submissions, mock analysis).
- [x] React 18 + Tailwind UI with interactive character offset highlighting.
- [x] Source document ingestion interface (PDF, TXT, MD) and file validation.
- [x] Benchmark dataset schema and evaluation runner CLI.
- [x] Unit and integration test suite passing.

### Phase 2: Document Intelligence & Hybrid Retrieval (Milestone 2)
- [ ] PyMuPDF OCR integration for scanned PDFs and multi-column tables.
- [ ] BM25 lexical retriever with domain stop-word filtering.
- [ ] Dense embeddings via SentenceTransformers (`all-MiniLM-L6-v2`) with FAISS indexing.
- [ ] Reciprocal Rank Fusion (RRF) for lexical + semantic evidence ranking.

### Phase 3: Real AI Verification & Uncertainty Calibration (Milestone 3)
- [ ] LLM structured output claim extractor (Pydantic function calling).
- [ ] Natural Language Inference (NLI) classifier (DeBERTa-v3 MNLI).
- [ ] Evidence-grounded chain-of-thought (CoT) LLM verifier.
- [ ] Conformal prediction and temperature-scaled uncertainty calibration.
- [ ] Python AST and regex deterministic numerical checker.

### Phase 4: Production Polish & Export (Milestone 4)
- [ ] PDF audit report generation via WeasyPrint / ReportLab.
- [ ] Real-time verification streaming via Server-Sent Events (SSE).
- [ ] Batch audit evaluation for large corporate document repositories.

---

## 16. Security Considerations, Known Limitations & Implementation Status

### Current Implementation Status
- **Implemented & Runnable:** Complete full-stack web and API skeleton, database persistence, upload handling, interactive UI workspace, offset text highlighter, and test suite.
- **Simulation/Mock Mode:** The verification analysis endpoint `/api/audits/{id}/analyze` currently returns realistic, clearly labeled mock findings (`is_mock=True`) conforming to the final planned response schema.
- **Planned:** Live neural NLI models and external LLM verification pipelines will be connected in Phase 2 and 3.

### Security Controls
- **File Validation:** Strict whitelist of extensions (`.pdf`, `.txt`, `.md`) and a 10MB file size limit to prevent Denial-of-Service and execution of arbitrary code.
- **No Hardcoded Credentials:** Provider API keys are configured strictly through environment variables.
- **Data Isolation:** User source documents are processed in local memory / scoped storage without telemetry leakage.

### Known Limitations (Phase 1)
- Scanned PDF documents without embedded text layers require OCR (planned in Phase 2).
- Large documents (> 100 pages) require background worker queues (Celery / Redis) for non-blocking processing.

---

## 17. References & Related Repositories

During subsequent phases of the project, we plan to study and adapt proven patterns from these research initiatives:

1. **FEVER (Fact Extraction and VERification)**: [fever.ai](https://fever.ai/) — Benchmark methodology for claim extraction and 3-class evidence grounding.
2. **RAG-Truth**: Research benchmark analyzing hallucination patterns in retrieval-augmented generation across multiple domains.
3. **MiniCheck / Bespoke-Minicheck**: Lightweight NLI models optimized for high-speed factual consistency checking.
4. **LangChain / LlamaIndex Evaluators**: Reference implementations for grounding evaluation and factual faithfulness metrics.
5. **Sentence-Transformers & FAISS**: [sbert.net](https://www.sbert.net/) & [faiss.ai](https://faiss.ai/) — Dense embedding retrieval architecture.

---

*Second Opinion — Developed for College Round AI/ML Competition*