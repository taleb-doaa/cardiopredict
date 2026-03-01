# preprocess.py

from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer

# ---------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent        # ml-service/src
PROJECT_ROOT = BASE_DIR.parent.parent             # remonte à Project_ML_FL
DATA_PATH = Path("data/heart.csv")

ARTIFACTS_DIR = BASE_DIR / "artifacts"            # ml-service/src/artifacts
ARTIFACTS_DIR.mkdir(exist_ok=True)

PREPROCESSOR_PATH = ARTIFACTS_DIR / "preprocessor.pkl"

# ---------------------------------------------------------------------
# Feature configuration
# ---------------------------------------------------------------------

TARGET_COLUMN = "HeartDisease"

categorical_cols = [
    "Sex",
    "ChestPainType",
    "RestingECG",
    "ExerciseAngina",
    "ST_Slope",
]

numeric_cols = [
    "Age",
    "RestingBP",
    "Cholesterol",
    "FastingBS",
    "MaxHR",
    "Oldpeak",
]

# ---------------------------------------------------------------------
# Main preprocessing function
# ---------------------------------------------------------------------

def load_and_preprocess(test_size=0.2, random_state=42):
    print("Loading dataset...")
    
    # Vérification que le fichier existe
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)

    # Séparer features / target
    y = df[TARGET_COLUMN].values.astype(np.float32)
    X_df = df.drop(TARGET_COLUMN, axis=1)

    print("Building preprocessing pipeline...")

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(drop="first"), categorical_cols),
            ("num", StandardScaler(), numeric_cols),
        ]
    )

    # Fit & transform
    X = preprocessor.fit_transform(X_df)
    X = X.astype(np.float32)

    print("Splitting dataset...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )

    print("Saving preprocessor...")
    joblib.dump(preprocessor, PREPROCESSOR_PATH)

    print(f"Preprocessing complete ✅\nPreprocessor saved at {PREPROCESSOR_PATH}")
    print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")

    return X_train, X_test, y_train, y_test


if __name__ == "__main__":
    load_and_preprocess()