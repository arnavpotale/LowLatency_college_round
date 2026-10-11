from datetime import datetime, timezone
import pytest

from app.reporting.generator import (
    generate_audit_markdown_report,
    generate_executive_markdown_report,
    generate_txt_report,
    generate_docx_report,
    generate_pdf_report,
    format_inline_code,
    get_evidence_relationship,
    format_location_string,
)
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
    assert "**Original Machine Verdict:** `supported`" in report
    assert "**Confidence:** 98%" in report
    assert "**Character Offset:** [0:34]" in report
    assert "Protocol explicitly confirms standard initial dosage is 25mg daily." in report
    assert "**Source:** `clinical_protocol.pdf` (Page 4, Section 3.2) | *Relevance:* 94%" in report
    assert "[Referenced Evidence]" in report
    assert "Standard dosage recommendation: 25mg daily, maximum recommended dose is 50mg daily under supervision." in report

    assert "### Claim 2: [CONTRADICTED]" in report
    assert "patients may safely take up to 100mg" in report
    assert "**Original Machine Verdict:** `contradicted`" in report
    assert "**Confidence:** 95%" in report
    assert "[Referenced Evidence]" in report

    # 6. Consistency Findings
    assert "## Consistency Findings" in report
    assert "**Numerical Mismatch** [HIGH]: Dosage upper limit in answer (100mg)" in report
    assert "*Affected Claims:* `cl-2`" in report

    # 7. Safety Findings
    assert "## Safety & Liability Warnings" in report
    assert "**Harmful Advice** [CRITICAL]: Exceeding maximum dosage by 2x poses acute toxicity hazards." in report
    assert "*Recommendation:* Consult a licensed physician; do not exceed 50mg maximum threshold." in report

    # 8. Referenced Evidence Passages
    assert "## Referenced Evidence Passages" in report
    assert "- **[ev-1]** (Source: `clinical_protocol.pdf`):" in report

    # 9. Audit Limitations & Review Status
    assert "## Audit Limitations & Verification Scope" in report
    assert "Human Review Status:" in report
    assert "human_verdict" in report


def test_live_mode_report(complete_audit):
    complete_audit.is_mock = False
    report = generate_audit_markdown_report(complete_audit)

    assert "**Mode:** LIVE AI VERIFICATION" in report
    assert "MOCK SIMULATION NOTICE" not in report
    assert "Non-simulation mode reported (`is_mock=False`)" in report


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
    assert "## Referenced Evidence Passages" not in report
    assert "## Audit Limitations & Verification Scope" in report


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
        evidence=[],
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
    # Limitations section flags citation integrity
    assert "Citation Integrity Alert:" in report


def test_evidence_referencing_source_absent_from_audit(base_timestamps):
    created, completed = base_timestamps
    audit = AuditResponse(
        audit_id="audit-absent-src",
        status=AuditStatus.COMPLETED,
        title="Absent Source Grounding Test",
        original_answer="Claim citing unattached source document.",
        sources=[
            Source(
                source_id="src-actual-1",
                filename="actual_upload.pdf",
                file_type="pdf",
                char_count=500,
                uploaded_at=created,
                content_snippet="Actual content",
            )
        ],
        claims=[
            Claim(
                claim_id="cl-1",
                claim_text="Claim citing unattached source document.",
                start_offset=0,
                end_offset=40,
                verdict=VerdictCategory.SUPPORTED,
                explanation="Cited chunk references a deleted or phantom source_id.",
                confidence=0.80,
                evidence_ids=["ev-ghost"],
            )
        ],
        evidence=[
            Evidence(
                evidence_id="ev-ghost",
                source_id="src-phantom-999",  # NOT in audit.sources!
                source_name="ghost_document.pdf",
                text="Some ghost excerpt not tied to actual uploads.",
                page_or_section="Page 99",
                relevance_score=0.75,
            ),
            Evidence(
                evidence_id="ev-uncited-ghost",
                source_id="src-phantom-888",  # NOT in audit.sources and NOT cited by any claim!
                source_name="phantom_uncited.pdf",
                text="Uncited excerpt referencing missing source.",
                page_or_section="Page 1",
                relevance_score=0.60,
            ),
        ],
        verdicts={"supported": 1},
        consistency_findings=[],
        safety_findings=[],
        summary=None,
        is_mock=False,
        created_at=created,
        completed_at=completed,
    )

    report = generate_audit_markdown_report(audit)

    # Claim evidence citation clearly flags unverified source document
    assert "[WARNING: Unverified Source Document]" in report
    assert "**Source:** `ghost_document.pdf` (Page 99) [WARNING: Unverified Source Document]" in report

    # Referenced evidence passage section also flags both unverified sources (cited and uncited)
    assert "- **[ev-ghost]** (Source: `ghost_document.pdf` [WARNING: Unverified Source Document]):" in report
    assert "- **[ev-uncited-ghost]** (Source: `phantom_uncited.pdf` [WARNING: Unverified Source Document]):" in report

    # Limitations section alerts on source provenance with exact count of absent source records
    assert "**Source Provenance Alert:** 2 evidence record(s) reference document identifiers not present in the audit's attached source list." in report


def test_evidence_records_when_no_attached_source_documents(base_timestamps):
    created, completed = base_timestamps
    audit = AuditResponse(
        audit_id="audit-no-sources",
        status=AuditStatus.COMPLETED,
        title="No Attached Sources Test",
        original_answer="Answer with evidence but no source documents attached.",
        sources=[],  # Empty sources attached to audit
        claims=[
            Claim(
                claim_id="cl-1",
                claim_text="Answer with evidence but no source documents attached.",
                start_offset=0,
                end_offset=56,
                verdict=VerdictCategory.SUPPORTED,
                explanation="Claim references evidence record.",
                confidence=0.85,
                evidence_ids=["ev-orphan-src"],
            )
        ],
        evidence=[
            Evidence(
                evidence_id="ev-orphan-src",
                source_id="src-unattached-1",
                source_name="detached_document.pdf",
                text="Detached evidence text excerpt.",
                page_or_section="Page 5",
                relevance_score=0.80,
            )
        ],
        verdicts={"supported": 1},
        consistency_findings=[],
        safety_findings=[],
        summary=None,
        is_mock=False,
        created_at=created,
        completed_at=completed,
    )

    report = generate_audit_markdown_report(audit)

    # 1. Source documents section indicates no sources attached
    assert "_No source documents were attached to this audit._" in report

    # 2. Claim evidence citation flags that no source documents are attached
    assert "[WARNING: No Attached Source Documents]" in report
    assert "**Source:** `detached_document.pdf` (Page 5) [WARNING: No Attached Source Documents]" in report

    # 3. Referenced evidence passage also flags no attached source documents
    assert "- **[ev-orphan-src]** (Source: `detached_document.pdf` [WARNING: No Attached Source Documents]):" in report

    # 4. Source provenance alert in limitations reflects the evidence record with no attached sources
    assert "**Source Provenance Alert:** 1 evidence record(s) reference document identifiers not present in the audit's attached source list." in report


def test_character_offsets_and_source_locations(base_timestamps):
    created, completed = base_timestamps
    audit = AuditResponse(
        audit_id="audit-offsets",
        status=AuditStatus.COMPLETED,
        title="Offsets Test",
        original_answer="Testing character offsets in report.",
        sources=[
            Source(
                source_id="src-1",
                filename="spec.pdf",
                file_type="pdf",
                char_count=1000,
                uploaded_at=created,
                content_snippet="Spec text",
            )
        ],
        claims=[
            Claim(
                claim_id="cl-1",
                claim_text="Testing character offsets in report.",
                start_offset=0,
                end_offset=35,
                verdict=VerdictCategory.SUPPORTED,
                explanation="Grounded with exact character bounds.",
                confidence=0.92,
                evidence_ids=["ev-offset"],
            )
        ],
        evidence=[
            Evidence(
                evidence_id="ev-offset",
                source_id="src-1",
                source_name="spec.pdf",
                text="The system operates within 25ms threshold.",
                page_or_section="Section 4.1",
                relevance_score=0.95,
                start_offset=120,
                end_offset=165,
            )
        ],
        verdicts={"supported": 1},
        consistency_findings=[],
        safety_findings=[],
        summary=None,
        is_mock=False,
        created_at=created,
        completed_at=completed,
    )

    report = generate_audit_markdown_report(audit)

    # Location string combines page/section and char offsets
    assert "(Section 4.1, chars 120-165)" in report
    assert "**Source:** `spec.pdf` (Section 4.1, chars 120-165) | *Relevance:* 95%" in report


def test_explicit_supporting_and_contradicting_evidence(base_timestamps):
    created, completed = base_timestamps
    ev_sup = Evidence(
        evidence_id="ev-sup",
        source_id="src-1",
        source_name="trial_data.pdf",
        text="Dosage 25mg is well tolerated.",
        page_or_section="Table 1",
        relevance_score=0.91,
    )
    ev_contra = Evidence(
        evidence_id="ev-contra",
        source_id="src-1",
        source_name="trial_data.pdf",
        text="Dosage exceeding 50mg leads to toxicity.",
        page_or_section="Table 2",
        relevance_score=0.89,
    )

    audit = AuditResponse(
        audit_id="audit-explicit-rel",
        status=AuditStatus.COMPLETED,
        title="Explicit Evidence Relationship Audit",
        original_answer="Dosage study evaluation with two distinct claims.",
        sources=[
            Source(
                source_id="src-1",
                filename="trial_data.pdf",
                file_type="pdf",
                char_count=2000,
                uploaded_at=created,
                content_snippet="Trial data summary",
            )
        ],
        claims=[
            Claim(
                claim_id="cl-sup",
                claim_text="Dosage 25mg is well tolerated.",
                start_offset=0,
                end_offset=30,
                verdict=VerdictCategory.SUPPORTED,
                explanation="Trial protocol confirms 25mg tolerance.",
                confidence=0.95,
                evidence_ids=["ev-sup"],
            ),
            Claim(
                claim_id="cl-contra",
                claim_text="Dosage exceeding 50mg leads to toxicity.",
                start_offset=31,
                end_offset=71,
                verdict=VerdictCategory.CONTRADICTED,
                explanation="Contradicted by safety threshold records.",
                confidence=0.90,
                evidence_ids=["ev-contra"],
            ),
        ],
        evidence=[ev_sup, ev_contra],
        verdicts={"supported": 1, "contradicted": 1},
        consistency_findings=[],
        safety_findings=[],
        summary=None,
        is_mock=False,
        created_at=created,
        completed_at=completed,
    )

    report = generate_audit_markdown_report(audit)

    # 1. With current schema lacking explicit relationship metadata, evidence receives neutral labels
    # even when claim verdicts are SUPPORTED or CONTRADICTED
    assert "[Referenced Evidence] **Source:** `trial_data.pdf` (Table 1)" in report
    assert "[Referenced Evidence] **Source:** `trial_data.pdf` (Table 2)" in report
    assert "[Supporting Evidence]" not in report
    assert "[Contradicting Evidence]" not in report

    # 2. When explicit structured relationship metadata is present on evidence, labels reflect it
    object.__setattr__(ev_sup, "relationship", "supporting")
    object.__setattr__(ev_contra, "relationship", "contradicting")

    report_with_meta = generate_audit_markdown_report(audit)
    assert "[Supporting Evidence] **Source:** `trial_data.pdf` (Table 1)" in report_with_meta
    assert "[Contradicting Evidence] **Source:** `trial_data.pdf` (Table 2)" in report_with_meta

    # 3. Explicit metadata takes precedence independently of claim machine verdicts
    object.__setattr__(ev_sup, "relationship", "contradicting")
    report_override = generate_audit_markdown_report(audit)
    assert "[Contradicting Evidence] **Source:** `trial_data.pdf` (Table 1)" in report_override


def test_preservation_of_original_machine_verdict(base_timestamps):
    created, completed = base_timestamps
    audit = AuditResponse(
        audit_id="audit-verdict-preserve",
        status=AuditStatus.COMPLETED,
        title="Verdict Preservation Test",
        original_answer="A contradicted assertion.",
        sources=[],
        claims=[
            Claim(
                claim_id="cl-1",
                claim_text="A contradicted assertion.",
                start_offset=0,
                end_offset=25,
                verdict=VerdictCategory.CONTRADICTED,
                explanation="Refuted by evidence.",
                confidence=0.99,
                evidence_ids=[],
            )
        ],
        evidence=[],
        verdicts={"contradicted": 1},
        consistency_findings=[],
        safety_findings=[],
        summary=None,
        is_mock=False,
        created_at=created,
        completed_at=completed,
    )

    report = generate_audit_markdown_report(audit)

    # Asserts original machine verdict is preserved with exact field value
    assert "### Claim 1: [CONTRADICTED]" in report
    assert "**Original Machine Verdict:** `contradicted`" in report


def test_missing_structured_human_review_documented(base_timestamps):
    created, completed = base_timestamps
    audit = AuditResponse(
        audit_id="audit-human-review-limitation",
        status=AuditStatus.COMPLETED,
        title="Human Review Limitation Test",
        original_answer="Automated pipeline output.",
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

    # Asserts honest representation of human review status and required fields
    assert "Human Review Status:" in report
    assert "The current schema contract does not capture structured human-review decisions" in report
    assert "Whether human verification or clinical oversight has occurred cannot be determined" in report
    assert "human_verdict" in report
    assert "reviewer_notes" in report
    assert "review_status" in report
    assert "review_history" in report


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


def test_executive_markdown_report_generation(complete_audit):
    report = generate_executive_markdown_report(complete_audit)
    assert "# Second Opinion — Executive Audit Summary" in report
    assert "Clinical Trial Drug Evaluation" in report
    assert "Overall Reliability Trust Score:" in report
    assert "Governance Risk Rating:" in report
    assert "Total Assertions Audited:" in report


def test_txt_report_generation(complete_audit):
    txt_detailed = generate_txt_report(complete_audit, report_type="detailed")
    assert "Second Opinion — Audit Report" in txt_detailed
    assert "Clinical Trial Drug Evaluation" in txt_detailed
    assert "**" not in txt_detailed  # Formatting stripped for plain text

    txt_exec = generate_txt_report(complete_audit, report_type="executive")
    assert "Executive Audit Summary" in txt_exec


def test_docx_report_generation(complete_audit):
    docx_detailed = generate_docx_report(complete_audit, report_type="detailed")
    assert isinstance(docx_detailed, bytes)
    assert len(docx_detailed) > 1000
    # DOCX magic bytes: PK (zip archive)
    assert docx_detailed.startswith(b"PK")

    docx_exec = generate_docx_report(complete_audit, report_type="executive")
    assert isinstance(docx_exec, bytes)
    assert docx_exec.startswith(b"PK")


def test_pdf_report_generation(complete_audit):
    pdf_detailed = generate_pdf_report(complete_audit, report_type="detailed")
    assert isinstance(pdf_detailed, bytes)
    assert len(pdf_detailed) > 500
    # PDF magic bytes: %PDF
    assert pdf_detailed.startswith(b"%PDF")

    pdf_exec = generate_pdf_report(complete_audit, report_type="executive")
    assert isinstance(pdf_exec, bytes)
    assert pdf_exec.startswith(b"%PDF")

