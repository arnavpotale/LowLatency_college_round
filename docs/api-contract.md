# Second Opinion — Shared API & Data Contract

This document specifies the shared interface contracts between Frontend (`apps/web`) and Backend (`services/api`). All developers must adhere to these schemas without independently altering types or fields.

---

## 1. Unicode Character Offset Rules

To support precise text highlighting and interactive auditing without UI desynchronization:
1. **0-Indexed Unicode Character Coordinates**: `start_offset` and `end_offset` are 0-indexed integer character counts in Python/JavaScript.
2. **Target String Invariant**:
   ```python
   # In Python:
   assert original_answer[claim.start_offset:claim.end_offset] == claim.claim_text

   // In TypeScript:
   console.assert(originalAnswer.substring(claim.start_offset, claim.end_offset) === claim.claim_text);
   ```
3. **Immutability of Original Text**: The backend stores the raw `original_answer` exactly as received to prevent offset drift caused by stripping, normalization, or line-ending transformations.

---

## 2. Verdict Categories

| Category | Definition | Visual Color |
|---|---|---|
| `supported` | The claim is directly corroborated and verified by retrieved source evidence. | Emerald Green (`#10b981`) |
| `contradicted` | The claim is directly refuted or conflicts with verified source facts. | Rose Red (`#ef4444`) |
| `unsupported` | No evidence was discovered in the provided sources to confirm the claim. | Amber (`#f59e0b`) |
| `ambiguous` | The claim or source text has multiple conflicting or vague interpretations. | Purple (`#8b5cf6`) |
| `inconclusive` | Retrieved passages are tangentially related but insufficient to render a verdict. | Slate Gray (`#64748b`) |

---

## 3. Core Schema Definitions

### 3.1 Claim
```json
{
  "claim_id": "claim_8f1b2c4d",
  "claim_text": "Metaproterenol should be taken at 100mg twice daily with meals.",
  "start_offset": 0,
  "end_offset": 64,
  "verdict": "contradicted",
  "explanation": "Direct conflict: Source protocol specifies maximum safe daily dosage is 50mg.",
  "confidence": 0.98,
  "evidence_ids": ["ev_01"]
}
```

### 3.2 Evidence
```json
{
  "evidence_id": "ev_01",
  "source_id": "src_44a1b92",
  "source_name": "clinical_protocol.pdf",
  "text": "Under no circumstances should daily administration exceed 50mg without intensive cardiac monitoring.",
  "page_or_section": "Page 4, Section 2.3",
  "relevance_score": 0.96
}
```

### 3.3 Source
```json
{
  "source_id": "src_44a1b92",
  "filename": "clinical_protocol.pdf",
  "file_type": "pdf",
  "char_count": 18450,
  "uploaded_at": "2026-10-10T12:00:00Z",
  "content_snippet": "CLINICAL PROTOCOL & PRESCRIBING GUIDELINES..."
}
```

### 3.4 Consistency Finding
```json
{
  "finding_id": "cf_01",
  "finding_type": "numerical_mismatch",
  "description": "Stated percentage increase (15%) conflicts with calculated figure (8%) from underlying disclosures.",
  "severity": "high",
  "affected_claim_ids": ["claim_8f1b2c4d"]
}
```

### 3.5 Safety Finding
```json
{
  "finding_id": "sf_01",
  "category": "harmful_advice",
  "severity": "critical",
  "description": "Answer advises taking 4x the maximum safe cardiac dosage.",
  "recommendation": "Insert immediate clinical advisory warning and advise consulting a licensed physician."
}
```

### 3.6 Summary
```json
{
  "total_claims": 5,
  "supported_claims": 1,
  "contradicted_claims": 2,
  "unsupported_claims": 2,
  "ambiguous_claims": 0,
  "inconclusive_claims": 0,
  "trust_score": 25.0,
  "risk_level": "high",
  "key_takeaway": "Critical contradictions identified regarding medication dosage and interactions."
}
```

---

## 4. API Endpoints

### `GET /api/health`
- **Description:** Readiness and health status.
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "timestamp": "2026-10-10T09:00:00Z",
  "database": "connected",
  "mock_verification_enabled": true
}
```

### `POST /api/audits`
- **Description:** Creates an audit session.
- **Request Body:**
```json
{
  "title": "Clinical Trial Review",
  "notes": "Testing against updated Q3 guidelines"
}
```
- **Response (201 Created):** `AuditResponse` (status: `"created"`).

### `POST /api/audits/{audit_id}/sources`
- **Description:** Uploads a source document.
- **Content-Type:** `multipart/form-data`
  - `file`: binary file (`.pdf`, `.txt`, `.md`, max 10MB) OR
  - `text_title`: string and `text_content`: string
- **Response (201 Created):** `Source` object.

### `POST /api/audits/{audit_id}/answer`
- **Description:** Submits or updates the AI answer.
- **Request Body:**
```json
{
  "original_answer": "Full text of AI response..."
}
```
- **Response (200 OK):** `AuditResponse`.

### `POST /api/audits/{audit_id}/analyze`
- **Description:** Executes the audit verification pipeline.
- **Response (200 OK):** Full `AuditResponse` populated with claims, evidence, findings, summary, and `is_mock=True`.

### `GET /api/audits/{audit_id}`
- **Description:** Fetches audit session metadata and current status.
- **Response (200 OK):** `AuditResponse`.

### `GET /api/audits/{audit_id}/results`
- **Description:** Fetches complete results of an analyzed audit.
- **Response (200 OK):** `AuditResponse`.

### `GET /api/audits/{audit_id}/report`
- **Description:** Fetches human-readable markdown export.
- **Response (200 OK):** `text/plain` markdown.
