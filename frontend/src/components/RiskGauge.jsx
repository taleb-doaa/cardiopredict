export default function RiskGauge({ probability }) {
  const pct = Math.round((probability || 0) * 100);
  const angle = -135 + (pct / 100) * 270;
  const color = pct < 30 ? "#10b981" : pct < 60 ? "#f59e0b" : "#ef4444";
  const label = pct < 30 ? "Faible" : pct < 60 ? "Modéré" : "Élevé";
  const bg = pct < 30 ? "rgba(16,185,129,0.08)" : pct < 60 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";

  return (
    <div style={{ textAlign: "center", padding: "20px 0 12px" }}>
      <svg width="180" height="110" viewBox="0 0 180 110">
        {/* Background arc */}
        <path d="M 22 98 A 68 68 0 1 1 158 98"
          fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        {/* Colored arc */}
        <path d="M 22 98 A 68 68 0 1 1 158 98"
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 213} 213`}
          style={{
            transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)",
            filter: `drop-shadow(0 0 8px ${color}80)`,
          }} />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map(tick => {
          const a = (-135 + (tick / 100) * 270) * (Math.PI / 180);
          const r1 = 72, r2 = 78;
          return (
            <line key={tick}
              x1={90 + r1 * Math.cos(a)} y1={98 + r1 * Math.sin(a)}
              x2={90 + r2 * Math.cos(a)} y2={98 + r2 * Math.sin(a)}
              stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
          );
        })}
        {/* Needle */}
        <g transform={`rotate(${angle}, 90, 98)`}
          style={{ transition: "transform 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <line x1="90" y1="98" x2="90" y2="38"
            stroke="#f1f5f9" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
          <circle cx="90" cy="98" r="6" fill={color}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
          <circle cx="90" cy="98" r="2.5" fill="#0b1120" />
        </g>
        {/* Percentage */}
        <text x="90" y="88" textAnchor="middle" fill={color}
          fontSize="24" fontWeight="700" fontFamily="'JetBrains Mono', monospace"
          style={{ filter: `drop-shadow(0 0 10px ${color}60)` }}>
          {pct}%
        </text>
      </svg>

      {/* Risk badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: bg, border: `1px solid ${color}40`,
        borderRadius: 20, padding: "5px 16px",
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }} />
        <span style={{
          fontSize: 12, color, fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.05em",
        }}>
          Risque {label}
        </span>
      </div>
    </div>
  );
}