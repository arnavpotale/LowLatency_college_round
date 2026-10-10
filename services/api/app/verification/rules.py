import re
import uuid
from typing import List, Dict, Any, Tuple, Optional, Set
from app.schemas import VerdictCategory, Evidence, ConflictDetail, ClaimAutopsySchema
from app.verification.types import (
    PairRelation,
    PairNLIResult,
    ClaimVerificationResult,
    InvalidCitationError,
)

# Regex pattern for quantities: handles comma-separated numbers, currency symbols, degree symbols, and units
QUANTITY_PATTERN = re.compile(
    r'(?P<prefix>[\$€£]?)\s*(?P<num>\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?P<unit>[°]?[a-zA-Z%]+(?:\s*[a-zA-Z]+)?)?',
    re.IGNORECASE
)

# Common stopwords to exclude from content-word overlap calculations
STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "up", "about", "into", "over", "after", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did", "can", "could",
    "shall", "should", "will", "would", "may", "might", "must", "it", "its", "they",
    "them", "their", "this", "that", "these", "those", "which", "who", "whom", "what",
    "when", "where", "why", "how", "all", "each", "every", "both", "few", "more",
    "most", "other", "some", "such", "than", "too", "very", "as", "if"
}

# Unit normalizations
UNIT_NORMALIZATION = {
    "%": "%",
    "percent": "%",
    "percentage": "%",
    "m": "million",
    "million": "million",
    "b": "billion",
    "billion": "billion",
    "k": "thousand",
    "thousand": "thousand",
    "mg": "mg",
    "g": "g",
    "grams": "g",
    "kg": "kg",
    "day": "day",
    "days": "day",
    "hour": "hour",
    "hours": "hour",
    "second": "second",
    "seconds": "second",
    "month": "month",
    "months": "month",
    "year": "year",
    "years": "year",
    "week": "week",
    "weeks": "week",
    "decade": "decade",
    "decades": "decade",
    "c": "c",
    "celsius": "c",
    "participant": "participant",
    "participants": "participant",
    "node": "node",
    "nodes": "node",
    "foot": "foot",
    "feet": "foot",
    "dollar": "$",
    "dollars": "$",
    "usd": "$",
}

# Polarity and semantic conflict pairs
POLARITY_CONFLICT_PAIRS = [
    (re.compile(r'\b(no|zero|without any)\s+contraindication', re.IGNORECASE),
     re.compile(r'\b(strictly\s+)?contraindicated\b', re.IGNORECASE),
     "Claim asserts no contraindications, but source specifies it is contraindicated."),
    (re.compile(r'\b(unnecessary|not\s+required|not\s+needed|no\s+need|optional|voluntary)\b', re.IGNORECASE),
     re.compile(r'\b(required|mandatory|necessary|strictly\s+advise|must|under\s+supervision)\b', re.IGNORECASE),
     "Claim asserts action is unnecessary or optional, but source specifies it is required/mandatory."),
    (re.compile(r'\b(required|mandatory|necessary|must)\b', re.IGNORECASE),
     re.compile(r'\b(optional|voluntary|not\s+required|not\s+needed|unnecessary|sidecarless)\b', re.IGNORECASE),
     "Contradiction: Claim asserts action is required/mandatory, but source specifies it is optional or not required."),
    (re.compile(r'\b(retained|stable|stability|maintained)\b', re.IGNORECASE),
     re.compile(r'\b(rapid\s+efficiency\s+drop|drop|degrading|degraded|degradation|loss\s+of)\b', re.IGNORECASE),
     "Contradiction: Claim asserts stability or retention, but source documents degradation or drop."),
    (re.compile(r'\b(reduced|decrease|decreased|reduction|drop|declined)\b', re.IGNORECASE),
     re.compile(r'\b(no\s+reduction|no\s+decrease|zero\s+reduction|failed\s+to\s+reduce|not\s+reduce)\b', re.IGNORECASE),
     "Contradiction: Claim asserts reduction or decrease, but source observed no reduction."),
    (re.compile(r'\b(improved|benefited|effective|efficacy|cured|curable)\b', re.IGNORECASE),
     re.compile(r'\b(no\s+improvement|no\s+benefit|ineffective|placebo\s+equivalence|incurable|no\s+cure)\b', re.IGNORECASE),
     "Contradiction: Claim asserts efficacy or cure, but source observed no benefit, placebo equivalence, or incurable status."),
    (re.compile(r'\b(non-toxic|completely\s+safe|entirely\s+safe|zero\s+risk|safe\s+for)\b', re.IGNORECASE),
     re.compile(r'\b(severe\s+risk|toxic|adverse\s+events?|crisis|danger|harmful|strictly\s+prohibited)\b', re.IGNORECASE),
     "Claim asserts safety or non-toxicity, but source warns of severe risk, toxicity, or strict prohibition."),
    (re.compile(r'\b(dropped|decreased|reduced|fell|declined|drop)\b', re.IGNORECASE),
     re.compile(r'\b(increased|rose|grew|surged|jumped|increase)\b', re.IGNORECASE),
     "Directional contradiction: Claim describes a decrease, but source documents an increase."),
    (re.compile(r'\b(increased|rose|grew|surged|jumped|increase)\b', re.IGNORECASE),
     re.compile(r'\b(dropped|decreased|reduced|fell|declined|drop)\b', re.IGNORECASE),
     "Directional contradiction: Claim describes an increase, but source documents a decrease."),
    (re.compile(r'\b(approved|licensed|authorized|fda-approved)\b', re.IGNORECASE),
     re.compile(r'\b(unapproved|not\s+approved|banned|prohibited|rejected)\b', re.IGNORECASE),
     "Contradiction: Claim asserts approval or licensing, but source specifies it is unapproved or banned."),
    (re.compile(r'\b(free|zero\s+cost|complimentary)\b', re.IGNORECASE),
     re.compile(r'\b(fee\s+required|paid|subscription\s+required|charges\s+apply)\b', re.IGNORECASE),
     "Contradiction: Claim asserts free service, but source specifies fees or subscription required."),
    (re.compile(r'\b(unlimited|infinite)\b', re.IGNORECASE),
     re.compile(r'\b(limited|capped|restricted|maximum\s+of)\b', re.IGNORECASE),
     "Contradiction: Claim asserts unlimited access, but source specifies limits or caps."),
    (re.compile(r'\b(compatible|interoperable)\b', re.IGNORECASE),
     re.compile(r'\b(incompatible|unsupported|breaks\s+compatibility)\b', re.IGNORECASE),
     "Contradiction: Claim asserts compatibility, but source specifies incompatibility."),
    (re.compile(r'\b(synchronous)\b', re.IGNORECASE),
     re.compile(r'\b(asynchronous)\b', re.IGNORECASE),
     "Contradiction: Claim asserts synchronous operation, but source specifies asynchronous replication/operation."),
    (re.compile(r'\b(asynchronous)\b', re.IGNORECASE),
     re.compile(r'\b(synchronous)\b', re.IGNORECASE),
     "Contradiction: Claim asserts asynchronous operation, but source specifies synchronous operation."),
]



def stem_word(w: str) -> str:
    """Lightweight deterministic suffix-trimming stemmer (zero external dependencies)."""
    w = w.lower().strip()
    if len(w) <= 4:
        return w
    for suffix in ["tion", "ment", "ness", "able", "ible", "ies", "ing", "ed", "es", "al", "ly", "s"]:
        if len(w) > len(suffix) + 3 and w.endswith(suffix):
            return w[:-len(suffix)]
    return w


def extract_quantities(text: str) -> List[Dict[str, Any]]:
    """Extracts numerical quantities, units, and nearby directional cues."""
    quantities = []
    text_lower = text.lower()

    for match in QUANTITY_PATTERN.finditer(text):
        num_str = match.group("num").replace(",", "")
        raw_unit = (match.group("unit") or "").strip().lower()
        prefix = match.group("prefix") or ""

        try:
            val = float(num_str)
        except ValueError:
            continue

        # Normalize unit
        if "%" in raw_unit or (match.end() < len(text) and text[match.end():match.end()+1] == "%"):
            unit_str = "%"
        else:
            clean_unit = raw_unit.replace("°", "").strip()
            unit_tokens = re.findall(r'[a-zA-Z]+', clean_unit)
            if unit_tokens:
                if unit_tokens[0] == "per" and len(unit_tokens) > 1:
                    rate_period = UNIT_NORMALIZATION.get(unit_tokens[1], unit_tokens[1])
                    unit_str = f"per_{rate_period}"
                elif unit_tokens[0] not in ["in", "by", "of", "to", "at", "for", "from", "with", "per"]:
                    unit_candidate = unit_tokens[0]
                    unit_str = UNIT_NORMALIZATION.get(unit_candidate, unit_candidate)
                else:
                    unit_str = ""
            else:
                unit_str = ""

        # Normalize scale multipliers (million, billion, etc.)
        scale = 1.0
        if unit_str == "million" or raw_unit.startswith("m"):
            scale = 1_000_000.0
        elif unit_str == "billion" or raw_unit.startswith("b"):
            scale = 1_000_000_000.0
        elif unit_str == "thousand" or raw_unit.startswith("k"):
            scale = 1_000.0

        # Look for directional or qualifier context in 40 characters surrounding match
        start_ctx = max(0, match.start() - 35)
        end_ctx = min(len(text), match.end() + 35)
        ctx = text_lower[start_ctx:end_ctx]

        qualifier = "neutral"
        if any(w in ctx for w in ["max", "maximum", "exceed", "limit", "safe up to", "not exceed"]):
            qualifier = "maximum"
        elif any(w in ctx for w in ["min", "minimum", "at least", "no less than"]):
            qualifier = "minimum"
        elif any(w in ctx for w in ["initial", "starting", "recommended"]):
            qualifier = "recommended"
        elif any(w in ctx for w in ["increase", "increased", "growth", "rose", "jumped", "surged"]):
            qualifier = "increase"
        elif any(w in ctx for w in ["decrease", "decreased", "drop", "dropped", "reduced", "fell", "declined"]):
            qualifier = "decrease"

        quantities.append({
            "value": val,
            "scaled_value": val * scale if scale > 1.0 else val,
            "unit": unit_str,
            "prefix": prefix,
            "qualifier": qualifier,
            "raw": match.group(0).strip(),
            "start": match.start(),
            "end": match.end()
        })
    return quantities


def compare_quantities(
    claim_quantities: List[Dict[str, Any]],
    evidence_quantities: List[Dict[str, Any]]
) -> Tuple[Optional[PairRelation], Optional[str]]:
    """
    Compares numerical quantities between claim and evidence passage.
    Returns (PairRelation, rationale) if a decisive numerical match or mismatch is found.
    """
    if not claim_quantities or not evidence_quantities:
        return None, None

    for cq in claim_quantities:
        c_val = cq["value"]
        c_unit = cq["unit"]
        c_qual = cq["qualifier"]
        c_scaled = cq.get("scaled_value", c_val)

        for eq in evidence_quantities:
            e_val = eq["value"]
            e_unit = eq["unit"]
            e_qual = eq["qualifier"]
            e_scaled = eq.get("scaled_value", e_val)

            time_converted = False
            rate_discrepancy = False

            # Rate frequency comparison (e.g. per year vs per decade or per month)
            if c_unit.startswith("per_") and e_unit.startswith("per_"):
                c_period = c_unit[4:]
                e_period = e_unit[4:]
                if c_period == e_period:
                    same_unit = True
                else:
                    period_multipliers = {
                        "day": 365.0,
                        "week": 52.0,
                        "month": 12.0,
                        "year": 1.0,
                        "decade": 0.1,
                    }
                    if c_period in period_multipliers and e_period in period_multipliers:
                        c_rate_annual = c_val * period_multipliers[c_period]
                        e_rate_annual = e_val * period_multipliers[e_period]
                        same_unit = True
                        time_converted = True
                        c_scaled_time = c_rate_annual
                        e_scaled_time = e_rate_annual
                    else:
                        same_unit = False
                        rate_discrepancy = True
            elif (c_unit.startswith("per_") and not e_unit.startswith("per_")) or (e_unit.startswith("per_") and not c_unit.startswith("per_")):
                same_unit = False
                rate_discrepancy = True
            elif (c_unit == "day" and e_unit == "hour") or (c_unit == "hour" and e_unit == "day"):
                same_unit = True
                time_converted = True
                if c_unit == "day" and e_unit == "hour":
                    c_scaled_time = c_val * 24.0
                    e_scaled_time = e_val
                else:
                    c_scaled_time = c_val
                    e_scaled_time = e_val * 24.0
            elif (c_unit == "year" and e_unit == "month") or (c_unit == "month" and e_unit == "year"):
                same_unit = True
                time_converted = True
                if c_unit == "year" and e_unit == "month":
                    c_scaled_time = c_val * 12.0
                    e_scaled_time = e_val
                else:
                    c_scaled_time = c_val
                    e_scaled_time = e_val * 12.0
            elif (c_unit == e_unit and c_unit != ""):
                same_unit = True
            elif (cq["prefix"] == eq["prefix"] and cq["prefix"] != "") and (not c_unit and not e_unit):
                same_unit = True
            else:
                same_unit = False

            if rate_discrepancy:
                return PairRelation.CONTRADICTS, (
                    f"Rate frequency discrepancy: Claim specifies rate of {cq['raw']}, "
                    f"conflicting with source terms {eq['raw']}."
                )

            if same_unit:
                # 1. Opposite directional trend (e.g. 15% drop vs 8% increase)
                if (c_qual in ["decrease", "reduced"] and e_qual in ["increase", "growth"]) or \
                   (c_qual in ["increase", "growth"] and e_qual in ["decrease", "reduced"]):
                    return PairRelation.CONTRADICTS, (
                        f"Numerical contradiction: Claim asserts a {c_qual} of {cq['raw']}, "
                        f"whereas source states an {e_qual} of {eq['raw']}."
                    )

                # 2. Maximum safe limit exceeded (e.g. claim says 100mg, evidence specifies max 50mg)
                if e_qual == "maximum" and c_val > e_val:
                    return PairRelation.CONTRADICTS, (
                        f"Numerical contradiction: Claim specifies {cq['raw']}, "
                        f"exceeding the source maximum threshold of {eq['raw']}."
                    )

                # 3. Minimum requirement violated
                if e_qual == "minimum" and c_val < e_val:
                    return PairRelation.CONTRADICTS, (
                        f"Numerical contradiction: Claim specifies {cq['raw']}, "
                        f"below the source minimum threshold of {eq['raw']}."
                    )

                # 4. Check time mismatch if converted
                if time_converted:
                    if abs(c_scaled_time - e_scaled_time) > 0.1:
                        return PairRelation.CONTRADICTS, (
                            f"Numerical discrepancy: Claim states {cq['raw']} ({c_scaled_time:.0f}h), "
                            f"conflicting with {eq['raw']} ({e_scaled_time:.0f}h) in source."
                        )
                    else:
                        return PairRelation.ENTAILS, f"Time durations match ({cq['raw']} is equivalent to {eq['raw']})."

                # 5. Direct value conflict (e.g. 100mg vs 25mg, or 10000 vs 100)
                diff = abs(c_scaled - e_scaled)
                if diff > 0.001:
                    return PairRelation.CONTRADICTS, (
                        f"Numerical discrepancy: Claim states {cq['raw']}, "
                        f"conflicting with {eq['raw']} in source."
                    )

                # 6. Exact matching value
                if diff <= 0.001:
                    return PairRelation.ENTAILS, f"Numerical values match ({cq['raw']})."

    return None, None


def detect_polarity_conflict(claim_text: str, evidence_text: str) -> Optional[str]:
    """Detects explicit antonym / polarity contradictions between claim and evidence."""
    for c_pattern, e_pattern, explanation in POLARITY_CONFLICT_PAIRS:
        if c_pattern.search(claim_text) and e_pattern.search(evidence_text):
            return explanation
    return None


def detect_context_mismatch(claim_text: str, ev_text: str) -> Optional[Tuple[PairRelation, str]]:
    """Detects demographic cohort and jurisdictional mismatches between claim and evidence."""
    c_lower = claim_text.lower()
    e_lower = ev_text.lower()

    # Demographic cohort mismatch (e.g. pediatric vs adult)
    pediatric_terms = {"pediatric", "child", "children", "infant", "infants", "toddler", "toddlers", "neonatal"}
    adult_terms = {"adult", "adults", "elderly", "geriatric"}

    c_has_ped = any(re.search(r'\b' + re.escape(w) + r'\b', c_lower) for w in pediatric_terms)
    e_has_ped = any(re.search(r'\b' + re.escape(w) + r'\b', e_lower) for w in pediatric_terms)
    c_has_adult = any(re.search(r'\b' + re.escape(w) + r'\b', c_lower) for w in adult_terms)
    e_has_adult = any(re.search(r'\b' + re.escape(w) + r'\b', e_lower) for w in adult_terms)

    if (c_has_ped and not c_has_adult) and (e_has_adult and not e_has_ped):
        return (
            PairRelation.INSUFFICIENT,
            "Demographic cohort discrepancy: claim specifies pediatric/child population, whereas source evidence documents adult guidelines."
        )
    if (c_has_adult and not c_has_ped) and (e_has_ped and not e_has_adult):
        return (
            PairRelation.INSUFFICIENT,
            "Demographic cohort discrepancy: claim specifies adult population, whereas source evidence documents pediatric guidelines."
        )

    # Jurisdiction mismatch (e.g. CCPA vs GDPR)
    c_has_ccpa = bool(re.search(r'\b(ccpa|california\s+consumer\s+privacy)\b', c_lower))
    e_has_ccpa = bool(re.search(r'\b(ccpa|california\s+consumer\s+privacy)\b', e_lower))
    c_has_gdpr = bool(re.search(r'\b(gdpr|general\s+data\s+protection\s+regulation)\b', c_lower))
    e_has_gdpr = bool(re.search(r'\b(gdpr|general\s+data\s+protection\s+regulation)\b', e_lower))

    if c_has_ccpa and not e_has_ccpa and e_has_gdpr:
        return (
            PairRelation.INSUFFICIENT,
            "Jurisdiction discrepancy: claim cites California/CCPA statutes, whereas source evidence documents European Union/GDPR regulations."
        )
    if c_has_gdpr and not e_has_gdpr and e_has_ccpa:
        return (
            PairRelation.INSUFFICIENT,
            "Jurisdiction discrepancy: claim cites European Union/GDPR regulations, whereas source evidence documents California/CCPA statutes."
        )

    # Temporal discrepancy (e.g. claim specifies 2025, but evidence documents 2021)
    c_years = set(re.findall(r'\b(19\d\d|20\d\d)\b', claim_text))
    e_years = set(re.findall(r'\b(19\d\d|20\d\d)\b', ev_text))
    if c_years and e_years and not c_years.intersection(e_years):
        return (
            PairRelation.INSUFFICIENT,
            f"Temporal discrepancy: claim specifies year {', '.join(sorted(c_years))}, whereas source evidence documents year {', '.join(sorted(e_years))}."
        )

    # Fiscal quarter discrepancy (e.g. Q1 vs Q2)
    c_qtrs = set(re.findall(r'\b(q[1-4])\b', c_lower))
    e_qtrs = set(re.findall(r'\b(q[1-4])\b', e_lower))
    if c_qtrs and e_qtrs and not c_qtrs.intersection(e_qtrs):
        return (
            PairRelation.INSUFFICIENT,
            f"Temporal quarter discrepancy: claim specifies {', '.join(sorted(c_qtrs)).upper()}, whereas source evidence documents {', '.join(sorted(e_qtrs)).upper()}."
        )

    return None


def find_contiguous_phrase_corroboration(claim_text: str, ev_text: str, min_words: Optional[int] = None) -> Tuple[bool, Optional[str]]:
    """
    Checks if the core assertion of the claim appears verbatim in the evidence passage.
    Requires that the matched contiguous subphrase covers the predominant portion
    (at least 65%) of the claim's content words, preventing an introductory preamble
    from corroborating a completely unmentioned factual assertion.
    """
    c_words = [w.lower() for w in re.findall(r'\b[a-zA-Z0-9_\-\$]{2,}\b', claim_text) if w.lower() not in STOPWORDS]
    ev_lower = ev_text.lower()

    if not c_words:
        return False, None

    if len(c_words) <= 3:
        sub_regex = r'\b' + r'\s+(?:\w+\s+){0,2}'.join(map(re.escape, c_words)) + r'\b'
        if re.search(sub_regex, ev_lower):
            return True, " ".join(c_words)
        return False, None

    # Require at least 65% of the claim's content words in contiguous sequence, or custom min_words
    base_min = min_words if min_words is not None else 4
    required_len = max(base_min, int(len(c_words) * 0.65))

    for k in range(len(c_words), required_len - 1, -1):
        for i in range(len(c_words) - k + 1):
            sub_slice = c_words[i:i+k]
            sub_regex = r'\b' + r'\s+(?:\w+\s+){0,2}'.join(map(re.escape, sub_slice)) + r'\b'
            if re.search(sub_regex, ev_lower):
                return True, " ".join(sub_slice)

    return False, None


def compute_pair_relation(claim_text: str, evidence: Evidence) -> PairNLIResult:
    """
    Evaluates a single (claim, evidence) pair using deterministic semantic and numerical rules.
    Eliminates false entailment from bag-of-words lexical overlap.
    """
    ev_text = evidence.text

    # Step 1: Check demographic / jurisdictional / temporal context mismatch FIRST
    # (prevents numbers from different quarters, years, or cohorts from falsely contradicting)
    ctx_mismatch = detect_context_mismatch(claim_text, ev_text)
    if ctx_mismatch:
        rel, rationale = ctx_mismatch
        return PairNLIResult(
            evidence_id=evidence.evidence_id,
            relation=rel,
            score=0.40,
            rationale=rationale
        )

    claim_quantities = extract_quantities(claim_text)
    evidence_quantities = extract_quantities(ev_text)

    # Step 2: Check numerical consistency
    num_rel, num_rationale = compare_quantities(claim_quantities, evidence_quantities)
    if num_rel == PairRelation.CONTRADICTS:
        return PairNLIResult(
            evidence_id=evidence.evidence_id,
            relation=PairRelation.CONTRADICTS,
            score=0.95,
            rationale=num_rationale or "Numerical contradiction detected against evidence.",
            contradiction_detail=num_rationale,
            numerical_finding=num_rationale,
            source_name=evidence.source_name,
            page_or_section=evidence.page_or_section,
            excerpt=evidence.text
        )

    # Step 3: Check polarity and negation contradictions
    polarity_conflict = detect_polarity_conflict(claim_text, ev_text)
    if polarity_conflict:
        return PairNLIResult(
            evidence_id=evidence.evidence_id,
            relation=PairRelation.CONTRADICTS,
            score=0.96,
            rationale=polarity_conflict,
            contradiction_detail=polarity_conflict,
            source_name=evidence.source_name,
            page_or_section=evidence.page_or_section,
            excerpt=evidence.text
        )

    # Step 4: Check content-word overlap with stem matching
    raw_c_words = [w.lower() for w in re.findall(r'\b[a-zA-Z0-9_\-\$]{2,}\b', claim_text)]
    raw_e_words = [w.lower() for w in re.findall(r'\b[a-zA-Z0-9_\-\$]{2,}\b', ev_text)]

    c_content_words = [w for w in raw_c_words if w not in STOPWORDS]
    e_content_words = [w for w in raw_e_words if w not in STOPWORDS]

    c_stems = {stem_word(w) for w in c_content_words}
    e_stems = {stem_word(w) for w in e_content_words}
    common_stems = c_stems.intersection(e_stems)

    overlap_ratio = len(common_stems) / max(1, len(c_stems))

    # Step 5: Check numerical entailment (only if context is aligned and numbers match)
    if num_rel == PairRelation.ENTAILS and (len(common_stems) >= 1 or overlap_ratio >= 0.20):
        return PairNLIResult(
            evidence_id=evidence.evidence_id,
            relation=PairRelation.ENTAILS,
            score=min(0.98, 0.75 + overlap_ratio * 0.25),
            rationale=f"Directly supported by source text at {evidence.page_or_section} ({num_rationale}).",
            numerical_finding=num_rationale,
            source_name=evidence.source_name,
            page_or_section=evidence.page_or_section,
            excerpt=evidence.text
        )

    # Step 6: Non-numerical assertions require contiguous phrase corroboration, NOT bag-of-words overlap
    has_phrase, matched_phrase = find_contiguous_phrase_corroboration(claim_text, ev_text, min_words=4)
    if has_phrase:
        return PairNLIResult(
            evidence_id=evidence.evidence_id,
            relation=PairRelation.ENTAILS,
            score=round(min(0.96, 0.75 + overlap_ratio * 0.20), 2),
            rationale=f"Source explicitly corroborates assertion at {evidence.page_or_section}: \"...{matched_phrase}...\"",
            source_name=evidence.source_name,
            page_or_section=evidence.page_or_section,
            excerpt=evidence.text
        )

    # Step 7: Topic overlap without phrase or numerical corroboration -> INSUFFICIENT
    # Mentions related terms but does NOT provide factual proof for the assertion
    if overlap_ratio >= 0.18:
        sample_terms = [w for w in c_content_words if stem_word(w) in common_stems][:3]
        terms_str = f" ({', '.join(sample_terms)})" if sample_terms else ""
        return PairNLIResult(
            evidence_id=evidence.evidence_id,
            relation=PairRelation.INSUFFICIENT,
            score=round(overlap_ratio, 2),
            rationale=f"Passage at {evidence.page_or_section} discusses related topic terms{terms_str} but provides insufficient evidence to confirm or deny the assertion.",
            source_name=evidence.source_name,
            page_or_section=evidence.page_or_section,
            excerpt=evidence.text
        )

    # Step 8: Negligible or zero overlap -> NEUTRAL
    return PairNLIResult(
        evidence_id=evidence.evidence_id,
        relation=PairRelation.NEUTRAL,
        score=0.10,
        rationale=f"Passage at {evidence.page_or_section} does not contain information directly relevant to this claim.",
        source_name=evidence.source_name,
        page_or_section=evidence.page_or_section,
        excerpt=evidence.text
    )


def validate_citations(evidence_ids: List[str], valid_evidence_ids: Set[str]) -> List[str]:
    """
    Validates that every citation refers to actually supplied evidence.
    Strips unknown IDs to prevent hallucinated citations.
    """
    filtered = []
    for eid in evidence_ids:
        if eid in valid_evidence_ids and eid not in filtered:
            filtered.append(eid)
    return filtered


def generate_claim_autopsy(
    claim_text: str,
    verdict: VerdictCategory,
    pair_results: List[PairNLIResult],
    candidate_evidence: List[Evidence]
) -> ClaimAutopsySchema:
    """
    Performs forensic autopsy on a claim verdict:
    Identifies the exact phrase responsible, discrepancy type, contrasting elements, and technical diagnosis.
    """
    evidence_lookup = {e.evidence_id: e for e in candidate_evidence}
    contradicting = [p for p in pair_results if p.relation == PairRelation.CONTRADICTS]
    entailing = [p for p in pair_results if p.relation == PairRelation.ENTAILS]

    if verdict == VerdictCategory.CONTRADICTED:
        best_cont = max(contradicting, key=lambda x: x.score) if contradicting else None
        rationale = best_cont.rationale if best_cont else "Claim contradicts source facts."

        # Check numerical / rate discrepancies
        claim_quantities = extract_quantities(claim_text)
        ev_item = evidence_lookup.get(best_cont.evidence_id) if best_cont else None
        ev_quantities = extract_quantities(ev_item.text) if ev_item else []

        def format_qty(q):
            val = q.get('value', 0)
            val_str = str(int(val)) if isinstance(val, (int, float)) and float(val).is_integer() else str(val)
            prefix = q.get('prefix', '')
            unit = q.get('unit', '')
            unit = unit.replace('per_', ' per ')
            return f"{prefix}{val_str}{unit}".strip()

        c_qty_strs = [format_qty(q) for q in claim_quantities]
        e_qty_strs = [format_qty(q) for q in ev_quantities]

        # Rate frequency mismatch?
        has_rate = any("per_" in str(q.get("unit", "")) for q in claim_quantities) or "per" in claim_text.lower()
        if has_rate:
            rate_phrase = re.search(r'\b(per\s+(?:decade|year|month|week|day|hour))\b', claim_text, re.IGNORECASE)
            problematic = rate_phrase.group(0) if rate_phrase else (c_qty_strs[0] if c_qty_strs else None)
            return ClaimAutopsySchema(
                problematic_phrase=problematic,
                issue_type="rate_frequency",
                claim_elements=c_qty_strs,
                evidence_elements=e_qty_strs,
                diagnosis=f"Rate interval discrepancy: assertion specifies '{problematic}' conflicting with source rate frequency."
            )

        if c_qty_strs and e_qty_strs:
            diverging = c_qty_strs[0]
            return ClaimAutopsySchema(
                problematic_phrase=diverging,
                issue_type="quantity_mismatch",
                claim_elements=c_qty_strs,
                evidence_elements=e_qty_strs,
                diagnosis=f"Numerical conflict: claim asserts '{diverging}' but authoritative source documents '{e_qty_strs[0]}'."
            )

        # Polarity conflict?
        for claim_pat, ev_pat, explanation in POLARITY_CONFLICT_PAIRS:
            m_c = claim_pat.search(claim_text)
            if m_c:
                return ClaimAutopsySchema(
                    problematic_phrase=m_c.group(0),
                    issue_type="polarity_negation",
                    claim_elements=[m_c.group(0)],
                    evidence_elements=[],
                    diagnosis=explanation
                )

        # Directional or general conflict
        dir_m = re.search(r'\b(increased|decreased|dropped|rose|grew|fell|declined)\b', claim_text, re.IGNORECASE)
        problematic = dir_m.group(0) if dir_m else None
        return ClaimAutopsySchema(
            problematic_phrase=problematic,
            issue_type="direct_contradiction",
            claim_elements=[problematic] if problematic else [],
            evidence_elements=[],
            diagnosis=rationale
        )

    elif verdict == VerdictCategory.AMBIGUOUS:
        sup_source = evidence_lookup.get(entailing[0].evidence_id) if entailing else None
        cont_source = evidence_lookup.get(contradicting[0].evidence_id) if contradicting else None
        return ClaimAutopsySchema(
            problematic_phrase=claim_text,
            issue_type="conflicting_sources",
            claim_elements=[sup_source.source_name if sup_source else "Source A"],
            evidence_elements=[cont_source.source_name if cont_source else "Source B"],
            diagnosis="Evidence conflict: multiple authoritative sources present incompatible accounts of this assertion."
        )

    elif verdict == VerdictCategory.SUPPORTED:
        claim_quantities = extract_quantities(claim_text)
        c_qty_strs = [f"{q.get('prefix','')}{str(int(q.get('value',0))) if isinstance(q.get('value'), (int, float)) and float(q.get('value')).is_integer() else q.get('value')}{q.get('unit','')}".strip() for q in claim_quantities]
        return ClaimAutopsySchema(
            problematic_phrase=None,
            issue_type="verified_match",
            claim_elements=c_qty_strs,
            evidence_elements=c_qty_strs,
            diagnosis="Factually corroborated: key assertion entities, units, and conditions align with source evidence."
        )

    elif verdict == VerdictCategory.INCONCLUSIVE:
        return ClaimAutopsySchema(
            problematic_phrase=None,
            issue_type="insufficient_context",
            claim_elements=[],
            evidence_elements=[],
            diagnosis="Insufficient context: source discusses related domain terminology but lacks explicit corroboration for this assertion."
        )

    else:  # UNSUPPORTED
        return ClaimAutopsySchema(
            problematic_phrase=claim_text,
            issue_type="missing_evidence",
            claim_elements=[claim_text[:50]],
            evidence_elements=[],
            diagnosis="Ungrounded assertion: claim introduces facts, entities, or outcomes absent from all supplied source documents."
        )


def aggregate_verdicts(
    claim_text: str,
    pair_results: List[PairNLIResult],
    candidate_evidence: List[Evidence]
) -> ClaimVerificationResult:
    """
    Deterministically aggregates multiple (claim, evidence) pair assessments into a final ClaimVerificationResult.
    
    Principles:
    1. If no candidate evidence or all pairs are NEUTRAL -> UNSUPPORTED (never mark false just because unmentioned).
    2. If conflicting evidence exists (both ENTAILS and CONTRADICTS) -> AMBIGUOUS (Rule 6).
    3. If CONTRADICTION exists without equal supporting counter-evidence -> CONTRADICTED.
    4. If ENTAILMENT exists without contradiction -> SUPPORTED.
    5. If all relevant evidence is INSUFFICIENT -> INCONCLUSIVE.
    6. Citations strictly refer to supplied evidence (Rule 7; unsupported claims always empty).
    """
    valid_ids = {e.evidence_id for e in candidate_evidence}
    evidence_lookup = {e.evidence_id: e for e in candidate_evidence}

    entailing_pairs = [p for p in pair_results if p.relation == PairRelation.ENTAILS]
    contradicting_pairs = [p for p in pair_results if p.relation == PairRelation.CONTRADICTS]
    insufficient_pairs = [p for p in pair_results if p.relation == PairRelation.INSUFFICIENT]

    # Case A: No candidate evidence supplied at all
    if not candidate_evidence or not pair_results:
        verdict = VerdictCategory.UNSUPPORTED
        autopsy = generate_claim_autopsy(claim_text, verdict, pair_results, candidate_evidence)
        return ClaimVerificationResult(
            claim_text=claim_text,
            verdict=verdict,
            explanation="No relevant evidence passages were found in the provided sources to substantiate or evaluate this claim.",
            confidence=0.30,
            evidence_ids=[],
            pair_results=pair_results,
            autopsy=autopsy,
            conflict=None
        )

    # Case B: Conflicting evidence (Both entailing and contradicting passages exist)
    if entailing_pairs and contradicting_pairs:
        used_ids = validate_citations(
            [p.evidence_id for p in contradicting_pairs] + [p.evidence_id for p in entailing_pairs],
            valid_ids
        )
        sup_source = evidence_lookup.get(entailing_pairs[0].evidence_id)
        cont_source = evidence_lookup.get(contradicting_pairs[0].evidence_id)
        sup_loc = sup_source.page_or_section if sup_source else "Source"
        cont_loc = cont_source.page_or_section if cont_source else "Source"

        conflict = ConflictDetail(
            conflict_id=f"conf_{uuid.uuid4().hex[:6]}",
            conflict_type="direct_contradiction",
            description=(
                f"Source divergence: passage at {sup_loc} ({sup_source.source_name if sup_source else 'Source A'}) "
                f"corroborates the claim, whereas passage at {cont_loc} ({cont_source.source_name if cont_source else 'Source B'}) "
                f"directly contradicts it ({contradicting_pairs[0].rationale})."
            ),
            claim_id=None,
            supporting_evidence_id=entailing_pairs[0].evidence_id,
            supporting_source_name=sup_source.source_name if sup_source else None,
            supporting_location=sup_loc,
            supporting_text=sup_source.text if sup_source else None,
            contradicting_evidence_id=contradicting_pairs[0].evidence_id,
            contradicting_source_name=cont_source.source_name if cont_source else None,
            contradicting_location=cont_loc,
            contradicting_text=cont_source.text if cont_source else None
        )
        verdict = VerdictCategory.AMBIGUOUS
        autopsy = generate_claim_autopsy(claim_text, verdict, pair_results, candidate_evidence)

        return ClaimVerificationResult(
            claim_text=claim_text,
            verdict=verdict,
            explanation=(
                f"Conflicting evidence across sources: passage at {sup_loc} appears to corroborate the assertion, "
                f"while passage at {cont_loc} contradicts it ({contradicting_pairs[0].rationale})."
            ),
            confidence=0.55,
            evidence_ids=used_ids,
            pair_results=pair_results,
            autopsy=autopsy,
            conflict=conflict
        )

    # Case C: Contradiction found
    if contradicting_pairs:
        used_ids = validate_citations([p.evidence_id for p in contradicting_pairs], valid_ids)
        best_cont = max(contradicting_pairs, key=lambda x: x.score)
        ev_item = evidence_lookup.get(best_cont.evidence_id)
        loc = f" at {ev_item.page_or_section}" if ev_item else ""

        verdict = VerdictCategory.CONTRADICTED
        autopsy = generate_claim_autopsy(claim_text, verdict, pair_results, candidate_evidence)

        return ClaimVerificationResult(
            claim_text=claim_text,
            verdict=verdict,
            explanation=f"Direct conflict with source evidence{loc}: {best_cont.rationale}",
            confidence=best_cont.score,
            evidence_ids=used_ids,
            pair_results=pair_results,
            autopsy=autopsy,
            conflict=None
        )

    # Case D: Supported by evidence
    if entailing_pairs:
        used_ids = validate_citations([p.evidence_id for p in entailing_pairs], valid_ids)
        best_ent = max(entailing_pairs, key=lambda x: x.score)
        ev_item = evidence_lookup.get(best_ent.evidence_id)
        loc = f" at {ev_item.page_or_section}" if ev_item else ""

        verdict = VerdictCategory.SUPPORTED
        autopsy = generate_claim_autopsy(claim_text, verdict, pair_results, candidate_evidence)

        return ClaimVerificationResult(
            claim_text=claim_text,
            verdict=verdict,
            explanation=f"Corroborated by source evidence{loc}: {best_ent.rationale}",
            confidence=best_ent.score,
            evidence_ids=used_ids,
            pair_results=pair_results,
            autopsy=autopsy,
            conflict=None
        )

    # Case E: Insufficient context found
    if insufficient_pairs:
        used_ids = validate_citations([p.evidence_id for p in insufficient_pairs], valid_ids)
        best_ins = insufficient_pairs[0]
        verdict = VerdictCategory.INCONCLUSIVE
        autopsy = generate_claim_autopsy(claim_text, verdict, pair_results, candidate_evidence)

        return ClaimVerificationResult(
            claim_text=claim_text,
            verdict=verdict,
            explanation=best_ins.rationale,
            confidence=0.45,
            evidence_ids=used_ids,
            pair_results=pair_results,
            autopsy=autopsy,
            conflict=None
        )

    # Case F: All passages were completely neutral (no support, no contradiction)
    verdict = VerdictCategory.UNSUPPORTED
    autopsy = generate_claim_autopsy(claim_text, verdict, pair_results, candidate_evidence)
    return ClaimVerificationResult(
        claim_text=claim_text,
        verdict=verdict,
        explanation="Candidate source passages do not contain facts confirming or addressing this claim.",
        confidence=0.25,
        evidence_ids=[],
        pair_results=pair_results,
        autopsy=autopsy,
        conflict=None
    )
