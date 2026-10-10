"""
Neural Natural Language Inference (NLI) Verification Provider.
Owner: Developer 4 — Verification and Evaluation

Uses a pretrained CrossEncoder (default: cross-encoder/nli-deberta-v3-small)
to evaluate claim-evidence pairs under an entailment-contradiction-neutral framework.
"""

import math
import logging
from typing import List, Dict, Any, Optional, Tuple, Callable
from app.core.config import settings
from app.schemas import VerdictCategory, Evidence
from app.verification.providers.base import VerificationProvider
from app.verification.types import (
    PairRelation,
    PairNLIResult,
    ClaimVerificationResult,
    ProviderUnavailableError,
    VerificationError,
)
from app.verification.rules import validate_citations

logger = logging.getLogger(__name__)

# Process-level model cache to ensure weights are loaded only once per process
_NLI_MODEL_CACHE: Dict[str, Any] = {}


def _softmax(scores: List[float]) -> Tuple[float, float, float]:
    """
    Applies numerically stable softmax over 3 NLI logits:
      Index 0: contradiction
      Index 1: entailment
      Index 2: neutral
    """
    if len(scores) != 3:
        raise VerificationError(
            f"Expected exactly 3 NLI output scores [contradiction, entailment, neutral], got {len(scores)}"
        )

    for s in scores:
        if math.isnan(s) or math.isinf(s):
            raise VerificationError(f"Invalid non-finite NLI score detected: {scores}")

    # If scores are already normalized probabilities
    if all(0.0 <= s <= 1.0 for s in scores) and abs(sum(scores) - 1.0) < 1e-3:
        return scores[0], scores[1], scores[2]

    max_val = max(scores)
    exp_scores = [math.exp(s - max_val) for s in scores]
    sum_exp = sum(exp_scores)
    if sum_exp <= 0:
        return 0.333, 0.333, 0.334
    probs = [s / sum_exp for s in exp_scores]
    return probs[0], probs[1], probs[2]


def get_nli_model(model_name: str, device: str = "cpu") -> Any:
    """
    Loads and caches the CrossEncoder model lazily once per process.
    Fails explicitly if dependencies are missing or weights cannot be loaded.
    """
    cache_key = f"{model_name}_{device}"
    if cache_key in _NLI_MODEL_CACHE:
        return _NLI_MODEL_CACHE[cache_key]

    try:
        from sentence_transformers import CrossEncoder
    except ImportError as e:
        raise ProviderUnavailableError(
            f"SentenceTransformers is not installed ({e}). "
            "Please install sentence-transformers or configure another verification provider."
        )

    try:
        logger.info("Loading NLI CrossEncoder model '%s' on device '%s'...", model_name, device)
        model = CrossEncoder(model_name, device=device)
        _NLI_MODEL_CACHE[cache_key] = model
        return model
    except Exception as e:
        raise ProviderUnavailableError(
            f"Failed to load NLI model weights for '{model_name}' on device '{device}': {e}"
        )


class NLIVerificationProvider(VerificationProvider):
    """
    Neural NLI Verification Provider utilizing cross-encoder/nli-deberta-v3-small.

    For each (evidence, claim) pair:
      - Premise: Evidence passage text
      - Hypothesis: Claim text
      - Computes: P(contradiction), P(entailment), P(neutral)
    """

    def __init__(
        self,
        model_name: Optional[str] = None,
        device: Optional[str] = None,
        predictor: Optional[Callable[[List[Tuple[str, str]]], Any]] = None,
        entailment_threshold: Optional[float] = None,
        contradiction_threshold: Optional[float] = None,
        neutral_threshold: Optional[float] = None,
        min_relevance_threshold: Optional[float] = None,
    ):
        self.model_name = model_name or settings.nli_model_name
        self.device = device or settings.nli_device
        self._custom_predictor = predictor
        self.entailment_threshold = (
            entailment_threshold
            if entailment_threshold is not None
            else settings.nli_entailment_threshold
        )
        self.contradiction_threshold = (
            contradiction_threshold
            if contradiction_threshold is not None
            else settings.nli_contradiction_threshold
        )
        self.neutral_threshold = (
            neutral_threshold
            if neutral_threshold is not None
            else settings.nli_neutral_threshold
        )
        self.min_relevance_threshold = (
            min_relevance_threshold
            if min_relevance_threshold is not None
            else settings.min_evidence_relevance
        )

    @property
    def name(self) -> str:
        model_short = self.model_name.split("/")[-1] if "/" in self.model_name else self.model_name
        return f"nli_{model_short}"

    def _predict_pairs(self, pairs: List[Tuple[str, str]]) -> List[List[float]]:
        """Executes inference on a batch of (premise, hypothesis) text pairs."""
        if not pairs:
            return []

        if self._custom_predictor is not None:
            raw_output = self._custom_predictor(pairs)
        else:
            model = get_nli_model(self.model_name, self.device)
            try:
                raw_output = model.predict(pairs)
            except Exception as e:
                raise VerificationError(f"NLI model inference failed: {e}")

        # Normalize numpy array or tensor to List[List[float]]
        if hasattr(raw_output, "tolist"):
            raw_output = raw_output.tolist()
        elif isinstance(raw_output, list) and raw_output and not isinstance(raw_output[0], list):
            # If 1D list returned for single pair, wrap
            raw_output = [raw_output]

        return raw_output

    def evaluate_pair(self, claim_text: str, evidence: Evidence) -> PairNLIResult:
        """
        Evaluates a single claim-evidence pair.
        Premise: evidence.text, Hypothesis: claim_text.
        """
        pair = (evidence.text, claim_text)
        raw_preds = self._predict_pairs([pair])
        if not raw_preds:
            raise VerificationError("No prediction returned from NLI model for pair.")

        p_contra, p_entail, p_neut = _softmax(raw_preds[0])

        if p_entail >= self.entailment_threshold and p_entail > p_contra:
            relation = PairRelation.ENTAILS
            score = p_entail
        elif p_contra >= self.contradiction_threshold and p_contra > p_entail:
            relation = PairRelation.CONTRADICTS
            score = p_contra
        else:
            relation = PairRelation.NEUTRAL
            score = p_neut

        rationale = (
            f"NLI evaluated passage at {evidence.page_or_section}: "
            f"Entailment={p_entail:.2f}, Contradiction={p_contra:.2f}, Neutral={p_neut:.2f}."
        )

        return PairNLIResult(
            evidence_id=evidence.evidence_id,
            relation=relation,
            score=round(score, 3),
            rationale=rationale
        )

    def evaluate_claim(
        self,
        claim_text: str,
        candidate_evidence: List[Evidence]
    ) -> ClaimVerificationResult:
        """
        Evaluates an atomic claim against candidate evidence passages.
        Aggregates individual pair NLI scores into a structured verdict adhering to
        Second Opinion verdict categories and strict citation grounding.
        """
        valid_ids = {e.evidence_id for e in candidate_evidence}

        # 1. Filter out candidate passages below the minimum relevance threshold
        active_evidence = [
            e for e in candidate_evidence
            if e.relevance_score >= self.min_relevance_threshold and e.text.strip()
        ]

        if not active_evidence:
            return ClaimVerificationResult(
                claim_text=claim_text,
                verdict=VerdictCategory.UNSUPPORTED,
                explanation="Candidate source passages do not contain facts confirming or addressing this claim.",
                confidence=0.85,
                evidence_ids=[],
                pair_results=[]
            )

        # 2. Batch predict on all active candidate evidence passages
        pairs = [(e.text, claim_text) for e in active_evidence]
        raw_outputs = self._predict_pairs(pairs)

        pair_results: List[PairNLIResult] = []
        entailing_items: List[Tuple[Evidence, float, float, float]] = []
        contradicting_items: List[Tuple[Evidence, float, float, float]] = []
        neutral_items: List[Tuple[Evidence, float, float, float]] = []

        for idx, ev in enumerate(active_evidence):
            p_contra, p_entail, p_neut = _softmax(raw_outputs[idx])

            if p_entail >= self.entailment_threshold and p_entail > p_contra:
                relation = PairRelation.ENTAILS
                score = p_entail
                entailing_items.append((ev, p_entail, p_contra, p_neut))
            elif p_contra >= self.contradiction_threshold and p_contra > p_entail:
                relation = PairRelation.CONTRADICTS
                score = p_contra
                contradicting_items.append((ev, p_entail, p_contra, p_neut))
            else:
                relation = PairRelation.NEUTRAL
                score = p_neut
                neutral_items.append((ev, p_entail, p_contra, p_neut))

            rationale = (
                f"NLI evaluated passage at {ev.page_or_section}: "
                f"Entailment={p_entail:.2f}, Contradiction={p_contra:.2f}, Neutral={p_neut:.2f}."
            )
            pair_results.append(
                PairNLIResult(
                    evidence_id=ev.evidence_id,
                    relation=relation,
                    score=round(score, 3),
                    rationale=rationale
                )
            )

        # 3. Apply Multi-Evidence Aggregation Policy
        # Rule A: Strong support and strong contradiction across different passages -> AMBIGUOUS
        if entailing_items and contradicting_items:
            entailing_items.sort(key=lambda x: x[1], reverse=True)
            contradicting_items.sort(key=lambda x: x[2], reverse=True)
            top_ent_ev, top_ent, _, _ = entailing_items[0]
            top_cont_ev, _, top_cont, _ = contradicting_items[0]

            used_ids = [item[0].evidence_id for item in contradicting_items] + [item[0].evidence_id for item in entailing_items]
            explanation = (
                f"Conflicting source evidence detected across passages: "
                f"Passage at {top_ent_ev.page_or_section} supports the claim (entailment: {top_ent:.2f}), "
                f"while passage at {top_cont_ev.page_or_section} refutes it (contradiction: {top_cont:.2f})."
            )
            confidence = round((top_ent + top_cont) / 2.0, 2)
            verdict = VerdictCategory.AMBIGUOUS

        # Rule B: Strong contradiction with no conflicting entailment -> CONTRADICTED
        elif contradicting_items and not entailing_items:
            contradicting_items.sort(key=lambda x: x[2], reverse=True)
            top_cont_ev, _, top_cont, _ = contradicting_items[0]

            used_ids = [item[0].evidence_id for item in contradicting_items]
            explanation = (
                f"Directly refuted by source evidence at {top_cont_ev.page_or_section} "
                f"(contradiction confidence: {top_cont:.2f})."
            )
            confidence = round(top_cont, 2)
            verdict = VerdictCategory.CONTRADICTED

        # Rule C: Strong entailment with no conflicting contradiction -> SUPPORTED
        elif entailing_items and not contradicting_items:
            entailing_items.sort(key=lambda x: x[1], reverse=True)
            top_ent_ev, top_ent, _, _ = entailing_items[0]

            used_ids = [item[0].evidence_id for item in entailing_items]
            explanation = (
                f"Directly corroborated and entailed by source evidence at {top_ent_ev.page_or_section} "
                f"(entailment confidence: {top_ent:.2f})."
            )
            confidence = round(top_ent, 2)
            verdict = VerdictCategory.SUPPORTED

        # Rule D: Neither strong entailment nor strong contradiction reached threshold
        else:
            # Distinguish INCONCLUSIVE (topically relevant evidence present, but uninformative/neutral)
            # from UNSUPPORTED (evidence is off-topic or irrelevant)
            top_relevance = max(e.relevance_score for e in active_evidence)
            top_ev = active_evidence[0]
            top_neut_score = neutral_items[0][3] if neutral_items else 0.50

            # If the retrieval stage found topically relevant passages (relevance >= 0.50),
            # neutrality indicates inconclusive context (e.g. preliminary study, different cohort).
            if top_relevance >= 0.50:
                verdict = VerdictCategory.INCONCLUSIVE
                used_ids = [top_ev.evidence_id]
                explanation = (
                    f"Source passage at {top_ev.page_or_section} discusses related context "
                    f"but provides insufficient evidence (neutral confidence: {top_neut_score:.2f}) "
                    f"to substantiate or refute the claim."
                )
                confidence = round(top_neut_score, 2)
            else:
                verdict = VerdictCategory.UNSUPPORTED
                used_ids = []
                explanation = "Candidate source passages do not contain facts confirming or addressing this claim."
                confidence = 0.85

        # 4. Strict Citation Integrity Guardrails
        validated_ids = validate_citations(used_ids, valid_ids)
        if verdict == VerdictCategory.UNSUPPORTED:
            validated_ids = []

        return ClaimVerificationResult(
            claim_text=claim_text,
            verdict=verdict,
            explanation=explanation,
            confidence=max(0.10, min(0.99, confidence)),
            evidence_ids=validated_ids,
            pair_results=pair_results
        )
