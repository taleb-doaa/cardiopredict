# client.py
import sys
import torch
import flwr as fl
import pandas as pd
import numpy as np
from model import HeartModel
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer

# DEVICE = torch.device("cpu")

# if len(sys.argv) != 2:
#     print("Usage: python client.py <node_id>")
#     sys.exit(1)

# NODE_ID = sys.argv[1]
# CSV_PATH = f"data/heart_node{NODE_ID}.csv"

# # Load data
# df = pd.read_csv(CSV_PATH)

# X = df.drop("HeartDisease", axis=1).values.astype(np.float32)
# y = df["HeartDisease"].values.astype(np.float32)

# import pandas as pd
# import numpy as np
# from sklearn.preprocessing import OneHotEncoder
# from sklearn.compose import ColumnTransformer

DEVICE = torch.device("cpu")

if len(sys.argv) != 2:
    print("Usage: python client.py <node_id>")
    sys.exit(1)

NODE_ID = sys.argv[1]
CSV_PATH = f"data/heart_node{NODE_ID}.csv"

# # Load data
df = pd.read_csv(CSV_PATH)

# Séparer target
y = df["HeartDisease"].values.astype(np.float32)
X_df = df.drop("HeartDisease", axis=1)

# Identifier colonnes catégorielles automatiquement
categorical_cols = X_df.select_dtypes(include=["object"]).columns.tolist()
numeric_cols = X_df.select_dtypes(exclude=["object"]).columns.tolist()

# Encodage
preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(drop="first"), categorical_cols)
    ],
    remainder="passthrough"
)

X = preprocessor.fit_transform(X_df)
X = X.astype(np.float32)


X_tensor = torch.tensor(X)
y_tensor = torch.tensor(y).unsqueeze(1)

dataset = TensorDataset(X_tensor, y_tensor)
loader = DataLoader(dataset, batch_size=32, shuffle=True)

model = HeartModel(input_size=X.shape[1]).to(DEVICE)
criterion = torch.nn.BCELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

# -------- Flower Client --------
class HeartClient(fl.client.NumPyClient):

    def get_parameters(self, config):
        return [val.cpu().numpy() for _, val in model.state_dict().items()]

    def set_parameters(self, parameters):
        params_dict = zip(model.state_dict().keys(), parameters)
        state_dict = {k: torch.tensor(v) for k, v in params_dict}
        model.load_state_dict(state_dict, strict=True)

    def fit(self, parameters, config):
        self.set_parameters(parameters)

        model.train()
        for epoch in range(2):
            for xb, yb in loader:
                optimizer.zero_grad()
                preds = model(xb)
                loss = criterion(preds, yb)
                loss.backward()
                optimizer.step()

        return self.get_parameters(config), len(dataset), {}

    def evaluate(self, parameters, config):
        self.set_parameters(parameters)

        model.eval()
        correct = 0
        with torch.no_grad():
            preds = model(X_tensor)
            predicted = (preds > 0.5).float()
            correct = (predicted == y_tensor).sum().item()

        accuracy = correct / len(dataset)
        return float(accuracy), len(dataset), {"accuracy": accuracy}

fl.client.start_numpy_client(
    server_address="localhost:8085",
    client=HeartClient()
)
