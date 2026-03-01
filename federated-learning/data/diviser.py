import pandas as pd
from sklearn.model_selection import train_test_split

# 1️⃣ Lire le fichier CSV
df = pd.read_csv("heart.csv")  # Remplace par le nom de ton fichier

# 2️⃣ Séparer les features et la target
X = df.drop("HeartDisease", axis=1)
y = df["HeartDisease"]

# 3️⃣ Split stratifié (50% / 50%)
X1, X2, y1, y2 = train_test_split(
    X,
    y,
    test_size=0.5,
    stratify=y,       # 🔥 clé pour garder la même proportion
    random_state=42
)

# 4️⃣ Reconstruire les deux DataFrames
df1 = pd.concat([X1, y1], axis=1)
df2 = pd.concat([X2, y2], axis=1)

# 5️⃣ Sauvegarder les fichiers
df1.to_csv("heart_node1.csv", index=False)
df2.to_csv("heart_node2.csv", index=False)

print("Division terminée !")
print("Part 1 :")
print(df1["HeartDisease"].value_counts())
print("\nPart 2 :")
print(df2["HeartDisease"].value_counts())
