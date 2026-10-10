from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class VerdictCategory(str, Enum):
    SUPPORTED = "supported"
    CONTRADICTED = "contradicted"
    UNSUPPORTED = "unsupported"
    AMBIGUOUS = "ambiguous"
    INCONCLUSIVE = "inconclusive"


class AuditStatus(str, Enum):
    CREATED = "created"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Source(BaseModel):
    source_id: str = Field(..., description="Unique identifier for the source")
    filename: str = Field(..., description="Original filename or document title")
    file_type: str = Field(..., description="File extension/type (e.g., pdf, txt, md)")
    char_count: int = Field(..., description="Total characters extracted from the document")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow, description="UTC timestamp of upload")
    content_snippet: str = Field(..., description="Preview snippet of the source content")
    raw_content: Optional[str] = Field(None, description="Full extracted text content if retained")


class SourceCreateText(BaseModel):
    filename: str = Field("source_document.txt", description="Document label or name")
    content: str = Field(..., min_length=1, description="Raw text of the source document")


class Evidence(BaseModel):
    evidence_id: str = Field(..., description="Unique evidence excerpt ID")
    source_id: str = Field(..., description="Referenced source document ID")
    source_name: str = Field(..., description="Name of the source document")
    text: str = Field(..., description="Exact verifiable excerpt text from the source")
    page_or_section: str = Field(..., description="Location pointer (e.g. 'Page 2', 'Section 4')")
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="Relevance score (0.0 to 1.0)")
    start_offset: Optional[int] = Field(None, ge=0, description="0-indexed Unicode character start offset in source document")
    end_offset: Optional[int] = Field(None, ge=0, description="0-indexed Unicode character end offset in source document")
    start_char: Optional[int] = Field(None, ge=0, description="Alias for start_offset")
    end_char: Optional[int] = Field(None, ge=0, description="Alias for end_offset")


class Claim(BaseModel):
    claim_id: str = Field(..., description="Unique identifier for the extracted claim")
    claim_text: str = Field(..., description="Atomic factual assertion extracted from the answer")
    start_offset: int = Field(..., ge=0, description="0-indexed Unicode character start offset in original_answer")
    end_offset: int = Field(..., ge=0, description="0-indexed Unicode character end offset in original_answer")
    verdict: VerdictCategory = Field(..., description="Evidence-backed verdict category")
    explanation: str = Field(..., description="Clear reasoning justifying the verdict based on evidence")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Calibrated confidence score between 0.0 and 1.0")
    evidence_ids: List[str] = Field(default_factory=list, description="IDs of supporting or contradicting evidence")


class ConsistencyFinding(BaseModel):
    finding_id: str = Field(..., description="Unique finding ID")
    finding_type: str = Field(..., description="Type of inconsistency (numerical_mismatch, internal_contradiction, temporal_inconsistency, logical_fallacy)")
    description: str = Field(..., description="Detailed explanation of the inconsistency")
    severity: str = Field("medium", description="Severity level: low, medium, or high")
    affected_claim_ids: List[str] = Field(default_factory=list, description="Claim IDs involved in the inconsistency")


class SafetyFinding(BaseModel):
    finding_id: str = Field(..., description="Unique safety finding ID")
    category: str = Field(..., description="Risk category (harmful_advice, medical_disclaimer_missing, financial_risk, unverified_procedure, security_risk, other)")
    severity: str = Field("medium", description="Severity level: low, medium, high, or critical")
    description: str = Field(..., description="Risk description")
    recommendation: str = Field(..., description="Actionable recommendation or disclaimer required")


class AuditSummary(BaseModel):
    total_claims: int = 0
    supported_claims: int = 0
    contradicted_claims: int = 0
    unsupported_claims: int = 0
    ambiguous_claims: int = 0
    inconclusive_claims: int = 0
    trust_score: float = Field(0.0, ge=0.0, le=100.0, description="Composite trust score (0-100)")
    risk_level: str = Field("low", description="Overall risk rating: low, medium, or high")
    key_takeaway: str = Field("", description="High-level summary of verification findings")


class AuditCreate(BaseModel):
    title: Optional[str] = Field("Untitled Audit", description="Optional audit title or tag")
    notes: Optional[str] = Field(None, description="Optional notes or audit context")


class AnswerInput(BaseModel):
    original_answer: str = Field(..., min_length=1, description="The complete AI-generated answer to verify")


class AuditResponse(BaseModel):
    audit_id: str = Field(..., description="Unique UUID for this audit session")
    status: AuditStatus = Field(..., description="Current status of the audit")
    title: Optional[str] = Field(None, description="Audit title")
    original_answer: str = Field("", description="The AI-generated answer being audited")
    sources: List[Source] = Field(default_factory=list, description="Associated source documents")
    claims: List[Claim] = Field(default_factory=list, description="Extracted claims and their verdicts")
    evidence: List[Evidence] = Field(default_factory=list, description="All retrieved evidence snippets")
    verdicts: Dict[str, int] = Field(default_factory=dict, description="Counts of claims by verdict category")
    consistency_findings: List[ConsistencyFinding] = Field(default_factory=list, description="Logical/numerical consistency issues")
    safety_findings: List[SafetyFinding] = Field(default_factory=list, description="Potential safety and liability warnings")
    summary: Optional[AuditSummary] = Field(None, description="Executive summary and trust score")
    report_reference: Optional[str] = Field(None, description="Identifier or path for the compiled audit report")
    is_mock: bool = Field(True, description="True if results are mock/simulated; False when real AI pipeline runs")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
    database: str
    mock_verification_enabled: bool
