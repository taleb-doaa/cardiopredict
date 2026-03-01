import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { predictML, predictFederated } from "../api/services";

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
  med:     "#b45309",
  medBg:   "#fef3e2",
  medBdr:  "#f9c96a",
  high:    "#c0392b",
  highBg:  "#fdecea",
  highBdr: "#f4a59a",
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  @keyframes fadeUp   { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:none;} }
  @keyframes pulse2   { 0%,100%{ opacity:1; } 50%{ opacity:0.35; } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes ecgDraw  { to { stroke-dashoffset: 0; } }
  @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }

  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
  input[type=number] { -moz-appearance:textfield; }

  select option { background: #fff; color: #1a2a3a; }
`;

// ─── STEP CONFIG ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 1,
    title: "Identité Patient",
    subtitle: "Données démographiques & constantes vitales",
    color: C.blue,
    bg: "#e8f2fb",
    bdr: "#b8d4ea",
    fields: ["Age","Sex","RestingBP","Cholesterol","FastingBS"],
    tip: "Paramètres de base permettant d'établir le profil démographique cardiovasculaire du patient.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    id: 2,
    title: "Bilan Cardiaque",
    subtitle: "Évaluation fonctionnelle du myocarde",
    color: C.high,
    bg: C.highBg,
    bdr: C.highBdr,
    fields: ["ChestPainType","RestingECG","MaxHR","ExerciseAngina"],
    tip: "Les paramètres cardiaques sont les indicateurs les plus déterminants pour la prédiction du risque cardiovasculaire.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    id: 3,
    title: "Analyse ECG",
    subtitle: "Segment ST & conduction électrique",
    color: C.teal,
    bg: "#e6f5f5",
    bdr: "#9edcdc",
    fields: ["Oldpeak","ST_Slope"],
    tip: "L'analyse du segment ST à l'effort est un marqueur crucial des anomalies ischémiques du myocarde.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
];

// ─── FIELD CONFIG ─────────────────────────────────────────────────────────────
const FIELDS = {
  Age:            { label:"Âge", type:"number", min:1, max:120, unit:"ans", placeholder:"ex: 55", normal:"18 – 80 ans" },
  Sex:            { label:"Sexe biologique", type:"select", options:[{v:"M",l:"Masculin"},{v:"F",l:"Féminin"}] },
  ChestPainType:  { label:"Douleur thoracique", type:"select", options:[{v:"ATA",l:"ATA — Angine atypique"},{v:"NAP",l:"NAP — Non angineuse"},{v:"ASY",l:"ASY — Asymptomatique"},{v:"TA",l:"TA — Angine typique"}] },
  RestingBP:      { label:"Pression artérielle", type:"number", min:60, max:300, unit:"mmHg", placeholder:"ex: 120", normal:"90 – 140 mmHg" },
  Cholesterol:    { label:"Cholestérol sérique", type:"number", min:0, max:700, unit:"mg/dL", placeholder:"ex: 200", normal:"< 200 mg/dL" },
  FastingBS:      { label:"Glycémie à jeun", type:"select", options:[{v:0,l:"Normale — < 120 mg/dL"},{v:1,l:"Élevée — > 120 mg/dL"}] },
  RestingECG:     { label:"ECG au repos", type:"select", options:[{v:"Normal",l:"Normal"},{v:"ST",l:"Anomalie ST-T"},{v:"LVH",l:"Hypertrophie VG"}] },
  MaxHR:          { label:"FC maximale à l'effort", type:"number", min:60, max:250, unit:"bpm", placeholder:"ex: 150", normal:"60 – 200 bpm" },
  ExerciseAngina: { label:"Angine à l'effort", type:"select", options:[{v:"N",l:"Non"},{v:"Y",l:"Oui"}] },
  Oldpeak:        { label:"Dépression ST — Oldpeak", type:"number", min:-5, max:10, step:0.1, unit:"mm", placeholder:"ex: 1.5", normal:"0 – 2 mm" },
  ST_Slope:       { label:"Pente du segment ST", type:"select", options:[{v:"Up",l:"Ascendante (Up)"},{v:"Flat",l:"Plate (Flat)"},{v:"Down",l:"Descendante (Down)"}] },
};

const INITIAL = {
  Age:"", Sex:"M", ChestPainType:"ATA", RestingBP:"",
  Cholesterol:"", FastingBS:0, RestingECG:"Normal",
  MaxHR:"", ExerciseAngina:"N", Oldpeak:"", ST_Slope:"Up"
};

// ─── BACKGROUND: soft anatomical grid ────────────────────────────────────────
function MedicalBg() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden",
    }}>
      {/* Subtle grid */}
      <svg width="100%" height="100%" style={{ position:"absolute", inset:0, opacity:0.35 }}>
        <defs>
          <pattern id="medgrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={C.border} strokeWidth="0.7"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#medgrid)"/>
      </svg>
      {/* Faint ECG watermark bottom-right */}
      <svg width="480" height="80" viewBox="0 0 480 80"
        style={{ position:"absolute", bottom:40, right:60, opacity:0.07 }}>
        <polyline
          points="0,40 50,40 80,40 100,8 120,72 140,40 190,40 240,40 270,20 300,40 350,40 380,40 410,12 430,68 450,40 480,40"
          fill="none" stroke={C.navy} strokeWidth="3" strokeLinecap="round"/>
      </svg>
      {/* Corner pulse circles */}
      {[["-80px","-80px"],["-80px","auto"],[""  ,"auto"]].map(([t,b],i)=>(
        <div key={i} style={{
          position:"absolute", top: i===0?"-80px":i===1?"auto":"auto",
          bottom: i===1?"-80px":i===2?"-80px":"auto",
          right: i===2?"-80px":"auto", left: i===0?"-80px":i===1?"-80px":"auto",
          width:260, height:260, borderRadius:"50%",
          background:`radial-gradient(circle, ${C.blue}08 0%, transparent 70%)`,
        }}/>
      ))}
    </div>
  );
}

// ─── SINGLE FIELD ─────────────────────────────────────────────────────────────
function FormField({ fieldKey, form, setForm, errors, focused, setFocused, stepColor }) {
  const meta   = FIELDS[fieldKey];
  const isFoc  = focused === fieldKey;
  const hasErr = errors[fieldKey];
  const hasVal = form[fieldKey] !== "" && form[fieldKey] !== null;

  const baseBorder = hasErr
    ? C.high
    : isFoc
      ? stepColor
      : hasVal
        ? `${stepColor}60`
        : C.border;

  const inputStyle = {
    width:"100%",
    background: isFoc ? C.card : C.surface,
    border:`1.5px solid ${baseBorder}`,
    borderRadius:8,
    color: C.text,
    padding:"11px 14px",
    fontSize:13,
    fontFamily:"'Source Sans 3',sans-serif",
    boxSizing:"border-box",
    outline:"none",
    transition:"all 0.18s",
    boxShadow: isFoc ? `0 0 0 3px ${stepColor}15` : "none",
    cursor: meta.type === "select" ? "pointer" : "text",
  };

  return (
    <div style={{ animation:"slideIn 0.3s ease both" }}>
      {/* Label row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
        <label style={{
          fontSize:11, color: isFoc ? stepColor : C.muted,
          letterSpacing:"0.08em", textTransform:"uppercase",
          fontFamily:"'Source Sans 3',sans-serif", fontWeight:700,
          transition:"color 0.18s",
          display:"flex", alignItems:"center", gap:5,
        }}>
          {meta.label}
          {meta.unit && (
            <span style={{
              fontSize:9, color: stepColor, fontFamily:"'JetBrains Mono',monospace",
              background:`${stepColor}12`, border:`1px solid ${stepColor}25`,
              borderRadius:3, padding:"1px 5px",
            }}>
              {meta.unit}
            </span>
          )}
        </label>
        {meta.normal && (
          <span style={{
            fontSize:9, color: C.muted,
            fontFamily:"'JetBrains Mono',monospace",
            background: C.surface, border:`1px solid ${C.border}`,
            borderRadius:4, padding:"2px 7px",
          }}>
            Réf : {meta.normal}
          </span>
        )}
      </div>

      {/* Input */}
      {meta.type === "select" ? (
        <select
          value={form[fieldKey]}
          onChange={e => setForm(f => ({ ...f, [fieldKey]: e.target.value }))}
          onFocus={() => setFocused(fieldKey)}
          onBlur={() => setFocused(null)}
          style={{ ...inputStyle, appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7d90' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", paddingRight:34 }}
        >
          {meta.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : (
        <input
          type="number"
          value={form[fieldKey]}
          min={meta.min} max={meta.max} step={meta.step || 1}
          placeholder={meta.placeholder}
          onChange={e => setForm(f => ({ ...f, [fieldKey]: e.target.value }))}
          onFocus={() => setFocused(fieldKey)}
          onBlur={() => setFocused(null)}
          style={inputStyle}
        />
      )}

      {/* Feedback */}
      {hasErr ? (
        <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.high} strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize:11, color: C.high, fontFamily:"'Source Sans 3',sans-serif" }}>{hasErr}</span>
        </div>
      ) : hasVal && meta.type === "number" ? (
        <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.low} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span style={{ fontSize:10, color: C.low, fontFamily:"'JetBrains Mono',monospace" }}>Valeur enregistrée</span>
        </div>
      ) : null}
    </div>
  );
}

// ─── STEP INDICATOR (sidebar) ─────────────────────────────────────────────────
function StepItem({ step, index, currentStep, onClick }) {
  const done   = index < currentStep;
  const active = index === currentStep;
  const future = index > currentStep;

  return (
    <div
      onClick={() => done && onClick(index)}
      style={{
        padding:"12px 14px", borderRadius:10,
        background: active ? `${step.color}0e` : "transparent",
        border:`1px solid ${active ? `${step.color}30` : done ? C.border : "transparent"}`,
        cursor: done ? "pointer" : "default",
        transition:"all 0.2s",
        opacity: future ? 0.5 : 1,
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {/* Icon circle */}
        <div style={{
          width:34, height:34, borderRadius:9, flexShrink:0,
          background: done
            ? step.color
            : active
              ? step.bg
              : C.surface,
          border:`1.5px solid ${done ? step.color : active ? step.bdr : C.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          color: done ? "white" : active ? step.color : C.mutedLt,
          transition:"all 0.25s",
          boxShadow: active ? `0 2px 10px ${step.color}25` : "none",
        }}>
          {done
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : step.icon
          }
        </div>
        {/* Text */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize:12, fontWeight: active ? 700 : 600,
            color: active ? C.text : done ? C.muted : C.mutedLt,
            fontFamily:"'Source Sans 3',sans-serif",
            transition:"color 0.2s",
          }}>
            {step.title}
          </div>
          <div style={{
            fontSize:9, color: active ? step.color : C.mutedLt,
            marginTop:2, fontFamily:"'Source Sans 3',sans-serif",
            fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em",
          }}>
            {step.subtitle}
          </div>
        </div>
        {/* Done dot */}
        {done && <div style={{ width:7, height:7, borderRadius:"50%", background: step.color, flexShrink:0 }}/>}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Predict({ token, setResults, addHistory }) {
  const [form,    setForm]    = useState(INITIAL);
  const [step,    setStep]    = useState(0);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const navigate = useNavigate();
  const current = STEPS[step];

  const filledCount = Object.values(form).filter(v => v !== "" && v !== null).length;
  const progressPct = Math.round((filledCount / Object.keys(form).length) * 100);

  const validate = () => {
    const e = {};
    const fields = STEPS[step].fields;
    if (fields.includes("Age")      && (!form.Age || +form.Age < 1 || +form.Age > 120))   e.Age      = "Valeur entre 1 et 120 ans";
    if (fields.includes("RestingBP") && !form.RestingBP)                                   e.RestingBP = "Champ requis";
    if (fields.includes("Cholesterol") && !form.Cholesterol)                               e.Cholesterol = "Champ requis";
    if (fields.includes("MaxHR")    && (!form.MaxHR || +form.MaxHR < 60))                 e.MaxHR    = "Valeur entre 60 et 250 bpm";
    if (fields.includes("Oldpeak")  && form.Oldpeak === "")                               e.Oldpeak  = "Champ requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const prev = () => { setStep(s => s - 1); setErrors({}); };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    const payload = {
      ...form,
      Age: +form.Age, RestingBP: +form.RestingBP, Cholesterol: +form.Cholesterol,
      MaxHR: +form.MaxHR, Oldpeak: +form.Oldpeak, FastingBS: +form.FastingBS,
    };
    try {
      const [ml, fed] = await Promise.allSettled([predictML(payload), predictFederated(payload, token)]);
      const results = {
        ml:   ml.status  === "fulfilled" ? ml.value  : null,
        fed:  fed.status === "fulfilled" ? fed.value : null,
        form: payload,
        date: new Date().toLocaleString("fr-FR"),
      };
      setResults(results);
      addHistory(results);
      navigate("/results");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{FONTS}</style>
      <div style={{
        minHeight:"calc(100vh - 64px)",
        background: C.surface,
        display:"flex", alignItems:"stretch", position:"relative",
        fontFamily:"'Source Sans 3',sans-serif",
      }}>
        <MedicalBg />

        {/* ── LEFT SIDEBAR ── */}
        <div style={{
          width:270, flexShrink:0,
          background: C.card,
          borderRight:`1px solid ${C.border}`,
          display:"flex", flexDirection:"column",
          padding:"24px 18px", gap:16, zIndex:1,
          boxShadow:"2px 0 12px rgba(13,34,64,0.05)",
          position:"sticky", top:0,
          height:"calc(100vh - 64px)",
          overflowY:"auto",
          alignSelf:"flex-start",
        }}>

          {/* Sidebar header */}
          <div style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:16 }}>
            <div style={{
              fontSize:9, color: current.color, letterSpacing:"0.18em",
              textTransform:"uppercase", fontFamily:"'Source Sans 3',sans-serif",
              fontWeight:700, marginBottom:5,
              display:"flex", alignItems:"center", gap:6,
            }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background: current.color, display:"inline-block", animation:"pulse2 1.8s infinite" }}/>
              Formulaire d'évaluation
            </div>
            <h2 style={{
              fontSize:16, fontWeight:700, color: C.navy,
              fontFamily:"'Playfair Display',serif", lineHeight:1.3, margin:0,
            }}>
              Évaluation cardiovasculaire
            </h2>
          </div>

          {/* Steps list */}
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {STEPS.map((s, i) => (
              <StepItem key={s.id} step={s} index={i} currentStep={step} onClick={setStep} />
            ))}
          </div>

          {/* Progress bar */}
          <div style={{
            background: C.surface, border:`1px solid ${C.border}`,
            borderRadius:10, padding:"12px 14px",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:10, color: C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>Complétion</span>
              <span style={{ fontSize:12, color: current.color, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>{progressPct}%</span>
            </div>
            <div style={{ height:6, background: C.border, borderRadius:3, overflow:"hidden" }}>
              <div style={{
                height:"100%", borderRadius:3,
                width:`${progressPct}%`,
                background:`linear-gradient(90deg, ${current.color}80, ${current.color})`,
                transition:"width 0.4s ease",
                boxShadow:`0 0 8px ${current.color}40`,
              }}/>
            </div>
            <div style={{ fontSize:10, color: C.muted, marginTop:7, textAlign:"center" }}>
              {filledCount} champ{filledCount>1?"s":""} renseigné{filledCount>1?"s":""} sur {Object.keys(form).length}
            </div>
          </div>

          {/* Meta info */}
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {[
              { label:"Modèles IA",     val:"ML Classique + Fédéré",   color: C.blue, icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
              { label:"Temps estimé",   val:"< 2 secondes",             color: C.low,  icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
              { label:"Confidentialité",val:"Données non stockées",     color: C.teal, icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
            ].map(m => (
              <div key={m.label} style={{
                display:"flex", alignItems:"center", gap:10,
                background: C.surface, border:`1px solid ${C.border}`,
                borderRadius:8, padding:"8px 11px",
              }}>
                <div style={{ width:26, height:26, borderRadius:6, flexShrink:0, background:`${m.color}12`, border:`1px solid ${m.color}25`, display:"flex", alignItems:"center", justifyContent:"center", color: m.color }}>
                  {m.icon}
                </div>
                <div>
                  <div style={{ fontSize:9, color: C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>{m.label}</div>
                  <div style={{ fontSize:11, color: C.text, fontWeight:600, marginTop:1 }}>{m.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Clinical tip */}
          <div style={{
            padding:"12px 14px",
            background: current.bg,
            border:`1px solid ${current.bdr}`,
            borderRadius:10,
          }}>
            <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={current.color} strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ fontSize:11, color: C.muted, lineHeight:1.65, margin:0 }}>{current.tip}</p>
            </div>
          </div>
        </div>

        {/* ── MAIN FORM AREA ── */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          padding:"28px 36px", zIndex:1,
          minHeight:"calc(100vh - 64px)",
        }}>

          {/* Step header */}
          <div style={{ marginBottom:24 }}>
            {/* Step pill row */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{
                  height:4, borderRadius:2,
                  flex: i === step ? 3 : 1,
                  background: i < step
                    ? s.color
                    : i === step
                      ? s.color
                      : C.border,
                  opacity: i > step ? 0.4 : 1,
                  transition:"all 0.35s ease",
                  boxShadow: i === step ? `0 0 8px ${s.color}50` : "none",
                }}/>
              ))}
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              {/* Icon */}
              <div style={{
                width:50, height:50, borderRadius:12, flexShrink:0,
                background: current.bg,
                border:`1.5px solid ${current.bdr}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                color: current.color,
                boxShadow:`0 4px 16px ${current.color}20`,
              }}>
                {current.icon}
              </div>
              {/* Title */}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color: current.color, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:4 }}>
                  Étape {step + 1} sur {STEPS.length}
                </div>
                <h3 style={{ fontSize:22, fontWeight:700, color: C.navy, fontFamily:"'Playfair Display',serif", margin:0, lineHeight:1.2 }}>
                  {current.title}
                </h3>
                <p style={{ fontSize:12, color: C.muted, margin:"4px 0 0", fontWeight:400 }}>
                  {current.subtitle}
                </p>
              </div>
              {/* Step dots */}
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                {STEPS.map((s, i) => (
                  <div key={i} style={{
                    width: i === step ? 22 : 8, height:8, borderRadius:4,
                    background: i <= step ? s.color : C.border,
                    transition:"all 0.3s", opacity: i > step ? 0.4 : 1,
                  }}/>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height:1, background:`linear-gradient(90deg, ${current.color}50, ${current.color}10, transparent)`, marginTop:16 }}/>
          </div>

          {/* Form card */}
          <div style={{
            background: C.card,
            border:`1px solid ${C.border}`,
            borderRadius:14,
            boxShadow:"0 4px 24px rgba(13,34,64,0.08)",
            overflow:"hidden",
            flex:1, display:"flex", flexDirection:"column",
            animation:"fadeUp 0.35s ease both",
          }}>
            {/* Top accent */}
            <div style={{ height:3, background:`linear-gradient(90deg, ${current.color}80, ${current.color}, ${current.color}40)` }}/>

            {/* Fields grid */}
            <div style={{
              flex:1, padding:"28px 32px",
              display:"grid",
              gridTemplateColumns: current.fields.length <= 2 ? "1fr 1fr" : "1fr 1fr",
              gap:"20px 32px",
              alignContent:"start",
              overflowY:"auto",
            }}>
              {current.fields.map(key => (
                <FormField
                  key={key}
                  fieldKey={key}
                  form={form}
                  setForm={setForm}
                  errors={errors}
                  focused={focused}
                  setFocused={setFocused}
                  stepColor={current.color}
                />
              ))}
            </div>

            {/* Footer bar */}
            <div style={{
              padding:"14px 32px",
              borderTop:`1px solid ${C.border}`,
              background: C.surface,
              display:"flex", justifyContent:"space-between", alignItems:"center",
            }}>
              {/* Left: back + counter */}
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <button
                  onClick={prev}
                  disabled={step === 0}
                  style={{
                    background: C.card, border:`1px solid ${step === 0 ? C.border : C.border}`,
                    color: step === 0 ? C.mutedLt : C.muted,
                    padding:"9px 18px", borderRadius:8,
                    cursor: step === 0 ? "not-allowed" : "pointer",
                    fontSize:12, fontWeight:600, fontFamily:"'Source Sans 3',sans-serif",
                    display:"flex", alignItems:"center", gap:6,
                    transition:"all 0.18s",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Précédent
                </button>
                <span style={{ fontSize:11, color: C.muted, fontFamily:"'JetBrains Mono',monospace" }}>
                  {filledCount} / {Object.keys(form).length} champs
                </span>
              </div>

              {/* Right: field dots + next/submit */}
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                {/* Mini field fill dots */}
                <div style={{ display:"flex", gap:3 }}>
                  {Object.keys(form).map((k, i) => {
                    const filled = form[k] !== "" && form[k] !== null;
                    return (
                      <div key={i} style={{
                        width:5, height:5, borderRadius:"50%",
                        background: filled ? current.color : C.border,
                        transition:"background 0.3s",
                      }}/>
                    );
                  })}
                </div>

                {step < STEPS.length - 1 ? (
                  <button onClick={next} style={{
                    background:`linear-gradient(135deg, ${current.color}, ${current.color}cc)`,
                    border:"none", color:"white",
                    padding:"10px 28px", borderRadius:9,
                    cursor:"pointer", fontSize:13, fontWeight:700,
                    fontFamily:"'Source Sans 3',sans-serif",
                    display:"flex", alignItems:"center", gap:7,
                    boxShadow:`0 4px 14px ${current.color}35`,
                    transition:"all 0.18s",
                  }}>
                    Étape suivante
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                ) : (
                  <button onClick={submit} disabled={loading} style={{
                    background: loading
                      ? C.surface
                      : `linear-gradient(135deg, ${C.navyMid}, ${C.blue})`,
                    border:`1px solid ${loading ? C.border : "transparent"}`,
                    color: loading ? C.muted : "white",
                    padding:"10px 32px", borderRadius:9,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize:13, fontWeight:700,
                    fontFamily:"'Source Sans 3',sans-serif",
                    display:"flex", alignItems:"center", gap:8,
                    boxShadow: loading ? "none" : `0 4px 16px ${C.blue}35`,
                    transition:"all 0.25s",
                  }}>
                    {loading ? (
                      <>
                        <div style={{
                          width:14, height:14, borderRadius:"50%",
                          border:`2px solid ${C.border}`,
                          borderTopColor: C.blue,
                          animation:"spin 0.8s linear infinite",
                        }}/>
                        Analyse en cours…
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        Lancer l'analyse IA
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            marginTop:14,
            padding:"10px 16px",
            background: C.medBg,
            border:`1px solid ${C.medBdr}`,
            borderRadius:8,
            display:"flex", gap:8, alignItems:"center",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.med} strokeWidth="2" style={{ flexShrink:0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize:11, color: C.med, margin:0, lineHeight:1.5 }}>
              <strong>Usage clinique supervisé :</strong> Les prédictions générées par IA sont à titre informatif uniquement et ne remplacent pas l'avis d'un médecin qualifié.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}