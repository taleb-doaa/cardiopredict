import RiskGauge from "./RiskGauge";
import { CheckCircle, AlertTriangle, Loader, Cpu, Globe } from "lucide-react";

export default function ResultCard({ result, service, loading, type }) {
  const isML = type === "ml";

  if (loading) return (
    <div style={{
      background: "var(--bg2)", border: "1px solid var(--border)",
      borderRadius: 16, padding: "40px 24px",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: 300, gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "2px solid var(--border)",
        borderTopColor: "var(--gold)",
        animation: "spin 0.9s linear infinite",
      }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 4 }}>Analyse en cours</div>
        <div style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
          {isML ? "ML · PORT 8001" : "FEDERATED · PORT 8000"}
        </div>
      </div>
    </div>
  );

  if (!result) return null;

  const isSick = result.is_sick;
  const accentColor = isSick ? "var(--danger)" : "var(--safe)";
  const accentDim = isSick ? "var(--danger-dim)" : "var(--safe-dim)";
  const Icon = isML ? Cpu : Globe;

  return (
    <div style={{
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      overflow: "hidden",
      position: "relative",
      transition: "border-color 0.4s",
    }}>
      {/* Top accent line */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg, transparent, ${isSick ? "#C0392B" : "#27AE60"}, transparent)`,
      }} />

      {/* Header */}
      <div style={{
        padding: "20px 24px 0",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
          }}>
            <div style={{
              width: 28, height: 28,
              background: "var(--bg3)",
              borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid var(--border)",
            }}>
              <Icon size={14} color="var(--gold)" strokeWidth={1.5} />
            </div>
            <span style={{
              fontSize: 10, color: "var(--text-muted)",
              letterSpacing: "0.2em", textTransform: "uppercase",
              fontFamily: "'DM Mono', monospace",
            }}>
              {isML ? "ML Classique · 8001" : "Federated · 8000"}
            </span>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 10,
          }}>
            {isSick
              ? <AlertTriangle size={20} color="var(--danger)" />
              : <CheckCircle size={20} color="var(--safe)" />
            }
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 26, fontWeight: 600,
              color: accentColor,
              letterSpacing: "0.02em",
            }}>
              {isSick ? "Risque détecté" : "Faible risque"}
            </span>
          </div>
        </div>

        {/* Probability badge */}
        <div style={{
          background: accentDim,
          border: `1px solid ${accentColor}40`,
          borderRadius: 8, padding: "8px 14px",
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 22, fontWeight: 500,
            color: accentColor,
          }}>
            {Math.round((result.probability || 0) * 100)}%
          </div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            probabilité
          </div>
        </div>
      </div>

      {/* Gauge */}
      <RiskGauge probability={result.probability} />

      {/* Footer */}
      {result.model_version && (
        <div style={{
          padding: "12px 24px 20px",
          display: "flex", alignItems: "center", gap: 6,
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gold)" }} />
          <span style={{
            fontSize: 10, color: "var(--text-muted)",
            fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em",
          }}>
            Modèle <span style={{ color: "var(--gold)" }}>{result.model_version}</span>
          </span>
        </div>
      )}
    </div>
  );
}