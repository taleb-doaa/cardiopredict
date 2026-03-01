from pathlib import Path
import torch
import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict
from src.evaluate import evaluate_model

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
PLOTS_DIR = BASE_DIR / "plots"

MODELS_DIR.mkdir(exist_ok=True)
ARTIFACTS_DIR.mkdir(exist_ok=True)
PLOTS_DIR.mkdir(exist_ok=True)

MODEL_PATH_LOCAL = MODELS_DIR / "heart_model.pth"
MODEL_PATH_GLOBAL = MODELS_DIR / "global_model.pth"
PREPROCESSOR_PATH = ARTIFACTS_DIR / "preprocessor.pkl"

preprocessor = joblib.load(PREPROCESSOR_PATH)

REFERENCE_CSV = BASE_DIR.parent / "data" / "heart.csv"
df_ref = pd.read_csv(REFERENCE_CSV)
X_ref = df_ref.drop("HeartDisease", axis=1)
X_transformed = preprocessor.transform(X_ref)
input_size = X_transformed.shape[1]

class HeartModel(torch.nn.Module):
    def __init__(self, input_size):
        super().__init__()
        self.net = torch.nn.Sequential(
            torch.nn.Linear(input_size, 16), torch.nn.ReLU(),
            torch.nn.Linear(16, 8), torch.nn.ReLU(),
            torch.nn.Linear(8, 1), torch.nn.Sigmoid()
        )
    def forward(self, x):
        return self.net(x)

model_local = HeartModel(input_size)
model_local.load_state_dict(torch.load(MODEL_PATH_LOCAL, map_location="cpu"))
model_local.eval()

model_global = HeartModel(input_size)
if MODEL_PATH_GLOBAL.exists():
    model_global.load_state_dict(torch.load(MODEL_PATH_GLOBAL, map_location="cpu"))
    model_global.eval()
else:
    model_global = None

app = FastAPI(title="Heart Disease ML Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class HeartDiseaseFeatures(BaseModel):
    Age: int
    Sex: str
    ChestPainType: str
    RestingBP: int
    Cholesterol: int
    FastingBS: int
    RestingECG: str
    MaxHR: int
    ExerciseAngina: str
    Oldpeak: float
    ST_Slope: str

def preprocess_input(features: HeartDiseaseFeatures):
    df = pd.DataFrame([features.dict()])
    X = preprocessor.transform(df).astype("float32")
    return torch.tensor(X)

@app.post("/predict")
def predict(features: HeartDiseaseFeatures):
    X_tensor = preprocess_input(features)
    with torch.no_grad():
        proba = float(model_local(X_tensor).item())
    return {"probability": proba, "is_sick": proba >= 0.5}

@app.post("/predict_global")
def predict_global(features: HeartDiseaseFeatures):
    if model_global is None:
        return {"error": "Federated model not yet trained"}
    X_tensor = preprocess_input(features)
    with torch.no_grad():
        proba = float(model_global(X_tensor).item())
    return {"probability": proba, "is_sick": proba >= 0.5}

@app.get("/model/info")
def model_info():
    return {"model_type": "HeartModel (MLP)", "input_size": input_size, "layers": [16, 8, 1]}

@app.get("/model/metrics")
def model_metrics():
    return {"local_model": evaluate_model(MODEL_PATH_LOCAL)}

@app.get("/model/info_global")
def model_info_global():
    if model_global is None:
        return {"error": "Federated model not yet trained"}
    return {"model_type": "HeartModel (MLP) - Federated", "input_size": input_size}

@app.get("/model/metrics_global")
def model_metrics_global():
    if model_global is None:
        return {"error": "Federated model not yet trained"}
    return {"global_model": evaluate_model(MODEL_PATH_GLOBAL)}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "local_model_loaded": MODEL_PATH_LOCAL.exists(),
        "global_model_loaded": MODEL_PATH_GLOBAL.exists()
    }