from typing import Dict, Any
from app.schemas import AuditResponse


def generate_audit_markdown_report(audit: AuditResponse) -> str:
    """
    Generates a structured, human-readable markdown audit report from an AuditResponse.
    """
    lines = [
        f"# Second Opinion — Audit Report",
        f"**Audit ID:** `{audit.audit_id}`",
        f"**Date:** {audit.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"**Status:** {audit.status.value.upper()}",
        f"**Mode:** {'[MOCK SIMULATION]' if audit.is_mock else '[LIVE AI VERIFICATION]'}",
        "",
        "---",
        "## Executive Summary",
    ]

    if audit.summary:
        lines.extend([
            f"- **Overall Trust Score:** {audit.summary.trust_score}/100",
            f"- **Risk Assessment:** {audit.summary.risk_level.upper()}",
            f"- **Total Claims Audited:** {audit.summary.total_claims}",
            f"  - Supported: {audit.summary.supported_claims}",
            f"  - Contradicted: {audit.summary.contradicted_claims}",
            f"  - Unsupported: {audit.summary.unsupported_claims}",
            f"  - Ambiguous: {audit.summary.ambiguous_claims}",
            f"  - Inconclusive: {audit.summary.inconclusive_claims}",
            "",
            f"> {audit.summary.key_takeaway}",
            ""
        ])

    lines.extend([
        "---",
        "## Original AI-Generated Answer",
        "```",
        audit.original_answer or "(No answer text submitted)",
        "```",
        "",
        "---",
        "## Detailed Claim Findings",
    ])

    for i, claim in enumerate(audit.claims, 1):
        verdict_badge = claim.verdict.value.upper()
        lines.extend([
            f"### Claim {i}: [{verdict_badge}]",
            f"**Claim Text:** \"{claim.claim_text}\"",
            f"**Confidence:** {int(claim.confidence * 100)}%",
            f"**Character Offset:** [{claim.start_offset}:{claim.end_offset}]",
            f"**Explanation:** {claim.explanation}",
            ""
        ])

    if audit.consistency_findings:
        lines.extend([
            "---",
            "## Consistency Findings",
        ])
        for cf in audit.consistency_findings:
            lines.extend([
                f"- **{cf.finding_type.replace('_', ' ').title()}** [{cf.severity.upper()}]: {cf.description}"
            ])
        lines.append("")

    if audit.safety_findings:
        lines.extend([
            "---",
            "## Safety & Liability Warnings",
        ])
        for sf in audit.safety_findings:
            lines.extend([
                f"- **{sf.category.replace('_', ' ').title()}** [{sf.severity.upper()}]: {sf.description}",
                f"  *Recommendation:* {sf.recommendation}"
            ])
        lines.append("")

    return "\n".join(lines)
