import os
import re
import json
import uuid
import logging
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.models import AuditModel, SourceModel
from app.schemas import (
    AuditCreate,
    AnswerInput,
    AuditResponse,
    Source as SourceSchema,
    SourceCreateText,
    AuditStatus,
    HumanReviewInput
)
from app.ingestion.parser import extract_text_from_file, sanitize_filename
from app.verification import default_verifier, get_verification_engine, ProviderUnavailableError
from app.reporting.generator import generate_audit_markdown_report
from app.verification.adversarial_suite import ADVERSARIAL_BENCHMARK_CASES, run_adversarial_suite

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/audits", tags=["Audits"])


@router.post("", response_model=AuditResponse, status_code=status.HTTP_201_CREATED)
def create_audit(payload: Optional[AuditCreate] = None, db: Session = Depends(get_db)):
    """Create a new audit session."""
    title = payload.title if payload and payload.title else "Untitled Audit"
    notes = payload.notes if payload else None

    audit = AuditModel(
        id=str(uuid.uuid4()),
        title=title,
        notes=notes,
        status=AuditStatus.CREATED.value,
        original_answer="",
        is_mock=settings.is_mock_active
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit.to_schema()


@router.get("", response_model=List[AuditResponse])
def list_audits(limit: int = 50, db: Session = Depends(get_db)):
    """List recent audit sessions, ordered by creation date descending."""
    audits = db.query(AuditModel).order_by(AuditModel.created_at.desc()).limit(limit).all()
    return [a.to_schema() for a in audits]


@router.post("/{audit_id}/sources", response_model=SourceSchema, status_code=status.HTTP_201_CREATED)
async def upload_source(
    audit_id: str,
    file: Optional[UploadFile] = File(None),
    text_title: Optional[str] = Form(None),
    text_content: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Attach a source document to an audit.
    Supports multipart file upload (.pdf, .txt, .md, .docx) or form text submission.
    """
    audit = db.query(AuditModel).filter(AuditModel.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")

    source_id = str(uuid.uuid4())
    os.makedirs(settings.upload_dir, exist_ok=True)

    if file is not None and file.filename:
        filename = sanitize_filename(file.filename)
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in settings.allowed_extensions_list:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file extension '.{ext}'. Allowed extensions: {settings.allowed_extensions_list}"
            )

        # Read file contents and validate file size
        file_bytes = await file.read()
        if len(file_bytes) > settings.max_upload_size_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum allowed size of {settings.max_upload_size_bytes // (1024 * 1024)}MB."
            )

        saved_path = os.path.join(settings.upload_dir, f"{source_id}_{filename}")
        with open(saved_path, "wb") as f:
            f.write(file_bytes)

        # Extract text with automatic temp file cleanup on error
        try:
            extracted_text, detected_type = extract_text_from_file(saved_path, filename)
        except Exception as e:
            if os.path.exists(saved_path):
                try:
                    os.remove(saved_path)
                except OSError:
                    pass
            raise HTTPException(status_code=400, detail=str(e))

        char_count = len(extracted_text)
        snippet = extracted_text[:300].strip()

        source = SourceModel(
            id=source_id,
            audit_id=audit_id,
            filename=filename,
            file_type=detected_type,
            char_count=char_count,
            content_snippet=snippet,
            raw_content=extracted_text,
            file_path=saved_path
        )
    elif text_content is not None and text_content.strip():
        filename = text_title or "pasted_source.txt"
        extracted_text = text_content.strip()
        char_count = len(extracted_text)
        snippet = extracted_text[:300].strip()

        source = SourceModel(
            id=source_id,
            audit_id=audit_id,
            filename=filename,
            file_type="txt",
            char_count=char_count,
            content_snippet=snippet,
            raw_content=extracted_text,
            file_path=None
        )
    else:
        raise HTTPException(
            status_code=400,
            detail="Must provide either an uploaded file or text content."
        )

    db.add(source)
    db.commit()
    db.refresh(source)
    return source.to_schema()


@router.delete("/{audit_id}/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(audit_id: str, source_id: str, db: Session = Depends(get_db)):
    """Remove a source document from an in-progress audit."""
    source = db.query(SourceModel).filter(SourceModel.id == source_id, SourceModel.audit_id == audit_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    if source.file_path and os.path.exists(source.file_path):
        try:
            os.remove(source.file_path)
        except OSError:
            pass
    db.delete(source)
    db.commit()
    return None


@router.post("/{audit_id}/answer", response_model=AuditResponse)
def submit_answer(audit_id: str, payload: AnswerInput, db: Session = Depends(get_db)):
    """Submit or update the AI-generated answer for verification."""
    audit = db.query(AuditModel).filter(AuditModel.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")

    audit.original_answer = payload.original_answer
    db.commit()
    db.refresh(audit)
    return audit.to_schema()


@router.post("/{audit_id}/analyze", response_model=AuditResponse)
def analyze_audit(audit_id: str, db: Session = Depends(get_db)):
    """
    Trigger the audit verification pipeline.
    Dispatches to real deterministic verification or LLM assessment when mock mode is disabled,
    or returns explicit simulation findings when mock mode is enabled.
    """
    audit = db.query(AuditModel).filter(AuditModel.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")

    if not audit.original_answer or not audit.original_answer.strip():
        raise HTTPException(status_code=400, detail="Cannot analyze an audit with an empty original answer.")

    sources = [s.to_schema() for s in audit.sources]

    # Transition to processing state
    audit.status = AuditStatus.PROCESSING.value
    db.commit()

    try:
        engine = get_verification_engine()
        findings = engine.verify_audit(audit.original_answer, sources)
    except ProviderUnavailableError as e:
        # Sanitize error message to prevent token/credential leakage
        clean_err = re.sub(r'sk-[a-zA-Z0-9_\-]{8,}', 'sk-***', str(e))
        clean_err = re.sub(r'Bearer\s+[a-zA-Z0-9_\-\.]+', 'Bearer ***', clean_err)
        audit.status = AuditStatus.FAILED.value
        audit.results_json = json.dumps({"error": clean_err})
        audit.completed_at = datetime.utcnow()
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Verification provider failed: {clean_err}"
        )
    except Exception as e:
        logger.exception("Audit analysis failed unexpectedly for audit_id=%s", audit_id)
        audit.status = AuditStatus.FAILED.value
        audit.results_json = json.dumps({"error": "Internal audit analysis failure"})
        audit.completed_at = datetime.utcnow()
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Audit analysis failed due to an internal server error. Please retry."
        )


    audit.status = AuditStatus.COMPLETED.value
    audit.results_json = json.dumps(findings)
    audit.is_mock = findings.get("is_mock", True)
    audit.completed_at = datetime.utcnow()
    audit.report_reference = f"/api/audits/{audit.id}/report"

    db.commit()
    db.refresh(audit)
    return audit.to_schema()


@router.get("/adversarial-lab/cases")
def get_adversarial_cases():
    """Returns curated adversarial benchmark cases for stress-testing verification."""
    return {"cases": ADVERSARIAL_BENCHMARK_CASES}


@router.post("/adversarial-lab/run")
def run_adversarial_lab():
    """
    Executes live verification against the adversarial stress test suite.
    Runs the genuine verification engine and returns pass/fail and latency results.
    """
    return run_adversarial_suite()


@router.get("/{audit_id}", response_model=AuditResponse)
def get_audit(audit_id: str, db: Session = Depends(get_db)):
    """Fetch audit session details and current state."""
    audit = db.query(AuditModel).filter(AuditModel.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit.to_schema()


@router.get("/{audit_id}/results", response_model=AuditResponse)
def get_audit_results(audit_id: str, db: Session = Depends(get_db)):
    """Fetch complete audit results."""
    audit = db.query(AuditModel).filter(AuditModel.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit.to_schema()


@router.get("/{audit_id}/report", response_class=PlainTextResponse)
def get_audit_report(audit_id: str, db: Session = Depends(get_db)):
    """Fetch human-readable Markdown report for the audit."""
    audit = db.query(AuditModel).filter(AuditModel.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    schema = audit.to_schema()
    return generate_audit_markdown_report(schema)


@router.post("/{audit_id}/claims/{claim_id}/review", response_model=AuditResponse)
def review_claim(
    audit_id: str,
    claim_id: str,
    payload: HumanReviewInput,
    db: Session = Depends(get_db)
):
    """
    Records a human auditor's review judgment, notes, or verdict override on a specific claim.
    Preserves the original machine verdict while allowing human override.
    """
    audit = db.query(AuditModel).filter(AuditModel.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")

    if not audit.results_json:
        raise HTTPException(status_code=400, detail="Audit has not been analyzed yet")

    try:
        results = json.loads(audit.results_json)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to parse audit results JSON")

    claims = results.get("claims", [])
    target_claim = None
    for c in claims:
        if c.get("claim_id") == claim_id:
            target_claim = c
            break

    if not target_claim:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found in audit")

    original_verdict = target_claim.get("verdict", "unsupported")
    review_record = {
        "action": payload.action,
        "notes": payload.notes or "",
        "reviewer": payload.reviewer or "Human Auditor",
        "reviewed_at": datetime.utcnow().isoformat(),
        "original_verdict": original_verdict
    }

    target_claim["human_review"] = review_record

    # If reviewer explicitly overrides verdict, update claim verdict
    if payload.action == "override_supported":
        target_claim["verdict"] = "supported"
    elif payload.action == "override_contradicted":
        target_claim["verdict"] = "contradicted"
    elif payload.action == "override_unsupported":
        target_claim["verdict"] = "unsupported"

    # Re-tally verdicts
    verdict_counts = {}
    for c in claims:
        v = c.get("verdict", "unsupported")
        verdict_counts[v] = verdict_counts.get(v, 0) + 1
    results["verdicts"] = verdict_counts
    results["claims"] = claims

    audit.results_json = json.dumps(results)
    db.commit()
    db.refresh(audit)
    return audit.to_schema()
