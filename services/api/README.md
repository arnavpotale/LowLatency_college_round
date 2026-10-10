# Second Opinion — Backend API Service

**Primary Owner:** Developer 2 — Backend and Integration
**Contributing Owners:**
- Developer 3: `app/ingestion/`, `app/extraction/`, `app/retrieval/`
- Developer 4: `app/verification/`, `app/consistency/`, `app/safety/`

## Quick Start

### 1. Environment & Dependencies
```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run the Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive OpenAPI documentation will be accessible at: [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Run Automated Tests
```bash
pytest tests/ -v
```

## Directory Structure
```
services/api/
├── app/
│   ├── api/             # HTTP endpoints and routing
│   │   ├── audits.py    # Audit lifecycle, source uploads, analysis
│   │   └── health.py    # Health and readiness check
│   ├── core/            # Configuration and environment settings
│   ├── database/        # SQLAlchemy engine, session, Base
│   ├── models/          # Persistent ORM models (Audit, Source)
│   ├── schemas/         # Pydantic schemas (Shared Data Contract)
│   ├── ingestion/       # Document parsing and chunking (Dev 3)
│   ├── extraction/      # Claim extraction with character offsets (Dev 3)
│   ├── retrieval/       # BM25 & dense vector retrieval (Dev 3)
│   ├── verification/    # Claim verification & mock engine (Dev 4)
│   ├── consistency/     # Numerical and logical checks (Dev 4)
│   ├── safety/          # Risk and guardrails detection (Dev 4)
│   ├── reporting/       # Audit report compilation
│   └── main.py          # FastAPI application entrypoint
├── tests/               # Pytest integration tests
├── pyproject.toml
└── requirements.txt
```

## Core Endpoints
- `GET /api/health` — System status & database connectivity
- `POST /api/audits` — Create a new audit session
- `POST /api/audits/{id}/sources` — Upload file (.pdf, .txt, .md) or text
- `POST /api/audits/{id}/answer` — Submit AI answer to verify
- `POST /api/audits/{id}/analyze` — Run audit verification pipeline
- `GET /api/audits/{id}` — Retrieve audit session state
- `GET /api/audits/{id}/results` — Retrieve complete audit results
- `GET /api/audits/{id}/report` — Retrieve human-readable Markdown report
