import sys
from pathlib import Path
import pytest

# Ensure repository root and services/api are in sys.path
REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from evaluation.evaluate import (
    calculate_binary_metrics_for_class,
    calculate_multiclass_metrics,
    CATEGORIES,
)


@pytest.fixture
def benchmark_confusion_matrix():
    """
    Exact 5x5 confusion matrix from the 76-claim benchmark audit.
    Rows: Ground Truth, Columns: Predicted.
    """
    return {
        "supported": {"supported": 31, "contradicted": 0, "unsupported": 0, "ambiguous": 0, "inconclusive": 0},
        "contradicted": {"supported": 1, "contradicted": 19, "unsupported": 0, "ambiguous": 0, "inconclusive": 0},
        "unsupported": {"supported": 2, "contradicted": 1, "unsupported": 8, "ambiguous": 0, "inconclusive": 2},
        "ambiguous": {"supported": 0, "contradicted": 0, "unsupported": 0, "ambiguous": 6, "inconclusive": 0},
        "inconclusive": {"supported": 1, "contradicted": 0, "unsupported": 2, "ambiguous": 0, "inconclusive": 3},
    }


def test_supported_class_binary_metrics_on_benchmark_matrix(benchmark_confusion_matrix):
    """
    Audits the binary metrics for the 'supported' class on the audited benchmark matrix.
    Verifies that:
      - TP = 31 (actual supported, predicted supported)
      - FP = 4 (1 contradicted, 2 unsupported, 1 inconclusive predicted as supported)
      - FN = 0 (actual supported, predicted non-supported)
      - TN = 41 (actual non-supported, predicted non-supported)
      - Actual Positive = 31 (31/76)
      - Actual Negative = 45 (45/76)
      - FPR = FP / (FP + TN) = 4 / 45 = 8.888...% (8.9%)
      - Precision = 31 / 35 = 88.6%
      - Recall (TPR) = 31 / 31 = 100.0%
      - FNR = 0 / 31 = 0.0%
    """
    metrics = calculate_binary_metrics_for_class(
        benchmark_confusion_matrix,
        target_class="supported",
        categories=CATEGORIES
    )

    assert metrics["class"] == "supported"
    assert metrics["tp"] == 31
    assert metrics["fp"] == 4
    assert metrics["fn"] == 0
    assert metrics["tn"] == 41

    assert metrics["actual_positive"] == 31
    assert metrics["actual_negative"] == 45
    assert metrics["predicted_positive"] == 35
    assert metrics["predicted_negative"] == 41

    # Invariants
    assert metrics["tp"] + metrics["fp"] + metrics["fn"] + metrics["tn"] == 76
    assert metrics["actual_positive"] + metrics["actual_negative"] == 76

    # Denominators and fraction strings
    assert metrics["fpr_frac"] == "4/45"
    assert metrics["fnr_frac"] == "0/31"
    assert metrics["precision_frac"] == "31/35"
    assert metrics["recall_frac"] == "31/31"

    # Rounded float values
    assert metrics["false_positive_rate"] == 0.089
    assert metrics["false_negative_rate"] == 0.0
    assert metrics["precision"] == 0.886
    assert metrics["recall"] == 1.0


def test_supported_class_binary_metrics_mock_double_all_predicted_supported():
    """
    Audits binary metrics when a trivial provider predicts 'supported' for all 76 claims.
    """
    mock_matrix = {
        "supported": {"supported": 31, "contradicted": 0, "unsupported": 0, "ambiguous": 0, "inconclusive": 0},
        "contradicted": {"supported": 20, "contradicted": 0, "unsupported": 0, "ambiguous": 0, "inconclusive": 0},
        "unsupported": {"supported": 13, "contradicted": 0, "unsupported": 0, "ambiguous": 0, "inconclusive": 0},
        "ambiguous": {"supported": 6, "contradicted": 0, "unsupported": 0, "ambiguous": 0, "inconclusive": 0},
        "inconclusive": {"supported": 6, "contradicted": 0, "unsupported": 0, "ambiguous": 0, "inconclusive": 0},
    }

    metrics = calculate_binary_metrics_for_class(
        mock_matrix,
        target_class="supported",
        categories=CATEGORIES
    )

    assert metrics["tp"] == 31
    assert metrics["fp"] == 45
    assert metrics["fn"] == 0
    assert metrics["tn"] == 0

    assert metrics["actual_positive"] == 31
    assert metrics["actual_negative"] == 45
    assert metrics["predicted_positive"] == 76
    assert metrics["predicted_negative"] == 0

    assert metrics["fpr_frac"] == "45/45"
    assert metrics["false_positive_rate"] == 1.0
    assert metrics["precision_frac"] == "31/76"
    assert metrics["precision"] == 0.408
    assert metrics["recall_frac"] == "31/31"
    assert metrics["recall"] == 1.0
    assert metrics["fnr_frac"] == "0/31"
    assert metrics["false_negative_rate"] == 0.0


def test_targeted_non_supported_claims_incorrectly_predicted_as_supported():
    """
    Targeted regression test with controlled counts:
    - 5 actual supported claims: 4 predicted supported, 1 predicted contradicted.
    - 10 actual non-supported claims: 3 predicted supported (FP=3), 7 predicted non-supported (TN=7).
    """
    synthetic_matrix = {
        "supported": {"supported": 4, "contradicted": 1, "unsupported": 0, "ambiguous": 0, "inconclusive": 0},
        "contradicted": {"supported": 1, "contradicted": 4, "unsupported": 0, "ambiguous": 0, "inconclusive": 0},
        "unsupported": {"supported": 2, "contradicted": 0, "unsupported": 3, "ambiguous": 0, "inconclusive": 0},
        "ambiguous": {"supported": 0, "contradicted": 0, "unsupported": 0, "ambiguous": 0, "inconclusive": 0},
        "inconclusive": {"supported": 0, "contradicted": 0, "unsupported": 0, "ambiguous": 0, "inconclusive": 0},
    }

    metrics = calculate_binary_metrics_for_class(
        synthetic_matrix,
        target_class="supported",
        categories=CATEGORIES
    )

    assert metrics["tp"] == 4
    assert metrics["fp"] == 3  # 1 from contradicted, 2 from unsupported
    assert metrics["fn"] == 1  # 1 from supported predicted contradicted
    assert metrics["tn"] == 7  # 4 contradicted + 3 unsupported

    assert metrics["actual_positive"] == 5
    assert metrics["actual_negative"] == 10
    assert metrics["predicted_positive"] == 7
    assert metrics["predicted_negative"] == 8

    # FPR = FP / (FP + TN) = 3 / 10 = 0.3 (30%)
    assert metrics["false_positive_rate"] == 0.3
    assert metrics["fpr_frac"] == "3/10"

    # FNR = FN / (TP + FN) = 1 / 5 = 0.2 (20%)
    assert metrics["false_negative_rate"] == 0.2
    assert metrics["fnr_frac"] == "1/5"

    # Precision = TP / (TP + FP) = 4 / 7 = 0.571 (57.1%)
    assert metrics["precision"] == 0.571
    assert metrics["precision_frac"] == "4/7"

    # Recall = TP / (TP + FN) = 4 / 5 = 0.8 (80%)
    assert metrics["recall"] == 0.8
    assert metrics["recall_frac"] == "4/5"


def test_multiclass_metrics_breakdown_and_macro_micro(benchmark_confusion_matrix):
    """
    Validates per-class precision, recall, F1, and Macro/Micro averages.
    """
    res = calculate_multiclass_metrics(benchmark_confusion_matrix, CATEGORIES)

    assert res["total_tp"] == 67
    assert res["total_claims"] == 76
    assert res["micro_accuracy"] == 0.882
    assert res["micro_frac"] == "67/76"

    # Macro averages
    assert res["macro_precision"] == 0.847
    assert res["macro_recall"] == 0.813
    assert res["macro_f1"] == 0.826

    # Category checks
    per_cat = res["per_category"]
    assert per_cat["supported"]["f1"] == 0.939
    assert per_cat["supported"]["prec_frac"] == "31/35"
    assert per_cat["supported"]["rec_frac"] == "31/31"

    assert per_cat["contradicted"]["f1"] == 0.950
    assert per_cat["contradicted"]["prec_frac"] == "19/20"
    assert per_cat["contradicted"]["rec_frac"] == "19/20"

    assert per_cat["unsupported"]["f1"] == 0.696
    assert per_cat["unsupported"]["prec_frac"] == "8/10"
    assert per_cat["unsupported"]["rec_frac"] == "8/13"

    assert per_cat["ambiguous"]["f1"] == 1.000
    assert per_cat["ambiguous"]["prec_frac"] == "6/6"
    assert per_cat["ambiguous"]["rec_frac"] == "6/6"

    assert per_cat["inconclusive"]["f1"] == 0.545
    assert per_cat["inconclusive"]["prec_frac"] == "3/5"
    assert per_cat["inconclusive"]["rec_frac"] == "3/6"


def test_metrics_handles_empty_classes_without_zero_division():
    """
    Validates that missing or unpredicted classes gracefully return 0.0 without crashing.
    """
    empty_matrix = {cat: {c: 0 for c in CATEGORIES} for cat in CATEGORIES}
    empty_matrix["supported"]["supported"] = 1

    res = calculate_multiclass_metrics(empty_matrix, CATEGORIES)
    assert res["total_tp"] == 1
    assert res["total_claims"] == 1
    assert res["micro_accuracy"] == 1.0
    # Only 1 class has support > 0
    assert res["macro_f1"] == 1.0

    binary = calculate_binary_metrics_for_class(empty_matrix, "contradicted", CATEGORIES)
    assert binary["tp"] == 0
    assert binary["fp"] == 0
    assert binary["fn"] == 0
    assert binary["tn"] == 1
    assert binary["false_positive_rate"] == 0.0
    assert binary["fpr_frac"] == "0/1"
    assert binary["precision"] == 0.0
    assert binary["precision_frac"] == "0/0"
    assert binary["recall"] == 0.0
    assert binary["recall_frac"] == "0/0"
