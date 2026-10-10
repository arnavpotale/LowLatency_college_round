import json
import logging
from typing import List, Optional
import httpx
from app.core.config import settings
from app.schemas import VerdictCategory, Evidence
from app.verification.providers.base import VerificationProvider
from app.verification.types import (
    PairRelation,
    PairNLIResult,
    ClaimVerificationResult,
    ProviderUnavailableError,
)
from app.verification.rules import validate_citations

logger = logging.getLogger(__name__)


class LLMVerificationProvider(VerificationProvider):
    """
    Evidence-grounded LLM verification provider supporting OpenAI,
    Anthropic, or any OpenAI-compatible structured endpoint via httpx.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        api_base: Optional[str] = None,
        timeout: float = 30.0
    ):
        self.api_key = api_key or settings.openai_api_key
        self.model = model or settings.openai_model
        self.api_base = (api_base or settings.llm_api_base or "https://api.openai.com/v1").rstrip("/")
        self.timeout = timeout

    @property
    def name(self) -> str:
        return f"llm_{self.model}"

    def evaluate_pair(self, claim_text: str, evidence: Evidence) -> PairNLIResult:
        # Evaluate pair using single-claim evaluator with one evidence candidate
        result = self.evaluate_claim(claim_text, [evidence])
        
        relation_map = {
            VerdictCategory.SUPPORTED: PairRelation.ENTAILS,
            VerdictCategory.CONTRADICTED: PairRelation.CONTRADICTS,
            VerdictCategory.AMBIGUOUS: PairRelation.CONFLICTING,
            VerdictCategory.INCONCLUSIVE: PairRelation.INSUFFICIENT,
            VerdictCategory.UNSUPPORTED: PairRelation.NEUTRAL,
        }
        
        return PairNLIResult(
            evidence_id=evidence.evidence_id,
            relation=relation_map.get(result.verdict, PairRelation.NEUTRAL),
            score=result.confidence,
            rationale=result.explanation
        )

    def evaluate_claim(
        self,
        claim_text: str,
        candidate_evidence: List[Evidence]
    ) -> ClaimVerificationResult:
        """
        Submits claim and candidate evidence to the LLM for structured verification.
        Fails clearly if provider credentials or endpoint are missing.
        """
        if not self.api_key:
            raise ProviderUnavailableError(
                f"LLM verification provider '{self.model}' is not configured. "
                "Missing API key. Please configure OPENAI_API_KEY in your environment, "
                "or switch to the deterministic verification provider."
            )

        valid_ids = {e.evidence_id for e in candidate_evidence}

        evidence_payload = [
            {
                "evidence_id": e.evidence_id,
                "source": e.source_name,
                "location": e.page_or_section,
                "text": e.text
            }
            for e in candidate_evidence
        ]

        system_prompt = (
            "You are an expert factual auditor and verification judge. "
            "Your task is to evaluate an atomic claim against the provided source evidence passages.\n\n"
            "Verdict Categories:\n"
            "- 'supported': Claim is directly corroborated and entailed by the source evidence.\n"
            "- 'contradicted': Claim is directly refuted or conflicts with facts in the source evidence.\n"
            "- 'unsupported': The evidence contains no facts to substantiate or evaluate this claim (do NOT assume it is false).\n"
            "- 'ambiguous': Conflicting evidence exists across passages, or statements are open to contradictory interpretations.\n"
            "- 'inconclusive': Retrieved passages are tangentially related but provide insufficient context to confirm or deny.\n\n"
            "Critical Rules:\n"
            "1. ONLY cite evidence_ids that are present in the provided candidate evidence.\n"
            "2. NEVER invent citations, quotes, or numbers.\n"
            "3. Provide a concise, objective, evidence-grounded explanation.\n"
            "4. Return strictly valid JSON conforming to the requested schema."
        )

        user_content = json.dumps({
            "claim": claim_text,
            "candidate_evidence": evidence_payload
        }, indent=2)

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_content}
                        ],
                        "temperature": 0.0,
                        "response_format": {"type": "json_object"}
                    }
                )
                if response.status_code != 200:
                    raise ProviderUnavailableError(
                        f"LLM provider returned HTTP {response.status_code}: {response.text}"
                    )

                body = response.json()
                raw_text = body["choices"][0]["message"]["content"]
                parsed = json.loads(raw_text)

        except httpx.RequestError as e:
            raise ProviderUnavailableError(f"Failed to communicate with LLM provider: {str(e)}")
        except Exception as e:
            raise ProviderUnavailableError(f"Error parsing LLM verification response: {str(e)}")

        raw_verdict = parsed.get("verdict", "inconclusive").lower()
        try:
            verdict = VerdictCategory(raw_verdict)
        except ValueError:
            verdict = VerdictCategory.INCONCLUSIVE

        raw_citations = parsed.get("cited_evidence_ids", [])
        if not isinstance(raw_citations, list):
            raw_citations = []

        # Strictly validate citations against provided candidate evidence
        validated_citations = validate_citations(raw_citations, valid_ids)

        # Unsupported claims must have empty citations
        if verdict == VerdictCategory.UNSUPPORTED:
            validated_citations = []

        confidence = float(parsed.get("confidence", 0.85))
        confidence = max(0.0, min(1.0, confidence))

        explanation = parsed.get("explanation", f"Claim evaluated as {verdict.value} based on evidence.")

        return ClaimVerificationResult(
            claim_text=claim_text,
            verdict=verdict,
            explanation=explanation,
            confidence=confidence,
            evidence_ids=validated_citations
        )
