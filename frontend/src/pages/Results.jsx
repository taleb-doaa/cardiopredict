import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from "recharts";
import jsPDF from "jspdf";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
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

const riskPalette = (lvl) => ({
  low:    { fg: C.low,  bg: C.lowBg,  bdr: C.lowBdr,  label: "RISQUE FAIBLE",   icon: "✓" },
  medium: { fg: C.med,  bg: C.medBg,  bdr: C.medBdr,  label: "RISQUE MODÉRÉ",   icon: "!" },
  high:   { fg: C.high, bg: C.highBg, bdr: C.highBdr, label: "RISQUE ÉLEVÉ",    icon: "✕" },
}[lvl]);

// ─── FONTS ───────────────────────────────────────────────────────────────────
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:none;} }
  @keyframes countUp { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse2 { 0%,100%{ opacity:1; } 50%{ opacity:0.45; } }
  @keyframes ecgDraw { to { stroke-dashoffset: 0; } }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ─── HUMAN BODY SVG ──────────────────────────────────────────────────────────
function HumanBody({ riskLevel, mlPct, fedPct, form }) {
  const pal = riskPalette(riskLevel);
  const color = pal.fg;
  const [pulse, setPulse] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setPulse(true);
      setTick(t => t + 1);
      setTimeout(() => setPulse(false), 400);
    }, 1400);
    return () => clearInterval(iv);
  }, []);

  // Annotations based on risk factors
  const annotations = [
    form?.RestingBP > 140  && { x: 148, y: 88,  label: `${form.RestingBP} mmHg`, sub:"Pression ↑", color: C.high },
    form?.Cholesterol > 240 && { x: 148, y: 108, label: `${form.Cholesterol}`, sub:"Cholestérol ↑", color: C.med },
    form?.MaxHR > 170       && { x: 148, y: 128, label: `${form.MaxHR} bpm`, sub:"FC élevée", color: C.med },
    (form?.FastingBS===1||form?.FastingBS==="1") && { x: 148, y: 148, label:"Glycémie", sub:"À jeun ↑", color: C.high },
  ].filter(Boolean);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", position:"relative" }}>
      {/* Score badge above */}
      <div style={{
        background: pal.bg, border:`1px solid ${pal.bdr}`,
        borderRadius:8, padding:"5px 14px", marginBottom:10,
        display:"flex", alignItems:"center", gap:8,
      }}>
        <span style={{ width:8, height:8, borderRadius:"50%", background: color, display:"inline-block", animation:"pulse2 1.4s infinite" }}/>
        <span style={{ fontSize:12, fontWeight:700, color, fontFamily:"'Source Sans 3',sans-serif" }}>{pal.label}</span>
        <span style={{ fontSize:13, fontWeight:800, color, fontFamily:"'JetBrains Mono',monospace" }}>
          {Math.round((mlPct + fedPct) / 2)}%
        </span>
      </div>

      <svg width="220" height="290" viewBox="0 0 220 290" style={{ overflow:"visible" }}>
        <defs>
          <radialGradient id="bodyGlow" cx="50%" cy="40%">
            <stop offset="0%" stopColor={color} stopOpacity="0.08"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </radialGradient>
          <filter id="heartGlow">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={color} floodOpacity="0.6"/>
          </filter>
          <filter id="softShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0d2240" floodOpacity="0.08"/>
          </filter>
        </defs>

        {/* Ambient glow behind figure */}
        <ellipse cx="80" cy="145" rx="62" ry="120" fill="url(#bodyGlow)"/>

        {/* ── BODY OUTLINE ── */}
        {/* Head */}
        <circle cx="80" cy="26" r="20" fill={C.surface} stroke={C.navyMid} strokeWidth="1.5" style={{filter:"url(#softShadow)"}}/>
        {/* Neck */}
        <rect x="74" y="44" width="12" height="12" rx="3" fill={C.surface} stroke={C.navyMid} strokeWidth="1.5"/>
        {/* Torso */}
        <path d="M 50 56 Q 42 70 42 100 Q 42 118 48 124 L 112 124 Q 118 118 118 100 Q 118 70 110 56 Z"
          fill={C.surface} stroke={C.navyMid} strokeWidth="1.5" style={{filter:"url(#softShadow)"}}/>
        {/* Left arm */}
        <path d="M 50 60 Q 30 78 28 108 Q 27 120 32 128" fill="none" stroke={C.navyMid} strokeWidth="8" strokeLinecap="round"/>
        <path d="M 50 60 Q 30 78 28 108 Q 27 120 32 128" fill="none" stroke={C.surface} strokeWidth="5" strokeLinecap="round"/>
        {/* Right arm */}
        <path d="M 110 60 Q 130 78 132 108 Q 133 120 128 128" fill="none" stroke={C.navyMid} strokeWidth="8" strokeLinecap="round"/>
        <path d="M 110 60 Q 130 78 132 108 Q 133 120 128 128" fill="none" stroke={C.surface} strokeWidth="5" strokeLinecap="round"/>
        {/* Left leg */}
        <path d="M 60 124 Q 56 158 54 185 Q 53 200 54 218" fill="none" stroke={C.navyMid} strokeWidth="10" strokeLinecap="round"/>
        <path d="M 60 124 Q 56 158 54 185 Q 53 200 54 218" fill="none" stroke={C.surface} strokeWidth="7" strokeLinecap="round"/>
        {/* Right leg */}
        <path d="M 100 124 Q 104 158 106 185 Q 107 200 106 218" fill="none" stroke={C.navyMid} strokeWidth="10" strokeLinecap="round"/>
        <path d="M 100 124 Q 104 158 106 185 Q 107 200 106 218" fill="none" stroke={C.surface} strokeWidth="7" strokeLinecap="round"/>

        {/* ── HEART ZONE ── */}
        {/* Pulse rings */}
        {pulse && [1, 2, 3].map(i => (
          <circle key={i} cx="72" cy="82" r={16 + i * 9}
            fill="none" stroke={color}
            strokeWidth={1.2 - i * 0.3}
            opacity={0.25 - i * 0.06}
            style={{ animation:`fadeOut${i} 0.5s ease forwards` }}
          />
        ))}
        {/* Heart icon */}
        <g transform="translate(60,71)" style={{ filter:"url(#heartGlow)" }}>
          <path d="M12 6.5C12 5 10.9 4 9.5 4 8.1 4 7 5 7 6.5 7 8.5 9.8 11.2 12 13.5 14.2 11.2 17 8.5 17 6.5 17 5 15.9 4 14.5 4 13.1 4 12 5 12 6.5Z"
            fill={color} transform="scale(0.95)"
          />
        </g>

        {/* ECG line from heart to right */}
        <line x1="80" y1="82" x2="140" y2="82" stroke={C.border} strokeWidth="1" strokeDasharray="3,3"/>
        <circle cx="140" cy="82" r="3" fill={color} opacity="0.7"/>
        {/* Mini ECG trace */}
        <polyline
          points="140,82 148,82 152,76 156,90 160,82 168,82"
          fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="60" strokeDashoffset="60"
          style={{ animation:"ecgDraw 1.5s ease 0.3s forwards" }}
        />

        {/* ── BLOOD PRESSURE indicator (shoulder/arm area) ── */}
        {form?.RestingBP > 0 && (
          <>
            <line x1="32" y1="94" x2="10" y2="94" stroke={C.border} strokeWidth="1" strokeDasharray="3,3"/>
            <circle cx="10" cy="94" r="3" fill={form.RestingBP>140?C.high:C.low} opacity="0.8"/>
          </>
        )}

        {/* ── ANNOTATIONS (right side) ── */}
        {annotations.map((a, i) => (
          <g key={i}>
            <line x1="112" y1={a.y} x2={a.x - 4} y2={a.y} stroke={a.color} strokeWidth="1" strokeDasharray="3,3" opacity="0.6"/>
            <rect x={a.x} y={a.y - 12} width={64} height={22} rx="4"
              fill={a.color === C.high ? C.highBg : C.medBg}
              stroke={a.color === C.high ? C.highBdr : C.medBdr}
              strokeWidth="1"
            />
            <text x={a.x + 6} y={a.y - 2} fontSize="9" fill={a.color} fontFamily="'JetBrains Mono',monospace" fontWeight="700">{a.label}</text>
            <text x={a.x + 6} y={a.y + 8} fontSize="8" fill={C.muted} fontFamily="'Source Sans 3',sans-serif">{a.sub}</text>
          </g>
        ))}

        {/* ── STRESS INDICATOR (head) ── */}
        <circle cx="80" cy="26" r="22" fill="none" stroke={color} strokeWidth="1.2"
          strokeDasharray={`${(Math.round((mlPct+fedPct)/2)/100)*138} 138`}
          strokeDashoffset="34" strokeLinecap="round" opacity="0.4"
        />

        {/* ── BOTTOM MODEL BADGES ── */}
        <g transform="translate(0,238)">
          <rect x="14" y="0" width="50" height="22" rx="5"
            fill={mlPct>50?C.highBg:C.lowBg} stroke={mlPct>50?C.highBdr:C.lowBdr} strokeWidth="1"/>
          <text x="39" y="10" textAnchor="middle" fontSize="8" fill={C.muted} fontFamily="'Source Sans 3',sans-serif" fontWeight="600">ML</text>
          <text x="39" y="19" textAnchor="middle" fontSize="10" fill={mlPct>50?C.high:C.low} fontFamily="'JetBrains Mono',monospace" fontWeight="700">{mlPct}%</text>

          <rect x="96" y="0" width="50" height="22" rx="5"
            fill={fedPct>50?C.highBg:C.lowBg} stroke={fedPct>50?C.highBdr:C.lowBdr} strokeWidth="1"/>
          <text x="121" y="10" textAnchor="middle" fontSize="8" fill={C.muted} fontFamily="'Source Sans 3',sans-serif" fontWeight="600">FL</text>
          <text x="121" y="19" textAnchor="middle" fontSize="10" fill={fedPct>50?C.high:C.low} fontFamily="'JetBrains Mono',monospace" fontWeight="700">{fedPct}%</text>
        </g>
      </svg>

      {/* Consensus tag */}
      <div style={{
        marginTop:8, display:"flex", alignItems:"center", gap:6,
        background: C.surface, border:`1px solid ${C.border}`,
        borderRadius:6, padding:"4px 12px",
      }}>
        <span style={{ width:7,height:7,borderRadius:"50%",
          background: riskLevel==="low"?C.low:riskLevel==="medium"?C.med:C.high,
          flexShrink:0, animation:"pulse2 2s infinite" }}/>
        <span style={{ fontSize:11, color: C.muted, fontFamily:"'Source Sans 3',sans-serif" }}>
          {riskLevel==="low"?"Profil cardiovasculaire favorable":
           riskLevel==="medium"?"Surveillance cardiaque recommandée":
           "Consultation cardiologique urgente"}
        </span>
      </div>
    </div>
  );
}

// ─── PARAM META ──────────────────────────────────────────────────────────────
const PARAM_META = {
  Age:            { label:"Âge",             unit:"ans",  icon:"👤" },
  Sex:            { label:"Sexe",            unit:"",     icon:"⚥",  fmt: v => v==="M"?"Masculin":"Féminin" },
  ChestPainType:  { label:"Douleur thoracique", unit:"", icon:"💔", fmt: v => ({ATA:"Atypique",NAP:"Non-angineux",ASY:"Asymptomatique",TA:"Angine typique"}[v]||v) },
  RestingBP:      { label:"Pression artérielle",unit:"mmHg", icon:"🩺" },
  Cholesterol:    { label:"Cholestérol",     unit:"mg/dL",icon:"🔬" },
  FastingBS:      { label:"Glycémie à jeun", unit:"",     icon:"💉", fmt: v => v===1||v==="1"?"Élevée (>120)":"Normale" },
  RestingECG:     { label:"ECG repos",       unit:"",     icon:"📈", fmt: v => ({Normal:"Normal",ST:"Anomalie ST",LVH:"HVG"}[v]||v) },
  MaxHR:          { label:"FC maximale",     unit:"bpm",  icon:"❤️" },
  ExerciseAngina: { label:"Angine effort",   unit:"",     icon:"🏃", fmt: v => v==="Y"?"Oui":"Non" },
  Oldpeak:        { label:"Oldpeak (ST)",    unit:"",     icon:"📉" },
  ST_Slope:       { label:"Pente ST",        unit:"",     icon:"📊", fmt: v => ({Up:"Ascendante",Flat:"Plate",Down:"Descendante"}[v]||v) },
};

// ─── RECOMMENDATIONS ─────────────────────────────────────────────────────────
const RECS = {
  high: [
    { priority:"URGENTE",  color: C.high,  bg: C.highBg,  title:"Consultation cardiologique",  desc:"Prendre rendez-vous avec un cardiologue dans les 48 heures. Apporter tous les résultats d'examens récents." },
    { priority:"URGENTE",  color: C.high,  bg: C.highBg,  title:"Bilan lipidique complet",      desc:"Dosage LDL, HDL, triglycérides et cholestérol total. Bilan hépatique associé si traitement envisagé." },
    { priority:"IMPORTANTE",color: C.med, bg: C.medBg,   title:"ECG 12 dérivations + effort",  desc:"Électrocardiogramme au repos et épreuve d'effort pour évaluation fonctionnelle complète." },
    { priority:"IMPORTANTE",color: C.med, bg: C.medBg,   title:"Modification du mode de vie",  desc:"Arrêt tabac impératif, régime méditerranéen, activité physique adaptée 150 min/semaine." },
  ],
  medium: [
    { priority:"RECOMMANDÉE",color: C.blue, bg:"#e8f2fb",  title:"Suivi médical dans 3 mois",    desc:"Consultation de contrôle avec bilan biologique incluant glycémie, bilan lipidique et NFS." },
    { priority:"RECOMMANDÉE",color: C.blue, bg:"#e8f2fb",  title:"Régime alimentaire adapté",    desc:"Réduction des graisses saturées, augmentation des fibres et oméga-3. Consultation diététique conseillée." },
    { priority:"CONSEILLÉE", color: C.teal, bg:"#e6f5f5",  title:"Programme d'activité physique",desc:"30 min d'activité modérée 5 fois par semaine. Privilégier marche rapide, natation, vélo." },
    { priority:"CONSEILLÉE", color: C.teal, bg:"#e6f5f5",  title:"Surveillance tensionnelle",    desc:"Automesure tensionnelle hebdomadaire. Tenir un carnet de suivi à présenter lors des consultations." },
  ],
  low: [
    { priority:"PRÉVENTIVE", color: C.low, bg: C.lowBg,   title:"Profil cardiovasculaire favorable", desc:"Maintenir les habitudes de vie saines. Le résultat est rassurant mais ne dispense pas du suivi annuel." },
    { priority:"PRÉVENTIVE", color: C.low, bg: C.lowBg,   title:"Bilan annuel de routine",       desc:"Contrôle annuel incluant tension, ECG et bilan lipidique pour maintenir ce profil favorable." },
    { priority:"CONSEILLÉE", color: C.teal, bg:"#e6f5f5", title:"Maintien de l'activité physique",desc:"Continuer une activité physique régulière. Objectif : 150 min/semaine en intensité modérée." },
    { priority:"CONSEILLÉE", color: C.teal, bg:"#e6f5f5", title:"Gestion du stress",             desc:"Techniques de relaxation (méditation, cohérence cardiaque) pour prévention à long terme." },
  ],
};

// ─── ANIMATED GAUGE ──────────────────────────────────────────────────────────
function Gauge({ value, size = 160, riskLevel }) {
  const [current, setCurrent] = useState(0);
  const pal = riskPalette(riskLevel);
  const r = 58, circ = 2 * Math.PI * r;
  const arc = 0.75; // 270°

  useEffect(() => {
    let f = 0;
    const iv = setInterval(() => {
      f = Math.min(f + 1.8, value);
      setCurrent(Math.round(f));
      if (f >= value) clearInterval(iv);
    }, 14);
    return () => clearInterval(iv);
  }, [value]);

  const filled = (current / 100) * arc * circ;
  const offset = circ * (1 - arc) / 2;

  // tick marks
  const ticks = [0, 25, 50, 75, 100].map(t => {
    const angle = (-135 + t * 2.7) * Math.PI / 180;
    const cx = size / 2, cy = size / 2;
    return { x1: cx + (r - 10) * Math.cos(angle), y1: cy + (r - 10) * Math.sin(angle), x2: cx + r * Math.cos(angle), y2: cy + r * Math.sin(angle) };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={pal.fg} stopOpacity="0.6" />
          <stop offset="100%" stopColor={pal.fg} />
        </linearGradient>
        <filter id="gaugeShadow">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={pal.fg} floodOpacity="0.4" />
        </filter>
      </defs>
      {/* Track */}
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth="10"
        strokeDasharray={`${arc * circ} ${circ}`} strokeDashoffset={-offset} strokeLinecap="round" />
      {/* Fill */}
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#gaugeGrad)" strokeWidth="10"
        strokeDasharray={`${filled} ${circ}`} strokeDashoffset={-offset} strokeLinecap="round"
        style={{ filter:"url(#gaugeShadow)", transition:"stroke-dasharray 0.04s linear" }} />
      {/* Ticks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={C.border} strokeWidth="2" strokeLinecap="round" />
      ))}
      {/* Value */}
      <text x={size/2} y={size/2 - 6} textAnchor="middle" fill={pal.fg}
        fontSize="30" fontWeight="700" fontFamily="'JetBrains Mono',monospace">{current}%</text>
      <text x={size/2} y={size/2 + 14} textAnchor="middle" fill={C.muted}
        fontSize="9" fontFamily="'Source Sans 3',sans-serif" letterSpacing="1.5">PROBABILITÉ</text>
    </svg>
  );
}

// ─── ECG STRIP ───────────────────────────────────────────────────────────────
function EcgStrip({ color, height = 36 }) {
  return (
    <svg width="100%" height={height} viewBox="0 0 400 36" preserveAspectRatio="none" style={{ opacity: 0.85 }}>
      <defs>
        <linearGradient id={`ecg${color.slice(1)}`} x1="0%" x2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="10%" stopColor={color} stopOpacity="1" />
          <stop offset="90%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points="0,18 30,18 45,18 55,4 65,32 75,18 100,18 130,18 145,10 155,18 175,18 210,18 225,2 235,34 245,18 280,18 310,18 325,9 335,18 365,18 400,18"
        fill="none" stroke={`url(#ecg${color.slice(1)})`} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="700" strokeDashoffset="700"
        style={{ animation: "ecgDraw 2.2s ease forwards" }}
      />
    </svg>
  );
}

// ─── RISK BAR ─────────────────────────────────────────────────────────────────
function RiskBar({ label, value, max, color, unit = "", delay = 0 }) {
  const [w, setW] = useState(0);
  const pct = Math.min(100, Math.round((value / max) * 100));
  useEffect(() => { const t = setTimeout(() => setW(pct), delay); return () => clearTimeout(t); }, [pct, delay]);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 4, alignItems:"baseline" }}>
        <span style={{ fontSize: 11, color: C.muted, fontFamily:"'Source Sans 3',sans-serif", fontWeight:600 }}>{label}</span>
        <span style={{ fontSize: 12, color: C.text, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>{value}<span style={{fontSize:9,color:C.muted,marginLeft:2}}>{unit}</span></span>
      </div>
      <div style={{ height: 6, background: C.surface, borderRadius: 4, overflow:"hidden", border:`1px solid ${C.border}` }}>
        <div style={{ height:"100%", borderRadius:4, width:`${w}%`, background:`linear-gradient(90deg,${color}60,${color})`, transition:"width 1.1s cubic-bezier(0.34,1.4,0.64,1)" }} />
      </div>
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ isSick, small }) {
  const s = isSick
    ? { bg: C.highBg, bdr: C.highBdr, fg: C.high, label: "Risque détecté" }
    : { bg: C.lowBg,  bdr: C.lowBdr,  fg: C.low,  label: "Faible risque"  };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background: s.bg, border:`1px solid ${s.bdr}`, borderRadius:20,
      padding: small?"3px 10px":"4px 14px",
      fontSize: small?10:12, fontWeight:600, color: s.fg,
      fontFamily:"'Source Sans 3',sans-serif",
    }}>
      <span style={{ width:6,height:6,borderRadius:"50%",background:s.fg,flexShrink:0,animation:"pulse2 2s infinite" }}/>
      {s.label}
    </span>
  );
}

// ─── MODEL CARD ───────────────────────────────────────────────────────────────
function ModelCard({ title, port, ver, prob, isSick, color, riskLevel, delay }) {
  const pct = Math.round((prob || 0) * 100);
  const accentColor = isSick ? C.high : C.low;
  return (
    <div style={{
      background: C.card, border:`1px solid ${C.border}`, borderRadius:12,
      overflow:"hidden", animation:`fadeUp 0.5s ease ${delay}ms both`,
      boxShadow:"0 2px 16px rgba(0,0,0,0.06)",
    }}>
      {/* Color bar */}
      <div style={{ height:3, background:`linear-gradient(90deg,${color},${accentColor})` }} />
      <div style={{ padding:"20px 24px" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color: C.muted, letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"'Source Sans 3',sans-serif" }}>{title}</div>
            <div style={{ fontSize:10, color: color, fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>PORT {port}{ver ? ` · ${ver}` : ""}</div>
          </div>
          <StatusBadge isSick={isSick} small />
        </div>
        <EcgStrip color={accentColor} />
        {/* Body */}
        <div style={{ display:"flex", alignItems:"center", gap:20, marginTop:16 }}>
          <Gauge value={pct} size={140} riskLevel={riskLevel} />
          <div>
            <div style={{ fontSize:28, fontWeight:700, color: accentColor, fontFamily:"'Playfair Display',serif", lineHeight:1.1, marginBottom:6 }}>
              {isSick ? "Risque\ndétecté" : "Faible\nrisque"}
            </div>
            <div style={{ fontSize:12, color: C.muted, lineHeight:1.7, fontFamily:"'Source Sans 3',sans-serif" }}>
              Modèle {title.toLowerCase()}<br />
              <span style={{ color: color, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>Port {port}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Results({ results, history }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  if (!results) return (
    <>
      <style>{FONTS}</style>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 60px)", background: C.surface, fontFamily:"'Source Sans 3',sans-serif" }}>
        <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"64px 56px", textAlign:"center", maxWidth:460, boxShadow:"0 4px 32px rgba(0,0,0,0.06)" }}>
          <div style={{ width:64, height:64, borderRadius:16, background:`${C.blue}10`, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <h2 style={{ fontSize:22, fontWeight:700, color: C.text, marginBottom:10, fontFamily:"'Playfair Display',serif" }}>Aucune analyse disponible</h2>
          <p style={{ color: C.muted, fontSize:14, marginBottom:28, lineHeight:1.7 }}>Remplissez le formulaire patient pour obtenir une prédiction cardiovasculaire par intelligence artificielle.</p>
          <button onClick={() => navigate("/predict")} style={{ background:`linear-gradient(135deg,${C.navyMid},${C.blue})`, color:"white", border:"none", borderRadius:10, padding:"13px 32px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'Source Sans 3',sans-serif", boxShadow:`0 4px 16px ${C.blue}40` }}>
            Lancer une analyse
          </button>
        </div>
      </div>
    </>
  );

  const mlPct   = Math.round((results.ml?.probability  || 0) * 100);
  const fedPct  = Math.round((results.fed?.probability || 0) * 100);
  const avgPct  = Math.round((mlPct + fedPct) / 2);
  const riskLevel = avgPct < 30 ? "low" : avgPct < 60 ? "medium" : "high";
  const pal       = riskPalette(riskLevel);
  const consensus = results.ml?.is_sick === results.fed?.is_sick;
  const historyData = history ? [...history].reverse().slice(-8).map((h, i) => ({
    name: `A${i + 1}`,
    ml:  Math.round((h.ml?.probability  || 0) * 100),
    fed: Math.round((h.fed?.probability || 0) * 100),
  })) : [];

  const radarData = [
    { metric:"Âge",        ml: Math.min(100,(results.form.Age/90)*100),           fed: Math.min(100,(results.form.Age/90)*100) },
    { metric:"Pression",   ml: Math.min(100,(results.form.RestingBP/200)*100),    fed: Math.min(100,(results.form.RestingBP/200)*100) },
    { metric:"Cholestérol",ml: Math.min(100,(results.form.Cholesterol/400)*100),  fed: Math.min(100,(results.form.Cholesterol/400)*100) },
    { metric:"FC Max",     ml: Math.min(100,(results.form.MaxHR/200)*100),        fed: Math.min(100,(results.form.MaxHR/200)*100) },
    { metric:"Oldpeak",    ml: Math.min(100,Math.abs(results.form.Oldpeak/6)*100),fed: Math.min(100,Math.abs(results.form.Oldpeak/6)*100) },
    { metric:"Risque ML",  ml: mlPct,  fed: 0 },
    { metric:"Risque Féd.",ml: 0,       fed: fedPct },
  ];

  // ── PDF ──────────────────────────────────────────────────────────────────────
  const handlePDF = () => {
    if (!results) return;
    const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
    const W = 210, pad = 18;
    let y = pad;

    doc.setFillColor(13, 34, 64);
    doc.rect(0, 0, W, 44, "F");
    doc.setFillColor(29, 111, 164);
    doc.rect(0, 40, W, 4, "F");
    doc.setFillColor(255, 255, 255);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CardioPredict", pad, 22);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 180, 210);
    doc.text("PLATEFORME D'IA CARDIAQUE FÉDÉRÉE  ·  RAPPORT CONFIDENTIEL", pad, 30);
    doc.text(`Généré le ${results.date}`, W - pad, 30, { align:"right" });

    y = 54;
    const rc = riskLevel === "high" ? [192, 57, 43] : riskLevel === "medium" ? [180, 83, 9] : [10, 138, 92];
    doc.setFillColor(...rc, 20);
    doc.roundedRect(pad, y, W - pad * 2, 32, 3, 3, "F");
    doc.setDrawColor(...rc);
    doc.roundedRect(pad, y, W - pad * 2, 32, 3, 3, "S");
    doc.setTextColor(...rc);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`Score global : ${avgPct}%  —  ${pal.label}`, pad + 8, y + 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Patient : ${results.form.Sex==="M"?"Homme":"Femme"}, ${results.form.Age} ans  ·  ML Classique : ${mlPct}%  ·  Fédéré : ${fedPct}%  ·  ${consensus?"Consensus":"Divergence"} des modèles`, pad + 8, y + 24);
    y += 40;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("PARAMÈTRES CLINIQUES ANALYSÉS", pad, y + 5);
    y += 10;
    const params = Object.entries(results.form);
    params.forEach(([k, v], i) => {
      const meta = PARAM_META[k] || {};
      const col = i % 4, row = Math.floor(i / 4);
      const px = pad + col * 44, py = y + row * 20;
      doc.setFillColor(244, 247, 251);
      doc.roundedRect(px, py, 41, 17, 2, 2, "F");
      doc.setTextColor(107, 125, 144);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text((meta.label || k).toUpperCase(), px + 3, py + 7);
      doc.setTextColor(26, 42, 58);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const display = meta.fmt ? meta.fmt(v) : String(v);
      doc.text(`${display}${meta.unit?" "+meta.unit:""}`, px + 3, py + 14);
    });
    y += Math.ceil(params.length / 4) * 20 + 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("RECOMMANDATIONS MÉDICALES", pad, y + 5);
    y += 10;
    RECS[riskLevel].forEach((r, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const px = pad + col * 88, py = y + row * 26;
      doc.setFillColor(244, 247, 251);
      doc.roundedRect(px, py, 84, 23, 2, 2, "F");
      const cc = r.color === C.high ? [192,57,43] : r.color === C.med ? [180,83,9] : r.color === C.low ? [10,138,92] : [29,111,164];
      doc.setFillColor(...cc);
      doc.rect(px, py, 3, 23, "F");
      doc.setTextColor(26, 42, 58);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(r.title, px + 6, py + 9, { maxWidth: 74 });
      doc.setTextColor(107, 125, 144);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(r.desc, px + 6, py + 17, { maxWidth: 74 });
    });
    y += Math.ceil(RECS[riskLevel].length / 2) * 26 + 10;

    doc.setFillColor(255, 251, 235);
    doc.roundedRect(pad, y, W - pad * 2, 16, 2, 2, "F");
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(7.5);
    doc.text("⚠ AVERTISSEMENT : Ces recommandations sont générées par IA à titre informatif uniquement et ne remplacent pas l'avis d'un médecin qualifié.", pad + 4, y + 10, { maxWidth: W - pad * 2 - 8 });

    doc.setFillColor(244, 247, 251);
    doc.rect(0, 282, W, 15, "F");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text("CardioPredict — Plateforme IA Médicale Fédérée", pad, 289);
    doc.text("Document confidentiel · Usage médical supervisé requis", W - pad, 289, { align:"right" });

    doc.save(`CardioPredict_${results.form.Sex}_${results.form.Age}ans_${new Date().toLocaleDateString("fr-FR").replace(/\//g,"-")}.pdf`);
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{FONTS}</style>
      <div style={{ minHeight:"calc(100vh - 60px)", background: C.surface, fontFamily:"'Source Sans 3',sans-serif", color: C.text }}>

        {/* ── HEADER ── */}
        <div style={{
          background: C.card,
          borderBottom: `1px solid ${C.border}`,
          padding: "0 28px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          position:"sticky", top:0, zIndex:50,
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", height:64 }}>
            {/* Left: patient info */}
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:`${C.navy}12`, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color: C.text, fontFamily:"'Playfair Display',serif" }}>
                  {results.form.Sex === "M" ? "Patient masculin" : "Patiente féminine"}, {results.form.Age} ans
                </div>
                <div style={{ fontSize:11, color: C.muted, display:"flex", gap:12, marginTop:1 }}>
                  <span>{results.date}</span>
                  <span>·</span>
                  <span style={{ color: consensus ? C.low : C.med, fontWeight:600 }}>
                    {consensus ? "✓ Consensus des modèles" : "⚠ Divergence des modèles"}
                  </span>
                </div>
              </div>
              <div style={{ height:36, width:1, background: C.border, margin:"0 4px" }} />
              <div style={{
                display:"inline-flex", alignItems:"center", gap:8,
                background: pal.bg, border:`1px solid ${pal.bdr}`,
                borderRadius:8, padding:"6px 16px",
              }}>
                <span style={{ fontSize:13, fontWeight:700, color: pal.fg }}>{pal.label}</span>
                <span style={{ fontSize:20, fontWeight:800, color: pal.fg, fontFamily:"'JetBrains Mono',monospace" }}>{avgPct}%</span>
              </div>
            </div>
            {/* Right: actions */}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handlePDF} style={{
                background: `linear-gradient(135deg,${C.navyMid},${C.blue})`, color:"white",
                border:"none", borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:600,
                cursor:"pointer", display:"flex", alignItems:"center", gap:7,
                fontFamily:"'Source Sans 3',sans-serif",
                boxShadow:`0 4px 14px ${C.blue}30`,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Télécharger PDF
              </button>
              <button onClick={() => navigate("/predict")} style={{
                background: C.surface, border:`1px solid ${C.border}`, color: C.text,
                borderRadius:8, padding:"9px 16px", fontSize:13, fontWeight:600,
                cursor:"pointer", display:"flex", alignItems:"center", gap:6,
                fontFamily:"'Source Sans 3',sans-serif",
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                Nouvelle analyse
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:0, marginTop:0 }}>
            {[["overview","Vue d'ensemble"],["params","Paramètres cliniques"],["recs","Recommandations"]].map(([id,label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                border:"none", background:"transparent", padding:"10px 18px",
                fontSize:13, fontWeight: activeTab === id ? 700 : 400, cursor:"pointer",
                color: activeTab === id ? C.blue : C.muted,
                borderBottom: activeTab === id ? `2px solid ${C.blue}` : "2px solid transparent",
                fontFamily:"'Source Sans 3',sans-serif", transition:"all 0.15s",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"24px 24px 40px" }}>

          {/* ── TAB: OVERVIEW ── */}
          {activeTab === "overview" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {/* KPI + Human Body row */}
              <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:16, alignItems:"start" }}>

                {/* Human Body Card */}
                <div style={{
                  background: C.card, border:`1px solid ${C.border}`, borderRadius:12,
                  padding:"20px 24px", boxShadow:"0 1px 8px rgba(0,0,0,0.04)",
                  animation:"fadeUp 0.4s ease both", display:"flex", flexDirection:"column", alignItems:"center",
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color: C.muted, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>
                    Visualisation du risque
                  </div>
                  <HumanBody riskLevel={riskLevel} mlPct={mlPct} fedPct={fedPct} form={results.form} />
                </div>

                {/* KPI grid + summary */}
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {[
                      { label:"Score global",  value:`${avgPct}%`, sub: pal.label, color: pal.fg, bg: pal.bg },
                      { label:"Consensus",     value: consensus?"Oui":"Non", sub: consensus?"Modèles concordants":"Révision conseillée", color: consensus?C.low:C.med, bg: consensus?C.lowBg:C.medBg },
                      { label:"ML Classique",  value:`${mlPct}%`, sub: results.ml?.is_sick?"Positif":"Négatif", color: results.ml?.is_sick?C.high:C.low, bg: results.ml?.is_sick?C.highBg:C.lowBg },
                      { label:"Fédéré",        value:`${fedPct}%`, sub: results.fed?.is_sick?"Positif":"Négatif", color: results.fed?.is_sick?C.high:C.low, bg: results.fed?.is_sick?C.highBg:C.lowBg },
                    ].map((k, i) => (
                      <div key={i} style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 20px", animation:`fadeUp 0.4s ease ${i*80+100}ms both`, boxShadow:"0 1px 8px rgba(0,0,0,0.04)" }}>
                        <div style={{ fontSize:11, color: C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>{k.label}</div>
                        <div style={{ fontSize:28, fontWeight:700, color: k.color, fontFamily:"'JetBrains Mono',monospace", lineHeight:1, marginBottom:4 }}>{k.value}</div>
                        <div style={{ display:"inline-block", background: k.bg, borderRadius:4, padding:"2px 8px", fontSize:10, fontWeight:600, color: k.color }}>{k.sub}</div>
                      </div>
                    ))}
                  </div>
                  {/* Patient quick summary */}
                  <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 20px", boxShadow:"0 1px 8px rgba(0,0,0,0.04)", animation:"fadeUp 0.4s ease 420ms both" }}>
                    <div style={{ fontSize:11, color: C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Résumé du profil patient</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {[
                        { k:"Âge",     v:`${results.form.Age} ans` },
                        { k:"Sexe",    v: results.form.Sex==="M"?"Masculin":"Féminin" },
                        { k:"Pression",v:`${results.form.RestingBP} mmHg` },
                        { k:"Cholest.",v:`${results.form.Cholesterol} mg/dL` },
                        { k:"FC Max",  v:`${results.form.MaxHR} bpm` },
                        { k:"Oldpeak", v:`${results.form.Oldpeak}` },
                      ].map(p => (
                        <div key={p.k} style={{ background: C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 11px", display:"flex", gap:6, alignItems:"baseline" }}>
                          <span style={{ fontSize:10, color: C.muted, fontWeight:600 }}>{p.k}</span>
                          <span style={{ fontSize:12, color: C.text, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>{p.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Model cards */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <ModelCard
                  title="ML Classique" port="8001" prob={results.ml?.probability}
                  isSick={results.ml?.is_sick} color={C.blue} riskLevel={riskLevel} delay={100}
                />
                <ModelCard
                  title="Apprentissage Fédéré" port="8000" ver={results.fed?.model_version}
                  prob={results.fed?.probability} isSick={results.fed?.is_sick}
                  color={C.teal} riskLevel={riskLevel} delay={200}
                />
              </div>

              {/* Charts row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {/* Radar */}
                <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 24px", boxShadow:"0 1px 8px rgba(0,0,0,0.04)", animation:"fadeUp 0.5s ease 300ms both" }}>
                  <div style={{ fontSize:12, fontWeight:700, color: C.muted, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:16 }}>Analyse comparative des paramètres</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData} outerRadius={85}>
                      <PolarGrid stroke={C.border} />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: C.muted, fontSize: 10, fontFamily:"Source Sans 3" }} />
                      <Radar name="ML" dataKey="ml" stroke={C.blue} fill={C.blue} fillOpacity={0.1} strokeWidth={2} />
                      <Radar name="Fédéré" dataKey="fed" stroke={C.teal} fill={C.teal} fillOpacity={0.1} strokeWidth={2} />
                      <Tooltip contentStyle={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, fontFamily:"Source Sans 3" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:8 }}>
                    {[[C.blue,"ML Classique"],[C.teal,"Fédéré"]].map(([c,l]) => (
                      <div key={l} style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:14, height:2, background:c, borderRadius:2 }}/>
                        <span style={{ fontSize:11, color: C.muted }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk factors */}
                <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 24px", boxShadow:"0 1px 8px rgba(0,0,0,0.04)", animation:"fadeUp 0.5s ease 380ms both" }}>
                  <div style={{ fontSize:12, fontWeight:700, color: C.muted, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:16 }}>Facteurs de risque cliniques</div>
                  {[
                    { label:"Âge",          value: results.form.Age,            max:100, unit:"ans",  color: C.blue,    delay:300 },
                    { label:"Pression art.", value: results.form.RestingBP,      max:200, unit:"mmHg", color:"#8b5cf6",  delay:380 },
                    { label:"Cholestérol",  value: results.form.Cholesterol,     max:400, unit:"mg/dL",color: C.med,     delay:460 },
                    { label:"FC maximale",  value: results.form.MaxHR,           max:220, unit:"bpm",  color: C.teal,    delay:540 },
                    { label:"Oldpeak (ST)", value: Math.abs(results.form.Oldpeak)*10, max:60, unit:"", color: C.high,   delay:620 },
                  ].map(b => <RiskBar key={b.label} {...b} />)}
                </div>
              </div>

              {/* History */}
              {historyData.length > 1 && (
                <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 24px", boxShadow:"0 1px 8px rgba(0,0,0,0.04)", animation:"fadeUp 0.5s ease 450ms both" }}>
                  <div style={{ fontSize:12, fontWeight:700, color: C.muted, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:16 }}>Évolution historique du risque</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={historyData}>
                      <defs>
                        <linearGradient id="mlGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.blue} stopOpacity={0.15}/>
                          <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="fedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.teal} stopOpacity={0.15}/>
                          <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={C.border} strokeDasharray="4 4" />
                      <XAxis dataKey="name" tick={{ fill: C.muted, fontSize:10 }} />
                      <YAxis domain={[0,100]} tick={{ fill: C.muted, fontSize:10 }} />
                      <Tooltip contentStyle={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12 }} />
                      <Area type="monotone" dataKey="ml" stroke={C.blue} fill="url(#mlGrad)" strokeWidth={2} dot={{ fill:C.blue, r:3 }} />
                      <Area type="monotone" dataKey="fed" stroke={C.teal} fill="url(#fedGrad)" strokeWidth={2} dot={{ fill:C.teal, r:3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: PARAMS ── */}
          {activeTab === "params" && (
            <div style={{ animation:"fadeUp 0.4s ease both" }}>
              <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"24px 28px", boxShadow:"0 1px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize:15, fontWeight:700, color: C.text, fontFamily:"'Playfair Display',serif", marginBottom:20 }}>Paramètres cliniques du patient</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {Object.entries(results.form).map(([k, v]) => {
                    const meta = PARAM_META[k] || { label:k, unit:"", icon:"•" };
                    const display = meta.fmt ? meta.fmt(v) : String(v);
                    return (
                      <div key={k} style={{ background: C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 16px" }}>
                        <div style={{ fontSize:11, color: C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
                          {meta.icon} {meta.label}
                        </div>
                        <div style={{ fontSize:18, fontWeight:700, color: C.text, fontFamily:"'JetBrains Mono',monospace" }}>
                          {display}
                          {meta.unit && <span style={{ fontSize:12, color: C.muted, marginLeft:4, fontFamily:"'Source Sans 3',sans-serif", fontWeight:400 }}>{meta.unit}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: RECOMMENDATIONS ── */}
          {activeTab === "recs" && (
            <div style={{ animation:"fadeUp 0.4s ease both" }}>
              {/* Warning banner */}
              <div style={{ background: C.medBg, border:`1px solid ${C.medBdr}`, borderRadius:10, padding:"12px 18px", display:"flex", gap:10, alignItems:"flex-start", marginBottom:20 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.med} strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p style={{ fontSize:13, color: C.med, lineHeight:1.6 }}>
                  <strong>Avertissement :</strong> Ces recommandations sont générées par intelligence artificielle à titre informatif uniquement. Elles ne remplacent pas l'avis d'un médecin qualifié ni un diagnostic clinique.
                </p>
              </div>

              <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"24px 28px", boxShadow:"0 1px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color: C.text, fontFamily:"'Playfair Display',serif" }}>Plan de prise en charge recommandé</div>
                    <div style={{ fontSize:12, color: C.muted, marginTop:2 }}>Basé sur le profil de risque cardiovasculaire ({pal.label})</div>
                  </div>
                  <div style={{ background: pal.bg, border:`1px solid ${pal.bdr}`, borderRadius:8, padding:"6px 16px", fontSize:13, fontWeight:700, color: pal.fg }}>{pal.label}</div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {RECS[riskLevel].map((r, i) => (
                    <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", animation:`fadeUp 0.4s ease ${i*80}ms both` }}>
                      <div style={{ background: r.bg, padding:"10px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span style={{ fontSize:11, fontWeight:700, color: r.color, textTransform:"uppercase", letterSpacing:"0.08em" }}>
                          {r.priority}
                        </span>
                        <div style={{ width:8, height:8, borderRadius:"50%", background: r.color }} />
                      </div>
                      <div style={{ padding:"14px 16px" }}>
                        <div style={{ fontSize:14, fontWeight:700, color: C.text, marginBottom:6, fontFamily:"'Playfair Display',serif" }}>{r.title}</div>
                        <div style={{ fontSize:13, color: C.muted, lineHeight:1.65 }}>{r.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}