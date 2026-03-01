# Dockerfile

# 📦 Base image
FROM python:3.10

# 📁 Définir le répertoire de travail
WORKDIR /app

# 🔹 Copier les fichiers de dépendances
COPY requirements.txt .

# 🔹 Mettre à jour pip
RUN pip install --upgrade pip

# 🔹 Installer PyTorch CPU version stable
RUN pip install torch==2.2.2 --index-url https://download.pytorch.org/whl/cpu

# 🔹 Installer les autres dépendances
RUN pip install --no-cache-dir -r requirements.txt

# 🔹 Copier tout le code dans le conteneur
COPY . .

# 🔹 Ajouter le code au PYTHONPATH pour que uvicorn trouve src.serve_model
ENV PYTHONPATH=/app

# 🔹 Exposer le port FastAPI
EXPOSE 8000

# 🔹 Commande pour lancer le serveur FastAPI
CMD ["uvicorn", "src.serve_model:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]