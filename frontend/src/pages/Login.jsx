import { useState, useEffect, useRef } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  navy:    "#0d2240",
  navyMid: "#163354",
  navyLt:  "#1e4a7a",
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

const DEFAULT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.JPlIDk8UPL2sYsV74bV2k-1UHnxvsTlgQnqzv2NDuPM";

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes pulse2   { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes heartbeat{ 0%{transform:scale(1)} 25%{transform:scale(1.16)} 50%{transform:scale(1)} 75%{transform:scale(1.08)} 100%{transform:scale(1)} }
  @keyframes ecgDraw  { to{stroke-dashoffset:0} }
  @keyframes gridFade { from{opacity:0} to{opacity:1} }
`;

// ─── STATIC MEDICAL BACKGROUND ───────────────────────────────────────────────
function MedicalBg() {
  return (
    <div style={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
      {/* Fine dot grid */}
      <svg width="100%" height="100%" style={{ position:"absolute", inset:0, opacity:0.6 }}>
        <defs>
          <pattern id="dotgrid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill={C.border}/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)"/>
      </svg>
      {/* Large faint ECG watermark */}
      <svg width="700" height="120" viewBox="0 0 700 120"
        style={{ position:"absolute", bottom:30, right:-40, opacity:0.055 }}>
        <polyline
          points="0,60 70,60 110,60 140,12 170,108 200,60 270,60 340,60 380,28 420,60 480,60 530,60 560,10 590,110 620,60 700,60"
          fill="none" stroke={C.navy} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {/* Top-left soft gradient blob */}
      <div style={{
        position:"absolute", top:-120, left:-120,
        width:420, height:420, borderRadius:"50%",
        background:`radial-gradient(circle, ${C.blue}10 0%, transparent 70%)`,
      }}/>
      {/* Bottom-right soft gradient blob */}
      <div style={{
        position:"absolute", bottom:-100, right:-80,
        width:360, height:360, borderRadius:"50%",
        background:`radial-gradient(circle, ${C.teal}08 0%, transparent 70%)`,
      }}/>
      {/* Vertical rule line */}
      <div style={{
        position:"absolute", top:"10%", bottom:"10%",
        left:"50%", width:1,
        background:`linear-gradient(to bottom, transparent, ${C.border}, transparent)`,
      }}/>
    </div>
  );
}

// ─── LIVE ECG CANVAS ─────────────────────────────────────────────────────────
function LiveEcg() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    let f = 0;
    const ecg = [0,0,0,0,-1,3,-10,20,-8,1,0,0,0,-1,2,-7,14,-5,0.5,0,0,0,0];
    const draw = () => {
      // Fade trail
      ctx.fillStyle = "rgba(244,247,251,0.18)";
      ctx.fillRect(0, 0, W, H);
      const x  = f % W;
      const y  = H/2 + ecg[f % ecg.length] * 1.6;
      const px = (f - 1 + W) % W;
      const py = H/2 + ecg[(f - 1) % ecg.length] * 1.6;
      if (x < px) { ctx.clearRect(0, 0, W, H); }
      // Line
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 5;
      ctx.shadowColor = C.blue;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      ctx.shadowBlur = 0;
      // Dot
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = C.sky; ctx.fill();
      f++; requestAnimationFrame(draw);
    };
    const raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas ref={ref} width={280} height={44} style={{
      borderRadius:8, background: C.surface,
      border:`1px solid ${C.border}`,
      display:"block",
    }}/>
  );
}

// ─── VITAL BADGE ─────────────────────────────────────────────────────────────
function VitalBadge({ value, unit, color, delay }) {
  return (
    <div style={{
      background: C.card, border:`1px solid ${C.border}`,
      borderRadius:8, padding:"8px 12px", textAlign:"center",
      animation:`fadeUp 0.5s ease ${delay}ms both`,
      boxShadow:"0 1px 6px rgba(13,34,64,0.05)",
    }}>
      <div style={{ fontSize:15, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:9, color: C.muted, marginTop:3, fontFamily:"'Source Sans 3',sans-serif", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>{unit}</div>
    </div>
  );
}

// ─── MAIN LOGIN COMPONENT ─────────────────────────────────────────────────────
export default function Login({ onLogin }) {
  const [token,   setToken]   = useState(DEFAULT_TOKEN);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [beat,    setBeat]    = useState(false);
  const [time,    setTime]    = useState(new Date());

  useEffect(() => {
    const hb = setInterval(() => { setBeat(true); setTimeout(() => setBeat(false), 350); }, 1500);
    const cl = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(hb); clearInterval(cl); };
  }, []);

  const handleLogin = async () => {
    if (token.trim().length < 20) { setError("Token JWT invalide ou manquant."); return; }
    setError(""); setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    onLogin(token.trim());
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <>
      <style>{FONTS}</style>
      <div style={{
        minHeight:"100vh",
        background: C.surface,
        display:"flex",
        fontFamily:"'Source Sans 3',sans-serif",
        position:"relative",
        overflow:"hidden",
      }}>
        <MedicalBg />

        {/* ══════════ LEFT PANEL ══════════ */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          justifyContent:"center", padding:"48px 56px",
          position:"relative", zIndex:1,
          animation:"fadeIn 0.6s ease both",
        }}>

          {/* System status bar */}
          <div style={{
            position:"absolute", top:28, left:48,
            display:"flex", alignItems:"center", gap:8,
            background: C.lowBg, border:`1px solid ${C.lowBdr}`,
            borderRadius:20, padding:"5px 14px",
          }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background: C.low, display:"inline-block", animation:"pulse2 1.6s infinite" }}/>
            <span style={{ fontSize:10, color: C.low, fontFamily:"'Source Sans 3',sans-serif", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>
              Systèmes opérationnels
            </span>
          </div>

          {/* Logo area */}
          <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:28 }}>
            {/* Heart */}
            <div style={{
              width:68, height:68, borderRadius:18,
              background:`linear-gradient(145deg, ${C.navyMid}, ${C.blue})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:`0 8px 32px ${C.blue}30`,
              border:`1px solid ${C.blue}40`,
              animation: beat ? "heartbeat 0.5s ease" : "none",
              flexShrink:0,
            }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="white">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize:38, fontWeight:700, color: C.navy, fontFamily:"'Playfair Display',serif", letterSpacing:"-0.02em", lineHeight:1, margin:0 }}>
                CardioPredict
              </h1>
              <div style={{ fontSize:10, color: C.blue, letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace", fontWeight:600, marginTop:4 }}>
                IA Fédérée · Intelligence Cardiaque
              </div>
            </div>
          </div>

          {/* Description */}
          <p style={{ fontSize:14, color: C.muted, lineHeight:1.75, maxWidth:420, marginBottom:28, fontWeight:400 }}>
            Plateforme clinique d'analyse cardiovasculaire par apprentissage fédéré multi-institutions. Prédiction en temps réel, confidentielle et certifiée.
          </p>

          {/* ECG Monitor card */}
          <div style={{
            background: C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:"16px 20px", marginBottom:24,
            maxWidth:360, boxShadow:"0 2px 16px rgba(13,34,64,0.06)",
            animation:"fadeUp 0.5s ease 200ms both",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background: C.low, animation:"pulse2 1.5s infinite" }}/>
                <span style={{ fontSize:9, color: C.muted, fontFamily:"'Source Sans 3',sans-serif", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em" }}>ECG Monitor · Lead II</span>
              </div>
              <span style={{ fontSize:10, color: C.blue, fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>
                {time.toLocaleTimeString("fr-FR")}
              </span>
            </div>
            <LiveEcg />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginTop:12 }}>
              <VitalBadge value="72"      unit="BPM"     color={C.high}  delay={300} />
              <VitalBadge value="98"      unit="SpO₂ %"  color={C.low}   delay={360} />
              <VitalBadge value="120/80"  unit="mmHg"    color={C.blue}  delay={420} />
              <VitalBadge value="36.7"    unit="°C"      color={C.teal}  delay={480} />
            </div>
          </div>

          {/* Feature pills */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24, animation:"fadeUp 0.5s ease 350ms both" }}>
            {[
              { label:"IA Fédérée",      icon:"🧠", color: C.blue },
              { label:"Chiffrement E2E", icon:"🔐", color: C.teal },
              { label:"Temps réel",      icon:"⚡", color: C.med  },
              { label:"RGPD Conforme",   icon:"✅", color: C.low  },
            ].map(p => (
              <div key={p.label} style={{
                display:"flex", alignItems:"center", gap:6,
                background: C.card, border:`1px solid ${C.border}`,
                borderRadius:20, padding:"5px 13px",
                boxShadow:"0 1px 4px rgba(13,34,64,0.05)",
              }}>
                <span style={{ fontSize:12 }}>{p.icon}</span>
                <span style={{ fontSize:11, color: C.muted, fontWeight:600 }}>{p.label}</span>
              </div>
            ))}
          </div>

          {/* KPI Stats */}
          <div style={{ display:"flex", gap:0, animation:"fadeUp 0.5s ease 450ms both" }}>
            {[
              { value:"2",    label:"Modèles IA",    color: C.blue },
              { value:"FL",   label:"Fédéré",         color: C.teal },
              { value:"<2s",  label:"Analyse",        color: C.low  },
              { value:"99%",  label:"Précision",      color: C.high },
            ].map((s, i) => (
              <div key={s.label} style={{
                paddingRight:24, marginRight:24,
                borderRight: i < 3 ? `1px solid ${C.border}` : "none",
              }}>
                <div style={{ fontSize:22, fontWeight:700, color: s.color, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:11, color: C.muted, marginTop:3, fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ position:"absolute", bottom:24, left:48, fontSize:9, color: C.mutedLt, fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.12em" }}>
            © 2026 CARDIOPREDICT · USAGE MÉDICAL SUPERVISÉ
          </div>
        </div>

        {/* ══════════ RIGHT PANEL (Login Form) ══════════ */}
        <div style={{
          width:480,
          background: C.card,
          borderLeft:`1px solid ${C.border}`,
          display:"flex", flexDirection:"column", justifyContent:"center",
          padding:"44px 44px",
          position:"relative", zIndex:1,
          boxShadow:"-4px 0 32px rgba(13,34,64,0.07)",
          animation:"fadeIn 0.5s ease 150ms both",
        }}>

          {/* Top accent bar */}
          <div style={{
            position:"absolute", top:0, left:0, right:0, height:3,
            background:`linear-gradient(90deg, ${C.blue}, ${C.teal})`,
          }}/>

          {/* Form header */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <div style={{
                width:42, height:42, borderRadius:11,
                background:`${C.blue}10`, border:`1px solid ${C.blue}25`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.6">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize:10, color: C.blue, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:3 }}>Accès sécurisé</div>
                <h2 style={{ fontSize:21, fontWeight:700, color: C.navy, fontFamily:"'Playfair Display',serif", margin:0 }}>
                  Connexion clinicien
                </h2>
              </div>
            </div>

            {/* Security badges grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.low}  strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label:"TLS 1.3 · Chiffré", color: C.low },
                { icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label:"Session 24h", color: C.blue },
                { icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, label:"Audit complet", color: C.teal },
                { icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.med}  strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, label:"RGPD Conforme", color: C.med },
              ].map((b, i) => (
                <div key={i} style={{
                  display:"flex", alignItems:"center", gap:8,
                  background: C.surface, border:`1px solid ${C.border}`,
                  borderRadius:8, padding:"8px 11px",
                }}>
                  {b.icon}
                  <span style={{ fontSize:11, color: C.muted, fontWeight:600 }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:`linear-gradient(90deg, transparent, ${C.border}, transparent)`, marginBottom:24 }}/>

          {/* Token field */}
          <div style={{ marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <label style={{
                display:"flex", alignItems:"center", gap:6,
                fontSize:11, color: focused ? C.blue : C.muted,
                fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em",
                transition:"color 0.18s",
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
                Token JWT
              </label>
              {token.length > 20 && !error && (
                <span style={{ fontSize:10, color: C.low, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.low} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Valide
                </span>
              )}
            </div>

            <div style={{ position:"relative" }}>
              <textarea
                value={token}
                onChange={e => { setToken(e.target.value); setError(""); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={handleKey}
                rows={3}
                placeholder="Collez votre token JWT ici…"
                style={{
                  width:"100%",
                  background: focused ? C.card : C.surface,
                  border:`1.5px solid ${error ? C.high : focused ? C.blue : C.border}`,
                  borderRadius:9, color: C.text,
                  padding:"12px 40px 12px 14px",
                  fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                  lineHeight:1.8, resize:"none", boxSizing:"border-box",
                  outline:"none", transition:"all 0.18s",
                  boxShadow: focused ? `0 0 0 3px ${C.blue}15` : "none",
                }}
              />
              {token.length > 20 && !error && (
                <div style={{
                  position:"absolute", top:10, right:10,
                  width:20, height:20, borderRadius:"50%",
                  background: C.lowBg, border:`1px solid ${C.lowBdr}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.low} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </div>

            {error && (
              <div style={{
                display:"flex", alignItems:"center", gap:8, marginTop:8,
                padding:"8px 12px",
                background: C.highBg, border:`1px solid ${C.highBdr}`,
                borderRadius:7,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.high} strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ fontSize:11, color: C.high, fontWeight:600 }}>{error}</span>
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width:"100%", padding:"13px",
              background: loading
                ? C.surface
                : `linear-gradient(135deg, ${C.navyMid}, ${C.blue})`,
              color: loading ? C.muted : "white",
              border:`1px solid ${loading ? C.border : "transparent"}`,
              borderRadius:10, fontSize:14, fontWeight:700,
              cursor: loading ? "not-allowed" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              boxShadow: loading ? "none" : `0 4px 20px ${C.blue}30`,
              transition:"all 0.25s", marginBottom:14,
              fontFamily:"'Source Sans 3',sans-serif",
            }}
          >
            {loading ? (
              <>
                <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${C.border}`, borderTopColor: C.blue, animation:"spin 0.8s linear infinite" }}/>
                Authentification en cours…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Accéder à la plateforme
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </>
            )}
          </button>

          {/* Info note */}
          <div style={{
            padding:"10px 14px",
            background: C.surface,
            border:`1px solid ${C.border}`,
            borderRadius:8, display:"flex", gap:9, alignItems:"flex-start",
            marginBottom:20,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize:12, color: C.muted, lineHeight:1.6, margin:0 }}>
              Token de démonstration pré-chargé. Cliquez sur{" "}
              <strong style={{ color: C.text }}>Accéder à la plateforme</strong> pour continuer.
            </p>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:`linear-gradient(90deg, transparent, ${C.border}, transparent)`, marginBottom:18 }}/>

          {/* Footer trust badges */}
          <div style={{ display:"flex", justifyContent:"center", gap:24 }}>
            {[
              { icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.mutedLt} strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label:"Sécurisé" },
              { icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.mutedLt} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label:"Chiffré" },
              { icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.mutedLt} strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, label:"Certifié" },
            ].map(b => (
              <div key={b.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                {b.icon}
                <span style={{ fontSize:10, color: C.mutedLt, fontFamily:"'Source Sans 3',sans-serif", fontWeight:600 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}