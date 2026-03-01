from pathlib import Path
from typing import Set
import os
import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import jwt, JWTError
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
import pandas as pd

APP_DIR = Path(__file__).resolve().parent
MODELS_DIR = APP_DIR / "models"
MODEL_PATH = MODELS_DIR / "global_model.pth"
DEVICE = torch.device("cpu")

JWT_SECRET = os.getenv("JWT_SECRET", "your-256-bit-secret-key-here-change-in-production")
JWT_ALGORITHM = "HS256"

class TokenPayload(BaseModel):
    sub: str | None = None
    exp: int | None = None
    roles: Set[str] | None = None

def verify_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"verify_aud": False})
        return TokenPayload(**payload)
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

def get_current_user(authorization: str = Header(..., alias="Authorization")) -> TokenPayload:
    token = authorization
    if token.startswith("Bearer "):
        token = token[len("Bearer "):]
    return verify_token(token)

class HeartModel(nn.Module):
    def __init__(self, input_size):
        super(HeartModel, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_size, 16), nn.ReLU(),
            nn.Linear(16, 8), nn.ReLU(),
            nn.Linear(8, 1), nn.Sigmoid()
        )
    def forward(self, x):
        return self.net(x)

FEATURE_COLUMNS = ["Age", "Sex", "ChestPainType", "RestingBP", "Cholesterol", "FastingBS", "RestingECG", "MaxHR", "ExerciseAngina", "Oldpeak", "ST_Slope"]
categorical_cols = ["Sex", "ChestPainType", "RestingECG", "ExerciseAngina", "ST_Slope"]
numeric_cols = ["Age", "RestingBP", "Cholesterol", "FastingBS", "MaxHR", "Oldpeak"]

preprocessor = ColumnTransformer(transformers=[
    ("cat", OneHotEncoder(drop="first"), categorical_cols),
    ("num", StandardScaler(), numeric_cols),
])

REFERENCE_DATA = pd.read_csv(APP_DIR / "data" / "heart_node1.csv")
X_ref = REFERENCE_DATA[FEATURE_COLUMNS]
preprocessor.fit(X_ref)

def load_model():
    if not MODEL_PATH.exists():
        raise RuntimeError("Federated global model not found.")
    input_size = preprocessor.transform(X_ref).shape[1]
    model = HeartModel(input_size)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
    return model

model = load_model()
MODEL_VERSION = "2.0.0-Federated"

app = FastAPI(title="Heart Disease ML Service (Federated)", version=MODEL_VERSION)

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

class PredictionResponse(BaseModel):
    is_sick: bool
    probability: float
    model_version: str

@app.post("/predict", response_model=PredictionResponse)
def predict(features: HeartDiseaseFeatures, token_payload: TokenPayload = Depends(get_current_user)):
    try:
        data = pd.DataFrame([features.dict()])
        X = preprocessor.transform(data)
        X_tensor = torch.tensor(X.astype(np.float32))
        with torch.no_grad():
            proba = float(model(X_tensor).item())
        is_sick = proba >= 0.5
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")
    return PredictionResponse(is_sick=is_sick, probability=proba, model_version=MODEL_VERSION)

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": MODEL_PATH.exists()}