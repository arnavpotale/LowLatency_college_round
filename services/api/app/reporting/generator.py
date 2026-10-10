from typing import Dict, List, Set
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
        lines.extend([
            f"- **Overall Trust Score:** {audit.summary.trust_score:.1f}/100",
            f"- **Risk Assessment:** {audit.summary.risk_level.upper()}",
            f"- **Total Claims Audited:** {audit.summary.total_claims}",
            f"  - Supported: {audit.summary.supported_claims}",
            f"  - Contradicted: {audit.summary.contradicted_claims}",
            f"  - Unsupported: {audit.summary.unsupported_claims}",
            f"  - Ambiguous: {audit.summary.ambiguous_claims}",
            f"  - Inconclusive: {audit.summary.inconclusive_claims}",
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
