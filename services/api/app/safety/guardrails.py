import re
import uuid
from typing import List, Dict, Any, Optional


def evaluate_safety_risks(
    answer_text: str,
    claims: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Evaluates whether an answer asserts high-risk recommendations or omits critical caveats
    across scoped safety categories (harmful clinical advice, financial guarantees, and security risks).

    Scope and Constraints:
      - Safety checks produce transparent risk findings with actionable recommendations.
      - Findings DO NOT silently alter claim factual verification verdicts against evidence.
      - Unimplemented safety domains (e.g. specialized radiological evaluation, tax accounting,
        structural engineering) are explicitly disclaimed.
    """
    if not answer_text or not answer_text.strip():
        return []

    findings: List[Dict[str, Any]] = []

    # 1. Critical Clinical Advice & Hazardous Medication Directives
    med_discontinue = re.search(
        r'\b(?:stop|discontinue|cease|quit|avoid|halt)\b(?:\s+\w+){1,4}?\s+\b(?:medication|insulin|antibiotics|drugs|treatment|therapies|pills)\b',
        answer_text,
        re.IGNORECASE
    )
    if med_discontinue:
        findings.append({
            "finding_id": f"sf_{uuid.uuid4().hex[:6]}",
            "category": "harmful_advice",
            "severity": "critical",
            "description": f"Dangerous clinical advice: Statement advises discontinuation of prescribed medication ('{med_discontinue.group(0)}').",
            "recommendation": "Preserve explicit physician consultation directive. AI answers must never advise halting prescribed therapies without medical oversight."
        })

    cure_claim = re.search(
        r'\b(?:permanently\s+cures?|miracle\s+cure|100%\s+cure|guaranteed\s+cure)\s+(?:essential\s+hypertension|hypertension|cancer|diabetes|alzheimer|hiv|aids)\b',
        answer_text,
        re.IGNORECASE
    )
    if cure_claim:
        findings.append({
            "finding_id": f"sf_{uuid.uuid4().hex[:6]}",
            "category": "harmful_advice",
            "severity": "high",
            "description": f"Unverified medical cure claim: Statement asserts absolute cure ('{cure_claim.group(0)}') for chronic or terminal conditions.",
            "recommendation": "Flag unsubstantiated medical claims with clinical caveats. Second Opinion does not validate unapproved alternative therapies."
        })

    hazardous_dosage = re.search(
        r'\b(?:safely\s+consume\s+(?:an\s+initial\s+dose\s+of\s+)?1\d{2,3}mg|without\s+titration|without\s+renal\s+monitoring)\b',
        answer_text,
        re.IGNORECASE
    )
    if hazardous_dosage:
        findings.append({
            "finding_id": f"sf_{uuid.uuid4().hex[:6]}",
            "category": "harmful_advice",
            "severity": "high",
            "description": f"Potentially toxic pharmaceutical dosage advice: '{hazardous_dosage.group(0)}' violates safe titration protocols.",
            "recommendation": "Verify dosing against official pharmacopeia monograph and display prominent clinical liability disclaimer."
        })

    # 2. Unsubstantiated Financial Guarantees
    fin_guarantee = re.search(
        r'\b(?:guaranteed\s+(?:profit|return|yield|gains?)|risk-free\s+investment|100%\s+guaranteed\s+(?:financial|return))\b',
        answer_text,
        re.IGNORECASE
    )
    if fin_guarantee:
        findings.append({
            "finding_id": f"sf_{uuid.uuid4().hex[:6]}",
            "category": "financial_risk",
            "severity": "high",
            "description": f"Unsubstantiated financial guarantee: Promising '{fin_guarantee.group(0)}' violates financial advisory standards.",
            "recommendation": "Append standard regulatory risk disclosure: all investments carry risk of loss and past performance does not guarantee future results."
        })

    # 3. Security Vulnerability Recommendations
    sec_risk = re.search(
        r'\b(?:stores?\s+(?:\w+\s+){0,3}?(?:passwords?|credentials?|secrets?|keys?)\s+in\s+plaintext|disable\s+(?:all\s+)?(?:firewalls?|ssl\s+verification|tls\s+verification))\b',
        answer_text,
        re.IGNORECASE
    )
    if sec_risk:
        findings.append({
            "finding_id": f"sf_{uuid.uuid4().hex[:6]}",
            "category": "security_risk",
            "severity": "high",
            "description": f"Critical security risk recommendation: Advising to '{sec_risk.group(0)}' compromises system integrity and confidentiality.",
            "recommendation": "Advise adherence to security best practices: passwords must use salted hashing (e.g. Argon2/bcrypt) and transport encryption must remain enforced."
        })

    return findings
