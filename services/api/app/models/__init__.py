import json
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.schemas import AuditResponse, Source as SourceSchema, AuditStatus


class AuditModel(Base):
    __tablename__ = "audits"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), default="Untitled Audit")
    notes = Column(Text, nullable=True)
    status = Column(String(50), default=AuditStatus.CREATED.value)
    original_answer = Column(Text, default="")
    report_reference = Column(String(255), nullable=True)
    is_mock = Column(Boolean, default=True)
    results_json = Column(Text, nullable=True)  # Stores serialized claims, evidence, findings, summary
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    sources = relationship("SourceModel", back_populates="audit", cascade="all, delete-orphan")

    def to_schema(self) -> AuditResponse:
        """Converts the database model to the shared AuditResponse Pydantic schema."""
        sources_list = [s.to_schema() for s in self.sources]
        
        parsed_results = {}
        if self.results_json:
            try:
                parsed_results = json.loads(self.results_json)
            except Exception:
                parsed_results = {}

        return AuditResponse(
            audit_id=self.id,
            status=AuditStatus(self.status),
            title=self.title,
            original_answer=self.original_answer or "",
            sources=sources_list,
            claims=parsed_results.get("claims", []),
            evidence=parsed_results.get("evidence", []),
            verdicts=parsed_results.get("verdicts", {}),
            consistency_findings=parsed_results.get("consistency_findings", []),
            safety_findings=parsed_results.get("safety_findings", []),
            summary=parsed_results.get("summary"),
            conflict_map=parsed_results.get("conflict_map", []),
            report_reference=self.report_reference,
            is_mock=self.is_mock,
            created_at=self.created_at,
            completed_at=self.completed_at
        )


class SourceModel(Base):
    __tablename__ = "sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id = Column(String(36), ForeignKey("audits.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    char_count = Column(Integer, default=0)
    content_snippet = Column(Text, default="")
    raw_content = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    audit = relationship("AuditModel", back_populates="sources")

    def to_schema(self) -> SourceSchema:
        return SourceSchema(
            source_id=self.id,
            filename=self.filename,
            file_type=self.file_type,
            char_count=self.char_count,
            uploaded_at=self.uploaded_at,
            content_snippet=self.content_snippet or "",
            raw_content=self.raw_content
        )
