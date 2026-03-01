import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
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
  high:    "#c0392b",
  highBg:  "#fdecea",
  highBdr: "#f4a59a",
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  @keyframes heartbeat {
    0%   { transform: scale(1); }
    25%  { transform: scale(1.18); }
    50%  { transform: scale(1); }
    75%  { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  @keyframes ecgDraw {
    to { stroke-dashoffset: 0; }
  }
  @keyframes pulse2 {
    0%,100% { opacity:1; }
    50%     { opacity:0.35; }
  }
`;

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = {
  heart: (s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  ecg: (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  chart: (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  clock: (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  logout: (s=14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

// ─── ANIMATED ECG STRIP (mini, in logo) ──────────────────────────────────────
function LogoEcg({ color, beat }) {
  return (
    <svg width="36" height="14" viewBox="0 0 36 14" style={{ display:"block" }}>
      <polyline
        key={beat ? "b" : "a"}
        points="0,7 5,7 8,7 10,2 12,12 14,7 18,7 22,7 24,4 26,7 30,7 36,7"
        fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="80" strokeDashoffset={beat ? "0" : "80"}
        style={{ transition:"stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

// ─── NAV LINK ─────────────────────────────────────────────────────────────────
function NavLink({ to, label, icon, active }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textDecoration:"none",
        height:64,
        display:"flex", alignItems:"center", gap:8,
        padding:"0 20px",
        color:  active ? C.blue : hov ? C.text : C.muted,
        borderBottom: active ? `2px solid ${C.blue}` : `2px solid transparent`,
        fontSize:12, fontWeight: active ? 700 : 600,
        letterSpacing:"0.06em", textTransform:"uppercase",
        fontFamily:"'Source Sans 3',sans-serif",
        transition:"all 0.18s ease",
        position:"relative",
      }}
    >
      {/* Active indicator dot */}
      {active && (
        <span style={{
          position:"absolute", top:10, right:14,
          width:5, height:5, borderRadius:"50%",
          background: C.blue, animation:"pulse2 2s infinite",
        }}/>
      )}
      <span style={{ color: active ? C.blue : hov ? C.navyMid : C.muted, transition:"color 0.18s" }}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

// ─── MAIN NAVBAR ──────────────────────────────────────────────────────────────
export default function Navbar({ onLogout }) {
  const location = useLocation();
  const [beat,  setBeat]  = useState(false);
  const [time,  setTime]  = useState(new Date());
  const [logHov, setLogHov] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setBeat(true);
      setTimeout(() => setBeat(false), 650);
    }, 1600);
    const clock = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(iv); clearInterval(clock); };
  }, []);

  const links = [
    { to:"/predict",  label:"Analyse",    icon: Icon.ecg(15)   },
    { to:"/results",  label:"Résultats",  icon: Icon.chart(15) },
    { to:"/history",  label:"Historique", icon: Icon.clock(15) },
  ];

  return (
    <>
      <style>{FONTS}</style>
      <nav style={{
        background: C.card,
        borderBottom:`1px solid ${C.border}`,
        position:"sticky", top:0, zIndex:100,
        boxShadow:"0 2px 16px rgba(13,34,64,0.06)",
      }}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 32px", height:64,
          maxWidth:1400, margin:"0 auto",
        }}>

          {/* ── LOGO ── */}
          <div style={{ display:"flex", alignItems:"center", gap:13 }}>
            {/* Heart icon with beat animation */}
            <div style={{
              width:42, height:42, borderRadius:11,
              background:`linear-gradient(145deg, ${C.navyMid}, ${C.blue})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"white",
              boxShadow:`0 4px 16px ${C.blue}35`,
              animation: beat ? "heartbeat 0.6s ease" : "none",
              flexShrink:0,
            }}>
              {Icon.heart(20)}
            </div>

            {/* Brand text + ECG */}
            <div>
              <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                <span style={{
                  fontSize:17, fontWeight:700, color: C.navy,
                  fontFamily:"'Playfair Display',serif", letterSpacing:"-0.01em", lineHeight:1,
                }}>
                  CardioPredict
                </span>
                <span style={{
                  fontSize:9, color: C.blue, fontFamily:"'JetBrains Mono',monospace",
                  letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:600,
                  background:`${C.blue}10`, border:`1px solid ${C.blue}25`,
                  borderRadius:4, padding:"1px 6px",
                }}>
                  IA Fédérée
                </span>
              </div>
              <div style={{ marginTop:3 }}>
                <LogoEcg color={beat ? C.blue : C.mutedLt} beat={beat} />
              </div>
            </div>
          </div>

          {/* ── NAV LINKS ── */}
          <div style={{ display:"flex", height:64 }}>
            {links.map(l => (
              <NavLink key={l.to} {...l} active={location.pathname === l.to} />
            ))}
          </div>

          {/* ── RIGHT SIDE ── */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>

            {/* Live clock + status */}
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              background: C.lowBg,
              border:`1px solid ${C.lowBdr}`,
              borderRadius:8, padding:"7px 13px",
            }}>
              <span style={{
                width:7, height:7, borderRadius:"50%",
                background: C.low, display:"inline-block",
                animation:"pulse2 1.6s infinite", flexShrink:0,
              }}/>
              <span style={{
                fontSize:11, color: C.low,
                fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
              }}>
                {time.toLocaleTimeString("fr-FR")}
              </span>
              <div style={{ width:1, height:14, background: C.lowBdr }}/>
              <span style={{
                fontSize:10, color: C.low,
                fontFamily:"'Source Sans 3',sans-serif", fontWeight:700,
                letterSpacing:"0.08em", textTransform:"uppercase",
              }}>
                En ligne
              </span>
            </div>

            {/* Divider */}
            <div style={{ width:1, height:28, background: C.border }}/>

            {/* Logout */}
            <button
              onMouseEnter={() => setLogHov(true)}
              onMouseLeave={() => setLogHov(false)}
              onClick={onLogout}
              style={{
                background: logHov ? C.highBg : C.surface,
                border:`1px solid ${logHov ? C.highBdr : C.border}`,
                color: logHov ? C.high : C.muted,
                height:36, padding:"0 16px",
                borderRadius:8, cursor:"pointer",
                fontSize:12, fontWeight:600,
                display:"flex", alignItems:"center", gap:7,
                fontFamily:"'Source Sans 3',sans-serif",
                transition:"all 0.18s ease",
              }}
            >
              {Icon.logout(13)}
              Déconnexion
            </button>
          </div>
        </div>

        {/* ── BOTTOM ACCENT LINE ── */}
        <div style={{
          height:2,
          background:`linear-gradient(90deg, transparent, ${C.blue}30, ${C.teal}30, transparent)`,
        }}/>
      </nav>
    </>
  );
}