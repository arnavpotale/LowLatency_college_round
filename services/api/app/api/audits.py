import os
import json
import uuid
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
    AuditStatus
)
from app.ingestion.parser import extract_text_from_file
from app.verification import default_verifier
from app.reporting.generator import generate_audit_markdown_report

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
        is_mock=settings.enable_mock_verification
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit.to_schema()


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
    Supports either multipart file upload (.pdf, .txt, .md) or form text submission.
    """
    audit = db.query(AuditModel).filter(AuditModel.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")

    source_id = str(uuid.uuid4())
    os.makedirs(settings.upload_dir, exist_ok=True)

    if file is not None and file.filename:
        filename = file.filename
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

        # Extract text
        extracted_text, detected_type = extract_text_from_file(saved_path, filename)
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
    Returns structured claims, verdicts, evidence citations, consistency checks,
    and safety findings. Clearly marked with is_mock=True in initial milestones.
    """
    audit = db.query(AuditModel).filter(AuditModel.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")

    if not audit.original_answer or not audit.original_answer.strip():
        raise HTTPException(status_code=400, detail="Cannot analyze an audit with an empty original answer.")

    sources = [s.to_schema() for s in audit.sources]

    # Run verification engine (returns mock findings for initial skeleton)
    findings = default_verifier.verify_audit(audit.original_answer, sources)

    audit.status = AuditStatus.COMPLETED.value
    audit.results_json = json.dumps(findings)
    audit.is_mock = findings.get("is_mock", True)
    audit.completed_at = datetime.utcnow()
    audit.report_reference = f"/api/audits/{audit.id}/report"

    db.commit()
    db.refresh(audit)
    return audit.to_schema()


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
