const API_ML = "http://localhost:8001";
const API_FEDERATED = "http://localhost:8000";

function fixDecimals(obj) {
  if (!obj) return obj;
  const fixed = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string" && v.includes(",") && !isNaN(v.replace(",", "."))) {
      fixed[k] = parseFloat(v.replace(",", "."));
    } else {
      fixed[k] = v;
    }
  }
  return fixed;
}

export const predictML = async (data) => {
  const response = await fetch(`${API_ML}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Erreur ML Service");
  const result = await response.json();
  return fixDecimals(result);
};

export const predictFederated = async (data, token) => {
  const response = await fetch(`${API_FEDERATED}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Erreur Federated Service");
  const result = await response.json();
  return fixDecimals(result);
};

export const healthML = async () => {
  const response = await fetch(`${API_ML}/health`);
  return response.json();
};

export const healthFederated = async (token) => {
  const response = await fetch(`${API_FEDERATED}/health`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};