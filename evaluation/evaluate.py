#!/usr/bin/env python3
"""
Second Opinion — Verification Evaluation Benchmark Harness
Owner: Developer 4 — Verification and Evaluation

Evaluates claim verification accuracy, retrieval grounding, citation integrity,
and offset preservation against multi-domain manually verified benchmarks.
"""

import os
import sys
import json
import argparse
from typing import List, Dict, Any, Tuple, Optional
from collections import defaultdict

# Add services/api to PYTHONPATH so application modules are importable
API_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "services", "api"))
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

from app.schemas import VerdictCategory, Evidence
from app.ingestion.chunker import chunk_document
from app.retrieval.retriever import retrieve_evidence
from app.verification.verifier import ClaimVerifier
from app.verification.providers.deterministic import DeterministicRuleEvaluator
from app.verification.providers.mock import MockVerificationProvider

CATEGORIES = [
    VerdictCategory.SUPPORTED.value,
    VerdictCategory.CONTRADICTED.value,
    VerdictCategory.UNSUPPORTED.value,
    VerdictCategory.AMBIGUOUS.value,
    VerdictCategory.INCONCLUSIVE.value,
]


def load_test_cases(file_path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(file_path):
        print(f"Error: Test cases file not found at {file_path}")
        sys.exit(1)

    cases = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line_str = line.strip()
            if not line_str or line_str.startswith("#"):
                continue
            try:
                cases.append(json.loads(line_str))
            except json.JSONDecodeError as e:
                print(f"Warning: Failed to parse line {line_no}: {e}")
    return cases


def calculate_binary_metrics_for_class(
    confusion_matrix: Dict[str, Dict[str, int]],
    target_class: str,
    categories: List[str] = CATEGORIES
) -> Dict[str, Any]:
    """
    Computes binary one-vs-rest classification metrics for a specific target class.

    True Positives (TP):  actual target_class, predicted target_class
    False Positives (FP): actual non-target_class, predicted target_class
    False Negatives (FN): actual target_class, predicted non-target_class
    True Negatives (TN):  actual non-target_class, predicted non-target_class

    Formulae:
      Precision:                 TP / (TP + FP)
      Recall (TPR):              TP / (TP + FN)
      False-Negative Rate (FNR): FN / (TP + FN)
      False-Positive Rate (FPR): FP / (FP + TN)
    """
    tp = confusion_matrix[target_class][target_class]
    fp = sum(confusion_matrix[r][target_class] for r in categories if r != target_class)
    fn = sum(confusion_matrix[target_class][c] for c in categories if c != target_class)
    tn = sum(
        confusion_matrix[r][c]
        for r in categories if r != target_class
        for c in categories if c != target_class
    )

    total_actual_pos = tp + fn
    total_actual_neg = fp + tn
    total_pred_pos = tp + fp
    total_pred_neg = tn + fn

    prec = tp / total_pred_pos if total_pred_pos > 0 else 0.0
    rec = tp / total_actual_pos if total_actual_pos > 0 else 0.0
    fnr = fn / total_actual_pos if total_actual_pos > 0 else 0.0
    fpr = fp / total_actual_neg if total_actual_neg > 0 else 0.0

    return {
        "class": target_class,
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn,
        "actual_positive": total_actual_pos,
        "actual_negative": total_actual_neg,
        "predicted_positive": total_pred_pos,
        "predicted_negative": total_pred_neg,
        "precision": round(prec, 3),
        "precision_frac": f"{tp}/{total_pred_pos}",
        "recall": round(rec, 3),
        "recall_frac": f"{tp}/{total_actual_pos}",
        "false_negative_rate": round(fnr, 3),
        "fnr_frac": f"{fn}/{total_actual_pos}",
        "false_positive_rate": round(fpr, 3),
        "fpr_frac": f"{fp}/{total_actual_neg}",
    }


def calculate_multiclass_metrics(
    confusion_matrix: Dict[str, Dict[str, int]],
    categories: List[str] = CATEGORIES
) -> Dict[str, Any]:
    """
    Computes per-category and macro/micro aggregated classification metrics.
    """
    per_category: Dict[str, Dict[str, Any]] = {}
    macro_f1_sum = 0.0
    macro_prec_sum = 0.0
    macro_rec_sum = 0.0
    valid_categories = 0
    total_tp = 0
    total_claims = 0

    for cat in categories:
        tp = confusion_matrix[cat][cat]
        total_tp += tp
        fp = sum(confusion_matrix[other][cat] for other in categories if other != cat)
        fn = sum(confusion_matrix[cat][other] for other in categories if other != cat)
        support = sum(confusion_matrix[cat].values())
        total_claims += support

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        if support > 0:
            macro_f1_sum += f1
            macro_prec_sum += prec
            macro_rec_sum += rec
            valid_categories += 1

        per_category[cat] = {
            "precision": round(prec, 3),
            "prec_frac": f"{tp}/{tp+fp}",
            "recall": round(rec, 3),
            "rec_frac": f"{tp}/{support}",
            "f1": round(f1, 3),
            "support": support,
        }

    macro_f1 = macro_f1_sum / valid_categories if valid_categories > 0 else 0.0
    macro_prec = macro_prec_sum / valid_categories if valid_categories > 0 else 0.0
    macro_rec = macro_rec_sum / valid_categories if valid_categories > 0 else 0.0
    micro_accuracy = total_tp / total_claims if total_claims > 0 else 0.0

    return {
        "per_category": per_category,
        "macro_f1": round(macro_f1, 3),
        "macro_precision": round(macro_prec, 3),
        "macro_recall": round(macro_rec, 3),
        "micro_accuracy": round(micro_accuracy, 3),
        "micro_frac": f"{total_tp}/{total_claims}",
        "total_tp": total_tp,
        "total_claims": total_claims,
    }


def evaluate_benchmark(
    cases: List[Dict[str, Any]],
    verifier: ClaimVerifier,
    provider_name: str,
    isolate_retrieval: bool = True,
    load_time_sec: Optional[float] = None,
    retrieval_strategy: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates claims across the benchmark cases.
    
    Args:
        cases: Ground-truth benchmark test cases.
        verifier: ClaimVerifier configured with target provider.
        provider_name: Label for display (e.g. 'Deterministic Rule-Based', 'Neural NLI').
        isolate_retrieval: If True, supplies ground-truth source passages directly to isolate
                           verification quality from retrieval. If False, runs end-to-end retrieval.
        load_time_sec: Optional model loading duration in seconds.
    """
    import time
    t_start = time.time()
    mode_label = "Isolated Verification" if isolate_retrieval else "End-to-End Pipeline"
    print(f"\nEvaluating Provider: {provider_name} ({mode_label})")
    print("=" * 82)

    confusion_matrix = {row: {col: 0 for col in CATEGORIES} for row in CATEGORIES}
    retrieval_hits_1 = 0
    retrieval_hits_3 = 0
    retrieval_hits_5 = 0
    total_retrieval_queries = 0
    mrr_total = 0.0

    valid_citation_claims = 0      # Syntactic citation validity: cited IDs exist in source (and [] for unsupported)
    relevant_citation_claims = 0   # Semantic evidence support: cited IDs match acceptable ground-truth evidence
    total_claims = 0
    exact_offset_matches = 0
    explanation_criteria_matches = 0

    for case in cases:
        source_text = case["source_text"]
        ai_answer = case["ai_answer"]
        chunks = chunk_document(source_text)

        all_evidence: List[Evidence] = []
        chunk_dict_list: List[Dict[str, Any]] = []
        for idx, ch in enumerate(chunks):
            eid = f"ev_{idx}"
            ev = Evidence(
                evidence_id=eid,
                source_id="src_eval",
                source_name=f"doc_{case['case_id']}.txt",
                text=ch["text"],
                page_or_section=ch.get("page_or_section", f"Section {idx+1}"),
                relevance_score=0.90
            )
            all_evidence.append(ev)
            chunk_dict_list.append({
                "evidence_id": eid,
                "source_id": "src_eval",
                "source_name": f"doc_{case['case_id']}.txt",
                "text": ch["text"],
                "page_or_section": ch.get("page_or_section", f"Section {idx+1}")
            })

        valid_evidence_ids = {e.evidence_id for e in all_evidence}

        for exp in case.get("expected_claims", []):
            total_claims += 1
            claim_text = exp["claim_text"]
            start_off = exp["start_offset"]
            end_off = exp["end_offset"]
            expected_verdict = exp["expected_verdict"]
            acceptable_ev_ids = exp.get("acceptable_evidence_ids", [])
            expected_criteria = exp.get("expected_explanation_criteria", [])

            # 1. Claim offset integrity check
            if ai_answer[start_off:end_off] == claim_text:
                exact_offset_matches += 1

            # 2. Retrieval evaluation (measure top-1, top-3, top-5 and MRR)
            if acceptable_ev_ids:
                total_retrieval_queries += 1
                top_chunks_5 = retrieve_evidence(claim_text, chunk_dict_list, top_k=5, strategy=retrieval_strategy)
                retrieved_ids = [tc["evidence_id"] for tc in top_chunks_5]
                
                # Recall@1
                if any(tc_id in acceptable_ev_ids for tc_id in retrieved_ids[:1]):
                    retrieval_hits_1 += 1
                # Recall@3
                if any(tc_id in acceptable_ev_ids for tc_id in retrieved_ids[:3]):
                    retrieval_hits_3 += 1
                # Recall@5
                if any(tc_id in acceptable_ev_ids for tc_id in retrieved_ids[:5]):
                    retrieval_hits_5 += 1

                # MRR
                hit_rank = 0
                for rank, tc_id in enumerate(retrieved_ids, 1):
                    if tc_id in acceptable_ev_ids:
                        hit_rank = rank
                        break
                if hit_rank > 0:
                    mrr_total += 1.0 / hit_rank

            # 3. Candidate evidence selection for verifier
            if isolate_retrieval:
                candidate_evidence = all_evidence
            else:
                top_chunks = retrieve_evidence(claim_text, chunk_dict_list, top_k=3, strategy=retrieval_strategy)
                candidate_evidence = []
                for tc in top_chunks:
                    matched = next((e for e in all_evidence if e.evidence_id == tc["evidence_id"]), None)
                    if matched and tc.get("relevance_score", 0.0) > 0.0:
                        candidate_evidence.append(
                            Evidence(
                                evidence_id=matched.evidence_id,
                                source_id=matched.source_id,
                                source_name=matched.source_name,
                                text=matched.text,
                                page_or_section=matched.page_or_section,
                                relevance_score=float(tc.get("relevance_score", 0.0))
                            )
                        )

            # 4. Execute verification
            result = verifier.verify_claim(claim_text, candidate_evidence)
            predicted_verdict = result.verdict.value

            # Record in confusion matrix
            if expected_verdict in confusion_matrix and predicted_verdict in confusion_matrix[expected_verdict]:
                confusion_matrix[expected_verdict][predicted_verdict] += 1

            # 5. Syntactic Citation Validity Check
            # (Invariant: all cited IDs exist in supplied passages, and unsupported claims have empty citations)
            citations_syntactically_valid = True
            for cid in result.evidence_ids:
                if cid not in valid_evidence_ids:
                    citations_syntactically_valid = False
            if result.verdict == VerdictCategory.UNSUPPORTED and len(result.evidence_ids) > 0:
                citations_syntactically_valid = False

            if citations_syntactically_valid:
                valid_citation_claims += 1

            # 6. Semantic Evidence Relevance / Support Check
            # (Did the verifier actually cite acceptable evidence passages that substantiate the expected verdict?)
            if expected_verdict == VerdictCategory.UNSUPPORTED.value:
                # Unsupported claims must cite nothing
                if len(result.evidence_ids) == 0:
                    relevant_citation_claims += 1
            else:
                # For supported, contradicted, ambiguous, or inconclusive claims, at least one cited ID
                # must match the acceptable evidence passages
                if acceptable_ev_ids and any(cid in acceptable_ev_ids for cid in result.evidence_ids):
                    relevant_citation_claims += 1

            # 7. Explanation criteria check
            expl_lower = result.explanation.lower()
            if not expected_criteria or any(crit.lower() in expl_lower for crit in expected_criteria):
                explanation_criteria_matches += 1

    # Compute classification and binary metrics
    multiclass = calculate_multiclass_metrics(confusion_matrix, CATEGORIES)
    per_category = multiclass["per_category"]
    macro_f1 = multiclass["macro_f1"]
    macro_prec = multiclass["macro_precision"]
    macro_rec = multiclass["macro_recall"]
    micro_accuracy = multiclass["micro_accuracy"]
    total_tp = multiclass["total_tp"]

    supported_binary = calculate_binary_metrics_for_class(
        confusion_matrix,
        VerdictCategory.SUPPORTED.value,
        CATEGORIES
    )

    # Retrieval and integrity metrics
    retrieval_recall = retrieval_hits_3 / total_retrieval_queries if total_retrieval_queries > 0 else 1.0
    mrr = mrr_total / total_retrieval_queries if total_retrieval_queries > 0 else 1.0
    citation_id_validity = valid_citation_claims / total_claims if total_claims > 0 else 1.0
    evidence_support_accuracy = relevant_citation_claims / total_claims if total_claims > 0 else 1.0
    offset_integrity = exact_offset_matches / total_claims if total_claims > 0 else 1.0

    # Print Confusion Matrix Table
    print("\nConfusion Matrix (Rows: Ground Truth, Columns: Predicted):")
    col_headers = [c[:5] for c in CATEGORIES]
    header = f"{'Actual':<14} | " + " | ".join(f"{h:<5}" for h in col_headers) + " | Total"
    print("-" * len(header))
    print(header)
    print("-" * len(header))
    for actual in CATEGORIES:
        row_str = f"{actual:<14} | "
        row_str += " | ".join(f"{confusion_matrix[actual][pred]:<5}" for pred in CATEGORIES)
        row_str += f" | {sum(confusion_matrix[actual].values())}"
        print(row_str)
    print("-" * len(header))
    col_totals = [sum(confusion_matrix[r][c] for r in CATEGORIES) for c in CATEGORIES]
    totals_str = f"{'Pred Total':<14} | " + " | ".join(f"{t:<5}" for t in col_totals) + f" | {total_claims}"
    print(totals_str)
    print("=" * len(header))

    # Print Category Performance Table
    print("\nClassification Metrics by Category:")
    p_header = f"{'Category':<14} | {'Precision':<17} | {'Recall':<17} | {'F1-Score':<8} | {'Support':<7}"
    print("-" * len(p_header))
    print(p_header)
    print("-" * len(p_header))
    for cat in CATEGORIES:
        m = per_category[cat]
        p_str = f"{m['precision']:.3f} ({m['prec_frac']})"
        r_str = f"{m['recall']:.3f} ({m['rec_frac']})"
        print(f"{cat:<14} | {p_str:<17} | {r_str:<17} | {m['f1']:<8.3f} | {m['support']:<7}")
    print("-" * len(p_header))
    print(f"{'Macro Average':<14} | {macro_prec:<17.3f} | {macro_rec:<17.3f} | {macro_f1:<8.3f} | {total_claims:<7}")
    print(f"{'Micro Average':<14} | {micro_accuracy:<17.3f} | {micro_accuracy:<17.3f} | {micro_accuracy:<8.3f} | {total_tp}/{total_claims}")
    print("=" * len(p_header))

    # Print Supported Class Binary Performance Breakdown
    print("\nSupported Class Binary Performance:")
    print(f"  True Positives (TP):                {supported_binary['tp']:<4} (actual supported, predicted supported)")
    print(f"  False Positives (FP):               {supported_binary['fp']:<4} (actual non-supported, predicted supported)")
    print(f"  False Negatives (FN):               {supported_binary['fn']:<4} (actual supported, predicted non-supported)")
    print(f"  True Negatives (TN):                {supported_binary['tn']:<4} (actual non-supported, predicted non-supported)")
    print(f"  Supported Precision:                {supported_binary['precision'] * 100:.1f}% ({supported_binary['precision_frac']})")
    print(f"  Supported Recall (TPR):             {supported_binary['recall'] * 100:.1f}% ({supported_binary['recall_frac']})")
    print(f"  Supported False-Negative Rate (FNR): {supported_binary['false_negative_rate'] * 100:.1f}% ({supported_binary['fnr_frac']})")
    print(f"  Supported False-Positive Rate (FPR): {supported_binary['false_positive_rate'] * 100:.1f}% ({supported_binary['fpr_frac']})")

    # Print System Grounding and Integrity Metrics
    retrieval_recall_1 = retrieval_hits_1 / max(1, total_retrieval_queries)
    retrieval_recall_3 = retrieval_hits_3 / max(1, total_retrieval_queries)
    retrieval_recall_5 = retrieval_hits_5 / max(1, total_retrieval_queries)
    mrr = mrr_total / max(1, total_retrieval_queries)

    print("\nSystem Grounding and Integrity Metrics:")
    print(f"  Claim Offset Integrity:            {offset_integrity * 100:.1f}% ({exact_offset_matches}/{total_claims})")
    print(f"  Citation-ID Validity (Syntactic):   {citation_id_validity * 100:.1f}% ({valid_citation_claims}/{total_claims})")
    print(f"  Evidence Support Acc. (Semantic):   {evidence_support_accuracy * 100:.1f}% ({relevant_citation_claims}/{total_claims})")
    print(f"  Supported False-Positive Rate (FPR): {supported_binary['false_positive_rate'] * 100:.1f}% ({supported_binary['fpr_frac']})")
    print(f"  Supported False-Negative Rate (FNR): {supported_binary['false_negative_rate'] * 100:.1f}% ({supported_binary['fnr_frac']})")
    print(f"  Evidence Retrieval Recall@1:        {retrieval_recall_1 * 100:.1f}% ({retrieval_hits_1}/{total_retrieval_queries})")
    print(f"  Evidence Retrieval Recall@3:        {retrieval_recall_3 * 100:.1f}% ({retrieval_hits_3}/{total_retrieval_queries})")
    print(f"  Evidence Retrieval Recall@5:        {retrieval_recall_5 * 100:.1f}% ({retrieval_hits_5}/{total_retrieval_queries})")
    print(f"  Retrieval MRR (Mean Reciprocal):    {mrr:.3f} ({mrr_total:.2f}/{total_retrieval_queries})")
    # Calculate execution and latency metrics
    elapsed_sec = time.time() - t_start
    avg_ms_per_claim = (elapsed_sec / total_claims * 1000.0) if total_claims > 0 else 0.0

    print("\nExecution and Latency Profiling:")
    if load_time_sec is not None:
        print(f"  Model Loading Duration:             {load_time_sec:.3f} s")
    print(f"  Total Verification Time:            {elapsed_sec:.3f} s")
    print(f"  Average Latency Per Claim:          {avg_ms_per_claim:.1f} ms")
    print("=" * 82)

    return {
        "provider": provider_name,
        "mode": mode_label,
        "total_claims": total_claims,
        "macro_f1": macro_f1,
        "macro_precision": macro_prec,
        "macro_recall": macro_rec,
        "micro_accuracy": micro_accuracy,
        "correct_predictions": total_tp,
        "per_category": per_category,
        "confusion_matrix": confusion_matrix,
        "supported_binary_metrics": supported_binary,
        "false_positive_rate_supported": supported_binary["false_positive_rate"],
        "false_positive_rate_supported_frac": supported_binary["fpr_frac"],
        "false_negative_rate_supported": supported_binary["false_negative_rate"],
        "false_negative_rate_supported_frac": supported_binary["fnr_frac"],
        "offset_integrity": round(offset_integrity, 3),
        "citation_id_validity": round(citation_id_validity, 3),
        "evidence_support_accuracy": round(evidence_support_accuracy, 3),
        "retrieval_recall_at_1": round(retrieval_recall_1, 3),
        "retrieval_recall_at_3": round(retrieval_recall_3, 3),
        "retrieval_recall_at_5": round(retrieval_recall_5, 3),
        "retrieval_mrr": round(mrr, 3),
        "elapsed_seconds": round(elapsed_sec, 3),
        "avg_latency_ms_per_claim": round(avg_ms_per_claim, 1),
        "load_time_seconds": round(load_time_sec, 3) if load_time_sec is not None else None
    }


def evaluate_retrieval_suite(cases: List[Dict[str, Any]], strategies: List[str] = ["hybrid", "bm25", "lexical"]):
    """
    Evaluates evidence retrieval independently of claim verification.
    Measures Recall@1, Recall@3, Recall@5, MRR, and latency per query across strategies.
    """
    import time
    print("\n" + "=" * 82)
    print("Independent Retrieval Pipeline Benchmark")
    print("=" * 82)
    print(f"Evaluating {len(cases)} cases across strategies: {strategies}\n")

    results = []

    for strat in strategies:
        t_start = time.time()
        total_queries = 0
        hits_1 = 0
        hits_3 = 0
        hits_5 = 0
        mrr_sum = 0.0

        for case in cases:
            source_text = case["source_text"]
            chunks = chunk_document(source_text)
            chunk_dict_list = [
                {
                    "evidence_id": f"ev_{idx}",
                    "source_id": "src_eval",
                    "source_name": f"doc_{case['case_id']}.txt",
                    "text": ch["text"],
                    "page_or_section": ch.get("page_or_section", f"Section {idx+1}")
                }
                for idx, ch in enumerate(chunks)
            ]

            for exp in case.get("expected_claims", []):
                acceptable_ids = exp.get("acceptable_evidence_ids", [])
                if not acceptable_ids:
                    continue

                total_queries += 1
                claim_text = exp["claim_text"]

                top_chunks = retrieve_evidence(claim_text, chunk_dict_list, top_k=5, strategy=strat)
                retrieved_ids = [tc["evidence_id"] for tc in top_chunks]

                if any(tid in acceptable_ids for tid in retrieved_ids[:1]):
                    hits_1 += 1
                if any(tid in acceptable_ids for tid in retrieved_ids[:3]):
                    hits_3 += 1
                if any(tid in acceptable_ids for tid in retrieved_ids[:5]):
                    hits_5 += 1

                hit_rank = 0
                for rank, tid in enumerate(retrieved_ids, 1):
                    if tid in acceptable_ids:
                        hit_rank = rank
                        break
                if hit_rank > 0:
                    mrr_sum += 1.0 / hit_rank

        elapsed = time.time() - t_start
        avg_ms = (elapsed / max(1, total_queries)) * 1000.0

        r1 = hits_1 / max(1, total_queries)
        r3 = hits_3 / max(1, total_queries)
        r5 = hits_5 / max(1, total_queries)
        mrr = mrr_sum / max(1, total_queries)

        results.append({
            "strategy": strat,
            "queries": total_queries,
            "recall@1": r1,
            "recall@3": r3,
            "recall@5": r5,
            "mrr": mrr,
            "latency_ms": avg_ms
        })

    # Print comparative markdown table
    print("---------------------------------------------------------------------------")
    print(f"{'Strategy':<14} | {'Recall@1':<10} | {'Recall@3':<10} | {'Recall@5':<10} | {'MRR':<8} | {'Latency/Q':<10}")
    print("---------------------------------------------------------------------------")
    for res in results:
        print(f"{res['strategy']:<14} | {res['recall@1']*100:<9.1f}% | {res['recall@3']*100:<9.1f}% | {res['recall@5']*100:<9.1f}% | {res['mrr']:<8.3f} | {res['latency_ms']:<8.2f} ms")
    print("---------------------------------------------------------------------------\n")
def evaluate_claim_decomposition(cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates claim decomposition precision, recall, and exact offset validity
    against manually annotated proposition boundaries.
    """
    from app.extraction.extractor import extract_claims

    total_expected_claims = 0
    total_predicted_claims = 0
    exact_span_matches = 0
    exact_offset_valid_count = 0
    compound_decompositions = 0
    conditional_preservations = 0

    print("\n==================================================================================")
    print("Evaluating Atomic Claim Decomposition Quality & Offset Integrity")
    print("==================================================================================")

    for case in cases:
        ai_answer = case["ai_answer"]
        expected = case.get("expected_claims", [])
        total_expected_claims += len(expected)

        predicted = extract_claims(ai_answer)
        total_predicted_claims += len(predicted)

        # Check invariant: ai_answer[start:end] == claim_text
        for pred in predicted:
            actual_slice = ai_answer[pred["start_offset"]:pred["end_offset"]]
            if actual_slice == pred["claim_text"]:
                exact_offset_valid_count += 1
            if pred.get("decomposition_type", "").startswith("compound_coordinate"):
                compound_decompositions += 1
            elif pred.get("decomposition_type") == "conditional_dependency_preserved":
                conditional_preservations += 1

        # Match predicted spans to expected spans
        for exp in expected:
            exp_start = exp["start_offset"]
            exp_end = exp["end_offset"]

            match_found = any(
                p["start_offset"] == exp_start and p["end_offset"] == exp_end
                for p in predicted
            )
            if match_found:
                exact_span_matches += 1

    precision = exact_span_matches / max(1, total_predicted_claims)
    recall = exact_span_matches / max(1, total_expected_claims)
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    offset_integrity = (exact_offset_valid_count / max(1, total_predicted_claims)) * 100.0

    print(f"Total Benchmark Cases:              {len(cases)}")
    print(f"Ground-Truth Expected Claims:       {total_expected_claims}")
    print(f"Model Predicted Decomposed Claims:  {total_predicted_claims}")
    print(f"Exact Span Matches (start & end):   {exact_span_matches}")
    print(f"Claim Decomposition Precision:      {precision * 100:.1f}% ({exact_span_matches}/{total_predicted_claims})")
    print(f"Claim Decomposition Recall:         {recall * 100:.1f}% ({exact_span_matches}/{total_expected_claims})")
    print(f"Claim Decomposition F1 Score:       {f1:.3f}")
    print(f"Character Offset Invariant Acc:     {offset_integrity:.1f}% ({exact_offset_valid_count}/{total_predicted_claims})")
    print(f"Coordinate Compound Decompositions: {compound_decompositions}")
    print(f"Conditionals Preserved Intact:      {conditional_preservations}")
    print("==================================================================================\n")

    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "offset_integrity": offset_integrity,
        "exact_matches": exact_span_matches,
        "expected": total_expected_claims,
        "predicted": total_predicted_claims
    }


def main():
    import time
    parser = argparse.ArgumentParser(description="Second Opinion Claim Verification Evaluator")
    parser.add_argument(
        "--mode",
        choices=["deterministic", "mock", "nli", "both", "all"],
        default="deterministic",
        help="Evaluation provider mode to run (deterministic, mock, nli, both, all)"
    )
    parser.add_argument(
        "--file",
        default=os.path.join(os.path.dirname(__file__), "test_cases.jsonl"),
        help="Path to evaluation test cases jsonl"
    )
    parser.add_argument(
        "--retrieval-suite",
        action="store_true",
        help="Run independent retrieval evaluation suite comparing strategies"
    )
    parser.add_argument(
        "--retrieval-file",
        default=os.path.join(os.path.dirname(__file__), "test_cases_retrieval.jsonl"),
        help="Path to retrieval benchmark cases jsonl"
    )
    parser.add_argument(
        "--decomposition-suite",
        action="store_true",
        help="Run atomic claim decomposition evaluation on benchmark suite"
    )
    parser.add_argument(
        "--decomposition-file",
        default=os.path.join(os.path.dirname(__file__), "test_cases_compound_multipassage.jsonl"),
        help="Path to compound decomposition test cases jsonl"
    )
    parser.add_argument(
        "--retrieval-strategy",
        choices=["hybrid", "bm25", "dense", "lexical"],
        default="hybrid",
        help="Retrieval strategy for end-to-end evaluation pipeline"
    )
    args = parser.parse_args()

    # 1. Independent Retrieval Benchmark Suite
    if args.retrieval_suite:
        ret_cases = load_test_cases(args.retrieval_file)
        evaluate_retrieval_suite(ret_cases, strategies=["hybrid", "bm25", "lexical"])
        return

    # 2. Independent Claim Decomposition Suite
    if args.decomposition_suite:
        decomp_cases = load_test_cases(args.decomposition_file)
        evaluate_claim_decomposition(decomp_cases)
        return

    cases = load_test_cases(args.file)
    total_claims = sum(len(c.get("expected_claims", [])) for c in cases)
    print(f"Loaded {len(cases)} benchmark cases containing {total_claims} claims from: {args.file}")

    if args.mode in ["deterministic", "both", "all"]:
        det_verifier = ClaimVerifier(provider=DeterministicRuleEvaluator())
        # 1. Isolated verification quality
        evaluate_benchmark(cases, det_verifier, "Deterministic Rule-Based Engine", isolate_retrieval=True)
        # 2. End-to-end pipeline with retriever
        evaluate_benchmark(
            cases,
            det_verifier,
            f"Deterministic Pipeline ({args.retrieval_strategy})",
            isolate_retrieval=False,
            retrieval_strategy=args.retrieval_strategy
        )

    if args.mode in ["mock", "all"]:
        mock_verifier = ClaimVerifier(provider=MockVerificationProvider())
        evaluate_benchmark(cases, mock_verifier, "Mock Verification Double", isolate_retrieval=True)

    if args.mode in ["nli", "both", "all"]:
        t0 = time.time()
        from app.verification.providers.nli import NLIVerificationProvider, get_nli_model
        nli_prov = NLIVerificationProvider()
        get_nli_model(nli_prov.model_name, nli_prov.device)
        t_load = time.time() - t0
        nli_verifier = ClaimVerifier(provider=nli_prov)
        # 1. Isolated verification quality
        evaluate_benchmark(
            cases,
            nli_verifier,
            f"Neural NLI CrossEncoder ({nli_prov.name})",
            isolate_retrieval=True,
            load_time_sec=t_load
        )
        # 2. End-to-end pipeline with retriever
        evaluate_benchmark(
            cases,
            nli_verifier,
            f"Neural NLI Pipeline ({nli_prov.name} + {args.retrieval_strategy})",
            isolate_retrieval=False,
            retrieval_strategy=args.retrieval_strategy
        )


if __name__ == "__main__":
    main()
