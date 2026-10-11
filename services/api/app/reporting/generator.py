import io
import re
from typing import Dict, List, Set, Optional
import docx
import pymupdf
from app.schemas import AuditResponse, Evidence, Claim, VerdictCategory


def format_inline_code(value: str) -> str:
    """
    Safely formats an untrusted string as a Markdown inline code span.
    Handles embedded backticks by using a delimiter longer than any backtick sequence in the value,
    with padding per CommonMark specification.
    """
    val = str(value)
    if "`" not in val:
        return f"`{val}`"
    max_ticks = 0
    curr = 0
    for ch in val:
        if ch == "`":
            curr += 1
            if curr > max_ticks:
                max_ticks = curr
        else:
            curr = 0
    delim = "`" * (max_ticks + 1)
    return f"{delim} {val} {delim}"


def get_evidence_relationship(ev: Evidence) -> str:
    """
    Determines whether evidence is supporting or contradicting ONLY when
    the individual evidence record explicitly establishes that relationship
    in its structured attributes.
    Never infers relationships from claim verdicts, raw text, or explanations.
    """
    rel_attr = getattr(ev, "relationship", None) or getattr(ev, "polarity", None)
    if rel_attr:
        rel_str = str(rel_attr).strip().lower()
        if rel_str in ("supporting", "support", "supported"):
            return "Supporting Evidence"
        if rel_str in ("contradicting", "contradict", "contradicted", "refuting", "refutes"):
            return "Contradicting Evidence"

    return "Referenced Evidence"


def format_location_string(ev: Evidence) -> str:
    """
    Formats page/section and character offsets if present.
    """
    s_off = getattr(ev, "start_offset", None) if getattr(ev, "start_offset", None) is not None else getattr(ev, "start_char", None)
    e_off = getattr(ev, "end_offset", None) if getattr(ev, "end_offset", None) is not None else getattr(ev, "end_char", None)

    loc_parts = []
    if ev.page_or_section and ev.page_or_section.strip():
        loc_parts.append(ev.page_or_section.strip())
    if s_off is not None and e_off is not None:
        loc_parts.append(f"chars {s_off}-{e_off}")

    return f" ({', '.join(loc_parts)})" if loc_parts else ""


def generate_audit_markdown_report(audit: AuditResponse) -> str:
    """
    Generates a structured, human-readable, deterministic Markdown audit report
    from an AuditResponse.
    """
    title_text = audit.title.strip() if audit.title and audit.title.strip() else "Untitled Audit"
    lines: List[str] = [
        "# Second Opinion — Audit Report",
        "",
        "## Audit Metadata",
        f"- **Title:** {title_text}",
        f"- **Audit ID:** `{audit.audit_id}`",
        f"- **Status:** {audit.status.value.upper()}",
        f"- **Created:** {audit.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}",
    ]

    if audit.completed_at:
        lines.append(f"- **Completed:** {audit.completed_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    else:
        lines.append("- **Completed:** N/A")

    if audit.is_mock:
        lines.extend([
            "- **Mode:** MOCK SIMULATION",
            "",
            "> **MOCK SIMULATION NOTICE**: This audit report contains simulated verification results "
            "generated for development, testing, or evaluation purposes. Findings have not been validated "
            "against live production models.",
        ])
    else:
        lines.extend([
            "- **Mode:** LIVE AI VERIFICATION",
        ])

    lines.extend([
        "",
        "---",
        "## Source Documents",
    ])

    attached_source_ids: Set[str] = set()
    if audit.sources:
        for src in audit.sources:
            attached_source_ids.add(src.source_id)
            lines.append(
                f"- **{format_inline_code(src.filename)}** ({src.file_type.upper()} | {src.char_count:,} characters)"
            )
            if src.content_snippet and src.content_snippet.strip():
                snippet = src.content_snippet.strip().replace("\n", " ")
                lines.append(f"  - *Snippet:* \"{snippet}\"")
    else:
        lines.append("_No source documents were attached to this audit._")

    lines.extend([
        "",
        "---",
        "## Executive Summary",
    ])

    if audit.summary:
        if audit.summary.trust_score is not None:
            score_line = f"- **Overall Trust Score:** {audit.summary.trust_score:.1f}/100"
        else:
            score_line = "- **Overall Trust Score:** N/A (no decisive claims)"

        decisive_claims_cnt = (
            audit.summary.decisive_claims
            if getattr(audit.summary, "decisive_claims", 0)
            else (audit.summary.supported_claims + audit.summary.contradicted_claims + audit.summary.unsupported_claims)
        )
        lines.extend([
            score_line,
            f"- **Risk Assessment:** {audit.summary.risk_level.upper()}",
            f"- **Total Claims Audited:** {audit.summary.total_claims}",
            f"  - Supported: {audit.summary.supported_claims}",
            f"  - Contradicted: {audit.summary.contradicted_claims}",
            f"  - Unsupported: {audit.summary.unsupported_claims}",
            f"  - Ambiguous: {audit.summary.ambiguous_claims}",
            f"  - Inconclusive: {audit.summary.inconclusive_claims}",
            f"- **Decisively Evaluated Claims:** {decisive_claims_cnt}",
            f"  - *Trust Score Formula:* Supported ÷ (Supported + Contradicted + Unsupported) × 100. Ambiguous and inconclusive assertions are excluded from coverage denominator.",
        ])
        if audit.summary.key_takeaway and audit.summary.key_takeaway.strip():
            takeaway_lines = audit.summary.key_takeaway.strip().splitlines()
            if takeaway_lines:
                lines.append("")
                lines.append(f"> **Key Takeaway:** {takeaway_lines[0]}")
                for t_line in takeaway_lines[1:]:
                    lines.append(f"> {t_line}")
    else:
        total_claims = len(audit.claims)
        lines.append(f"- **Total Claims Audited:** {total_claims}")
        if total_claims > 0:
            # Derive counts directly from claims to ensure consistency with total_claims
            counts: Dict[str, int] = {}
            for cl in audit.claims:
                counts[cl.verdict.value] = counts.get(cl.verdict.value, 0) + 1
            for verdict_key, count in sorted(counts.items()):
                lines.append(f"  - {verdict_key.title()}: {count}")
        elif audit.verdicts:
            for verdict_key, count in sorted(audit.verdicts.items()):
                lines.append(f"  - {verdict_key.title()}: {count}")
        lines.append("- *Notice:* Executive summary metrics not available for this session.")

    raw_answer = audit.original_answer if audit.original_answer and audit.original_answer.strip() else "(No answer text submitted)"
    max_ticks = 0
    current_ticks = 0
    for ch in raw_answer:
        if ch == '`':
            current_ticks += 1
            if current_ticks > max_ticks:
                max_ticks = current_ticks
        else:
            current_ticks = 0
    fence = "`" * max(3, max_ticks + 1)

    lines.extend([
        "",
        "---",
        "## Original AI-Generated Answer",
        fence,
        raw_answer,
        fence,
        "",
        "---",
        "## Detailed Claim Findings",
    ])

    evidence_map: Dict[str, Evidence] = {ev.evidence_id: ev for ev in audit.evidence}
    unresolved_citation_ids: Set[str] = set()

    # Count all evidence records referencing source IDs absent from the audit's attached sources
    if attached_source_ids:
        unverified_evidence_records = [
            ev for ev in audit.evidence if ev.source_id not in attached_source_ids
        ]
    else:
        unverified_evidence_records = list(audit.evidence)
    unverified_source_count = len(unverified_evidence_records)

    if not audit.claims:
        lines.append("_No claims were extracted or evaluated for this audit._")
    else:
        for i, claim in enumerate(audit.claims, 1):
            verdict_badge = claim.verdict.value.upper()
            confidence_pct = int(round(claim.confidence * 100))
            lines.extend([
                f"### Claim {i}: [{verdict_badge}]",
                f"- **Claim Text:** \"{claim.claim_text}\"",
                f"- **Original Machine Verdict:** `{claim.verdict.value}`",
                f"- **Confidence:** {confidence_pct}%",
                f"- **Character Offset:** [{claim.start_offset}:{claim.end_offset}]",
                f"- **Explanation:** {claim.explanation}",
                "- **Evidence Citations:**",
            ])

            if claim.evidence_ids:
                for ev_id in claim.evidence_ids:
                    if ev_id in evidence_map:
                        ev = evidence_map[ev_id]
                        rel_pct = int(round(ev.relevance_score * 100))
                        loc_str = format_location_string(ev)
                        rel_label = get_evidence_relationship(ev)

                        src_status = ""
                        if attached_source_ids and ev.source_id not in attached_source_ids:
                            src_status = " [WARNING: Unverified Source Document]"
                        elif not attached_source_ids:
                            src_status = " [WARNING: No Attached Source Documents]"

                        lines.append(
                            f"  - [{rel_label}] **Source:** {format_inline_code(ev.source_name)}{loc_str}{src_status} | *Relevance:* {rel_pct}% (ID: `{ev.evidence_id}`)"
                        )
                        text_lines = ev.text.strip().splitlines()
                        if not text_lines:
                            lines.append("    > \"\"")
                        elif len(text_lines) == 1:
                            lines.append(f"    > \"{text_lines[0]}\"")
                        else:
                            for idx, t_line in enumerate(text_lines):
                                if idx == 0:
                                    lines.append(f"    > \"{t_line}")
                                elif idx == len(text_lines) - 1:
                                    lines.append(f"    > {t_line}\"")
                                else:
                                    lines.append(f"    > {t_line}")
                    else:
                        unresolved_citation_ids.add(ev_id)
                        lines.append(
                            f"  - *Unresolved Citation:* Evidence ID {format_inline_code(ev_id)} not found in evidence catalog."
                        )
            else:
                lines.append("  - _No direct evidence citations linked to this claim._")
            lines.append("")

    if audit.consistency_findings:
        lines.extend([
            "---",
            "## Consistency Findings",
        ])
        for cf in audit.consistency_findings:
            title = cf.finding_type.replace("_", " ").title()
            lines.append(f"- **{title}** [{cf.severity.upper()}]: {cf.description}")
            if cf.affected_claim_ids:
                claim_ids_str = ", ".join(format_inline_code(cid) for cid in cf.affected_claim_ids)
                lines.append(f"  - *Affected Claims:* {claim_ids_str}")
        lines.append("")

    if audit.safety_findings:
        lines.extend([
            "---",
            "## Safety & Liability Warnings",
        ])
        for sf in audit.safety_findings:
            category_title = sf.category.replace("_", " ").title()
            lines.append(f"- **{category_title}** [{sf.severity.upper()}]: {sf.description}")
            if sf.recommendation and sf.recommendation.strip():
                lines.append(f"  - *Recommendation:* {sf.recommendation.strip()}")
        lines.append("")

    if audit.evidence:
        lines.extend([
            "---",
            "## Referenced Evidence Passages",
        ])
        for ev in audit.evidence:
            s_off = getattr(ev, 'start_offset', None) if getattr(ev, 'start_offset', None) is not None else getattr(ev, 'start_char', None)
            e_off = getattr(ev, 'end_offset', None) if getattr(ev, 'end_offset', None) is not None else getattr(ev, 'end_char', None)
            loc = f" (chars {s_off}-{e_off})" if s_off is not None and e_off is not None else ""
            src_flag = ""
            if attached_source_ids and ev.source_id not in attached_source_ids:
                src_flag = " [WARNING: Unverified Source Document]"
            elif not attached_source_ids:
                src_flag = " [WARNING: No Attached Source Documents]"
            lines.append(
                f"- **[{ev.evidence_id}]** (Source: {format_inline_code(ev.source_name)}{loc}{src_flag}): \"{ev.text.strip()}\""
            )
        lines.append("")

    # Audit Limitations & Review Status
    lines.extend([
        "---",
        "## Audit Limitations & Verification Scope",
    ])

    if audit.is_mock:
        lines.append(
            "- **Mode Caveat:** Simulation mode is enabled (`is_mock=True`). Findings were generated via simulation or test fixtures and have not been validated by production neural NLI or LLM models."
        )
    else:
        lines.append(
            "- **Verification Mode:** Non-simulation mode reported (`is_mock=False`). Automated pipeline records indicate standard processing rather than mock fixtures."
        )

    lines.append(
        "- **Human Review Status:** The current schema contract does not capture structured human-review decisions, reviewer notes, or review history. Whether human verification or clinical oversight has occurred cannot be determined from this record alone. (Schema fields required for full human audit lifecycle: `human_verdict`, `reviewer_notes`, `review_status`, and `review_history`)."
    )

    unsupported_count = sum(1 for c in audit.claims if c.verdict == VerdictCategory.UNSUPPORTED)
    ambiguous_count = sum(1 for c in audit.claims if c.verdict == VerdictCategory.AMBIGUOUS)
    inconclusive_count = sum(1 for c in audit.claims if c.verdict == VerdictCategory.INCONCLUSIVE)
    if unsupported_count or ambiguous_count or inconclusive_count:
        lines.append(
            f"- **Claim Grounding Limitations:** {unsupported_count + ambiguous_count + inconclusive_count} of {len(audit.claims)} claim(s) lack definitive factual verification ({unsupported_count} unsupported, {ambiguous_count} ambiguous, {inconclusive_count} inconclusive). These claims should not be treated as fully verified facts without manual source inspection."
        )
    elif audit.claims:
        lines.append(
            "- **Claim Grounding Coverage:** 100% of audited claims were decisively grounded against referenced evidence."
        )

    if unresolved_citation_ids:
        lines.append(
            f"- **Citation Integrity Alert:** {len(unresolved_citation_ids)} cited evidence ID(s) could not be resolved in the audit's evidence catalog."
        )
    if unverified_source_count > 0:
        lines.append(
            f"- **Source Provenance Alert:** {unverified_source_count} evidence record(s) reference document identifiers not present in the audit's attached source list."
        )

    lines.append("")
    return "\n".join(lines).strip() + "\n"


def generate_executive_markdown_report(audit: AuditResponse) -> str:
    """
    Generates a concise, high-level executive audit summary focusing on key risk metrics,
    verdict distributions, critical contradictions, and governance recommendations.
    """
    title_text = audit.title.strip() if audit.title and audit.title.strip() else "Untitled Audit"
    score_str = (
        f"{audit.summary.trust_score:.1f} / 100"
        if (audit.summary and audit.summary.trust_score is not None)
        else "N/A"
    )
    risk = audit.summary.risk_level.upper() if audit.summary and audit.summary.risk_level else "UNKNOWN"

    lines: List[str] = [
        "# Second Opinion — Executive Audit Summary",
        "",
        "## Executive Overview",
        f"- **Audit Title:** {title_text}",
        f"- **Audit ID:** `{audit.audit_id}`",
        f"- **Audit Status:** {audit.status.value.upper()}",
        f"- **Audit Date:** {audit.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"- **Overall Reliability Trust Score:** {score_str}",
        f"- **Governance Risk Rating:** {risk}",
        "",
        "---",
        "## Summary of Findings",
    ]

    if audit.summary:
        decisive_claims_cnt = (
            audit.summary.decisive_claims
            if getattr(audit.summary, "decisive_claims", 0)
            else (audit.summary.supported_claims + audit.summary.contradicted_claims + audit.summary.unsupported_claims)
        )
        lines.extend([
            f"- **Total Assertions Audited:** {audit.summary.total_claims}",
            f"- **Decisively Evaluated Claims:** {decisive_claims_cnt}",
            f"- **Fully Corroborated (Supported):** {audit.summary.supported_claims}",
            f"- **Factual Contradictions:** {audit.summary.contradicted_claims}",
            f"- **Ungrounded (Unsupported):** {audit.summary.unsupported_claims}",
            f"- **Source Disagreements (Ambiguous):** {audit.summary.ambiguous_claims}",
            f"- **Inconclusive Context:** {audit.summary.inconclusive_claims}",
            f"- **Scoring Method:** Supported ÷ (Supported + Contradicted + Unsupported) × 100",
        ])
    lines.append("")

    # Flagged critical assertions
    flagged = [c for c in audit.claims if c.verdict in (VerdictCategory.CONTRADICTED, VerdictCategory.AMBIGUOUS)]
    if flagged:
        lines.extend([
            "---",
            "## Critical Assertions Requiring Remediation",
            "",
        ])
        for i, c in enumerate(flagged, 1):
            lines.append(f"### Assertion #{i:02d}: [{c.verdict.value.upper()}]")
            lines.append(f"> \"{c.claim_text.strip()}\"")
            lines.append("")
            lines.append(f"- **Audit Finding:** {c.explanation.strip()}")
            if c.conflict:
                lines.append(f"- **Cross-Source Conflict:** {c.conflict.description.strip()}")
            if c.autopsy and c.autopsy.diagnosis:
                lines.append(f"- **Forensic Autopsy:** {c.autopsy.diagnosis.strip()}")
            lines.append("")
    else:
        lines.extend([
            "---",
            "## Risk Assessment",
            "No direct factual contradictions or cross-source ambiguities were detected in the audited material.",
            "",
        ])

    lines.extend([
        "---",
        "## Actionable Governance Recommendations",
    ])
    if audit.summary and audit.summary.contradicted_claims > 0:
        lines.append("- **REJECT OR REVISE:** One or more assertions directly contradict authoritative reference documentation. Correct the underlying model generation before external dissemination.")
    elif audit.summary and audit.summary.unsupported_claims > 0:
        lines.append("- **GROUNDING CAUTION:** Gaps in evidence grounding identified. Attach supplementary reference materials or seek manual subject-matter review.")
    else:
        lines.append("- **VERIFIED:** All assertions are corroborated by attached reference documentation. Low compliance risk.")

    lines.append("")
    return "\n".join(lines).strip() + "\n"


def generate_txt_report(audit: AuditResponse, report_type: str = "detailed") -> str:
    """
    Generates a clean plain-text ASCII formatted audit report.
    """
    md = generate_executive_markdown_report(audit) if report_type == "executive" else generate_audit_markdown_report(audit)
    txt = re.sub(r'#+\s*', '', md)
    txt = re.sub(r'\*\*(.*?)\*\*', r'\1', txt)
    txt = re.sub(r'`(.*?)`', r'\1', txt)
    txt = re.sub(r'---', '------------------------------------------------------------', txt)
    return txt.strip() + "\n"


def generate_docx_report(audit: AuditResponse, report_type: str = "detailed") -> bytes:
    """
    Generates a formatted native DOCX (.docx) document for the audit.
    """
    doc = docx.Document()
    title = audit.title.strip() if audit.title and audit.title.strip() else "Untitled Audit"

    if report_type == "executive":
        doc.add_heading("Second Opinion — Executive Audit Summary", 0)
        doc.add_heading(f"Audit Title: {title}", level=1)
        doc.add_paragraph(f"Audit ID: {audit.audit_id}")
        doc.add_paragraph(f"Date: {audit.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        if audit.summary:
            score_disp = f"{audit.summary.trust_score:.1f} / 100" if audit.summary.trust_score is not None else "N/A"
            doc.add_paragraph(f"Reliability Trust Score: {score_disp} | Risk: {audit.summary.risk_level.upper()}")
            p_stats = doc.add_paragraph()
            p_stats.add_run(f"Assertions Audited: {audit.summary.total_claims} | ")
            p_stats.add_run(f"Supported: {audit.summary.supported_claims} | ")
            p_stats.add_run(f"Contradicted: {audit.summary.contradicted_claims} | ")
            p_stats.add_run(f"Unsupported: {audit.summary.unsupported_claims}")

        flagged = [c for c in audit.claims if c.verdict in (VerdictCategory.CONTRADICTED, VerdictCategory.AMBIGUOUS)]
        if flagged:
            doc.add_heading("Critical Assertions Requiring Remediation", level=2)
            for c in flagged:
                p = doc.add_paragraph()
                p.add_run(f"[{c.verdict.value.upper()}] ").bold = True
                p.add_run(f"\"{c.claim_text}\"\n")
                p.add_run(f"Audit Finding: {c.explanation}\n")
                if c.autopsy and c.autopsy.diagnosis:
                    p.add_run(f"Autopsy Diagnosis: {c.autopsy.diagnosis}")
    else:
        doc.add_heading("Second Opinion — Forensic Audit Dossier", 0)
        doc.add_heading(f"Audit Title: {title}", level=1)
        doc.add_paragraph(f"Audit ID: {audit.audit_id}")
        doc.add_paragraph(f"Status: {audit.status.value.upper()}")
        doc.add_paragraph(f"Date: {audit.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        if audit.summary:
            score_disp = f"{audit.summary.trust_score:.1f} / 100" if audit.summary.trust_score is not None else "N/A"
            doc.add_paragraph(f"Trust Score: {score_disp} | Risk: {audit.summary.risk_level.upper()}")

        doc.add_heading("Complete Claim Register", level=2)
        for i, c in enumerate(audit.claims, 1):
            p = doc.add_paragraph()
            p.add_run(f"Claim #{i:02d} [{c.verdict.value.upper()}] ").bold = True
            p.add_run(f"\"{c.claim_text}\"\n")
            p.add_run(f"Audit Finding: {c.explanation}\n")
            if c.evidence_ids:
                p.add_run(f"Referenced Citations: {', '.join(c.evidence_ids)}\n")
            if c.autopsy and c.autopsy.diagnosis:
                p.add_run(f"Forensic Autopsy: {c.autopsy.diagnosis}\n")

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def generate_pdf_report(audit: AuditResponse, report_type: str = "detailed") -> bytes:
    """
    Generates a structured native PDF document using PyMuPDF.
    """
    pdf_doc = pymupdf.open()
    title = audit.title.strip() if audit.title and audit.title.strip() else "Untitled Audit"
    md_content = generate_executive_markdown_report(audit) if report_type == "executive" else generate_audit_markdown_report(audit)

    clean_lines = []
    for line in md_content.splitlines():
        l = re.sub(r'\*\*(.*?)\*\*', r'\1', line)
        l = re.sub(r'`(.*?)`', r'\1', l)
        clean_lines.append(l)

    lines_per_page = 46
    chunks = [clean_lines[i:i + lines_per_page] for i in range(0, max(1, len(clean_lines)), lines_per_page)]

    for page_idx, chunk in enumerate(chunks):
        page = pdf_doc.new_page(width=595, height=842)
        y = 48
        page.insert_text((50, y), f"SECOND OPINION | {title.upper()} | PAGE {page_idx + 1} OF {len(chunks)}", fontsize=8, color=(0.4, 0.4, 0.4))
        y += 26

        for line in chunk:
            if line.startswith("# "):
                page.insert_text((50, y), line[2:], fontsize=15, fontname="helv", color=(0.05, 0.1, 0.2))
                y += 22
            elif line.startswith("## "):
                page.insert_text((50, y), line[3:], fontsize=11, fontname="helv", color=(0.1, 0.2, 0.3))
                y += 18
            elif line.startswith("### "):
                page.insert_text((50, y), line[4:], fontsize=9.5, fontname="helv", color=(0.15, 0.25, 0.35))
                y += 15
            elif line.startswith("---"):
                page.draw_line((50, y), (545, y), color=(0.8, 0.8, 0.8), width=0.5)
                y += 14
            else:
                text_to_print = line
                if len(text_to_print) > 92:
                    sub_lines = [text_to_print[j:j+88] for j in range(0, len(text_to_print), 88)]
                    for sl in sub_lines:
                        page.insert_text((50, y), sl, fontsize=8.5, fontname="helv", color=(0.15, 0.15, 0.15))
                        y += 12.5
                else:
                    page.insert_text((50, y), text_to_print, fontsize=8.5, fontname="helv", color=(0.15, 0.15, 0.15))
                    y += 12.5

    return pdf_doc.tobytes()

