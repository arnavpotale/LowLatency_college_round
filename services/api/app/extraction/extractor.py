import re
import uuid
import logging
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

# Verb and predicate indicators for detecting independent clauses
VERB_INDICATORS = re.compile(
    r'\b(?:is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|shall|should|can|could|may|might|must|'
    r'increases?|increased|increasing|decreases?|decreased|decreasing|declines?|declined|declining|'
    r'rises?|rose|rising|grows?|grew|growing|supports?|supported|supporting|stores?|stored|storing|'
    r'prevents?|prevented|preventing|causes?|caused|causing|reduces?|reduced|reducing|fails?|failed|failing|'
    r'runs?|ran|running|operates?|operated|operating|generates?|generated|generating|shows?|showed|shown|showing|'
    r'applies?|applied|applying|contains?|contained|containing|requires?|required|requiring|provides?|provided|providing|'
    r'allows?|allowed|allowing|recommends?|recommended|recommending|prohibits?|prohibited|prohibiting|'
    r'mandates?|mandated|mandating|advises?|advised|advising|concludes?|concluded|concluding|observes?|observed|observing|'
    r'relies?|relied|relying|uses?|used|using|depends?|depended|depending|'
    r'states?|stated|stating|reports?|reported|reporting|demonstrates?|demonstrated|demonstrating|'
    r'\w+ed|\w+ing)\b',
    re.IGNORECASE
)

# Conditional, causal, or concessive words that indicate dependent clauses that must NOT be split
CONDITIONAL_DEPENDENCY_STARTERS = re.compile(
    r'^\s*(?:if|unless|provided\s+that|assuming\s+that|in\s+case|although|even\s+though|despite|because|since|so\s+that|in\s+order\s+to)\b',
    re.IGNORECASE
)

# Relative pronouns that indicate subordinate/adjective clauses rather than coordinate assertions
SUBORDINATE_MARKERS = re.compile(
    r'^\s*(?:which|who|whom|whose|that|where|whereby|wherein)\b',
    re.IGNORECASE
)

# Coordinating conjunction patterns for splitting compound independent assertions
COORDINATE_SPLIT_PATTERNS = [
    # Pattern 1: Semicolon followed by transitional adverb
    (re.compile(r';\s+(?:however|nevertheless|furthermore|moreover|meanwhile),\s+', re.IGNORECASE), "semicolon_adverb"),
    # Pattern 2: Semicolon joining two independent clauses
    (re.compile(r';\s+', re.IGNORECASE), "semicolon"),
    # Pattern 3: Comma + contrasting conjunction (", but ", ", whereas ", ", while ")
    (re.compile(r',\s+(?:but|whereas|while)\s+', re.IGNORECASE), "comma_contrast"),
    # Pattern 4: Comma + additive conjunction (", and ", ", yet ")
    (re.compile(r',\s+(?:and|yet)\s+', re.IGNORECASE), "comma_coordinator"),
    # Pattern 5: Naked contrasting " but " or " whereas " between predicates
    (re.compile(r'\s+(?:but|whereas)\s+', re.IGNORECASE), "naked_contrast"),
]

# Common abbreviations that should not trigger sentence boundaries
ABBREVIATIONS = {
    "e.g.", "i.e.", "dr.", "mr.", "mrs.", "ms.", "prof.", "vs.", "u.s.", "inc.", "ltd.", "corp.", "co.", "approx.", "est."
}


def _split_into_sentences(text: str) -> List[Tuple[int, int, str]]:
    """
    Splits text into sentences while respecting decimals, currency, and quotes.
    Returns list of (start_offset, end_offset, sentence_text).
    """
    if not text or not text.strip():
        return []

    boundary_pattern = re.compile(r'(?<=[.!?])\s+(?=[A-Z0-9“"\'])|\n\s*\n', re.UNICODE)

    sentences = []
    cursor = 0
    for match in boundary_pattern.finditer(text):
        m_start = match.start()
        raw = text[cursor:m_start]
        clean = raw.strip()
        if len(clean) >= 3:
            s_start = cursor + (len(raw) - len(raw.lstrip()))
            s_end = s_start + len(clean)
            sentences.append((s_start, s_end, clean))
        cursor = match.end()

    # Remainder of text
    if cursor < len(text):
        raw = text[cursor:]
        clean = raw.strip()
        if len(clean) >= 3:
            s_start = cursor + (len(raw) - len(raw.lstrip()))
            s_end = s_start + len(clean)
            sentences.append((s_start, s_end, clean))

    return sentences


def _extract_subject_noun_phrase(clause_text: str) -> Optional[str]:
    """
    Extracts the leading subject noun phrase from an independent clause
    to resolve elided subjects in coordinate clauses.
    """
    clause_clean = clause_text.strip()
    np_match = re.match(
        r'^((?:the|a|an|this|that|these|those|its|our|their|all|both)?\s*[A-Z0-9][a-zA-Z0-9_\-\s]{1,35}?)(?=\s+(?:is|are|was|were|has|have|had|may|might|can|could|will|would|should|must|increased?|decreased?|declined?|rose|supports?|stores?|reduces?|prevents?|exceeds?|fell|grew))\b',
        clause_clean,
        re.IGNORECASE
    )
    if np_match:
        return np_match.group(1).strip()
    
    single_word_match = re.match(r'^([A-Z][a-zA-Z0-9_\-]{2,20})\b', clause_clean)
    if single_word_match:
        return single_word_match.group(1).strip()
    return None


def decompose_sentence_into_propositions(
    sent_text: str,
    sent_start: int,
    original_text: str
) -> List[Dict[str, Any]]:
    """
    Decomposes a single sentence into independently verifiable atomic propositions.
    
    Preserves:
      - Exact offsets: original_text[start:end] == claim_text
      - Dependencies & Conditions: If sentence is governed by a conditional/causal opener, preserves intact.
      - Attributions & Qualifiers: When coordinate clauses share an elided subject, inherits it for verification.
    """
    sent_clean = sent_text.strip()
    if not sent_clean:
        return []

    # Rule 1: Preserve sentences with conditional or causal dependencies intact
    if CONDITIONAL_DEPENDENCY_STARTERS.match(sent_clean):
        return [{
            "claim_text": sent_clean,
            "start_offset": sent_start,
            "end_offset": sent_start + len(sent_clean),
            "verifiable_text": sent_clean,
            "decomposition_type": "conditional_dependency_preserved",
            "limitation": "Conditional dependency preserved as a single qualified proposition."
        }]

    # Rule 2: Search for coordinating conjunction split points
    best_split: Optional[Tuple[int, int, str]] = None

    for pattern, split_type in COORDINATE_SPLIT_PATTERNS:
        for match in pattern.finditer(sent_clean):
            m_start, m_end = match.start(), match.end()
            left_part = sent_clean[:m_start].strip()
            right_part = sent_clean[m_end:].strip()

            if len(left_part) < 10 or len(right_part) < 10:
                continue

            if SUBORDINATE_MARKERS.match(right_part):
                continue

            has_left_verb = bool(VERB_INDICATORS.search(left_part))
            has_right_verb = bool(VERB_INDICATORS.search(right_part))

            if has_left_verb and has_right_verb:
                best_split = (m_start, m_end, split_type)
                break
        if best_split:
            break

    if not best_split:
        return [{
            "claim_text": sent_clean,
            "start_offset": sent_start,
            "end_offset": sent_start + len(sent_clean),
            "verifiable_text": sent_clean,
            "decomposition_type": "atomic_sentence",
            "limitation": None
        }]

    m_start, m_end, split_type = best_split
    left_raw = sent_clean[:m_start]
    right_raw = sent_clean[m_end:]

    left_clean = left_raw.strip()
    right_clean = right_raw.strip()

    left_offset_in_sent = sent_clean.find(left_clean)
    left_start = sent_start + left_offset_in_sent
    left_end = left_start + len(left_clean)

    right_offset_in_sent = m_end + right_raw.find(right_clean)
    right_start = sent_start + right_offset_in_sent
    right_end = right_start + len(right_clean)

    if original_text[left_start:left_end] != left_clean or original_text[right_start:right_end] != right_clean:
        logger.warning("Offset verification failed during decomposition; falling back to intact sentence.")
        return [{
            "claim_text": sent_clean,
            "start_offset": sent_start,
            "end_offset": sent_start + len(sent_clean),
            "verifiable_text": sent_clean,
            "decomposition_type": "atomic_sentence",
            "limitation": None
        }]

    left_subject = _extract_subject_noun_phrase(left_clean)
    right_has_subject = bool(
        re.match(r'^(?:it|they|he|she|we|this|that|these|those|the|a|an|[A-Z0-9])\b', right_clean, re.IGNORECASE)
    )

    right_verifiable = right_clean
    inherited_subject = None
    if not right_has_subject and left_subject:
        inherited_subject = left_subject
        right_verifiable = f"{left_subject} {right_clean}"

    claim_1 = {
        "claim_text": left_clean,
        "start_offset": left_start,
        "end_offset": left_end,
        "verifiable_text": left_clean,
        "decomposition_type": f"compound_coordinate_left_{split_type}",
        "limitation": None
    }

    claim_2 = {
        "claim_text": right_clean,
        "start_offset": right_start,
        "end_offset": right_end,
        "verifiable_text": right_verifiable,
        "decomposition_type": f"compound_coordinate_right_{split_type}",
        "inherited_subject": inherited_subject,
        "limitation": "Inherited coordinate subject from antecedent clause." if inherited_subject else None
    }

    return [claim_1, claim_2]


def extract_claims(original_answer: str) -> List[Dict[str, Any]]:
    """
    Decomposes the original answer text into individual factual claims.
    Preserves exact Unicode character offsets [start_offset, end_offset]
    satisfying original_answer[start_offset:end_offset] == claim_text.

    Features:
      - Coordinate clause decomposition with finite verb validation.
      - Preservation of conditional qualifiers and exceptions intact.
      - Elided subject inheritance for independent verification.
      - Guaranteed offset alignment with zero drifting.
    """
    if not original_answer or not original_answer.strip():
        return []

    sentences = _split_into_sentences(original_answer)
    claims: List[Dict[str, Any]] = []
    claim_idx = 0

    for s_start, s_end, s_text in sentences:
        propositions = decompose_sentence_into_propositions(s_text, s_start, original_answer)
        
        for prop in propositions:
            c_text = prop["claim_text"]
            c_start = prop["start_offset"]
            c_end = prop["end_offset"]
            
            actual_slice = original_answer[c_start:c_end]
            if actual_slice != c_text:
                logger.error(
                    "Offset mismatch invariant violated: expected '%s', got '%s'",
                    c_text, actual_slice
                )
                continue

            claims.append({
                "claim_id": f"claim_{claim_idx}_{uuid.uuid4().hex[:6]}",
                "claim_text": c_text,
                "start_offset": c_start,
                "end_offset": c_end,
                "verifiable_text": prop.get("verifiable_text", c_text),
                "confidence": 0.95,
                "decomposition_type": prop.get("decomposition_type", "atomic_sentence"),
                "inherited_subject": prop.get("inherited_subject"),
                "limitation": prop.get("limitation")
            })
            claim_idx += 1

    return claims
