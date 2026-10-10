from datetime import datetime, timezone
import pytest

from app.reporting.generator import generate_audit_markdown_report, format_inline_code
from app.schemas import (
    AuditResponse,
    AuditStatus,
    AuditSummary,
    Claim,
    ConsistencyFinding,
    Evidence,
    SafetyFinding,
    Source,
    VerdictCategory,
)


@pytest.fixture
def base_timestamps():
    created = datetime(2026, 10, 10, 12, 0, 0, tzinfo=timezone.utc)
    completed = datetime(2026, 10, 10, 12, 0, 5, tzinfo=timezone.utc)
    return created, completed


@pytest.fixture
def complete_audit(base_timestamps):
    created, completed = base_timestamps
    return AuditResponse(
        audit_id="audit-uuid-12345",
        status=AuditStatus.COMPLETED,
        title="Clinical Trial Drug Evaluation",
        original_answer="The standard dosage is 25mg daily, but patients may safely take up to 100mg.",
        sources=[
            Source(
                source_id="src-1",
                filename="clinical_protocol.pdf",
                file_type="pdf",
                char_count=15420,
                uploaded_at=created,
                content_snippet="Standard dosage recommendation: 25mg daily, maximum 50mg daily.",
            )
        ],
        claims=[
            Claim(
                claim_id="cl-1",
                claim_text="The standard dosage is 25mg daily",
                start_offset=0,
                end_offset=34,
                verdict=VerdictCategory.SUPPORTED,
                explanation="Protocol explicitly confirms standard initial dosage is 25mg daily.",
                confidence=0.98,
                evidence_ids=["ev-1"],
            ),
            Claim(
                claim_id="cl-2",
                claim_text="patients may safely take up to 100mg",
                start_offset=40,
                end_offset=76,
                verdict=VerdictCategory.CONTRADICTED,
                explanation="Protocol explicitly caps maximum safe dosage at 50mg daily, contradicting 100mg.",
                confidence=0.95,
                evidence_ids=["ev-1"],
            ),
        ],
        evidence=[
            Evidence(
                evidence_id="ev-1",
                source_id="src-1",
                source_name="clinical_protocol.pdf",
                text="Standard dosage recommendation: 25mg daily, maximum recommended dose is 50mg daily under supervision.",
                page_or_section="Page 4, Section 3.2",
                relevance_score=0.94,
            )
        ],
        verdicts={
            "supported": 1,
            "contradicted": 1,
            "unsupported": 0,
            "ambiguous": 0,
            "inconclusive": 0,
        },
        consistency_findings=[
            ConsistencyFinding(
                finding_id="cf-1",
                finding_type="numerical_mismatch",
                description="Dosage upper limit in answer (100mg) doubles the maximum allowed protocol dose (50mg).",
                severity="high",
                affected_claim_ids=["cl-2"],
            )
        ],
        safety_findings=[
            SafetyFinding(
                finding_id="sf-1",
                category="harmful_advice",
                severity="critical",
                description="Exceeding maximum dosage by 2x poses acute toxicity hazards.",
                recommendation="Consult a licensed physician; do not exceed 50mg maximum threshold.",
            )
        ],
        summary=AuditSummary(
            total_claims=2,
            supported_claims=1,
            contradicted_claims=1,
            unsupported_claims=0,
            ambiguous_claims=0,
            inconclusive_claims=0,
            trust_score=50.0,
            risk_level="high",
            key_takeaway="Significant dosage safety risk detected contradicting official clinical protocol.",
        ),
        report_reference="/api/audits/audit-uuid-12345/report",
        is_mock=True,
        created_at=created,
        completed_at=completed,
    )


def test_complete_audit_report_generation(complete_audit):
    report = generate_audit_markdown_report(complete_audit)

    # 1. Header & Metadata
    assert "# Second Opinion — Audit Report" in report
    assert "**Title:** Clinical Trial Drug Evaluation" in report
    assert "**Audit ID:** `audit-uuid-12345`" in report
    assert "**Status:** COMPLETED" in report
    assert "**Created:** 2026-10-10 12:00:00 UTC" in report
    assert "**Completed:** 2026-10-10 12:00:05 UTC" in report
    assert "**Mode:** MOCK SIMULATION" in report
    assert "MOCK SIMULATION NOTICE" in report

    # 2. Source Documents
    assert "## Source Documents" in report
    assert "`clinical_protocol.pdf`" in report
    assert "PDF | 15,420 characters" in report
    assert "*Snippet:* \"Standard dosage recommendation: 25mg daily, maximum 50mg daily.\"" in report

    # 3. Executive Summary
    assert "## Executive Summary" in report
    assert "**Overall Trust Score:** 50.0/100" in report
    assert "**Risk Assessment:** HIGH" in report
    assert "**Total Claims Audited:** 2" in report
    assert "Supported: 1" in report
    assert "Contradicted: 1" in report
    assert "Significant dosage safety risk detected contradicting official clinical protocol." in report

    # 4. Original AI Answer
    assert "## Original AI-Generated Answer" in report
    assert "The standard dosage is 25mg daily, but patients may safely take up to 100mg." in report

    # 5. Claims & Evidence Citations
    assert "## Detailed Claim Findings" in report
    assert "### Claim 1: [SUPPORTED]" in report
    assert "The standard dosage is 25mg daily" in report
    assert "**Confidence:** 98%" in report
    assert "**Character Offset:** [0:34]" in report
    assert "Protocol explicitly confirms standard initial dosage is 25mg daily." in report
    assert "**Source:** `clinical_protocol.pdf` (Page 4, Section 3.2) | *Relevance:* 94%" in report
    assert "Standard dosage recommendation: 25mg daily, maximum recommended dose is 50mg daily under supervision." in report

    assert "### Claim 2: [CONTRADICTED]" in report
    assert "patients may safely take up to 100mg" in report
    assert "**Confidence:** 95%" in report

    # 6. Consistency Findings
    assert "## Consistency Findings" in report
    assert "**Numerical Mismatch** [HIGH]: Dosage upper limit in answer (100mg)" in report
    assert "*Affected Claims:* `cl-2`" in report

    # 7. Safety Findings
    assert "## Safety & Liability Warnings" in report
    assert "**Harmful Advice** [CRITICAL]: Exceeding maximum dosage by 2x poses acute toxicity hazards." in report
    assert "*Recommendation:* Consult a licensed physician; do not exceed 50mg maximum threshold." in report


def test_live_mode_report(complete_audit):
    complete_audit.is_mock = False
    report = generate_audit_markdown_report(complete_audit)

    assert "**Mode:** LIVE AI VERIFICATION" in report
    assert "MOCK SIMULATION NOTICE" not in report


def test_empty_audit_report(base_timestamps):
    created, _ = base_timestamps
    empty_audit = AuditResponse(
        audit_id="empty-session-999",
        status=AuditStatus.CREATED,
        title=None,
        original_answer="",
        sources=[],
        claims=[],
        evidence=[],
        verdicts={},
        consistency_findings=[],
        safety_findings=[],
        summary=None,
        report_reference=None,
        is_mock=True,
        created_at=created,
        completed_at=None,
    )

    report = generate_audit_markdown_report(empty_audit)

    assert "# Second Opinion — Audit Report" in report
    assert "**Title:** Untitled Audit" in report
    assert "**Audit ID:** `empty-session-999`" in report
    assert "**Status:** CREATED" in report
    assert "**Completed:** N/A" in report
    assert "_No source documents were attached to this audit._" in report
    assert "(No answer text submitted)" in report
    assert "_No claims were extracted or evaluated for this audit._" in report
    assert "Executive summary metrics not available for this session." in report
    assert "## Consistency Findings" not in report
    assert "## Safety & Liability Warnings" not in report


def test_missing_and_orphaned_evidence(base_timestamps):
    created, completed = base_timestamps
    audit = AuditResponse(
        audit_id="audit-orphaned-ev",
        status=AuditStatus.COMPLETED,
        title="Orphaned Evidence Test",
        original_answer="A statement with missing citations.",
        sources=[],
        claims=[
            Claim(
                claim_id="cl-orphan",
                claim_text="A statement with missing citations.",
                start_offset=0,
                end_offset=34,
                verdict=VerdictCategory.UNSUPPORTED,
                explanation="No valid source document confirms this claim.",
                confidence=0.45,
                evidence_ids=["ev-nonexistent-99"],
            ),
            Claim(
                claim_id="cl-no-ids",
                claim_text="Another assertion without any citations.",
                start_offset=0,
                end_offset=41,
                verdict=VerdictCategory.INCONCLUSIVE,
                explanation="Insufficient evidence context.",
                confidence=0.30,
                evidence_ids=[],
            ),
        ],
        evidence=[],  # No evidence in catalog
        verdicts={"unsupported": 1, "inconclusive": 1},
        consistency_findings=[],
        safety_findings=[],
        summary=None,
        is_mock=False,
        created_at=created,
        completed_at=completed,
    )

    report = generate_audit_markdown_report(audit)

    # Verifies unresolved citation note for missing evidence ID
    assert "*Unresolved Citation:* Evidence ID `ev-nonexistent-99` not found in evidence catalog." in report
    # Verifies note for claims with empty evidence_ids
    assert "_No direct evidence citations linked to this claim._" in report
    # Verifies fallback summary verdicts breakdown
    assert "**Total Claims Audited:** 2" in report
    assert "Inconclusive: 1" in report
    assert "Unsupported: 1" in report


def test_deterministic_output(complete_audit):
    # Calling generator multiple times on the same object must produce identical strings
    report_1 = generate_audit_markdown_report(complete_audit)
    report_2 = generate_audit_markdown_report(complete_audit)
    report_3 = generate_audit_markdown_report(complete_audit)

    assert report_1 == report_2
    assert report_2 == report_3


def test_code_fence_with_embedded_backticks(base_timestamps):
    created, completed = base_timestamps
    code_answer = "Here is the code solution:\n```python\nprint('hello world')\n```\nIt works!"
    audit = AuditResponse(
        audit_id="audit-code-ticks",
        status=AuditStatus.COMPLETED,
        title="   ",  # Whitespace-only title to test fallback
        original_answer=code_answer,
        sources=[],
        claims=[],
        evidence=[],
        verdicts={},
        consistency_findings=[],
        safety_findings=[],
        summary=None,
        is_mock=False,
        created_at=created,
        completed_at=completed,
    )

    report = generate_audit_markdown_report(audit)

    # Whitespace-only title should fall back to Untitled Audit
    assert "**Title:** Untitled Audit" in report
    # Fence should adapt to 4 backticks (or more) so internal ``` does not break it
    assert "````\nHere is the code solution:\n```python\nprint('hello world')\n```\nIt works!\n````" in report


def test_multiline_evidence_and_takeaway(base_timestamps):
    created, completed = base_timestamps
    audit = AuditResponse(
        audit_id="audit-multiline",
        status=AuditStatus.COMPLETED,
        title="Multiline Formatting Audit",
        original_answer="First line of answer.",
        sources=[
            Source(
                source_id="src-1",
                filename="document.txt",
                file_type="txt",
                char_count=500,
                uploaded_at=created,
                content_snippet="Snippet\nwith\nnewlines",
            )
        ],
        claims=[
            Claim(
                claim_id="cl-1",
                claim_text="First line of answer.",
                start_offset=0,
                end_offset=21,
                verdict=VerdictCategory.SUPPORTED,
                explanation="Grounded in multiline excerpt.",
                confidence=0.90,
                evidence_ids=["ev-multi", "ev-no-loc"],
            )
        ],
        evidence=[
            Evidence(
                evidence_id="ev-multi",
                source_id="src-1",
                source_name="document.txt",
                text="Line one of evidence excerpt.\nLine two of evidence excerpt.\nLine three.",
                page_or_section="Section 1",
                relevance_score=0.88,
            ),
            Evidence(
                evidence_id="ev-no-loc",
                source_id="src-1",
                source_name="document.txt",
                text="Single line evidence with no location.",
                page_or_section="",  # Empty location
                relevance_score=0.75,
            ),
        ],
        verdicts={"supported": 1},
        consistency_findings=[],
        safety_findings=[],
        summary=AuditSummary(
            total_claims=1,
            supported_claims=1,
            contradicted_claims=0,
            unsupported_claims=0,
            ambiguous_claims=0,
            inconclusive_claims=0,
            trust_score=95.0,
            risk_level="low",
            key_takeaway="Primary finding: Safe.\nSecondary note: Verify periodically.",
        ),
        is_mock=False,
        created_at=created,
        completed_at=completed,
    )

    report = generate_audit_markdown_report(audit)

    # Multiline takeaway is properly quoted on each line
    assert "> **Key Takeaway:** Primary finding: Safe.\n> Secondary note: Verify periodically." in report

    # Multiline evidence excerpt is indented and quoted on each line
    assert "    > \"Line one of evidence excerpt.\n    > Line two of evidence excerpt.\n    > Line three.\"" in report

    # Empty location does not leave empty parentheses ()
    assert "**Source:** `document.txt` | *Relevance:* 75%" in report
    assert "()" not in report


def test_inconsistent_verdicts_fallback_derives_from_claims(base_timestamps):
    created, completed = base_timestamps
    # Inconsistent verdicts supplied in dictionary (says supported: 99), but claims only has 2 claims
    audit = AuditResponse(
        audit_id="audit-inconsistent-counts",
        status=AuditStatus.COMPLETED,
        title="Inconsistent Counts Fallback Test",
        original_answer="Two claims test.",
        sources=[],
        claims=[
            Claim(
                claim_id="cl-1",
                claim_text="Claim A",
                start_offset=0,
                end_offset=7,
                verdict=VerdictCategory.SUPPORTED,
                explanation="Explanation A",
                confidence=0.85,
                evidence_ids=[],
            ),
            Claim(
                claim_id="cl-2",
                claim_text="Claim B",
                start_offset=8,
                end_offset=15,
                verdict=VerdictCategory.AMBIGUOUS,
                explanation="Explanation B",
                confidence=0.60,
                evidence_ids=[],
            ),
        ],
        evidence=[],
        verdicts={"supported": 99, "contradicted": 50},  # Stale/inconsistent counts!
        consistency_findings=[],
        safety_findings=[],
        summary=None,  # Forces fallback branch
        is_mock=False,
        created_at=created,
        completed_at=completed,
    )

    report = generate_audit_markdown_report(audit)

    # Total claims audited is 2
    assert "**Total Claims Audited:** 2" in report
    # Derived from actual claims: 1 supported, 1 ambiguous, NOT the stale 99 / 50
    assert "Supported: 1" in report
    assert "Ambiguous: 1" in report
    assert "Supported: 99" not in report
    assert "Contradicted: 50" not in report


def test_format_inline_code_helper():
    assert format_inline_code("regular_file.pdf") == "`regular_file.pdf`"
    assert format_inline_code("file`v1.txt") == "`` file`v1.txt ``"
    assert format_inline_code("`leading_tick") == "`` `leading_tick ``"
    assert format_inline_code("two``ticks") == "``` two``ticks ```"


def test_inline_code_spans_with_embedded_backticks(base_timestamps):
    created, completed = base_timestamps
    audit = AuditResponse(
        audit_id="audit-backticks-in-identifiers",
        status=AuditStatus.COMPLETED,
        title="Backticks Formatting Test",
        original_answer="Checking backticks safety.",
        sources=[
            Source(
                source_id="src-1",
                filename="weird`file`name.pdf",
                file_type="pdf",
                char_count=100,
                uploaded_at=created,
                content_snippet="Content snippet",
            )
        ],
        claims=[
            Claim(
                claim_id="cl`1`tick",
                claim_text="Checking backticks safety.",
                start_offset=0,
                end_offset=26,
                verdict=VerdictCategory.SUPPORTED,
                explanation="Explanation text",
                confidence=0.95,
                evidence_ids=["ev`orphan`id"],
            )
        ],
        evidence=[
            Evidence(
                evidence_id="ev-good",
                source_id="src-1",
                source_name="evidence`source`name.pdf",
                text="Evidence text excerpt",
                page_or_section="Page 1",
                relevance_score=0.90,
            )
        ],
        verdicts={"supported": 1},
        consistency_findings=[
            ConsistencyFinding(
                finding_id="cf-1",
                finding_type="internal_contradiction",
                description="Contradiction description",
                severity="low",
                affected_claim_ids=["cl`1`tick"],
            )
        ],
        safety_findings=[],
        summary=None,
        is_mock=False,
        created_at=created,
        completed_at=completed,
    )

    report = generate_audit_markdown_report(audit)

    # 1. Source filename with backtick
    assert "- **`` weird`file`name.pdf ``** (PDF | 100 characters)" in report

    # 2. Unresolved evidence ID with backtick
    assert "*Unresolved Citation:* Evidence ID `` ev`orphan`id `` not found in evidence catalog." in report

    # 3. Affected claim ID with backtick
    assert "*Affected Claims:* `` cl`1`tick ``" in report
