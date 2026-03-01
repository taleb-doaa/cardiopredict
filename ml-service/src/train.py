# train.py

from pathlib import Path
import torch
from torch.utils.data import DataLoader, TensorDataset
import joblib
from preprocess import load_and_preprocess
import matplotlib.pyplot as plt

# ---------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent

MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)
MODEL_PATH = MODELS_DIR / "heart_model.pth"

PREPROCESSOR_PATH = BASE_DIR / "artifacts" / "preprocessor.pkl"

PLOTS_DIR = BASE_DIR / "plots"
PLOTS_DIR.mkdir(exist_ok=True)
LOSS_PLOT_PATH = PLOTS_DIR / "loss.png"
ACCURACY_PLOT_PATH = PLOTS_DIR / "accuracy.png"

# ---------------------------------------------------------------------
# Load & preprocess data
# ---------------------------------------------------------------------
X_train, X_val, y_train, y_val = load_and_preprocess()  # test = validation

X_train_tensor = torch.tensor(X_train)
y_train_tensor = torch.tensor(y_train).unsqueeze(1)
X_val_tensor = torch.tensor(X_val)
y_val_tensor = torch.tensor(y_val).unsqueeze(1)

train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)

# ---------------------------------------------------------------------
# Define HeartModel directly
# ---------------------------------------------------------------------
class HeartModel(torch.nn.Module):
    def __init__(self, input_size):
        super(HeartModel, self).__init__()
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

input_size = X_train.shape[1]
model = HeartModel(input_size)
criterion = torch.nn.BCELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

# ---------------------------------------------------------------------
# Training loop with metrics
# ---------------------------------------------------------------------
epochs = 15
train_losses = []
val_losses = []
train_accuracies = []
val_accuracies = []

for epoch in range(epochs):
    model.train()
    epoch_loss = 0
    for xb, yb in train_loader:
        optimizer.zero_grad()
        preds = model(xb)
        loss = criterion(preds, yb)
        loss.backward()
        optimizer.step()
        epoch_loss += loss.item() * xb.size(0)
    
    epoch_loss /= len(train_loader.dataset)
    train_losses.append(epoch_loss)
    
    # Évaluation sur training pour accuracy
    model.eval()
    with torch.no_grad():
        preds_train = model(X_train_tensor)
        predicted_train = (preds_train > 0.5).float()
        train_acc = (predicted_train == y_train_tensor).sum().item() / len(y_train_tensor)
        train_accuracies.append(train_acc)
        
        # Évaluation sur validation
        preds_val = model(X_val_tensor)
        val_loss = criterion(preds_val, y_val_tensor).item()
        val_losses.append(val_loss)
        predicted_val = (preds_val > 0.5).float()
        val_acc = (predicted_val == y_val_tensor).sum().item() / len(y_val_tensor)
        val_accuracies.append(val_acc)
    
    print(f"Epoch {epoch+1}/{epochs} - Loss: {epoch_loss:.4f} - Acc: {train_acc:.4f} - "
          f"Val Loss: {val_loss:.4f} - Val Acc: {val_acc:.4f}")

# ---------------------------------------------------------------------
# Save model
# ---------------------------------------------------------------------
torch.save(model.state_dict(), MODEL_PATH)
print(f"Model saved at {MODEL_PATH}")

# ---------------------------------------------------------------------
# Save training curves as images
# ---------------------------------------------------------------------
# Loss curve
plt.figure()
plt.plot(range(1, epochs+1), train_losses, marker='o', color='blue', label='Train Loss')
plt.plot(range(1, epochs+1), val_losses, marker='o', color='red', label='Validation Loss')
plt.title("Loss per Epoch")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.legend()
plt.savefig(LOSS_PLOT_PATH)
plt.close()

# Accuracy curve
plt.figure()
plt.plot(range(1, epochs+1), train_accuracies, marker='o', color='blue', label='Train Accuracy')
plt.plot(range(1, epochs+1), val_accuracies, marker='o', color='green', label='Validation Accuracy')
plt.title("Accuracy per Epoch")
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.legend()
plt.savefig(ACCURACY_PLOT_PATH)
plt.close()

print(f"Loss plot saved at {LOSS_PLOT_PATH}")
print(f"Accuracy plot saved at {ACCURACY_PLOT_PATH}")