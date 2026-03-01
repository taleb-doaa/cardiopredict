import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// ─── DESIGN TOKENS (same as Results) ─────────────────────────────────────────
const C = {
  navy:    "#0d2240",
  navyMid: "#163354",
  blue:    "#1d6fa4",
  sky:     "#3b9fd4",
  teal:    "#0e8a8a",
  surface: "#f4f7fb",
  card:    "#ffffff",
  border:  "#dde5f0",
  text:    "#1a2a3a",
  muted:   "#6b7d90",
  mutedLt: "#a8b8c8",
  low:     "#0a8a5c",
  lowBg:   "#e6f7f0",
  lowBdr:  "#9edfc6",
  med:     "#b45309",
  medBg:   "#fef3e2",
  medBdr:  "#f9c96a",
  high:    "#c0392b",
  highBg:  "#fdecea",
  highBdr: "#f4a59a",
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:none;} }
  @keyframes pulse2 { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }
  @keyframes slideIn { from { opacity:0; transform:translateX(-8px);} to { opacity:1; transform:none;} }
`;

// ─── RISK LEVEL HELPER ────────────────────────────────────────────────────────
function getRiskLevel(fedPct) {
  if (fedPct < 30) return "low";
  if (fedPct < 60) return "medium";
  return "high";
}

function getRiskPalette(lvl) {
  return {
    low:    { fg: C.low,  bg: C.lowBg,  bdr: C.lowBdr,  label: "Risque faible",  labelU: "FAIBLE" },
    medium: { fg: C.med,  bg: C.medBg,  bdr: C.medBdr,  label: "Risque modéré",  labelU: "MODÉRÉ" },
    high:   { fg: C.high, bg: C.highBg, bdr: C.highBdr, label: "Risque élevé",   labelU: "ÉLEVÉ" },
  }[lvl];
}

// ─── MINI SPARKLINE ───────────────────────────────────────────────────────────
function MiniSparkline({ data, color }) {
  return (
    <ResponsiveContainer width={80} height={32}>
      <AreaChart data={data} margin={{ top:2, right:0, left:0, bottom:0 }}>
        <defs>
          <linearGradient id={`sg${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.25}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} fill={`url(#sg${color.slice(1)})`}
          strokeWidth={1.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon, sub, delay }) {
  return (
    <div style={{
      background: C.card, border:`1px solid ${C.border}`, borderRadius:12,
      padding:"18px 20px", boxShadow:"0 1px 8px rgba(0,0,0,0.04)",
      animation:`fadeUp 0.45s ease ${delay}ms both`,
      display:"flex", alignItems:"center", gap:14,
    }}>
      <div style={{
        width:44, height:44, borderRadius:10, flexShrink:0,
        background:`${color}12`, border:`1px solid ${color}25`,
        display:"flex", alignItems:"center", justifyContent:"center", color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:26, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:11, color: C.muted, marginTop:4, fontFamily:"'Source Sans 3',sans-serif", fontWeight:600 }}>{label}</div>
        {sub && <div style={{ fontSize:10, color: C.mutedLt, marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── HISTORY ROW ─────────────────────────────────────────────────────────────
function HistoryRow({ item, index, total, onView }) {
  const [hovered, setHovered] = useState(false);
  const mlPct   = Math.round((item.ml?.probability  || 0) * 100);
  const fedPct  = Math.round((item.fed?.probability || 0) * 100);
  const avgPct  = Math.round((mlPct + fedPct) / 2);
  const fedSick = item.fed?.is_sick;
  const mlSick  = item.ml?.is_sick;
  const consensus = mlSick === fedSick;
  const lvl     = getRiskLevel(fedPct);
  const pal     = getRiskPalette(lvl);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#fafcff" : C.card,
        border:`1px solid ${hovered ? C.blue+"40" : C.border}`,
        borderRadius:12, overflow:"hidden",
        boxShadow: hovered ? `0 4px 20px rgba(29,111,164,0.1)` : "0 1px 6px rgba(0,0,0,0.04)",
        animation:`fadeUp 0.4s ease ${index * 45}ms both`,
        transition:"all 0.18s ease", cursor:"pointer",
      }}
      onClick={onView}
    >
      {/* Risk accent bar */}
      <div style={{ height:3, background:`linear-gradient(90deg, ${pal.fg}60, ${pal.fg}, ${pal.fg}60)` }}/>

      <div style={{ display:"flex", alignItems:"center", padding:"14px 20px", gap:14 }}>

        {/* Serial number */}
        <div style={{
          width:38, height:38, borderRadius:8, flexShrink:0,
          background: C.surface, border:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'JetBrains Mono',monospace", fontSize:12,
          color: C.muted, fontWeight:600,
        }}>
          {String(total - index).padStart(2,"0")}
        </div>

        {/* Patient info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
            <span style={{ fontSize:14, fontWeight:700, color: C.text, fontFamily:"'Source Sans 3',sans-serif" }}>
              {item.form.Sex === "M" ? "Patient masculin" : "Patiente féminine"}, {item.form.Age} ans
            </span>
            <Tag label={item.form.ChestPainType} />
            <Tag label={`BP: ${item.form.RestingBP}`} />
            <Tag label={`Cholest: ${item.form.Cholesterol}`} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.mutedLt} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize:11, color: C.muted, fontFamily:"'JetBrains Mono',monospace" }}>{item.date}</span>
          </div>
        </div>

        {/* Score blocks */}
        <ScoreBlock label="ML" value={mlPct} isSick={mlSick} />
        <div style={{ width:1, height:44, background: C.border, flexShrink:0 }}/>
        <ScoreBlock label="FL" value={fedPct} isSick={fedSick} />
        <div style={{ width:1, height:44, background: C.border, flexShrink:0 }}/>

        {/* Average + risk badge */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, minWidth:90 }}>
          <div style={{ fontSize:10, color: C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'Source Sans 3',sans-serif" }}>Score moy.</div>
          <div style={{
            background: pal.bg, border:`1px solid ${pal.bdr}`,
            borderRadius:7, padding:"4px 12px",
            fontSize:14, fontWeight:700, color: pal.fg,
            fontFamily:"'JetBrains Mono',monospace",
          }}>{avgPct}%</div>
          <div style={{ fontSize:9, color: pal.fg, fontWeight:700, letterSpacing:"0.1em" }}>{pal.labelU}</div>
        </div>

        {/* Consensus pill */}
        <div style={{
          width:36, height:36, borderRadius:8, flexShrink:0,
          background: consensus ? C.lowBg : C.medBg,
          border:`1px solid ${consensus ? C.lowBdr : C.medBdr}`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }} title={consensus ? "Consensus modèles" : "Divergence modèles"}>
          {consensus
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.low} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.med} strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><line x1="12" y1="5" x2="12" y2="19"/></svg>
          }
        </div>

        {/* View arrow */}
        <div style={{
          width:32, height:32, borderRadius:7, flexShrink:0,
          background: hovered ? `${C.blue}12` : C.surface,
          border:`1px solid ${hovered ? C.blue+"30" : C.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          color: hovered ? C.blue : C.mutedLt,
          transition:"all 0.18s",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

function ScoreBlock({ label, value, isSick }) {
  const color = isSick ? C.high : C.low;
  return (
    <div style={{ textAlign:"center", minWidth:64 }}>
      <div style={{ fontSize:9, color: C.muted, letterSpacing:"0.15em", textTransform:"uppercase", fontFamily:"'Source Sans 3',sans-serif", fontWeight:600, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color }}>{value}%</div>
      <div style={{ fontSize:9, color, fontWeight:600, marginTop:2, fontFamily:"'Source Sans 3',sans-serif" }}>{isSick ? "Positif" : "Négatif"}</div>
    </div>
  );
}

function Tag({ label }) {
  return (
    <span style={{
      fontSize:10, color: C.muted, background: C.surface,
      padding:"2px 8px", borderRadius:5,
      fontFamily:"'JetBrains Mono',monospace",
      border:`1px solid ${C.border}`, fontWeight:600,
    }}>{label}</span>
  );
}

// ─── TREND CHART ─────────────────────────────────────────────────────────────
function TrendChart({ history }) {
  const data = [...history].reverse().map((h, i) => ({
    name: `#${i + 1}`,
    ml:   Math.round((h.ml?.probability  || 0) * 100),
    fed:  Math.round((h.fed?.probability || 0) * 100),
    avg:  Math.round(((h.ml?.probability || 0) + (h.fed?.probability || 0)) * 50),
  }));

  return (
    <div style={{
      background: C.card, border:`1px solid ${C.border}`, borderRadius:12,
      padding:"20px 24px", boxShadow:"0 1px 8px rgba(0,0,0,0.04)",
      animation:"fadeUp 0.5s ease 200ms both",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color: C.text, fontFamily:"'Playfair Display',serif" }}>
            Tendance du risque cardiovasculaire
          </div>
          <div style={{ fontSize:11, color: C.muted, marginTop:2 }}>Évolution sur {data.length} analyse{data.length>1?"s":""}</div>
        </div>
        <div style={{ display:"flex", gap:16 }}>
          {[[C.blue,"ML"],[C.teal,"Fédéré"],[C.navy,"Moyenne"]].map(([c,l]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:14, height:2, background:c, borderRadius:2 }}/>
              <span style={{ fontSize:11, color: C.muted, fontFamily:"'Source Sans 3',sans-serif" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top:4, right:4, left:-20, bottom:0 }}>
          <defs>
            {[[C.blue,"ml"],[C.teal,"fed"],[C.navy,"avg"]].map(([c,k]) => (
              <linearGradient key={k} id={`tg_${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={c} stopOpacity={0.12}/>
                <stop offset="95%" stopColor={c} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey="name" tick={{ fill: C.muted, fontSize:10 }} axisLine={false} tickLine={false}/>
          <YAxis domain={[0,100]} tick={{ fill: C.muted, fontSize:10 }} axisLine={false} tickLine={false}/>
          <Tooltip
            contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, fontFamily:"Source Sans 3", boxShadow:"0 4px 16px rgba(0,0,0,0.08)" }}
            labelStyle={{ color: C.text, fontWeight:600 }}
          />
          <Area type="monotone" dataKey="ml"  stroke={C.blue}  fill={`url(#tg_ml)`}  strokeWidth={2} dot={false}/>
          <Area type="monotone" dataKey="fed" stroke={C.teal}  fill={`url(#tg_fed)`} strokeWidth={2} dot={false}/>
          <Area type="monotone" dataKey="avg" stroke={C.navy}  fill={`url(#tg_avg)`} strokeWidth={1.5} dot={false} strokeDasharray="4 3"/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function History({ history, setHistory }) {
  const navigate = useNavigate();
  const [filter,   setFilter]   = useState("all");   // all | high | medium | low
  const [showClear, setShowClear] = useState(false);

  const filtered = history.filter(h => {
    if (filter === "all") return true;
    const fedPct = Math.round((h.fed?.probability || 0) * 100);
    return getRiskLevel(fedPct) === filter;
  });

  const totalHigh   = history.filter(h => getRiskLevel(Math.round((h.fed?.probability||0)*100)) === "high").length;
  const totalMed    = history.filter(h => getRiskLevel(Math.round((h.fed?.probability||0)*100)) === "medium").length;
  const totalLow    = history.filter(h => getRiskLevel(Math.round((h.fed?.probability||0)*100)) === "low").length;
  const totalCons   = history.filter(h => h.ml?.is_sick === h.fed?.is_sick).length;

  return (
    <>
      <style>{FONTS}</style>
      <div style={{ background: C.surface, minHeight:"calc(100vh - 60px)", fontFamily:"'Source Sans 3',sans-serif", color: C.text }}>

        {/* ── PAGE HEADER ── */}
        <div style={{
          background: C.card, borderBottom:`1px solid ${C.border}`,
          padding:"0 32px", boxShadow:"0 2px 12px rgba(0,0,0,0.04)",
          position:"sticky", top:0, zIndex:40,
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", height:68 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{
                width:42, height:42, borderRadius:10,
                background:`${C.navy}10`, border:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize:17, fontWeight:700, color: C.text, fontFamily:"'Playfair Display',serif", margin:0 }}>
                  Historique des analyses
                </h2>
                <div style={{ fontSize:11, color: C.muted, marginTop:1 }}>
                  {history.length} analyse{history.length !== 1 ? "s" : ""} enregistrée{history.length !== 1 ? "s" : ""} · Session courante
                </div>
              </div>
            </div>

            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button onClick={() => navigate("/predict")} style={{
                background: `linear-gradient(135deg,${C.navyMid},${C.blue})`, color:"white",
                border:"none", borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:600,
                cursor:"pointer", display:"flex", alignItems:"center", gap:7,
                fontFamily:"'Source Sans 3',sans-serif", boxShadow:`0 4px 14px ${C.blue}30`,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Nouvelle analyse
              </button>
              {history.length > 0 && (
                <button onClick={() => setShowClear(true)} style={{
                  background: C.surface, border:`1px solid ${C.highBdr}`,
                  color: C.high, padding:"9px 16px", borderRadius:8,
                  cursor:"pointer", fontSize:13, fontWeight:600,
                  display:"flex", alignItems:"center", gap:6,
                  fontFamily:"'Source Sans 3',sans-serif",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                  Effacer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── CLEAR CONFIRM MODAL ── */}
        {showClear && (
          <div style={{
            position:"fixed", inset:0, background:"rgba(13,34,64,0.45)", backdropFilter:"blur(4px)",
            zIndex:100, display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <div style={{
              background: C.card, border:`1px solid ${C.border}`, borderRadius:14,
              padding:"32px 36px", maxWidth:420, width:"90%",
              boxShadow:"0 16px 64px rgba(0,0,0,0.12)", animation:"fadeUp 0.25s ease both",
            }}>
              <div style={{ width:48, height:48, borderRadius:12, background: C.highBg, border:`1px solid ${C.highBdr}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.high} strokeWidth="1.8">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3 style={{ fontSize:17, fontWeight:700, color: C.text, textAlign:"center", fontFamily:"'Playfair Display',serif", marginBottom:8 }}>Effacer l'historique ?</h3>
              <p style={{ fontSize:13, color: C.muted, textAlign:"center", lineHeight:1.65, marginBottom:24 }}>
                Cette action supprimera les <strong style={{ color: C.text }}>{history.length} analyse{history.length>1?"s":""}</strong> de la session courante. Cette opération est irréversible.
              </p>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setShowClear(false)} style={{
                  flex:1, background: C.surface, border:`1px solid ${C.border}`, color: C.muted,
                  borderRadius:8, padding:"11px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Source Sans 3',sans-serif",
                }}>Annuler</button>
                <button onClick={() => { setHistory([]); setShowClear(false); }} style={{
                  flex:1, background: C.high, border:"none", color:"white",
                  borderRadius:8, padding:"11px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Source Sans 3',sans-serif",
                  boxShadow:`0 4px 12px ${C.high}40`,
                }}>Confirmer la suppression</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ maxWidth:1280, margin:"0 auto", padding:"24px 24px 48px" }}>

          {history.length === 0 ? (
            /* ── EMPTY STATE ── */
            <div style={{
              background: C.card, border:`1px solid ${C.border}`, borderRadius:16,
              padding:"80px 48px", textAlign:"center", boxShadow:"0 2px 16px rgba(0,0,0,0.04)",
              animation:"fadeUp 0.4s ease both",
            }}>
              <div style={{
                width:72, height:72, margin:"0 auto 24px",
                background: C.surface, borderRadius:16, border:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3 style={{ fontSize:22, fontWeight:700, color: C.text, fontFamily:"'Playfair Display',serif", marginBottom:10 }}>
                Aucune analyse enregistrée
              </h3>
              <p style={{ fontSize:14, color: C.muted, marginBottom:32, maxWidth:380, margin:"0 auto 32px", lineHeight:1.7 }}>
                Les résultats de vos analyses cardiovasculaires apparaîtront ici automatiquement après chaque prédiction.
              </p>
              <button onClick={() => navigate("/predict")} style={{
                background:`linear-gradient(135deg,${C.navyMid},${C.blue})`,
                color:"white", border:"none", borderRadius:10, padding:"13px 32px",
                fontSize:14, fontWeight:600, cursor:"pointer",
                fontFamily:"'Source Sans 3',sans-serif",
                boxShadow:`0 4px 16px ${C.blue}35`,
                display:"inline-flex", alignItems:"center", gap:8,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Lancer une analyse
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {/* ── STAT CARDS ── */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                <StatCard label="Total analyses"    value={history.length} color={C.blue}  delay={0}
                  sub="Session courante"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                />
                <StatCard label="Risque élevé"       value={totalHigh}  color={C.high}  delay={60}
                  sub={`${Math.round(totalHigh/history.length*100)||0}% des analyses`}
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                />
                <StatCard label="Profil favorable"   value={totalLow}   color={C.low}   delay={120}
                  sub={`${Math.round(totalLow/history.length*100)||0}% des analyses`}
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                />
                <StatCard label="Consensus modèles"  value={totalCons}  color={C.teal}  delay={180}
                  sub={`Concordance sur ${history.length} analyse${history.length>1?"s":""}`}
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                />
              </div>

              {/* ── TREND CHART ── */}
              {history.length > 1 && <TrendChart history={history} />}

              {/* ── FILTER + LIST ── */}
              <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 24px", boxShadow:"0 1px 8px rgba(0,0,0,0.04)", animation:"fadeUp 0.45s ease 250ms both" }}>

                {/* Filter bar */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                  <div style={{ fontSize:13, fontWeight:700, color: C.text, fontFamily:"'Playfair Display',serif" }}>
                    Dossiers patients
                    <span style={{ fontSize:11, color: C.muted, fontWeight:400, fontFamily:"'Source Sans 3',sans-serif", marginLeft:10 }}>
                      {filtered.length} résultat{filtered.length>1?"s":""}
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:6, background: C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:4 }}>
                    {[
                      ["all",   "Tous",       C.blue],
                      ["high",  "Élevé",      C.high],
                      ["medium","Modéré",     C.med],
                      ["low",   "Faible",     C.low],
                    ].map(([id, label, color]) => (
                      <button key={id} onClick={() => setFilter(id)} style={{
                        border:"none", borderRadius:5, padding:"5px 14px",
                        fontSize:12, fontWeight: filter === id ? 700 : 500,
                        cursor:"pointer", fontFamily:"'Source Sans 3',sans-serif",
                        background: filter === id ? C.card : "transparent",
                        color:      filter === id ? color  : C.muted,
                        boxShadow:  filter === id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                        transition:"all 0.15s",
                      }}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* Divider with column headers */}
                <div style={{
                  display:"flex", alignItems:"center", padding:"0 20px 10px",
                  borderBottom:`1px solid ${C.border}`, marginBottom:12,
                  fontSize:10, fontWeight:700, color: C.mutedLt,
                  textTransform:"uppercase", letterSpacing:"0.1em",
                  fontFamily:"'Source Sans 3',sans-serif",
                }}>
                  <div style={{ width:38 }}/>
                  <div style={{ flex:1, paddingLeft:14 }}>Patient</div>
                  <div style={{ width:64, textAlign:"center" }}>ML</div>
                  <div style={{ width:1 }}/>
                  <div style={{ width:64, textAlign:"center", marginLeft:14 }}>Fédéré</div>
                  <div style={{ width:1 }}/>
                  <div style={{ width:90, textAlign:"center", marginLeft:14 }}>Score moy.</div>
                  <div style={{ width:36, marginLeft:14 }}/>
                  <div style={{ width:32, marginLeft:8 }}/>
                </div>

                {filtered.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"36px 0", color: C.muted, fontSize:13 }}>
                    Aucune analyse pour ce filtre.
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {filtered.map((item, i) => (
                      <HistoryRow
                        key={item.id}
                        item={item}
                        index={i}
                        total={filtered.length}
                        onView={() => navigate("/results", { state: { fromHistory: item } })}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ── DISCLAIMER ── */}
              <div style={{
                background: C.medBg, border:`1px solid ${C.medBdr}`,
                borderRadius:10, padding:"12px 18px",
                display:"flex", gap:10, alignItems:"flex-start",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.med} strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ fontSize:12, color: C.med, lineHeight:1.65, margin:0 }}>
                  <strong>Usage clinique supervisé :</strong> Cet historique est généré par intelligence artificielle à titre informatif. Il ne constitue pas un dossier médical officiel et ne remplace pas l'évaluation d'un médecin qualifié.
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}