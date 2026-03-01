# server.py
import flwr as fl
import torch
from pathlib import Path
from model import HeartModel

MODELS_DIR = Path(__file__).resolve().parent / "models"
MODELS_DIR.mkdir(exist_ok=True)
MODEL_PATH = MODELS_DIR / "global_model.pth"


class SaveModelStrategy(fl.server.strategy.FedAvg):

    def aggregate_fit(self, server_round, results, failures):
        aggregated_parameters, aggregated_metrics = super().aggregate_fit(
            server_round, results, failures
        )

        if aggregated_parameters is not None:
            print(f"Saving global model after round {server_round}...")

            # Convert Flower parameters to PyTorch state_dict
            ndarrays = fl.common.parameters_to_ndarrays(aggregated_parameters)

            # Créer modèle vide (input_size doit être identique au client)
            # ⚠️ IMPORTANT : adapte input_size si nécessaire
            input_size = ndarrays[0].shape[1]
            model = HeartModel(input_size)

            # Charger poids
            params_dict = zip(model.state_dict().keys(), ndarrays)
            state_dict = {k: torch.tensor(v) for k, v in params_dict}
            model.load_state_dict(state_dict, strict=True)

            torch.save(model.state_dict(), MODEL_PATH)

        return aggregated_parameters, aggregated_metrics


strategy = SaveModelStrategy(
    fraction_fit=1.0,
    fraction_evaluate=1.0,
    min_fit_clients=2,
    min_evaluate_clients=2,
    min_available_clients=2,
)

if __name__ == "__main__":
    fl.server.start_server(
        server_address="0.0.0.0:8085",
        config=fl.server.ServerConfig(num_rounds=30),
        strategy=strategy,
    )