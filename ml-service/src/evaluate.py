# evaluate.py

from pathlib import Path
import torch
import joblib
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, precision_recall_curve, average_precision_score
)
from src.preprocess import load_and_preprocess
import matplotlib.pyplot as plt

# ---------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"

CENTRAL_MODEL_PATH = MODELS_DIR / "heart_model.pth"
# FEDERATED_MODEL_PATH = MODELS_DIR / "global_model.pth"

PREPROCESSOR_PATH = BASE_DIR / "artifacts/preprocessor.pkl"

PLOTS_DIR = BASE_DIR / "plots"
PLOTS_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------
# Load preprocessor
# ---------------------------------------------------------------------
preprocessor = joblib.load(PREPROCESSOR_PATH)

# ---------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------
_, X_test, _, y_test = load_and_preprocess()

X_test_tensor = torch.tensor(X_test.astype("float32"))
y_true = y_test.astype(int)

# ---------------------------------------------------------------------
# Model definition
# ---------------------------------------------------------------------
class HeartModel(torch.nn.Module):
    def __init__(self, input_size):
        super().__init__()
        self.net = torch.nn.Sequential(
            torch.nn.Linear(input_size, 16),
            torch.nn.ReLU(),
            torch.nn.Linear(16, 8),
            torch.nn.ReLU(),
            torch.nn.Linear(8, 1),
            torch.nn.Sigmoid()
        )

    def forward(self, x):
        return self.net(x)


# ---------------------------------------------------------------------
# Core evaluation
# ---------------------------------------------------------------------
def evaluate_model(model_path: Path, model_name="model"):

    input_size = X_test_tensor.shape[1]

    model = HeartModel(input_size)
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    model.eval()

    with torch.no_grad():
        y_pred_prob = model(X_test_tensor).numpy().flatten()
        y_pred = (y_pred_prob > 0.5).astype(int)

    metrics = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1_score": f1_score(y_true, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_true, y_pred_prob)
    }

    # ---------------- ROC ----------------
    fpr, tpr, _ = roc_curve(y_true, y_pred_prob)

    plt.figure()
    plt.plot(fpr, tpr, lw=2, label=f"AUC = {metrics['roc_auc']:.2f}")
    plt.plot([0, 1], [0, 1], linestyle="--")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title(f"ROC - {model_name}")
    plt.legend()

    roc_path = PLOTS_DIR / f"roc_{model_name}.png"
    plt.savefig(roc_path)
    plt.close()

    # ---------------- PR ----------------
    precision, recall, _ = precision_recall_curve(y_true, y_pred_prob)
    ap = average_precision_score(y_true, y_pred_prob)

    plt.figure()
    plt.plot(recall, precision, lw=2, label=f"AP = {ap:.2f}")
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title(f"PR Curve - {model_name}")
    plt.legend()

    pr_path = PLOTS_DIR / f"pr_{model_name}.png"
    plt.savefig(pr_path)
    plt.close()

    return metrics


# ---------------------------------------------------------------------
# Centralized evaluation
# ---------------------------------------------------------------------
if __name__ == "__main__":

    print("\nCentralized Model Evaluation")
    central_metrics = evaluate_model(CENTRAL_MODEL_PATH, "centralized")

    for k, v in central_metrics.items():
        print(f"{k}: {v:.4f}")

    # ------------------------------------------------------------
    # Federated model (optionnel)
    # ------------------------------------------------------------
    """
    print("\nFederated Model Evaluation")
    fed_metrics = evaluate_model(FEDERATED_MODEL_PATH, "federated")

    for k, v in fed_metrics.items():
        print(f"{k}: {v:.4f}")

    print("\nComparison")
    for m in central_metrics.keys():
        print(
            f"{m} | Centralized: {central_metrics[m]:.4f} "
            f"| Federated: {fed_metrics[m]:.4f}"
        )
    """