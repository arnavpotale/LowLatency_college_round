# Second Opinion — Development & Collaboration Workflow

## 1. Four-Developer Module Boundaries & Ownership

To ensure parallel development velocity without merge conflicts:

| Role | Module Scope | Core Responsibilities |
|---|---|---|
| **Developer 1 (Frontend)** | `apps/web/` | React UI, Tailwind styles, claim highlighter, evidence viewer, report preview, UX state. |
| **Developer 2 (Backend & Integration)** | `services/api/app/api/`, `app/models/`, `app/database/`, `app/core/`, `app/reporting/` | FastAPI orchestration, SQLAlchemy persistence, health check, shared contract enforcement. |
| **Developer 3 (Document Intelligence)** | `services/api/app/ingestion/`, `services/api/app/extraction/`, `services/api/app/retrieval/` | Document parsing (PDF/TXT/MD), chunking, BM25 keyword search, FAISS dense embeddings. |
| **Developer 4 (Verification & Evaluation)** | `services/api/app/verification/`, `app/consistency/`, `app/safety/`, `evaluation/` | NLI classification, LLM verifier, numerical checkers, safety guardrails, test benchmark harness. |

---

## 2. Git Branching Strategy

```
main (stable releases)
  └── dev (integration branch)
        ├── feature/dev1-evidence-highlighting
        ├── feature/dev2-postgres-migration
        ├── feature/dev3-bm25-retriever
        └── feature/dev4-nli-classifier
```

### Branch Naming Conventions
- `feature/<dev-id>-<short-description>` (e.g., `feature/dev3-pdf-parser`)
- `fix/<dev-id>-<issue-description>`
- `docs/<topic>`

### Pull Request & Review Protocol
1. **Never commit directly to `main` or `dev`.**
2. Every pull request must target `dev` first and require at least one approving review from the affected module owner.
3. **CI / Pre-merge Quality Gate**:
   - Backend tests must pass: `pytest services/api/tests`
   - Frontend build must pass: `cd apps/web && npm run build`
   - No committed secrets or API keys.

---

## 3. Local Development Setup

### Running Backend (Terminal 1)
```bash
cd services/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Swagger UI available at [http://localhost:8000/docs](http://localhost:8000/docs).

### Running Frontend (Terminal 2)
```bash
cd apps/web
npm install
npm run dev
```
Vite app available at [http://localhost:5173](http://localhost:5173).

### Running Benchmarks
```bash
python3 evaluation/evaluate.py
```
