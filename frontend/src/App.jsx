import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Predict from "./pages/Predict";
import Results from "./pages/Results";
import History from "./pages/History";
import Navbar from "./components/Navbar";

// ─── GLOBAL RESET : force white medical theme ─────────────────────────────────
const GLOBAL_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: #f4f7fb !important;
    color: #1a2a3a;
    font-family: 'Source Sans 3', sans-serif;
    min-height: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  #root {
    min-height: 100vh;
    background: #f4f7fb;
  }
  /* Scrollbar médical discret */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #f4f7fb; }
  ::-webkit-scrollbar-thumb { background: #dde5f0; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #a8b8c8; }
`;

export default function App() {
  const [token,   setToken]   = useState(null);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);

  // ── Apply white theme globally on mount ──────────────────────────────────
  useEffect(() => {
    // Remove any dark theme attributes
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.background = "#f4f7fb";
    document.documentElement.style.color      = "#1a2a3a";
    document.body.style.background            = "#f4f7fb";
    document.body.style.color                 = "#1a2a3a";
    document.body.style.margin                = "0";
  }, []);

  const addHistory = (entry) => {
    setHistory(h => [{ ...entry, id: Date.now() }, ...h].slice(0, 50));
  };

  const handleLogout = () => {
    setToken(null);
    setResults(null);
    setHistory([]);
  };

  if (!token) return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <Login onLogin={setToken} />
    </>
  );

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <BrowserRouter>
        <div style={{
          minHeight:"100vh",
          background:"#f4f7fb",
          color:"#1a2a3a",
        }}>
          <Navbar onLogout={handleLogout} />
          <Routes>
            <Route path="/"        element={<Navigate to="/predict" replace />} />
            <Route path="/predict" element={
              <Predict token={token} setResults={setResults} addHistory={addHistory} />
            }/>
            <Route path="/results" element={
              <Results results={results} history={history} />
            }/>
            <Route path="/history" element={
              <History history={history} setHistory={setHistory} />
            }/>
          </Routes>
        </div>
      </BrowserRouter>
    </>
  );
}