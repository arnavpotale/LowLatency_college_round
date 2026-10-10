import re
import uuid
from typing import List, Dict, Any, Optional


def check_numerical_consistency(
    answer_text: str,
    claims: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Scans answer text and extracted claims for high-confidence numerical inconsistencies,
    arithmetic contradictions, and temporal ordering errors.

    Scope:
      1. Partition percentage sum exceeding 100% in single distribution contexts.
      2. Internal directional contradictions (e.g. Metric X increased and decreased in same context).
      3. Timeline temporal reversals (e.g. Founded year > launch/IPO year).
      4. Linking to affected claim IDs where claims are provided.

    Note: This is a scoped deterministic consistency validator; it does not replace
    domain-specific symbolic math solvers or full constraint satisfiers.
    """
    if not answer_text or not answer_text.strip():
        return []

    findings: List[Dict[str, Any]] = []

    # 1. Check for partitioned percentages exceeding 100%
    # e.g. "45% of users chose A, 40% chose B, and 30% chose C"
    pct_pattern = re.compile(r'(\d+(?:\.\d+)?)\s*%\s*(?:of\s+[a-zA-Z\s]{2,20}?(?:chose|use|prefer|accounted|represented|are|were))', re.IGNORECASE)
    matches = pct_pattern.findall(answer_text)
    if len(matches) >= 2:
        try:
            total_pct = sum(float(m) for m in matches)
            if total_pct > 105.0:  # Allow 5% margin for rounding
                affected = []
                if claims:
                    for c in claims:
                        if "%" in c.get("claim_text", ""):
                            affected.append(c.get("claim_id", ""))
                findings.append({
                    "finding_id": f"cf_{uuid.uuid4().hex[:6]}",
                    "finding_type": "numerical_mismatch",
                    "description": f"Partitioned percentage distribution totals {total_pct:.1f}%, exceeding the mathematically valid maximum of 100%.",
                    "severity": "medium",
                    "affected_claim_ids": affected
                })
        except ValueError:
            pass

    # 2. Check for internal directional contradictions on the same entity
    # e.g., "Operating expenditures increased by 8% ... Operating expenditures decreased by 15%"
    inc_entities = set(re.findall(r'\b([a-zA-Z\s]{3,25}?)\s+(?:increased|rose|grew|expanded)\s+by\s+\d+', answer_text, re.IGNORECASE))
    dec_entities = set(re.findall(r'\b([a-zA-Z\s]{3,25}?)\s+(?:decreased|declined|dropped|fell)\s+by\s+\d+', answer_text, re.IGNORECASE))
    
    clean_inc = {e.strip().lower() for e in inc_entities if len(e.strip()) > 3}
    clean_dec = {e.strip().lower() for e in dec_entities if len(e.strip()) > 3}
    conflicted = clean_inc.intersection(clean_dec)
    
    for entity in conflicted:
        affected = []
        if claims:
            for c in claims:
                c_text = c.get("claim_text", "").lower()
                if entity in c_text and ("increase" in c_text or "decrease" in c_text or "decline" in c_text or "rose" in c_text):
                    affected.append(c.get("claim_id", ""))
        findings.append({
            "finding_id": f"cf_{uuid.uuid4().hex[:6]}",
            "finding_type": "internal_contradiction",
            "description": f"Internal directional contradiction: '{entity}' is asserted to both increase and decrease within the same answer context.",
            "severity": "high",
            "affected_claim_ids": affected
        })

    # 3. Check for temporal ordering inversions
    # e.g., "Founded in 2025, the company launched its core platform in 2020."
    founding_match = re.search(r'\b(?:founded|incorporated|established|created)\s+(?:in|during)\s+(\d{4})\b', answer_text, re.IGNORECASE)
    subsequent_match = re.search(r'\b(?:went\s+public|launched|acquired|ipoed|released)(?:[a-zA-Z0-9_\-\s]{0,35}?)\s+(?:in|during)\s+(\d{4})\b', answer_text, re.IGNORECASE)
    if founding_match and subsequent_match:
        f_year = int(founding_match.group(1))
        s_year = int(subsequent_match.group(1))
        if f_year > s_year:
            findings.append({
                "finding_id": f"cf_{uuid.uuid4().hex[:6]}",
                "finding_type": "temporal_inconsistency",
                "description": f"Temporal inversion: Founding year ({f_year}) occurs after reported milestone year ({s_year}).",
                "severity": "medium",
                "affected_claim_ids": []
            })

    return findings
