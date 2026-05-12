/**
 * App.jsx — FalsebirdAI v2.1
 * ✦ Desktop: sidebar collapses → icon-rail (chevron button on edge)
 * ✦ Mobile:  sidebar slides in as a full drawer over content
 * ✦ Bottom nav (Balu | Dora | Settings)
 * ✦ Settings · Breathing · Mood · History
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useChat } from "./hooks/useChat";
import ChatInterface from "./components/ChatInterface.jsx";
import "./index.css";


// ─── Personas ─────────────────────────────────────────────────────────────────
const PERSONAS = {
  balu: { id:"balu", name:"Balu", emoji:"🐻", color:"#c084fc", accent:"#a855f7", tagline:"Warm & nurturing" },
  dora: { id:"dora", name:"Dora", emoji:"🦋", color:"#67e8f9", accent:"#22d3ee", tagline:"Energetic & motivating" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  Menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  ChevLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Balu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.5 2 6 4.5 6 7c0 1.5.6 2.8 1.5 3.8C5.2 11.8 4 13.8 4 16c0 3.3 3.6 6 8 6s8-2.7 8-6c0-2.2-1.2-4.2-3.5-5.2C17.4 9.8 18 8.5 18 7c0-2.5-2.5-5-6-5z"/>
      <circle cx="9.5" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>
      <path d="M9.5 14.5s1 1.5 2.5 1.5 2.5-1.5 2.5-1.5"/>
    </svg>
  ),
  Dora: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L8 8H4l3.5 3-1.5 5L12 13l6 3-1.5-5L20 8h-4L12 2z"/>
      <path d="M12 13v9"/><path d="M9 16c-2 0-4 1-5 3"/><path d="M15 16c2 0 4 1 5 3"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Breath: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12m0 0C12 7 8 4 4 4"/><path d="M12 12c0-5 4-8 8-8"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  History: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5.1L1 10"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

// ─── Breathing Widget ─────────────────────────────────────────────────────────
function BreathingWidget({ onClose }) {
  const [phase, setPhase] = useState("idle");
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef(null);
  const PHASES = {
    inhale: { label:"Breathe In",  duration:4, next:"hold",   color:"#a78bfa" },
    hold:   { label:"Hold",        duration:4, next:"exhale", color:"#67e8f9" },
    exhale: { label:"Breathe Out", duration:6, next:"inhale", color:"#86efac" },
  };
  const start = useCallback(() => { setPhase("inhale"); setCount(4); setCycles(0); }, []);
  useEffect(() => {
    if (phase === "idle") return;
    if (count > 0) { timerRef.current = setTimeout(() => setCount(c => c-1), 1000); }
    else {
      const next = PHASES[phase].next;
      if (next === "inhale") setCycles(c => c+1);
      setPhase(next); setCount(PHASES[next].duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [phase, count]);
  const stop = () => { setPhase("idle"); clearTimeout(timerRef.current); };
  const ringColor = phase !== "idle" ? PHASES[phase].color : "#4b5563";
  const scale = phase === "inhale" ? 1.35 : phase === "exhale" ? 0.75 : 1.1;
  return (
    <div className="fb-modal-overlay" onClick={onClose}>
      <div className="fb-modal fb-breath-modal" onClick={e => e.stopPropagation()}>
        <button className="fb-modal-close" onClick={onClose}><Icons.Close /></button>
        <h2 className="fb-breath-title">Breathing Exercise</h2>
        <p className="fb-breath-sub">4-4-6 box breathing — calms your nervous system</p>
        <div className="fb-breath-ring-wrap">
          <div className="fb-breath-ring" style={{
            "--ring-color": ringColor,
            transform: `scale(${scale})`,
            transition: phase !== "idle" ? `transform ${PHASES[phase]?.duration||4}s ease-in-out` : "none",
          }}/>
          <div className="fb-breath-center">
            {phase === "idle"
              ? <span className="fb-breath-idle-text">Ready?</span>
              : <><span className="fb-breath-phase">{PHASES[phase].label}</span><span className="fb-breath-count">{count}</span></>}
          </div>
        </div>
        {cycles > 0 && <p className="fb-breath-cycles">Cycles: {cycles}</p>}
        <div className="fb-modal-actions">
          {phase === "idle"
            ? <button className="fb-btn-primary" onClick={start}>Start</button>
            : <button className="fb-btn-secondary" onClick={stop}>Stop</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Mood Check-in ────────────────────────────────────────────────────────────
const MOODS = [
  {emoji:"😔",label:"Low",value:1},{emoji:"😐",label:"Okay",value:2},
  {emoji:"🙂",label:"Good",value:3},{emoji:"😊",label:"Great",value:4},{emoji:"🤩",label:"Amazing",value:5},
];
function MoodCheckIn({ onClose, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  return (
    <div className="fb-modal-overlay" onClick={onClose}>
      <div className="fb-modal fb-mood-modal" onClick={e => e.stopPropagation()}>
        <button className="fb-modal-close" onClick={onClose}><Icons.Close /></button>
        <h2 className="fb-mood-title">How are you feeling?</h2>
        <p className="fb-mood-sub">Your feelings matter. Take a moment to check in.</p>
        <div className="fb-mood-grid">
          {MOODS.map(m => (
            <button key={m.value} className={`fb-mood-btn ${selected?.value === m.value ? "fb-mood-btn--active" : ""}`} onClick={() => setSelected(m)}>
              <span className="fb-mood-emoji">{m.emoji}</span>
              <span className="fb-mood-label">{m.label}</span>
            </button>
          ))}
        </div>
        <textarea className="fb-mood-note" placeholder="Anything on your mind? (optional)" value={note} onChange={e => setNote(e.target.value)} rows={3}/>
        <div className="fb-modal-actions">
          <button className="fb-btn-primary" disabled={!selected} onClick={() => { onSubmit({mood:selected,note}); onClose(); }}>Save check-in</button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ settings, onUpdate, onClose }) {
  return (
    <div className="fb-modal-overlay" onClick={onClose}>
      <div className="fb-modal fb-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="fb-modal-header">
          <h2>Settings</h2>
          <button className="fb-modal-close static" onClick={onClose}><Icons.Close /></button>
        </div>
        <div className="fb-setting-row">
          <div className="fb-setting-info">
            <span className="fb-setting-icon">{settings.darkMode ? <Icons.Moon /> : <Icons.Sun />}</span>
            <div><p className="fb-setting-label">Dark Mode</p><p className="fb-setting-desc">Switch between light and dark theme</p></div>
          </div>
          <button className={`fb-toggle ${settings.darkMode?"fb-toggle--on":""}`} onClick={() => onUpdate("darkMode", !settings.darkMode)}><span className="fb-toggle-thumb"/></button>
        </div>
        <div className="fb-setting-row">
          <div className="fb-setting-info">
            <span className="fb-setting-icon" style={{fontSize:"1.1rem",fontWeight:700,color:"var(--text-secondary)"}}>Aa</span>
            <div><p className="fb-setting-label">Font Size</p><p className="fb-setting-desc">Adjust chat text size</p></div>
          </div>
          <div className="fb-font-btns">
            {["sm","md","lg"].map(s => (
              <button key={s} className={`fb-font-btn ${settings.fontSize===s?"fb-font-btn--active":""}`} onClick={() => onUpdate("fontSize",s)}>
                {s==="sm"?"S":s==="md"?"M":"L"}
              </button>
            ))}
          </div>
        </div>
        <div className="fb-setting-row">
          <div className="fb-setting-info">
            <span className="fb-setting-icon">🔔</span>
            <div><p className="fb-setting-label">Message Sounds</p><p className="fb-setting-desc">Play sound on new messages</p></div>
          </div>
          <button className={`fb-toggle ${settings.sounds?"fb-toggle--on":""}`} onClick={() => onUpdate("sounds",!settings.sounds)}><span className="fb-toggle-thumb"/></button>
        </div>
        <div className="fb-setting-row">
          <div className="fb-setting-info">
            <span className="fb-setting-icon">💬</span>
            <div><p className="fb-setting-label">Typing Indicator</p><p className="fb-setting-desc">Show animated dots while AI types</p></div>
          </div>
          <button className={`fb-toggle ${settings.typingIndicator?"fb-toggle--on":""}`} onClick={() => onUpdate("typingIndicator",!settings.typingIndicator)}><span className="fb-toggle-thumb"/></button>
        </div>
        <div className="fb-setting-row">
          <div className="fb-setting-info">
            <span className="fb-setting-icon">🌐</span>
            <div><p className="fb-setting-label">Language</p><p className="fb-setting-desc">Interface language</p></div>
          </div>
          <select className="fb-select" value={settings.language} onChange={e => onUpdate("language",e.target.value)}>
            <option value="en">English</option><option value="uz">O'zbek</option><option value="ru">Русский</option>
          </select>
        </div>
        <div className="fb-settings-footer">
          <p>FalsebirdAI v2.1 — Support companion</p>
          <p>Not a crisis service. In emergencies, call 103.</p>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { messages, activePersona, isLoading, error, safetyAlert,
          sendMessage, switchPersona, clearConversation, dismissSafetyAlert } = useChat();

  const [activeTab,    setActiveTab]    = useState(activePersona || "balu");
  // mobile: sidebar slides in as overlay drawer
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  // desktop: sidebar collapses to narrow icon-rail
  const [railMode,     setRailMode]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBreath,   setShowBreath]   = useState(false);
  const [showMood,     setShowMood]     = useState(false);
  const [showHistory,  setShowHistory]  = useState(false);
  const [moodHistory,  setMoodHistory]  = useState([]);
  const [settings, setSettings] = useState({
    darkMode:true, fontSize:"md", sounds:false, typingIndicator:true, language:"en",
  });

  useEffect(() => { if (activeTab !== "settings") switchPersona(activeTab); }, [activeTab]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", settings.darkMode ? "dark" : "light");
    root.setAttribute("data-font",  settings.fontSize);
  }, [settings.darkMode, settings.fontSize]);

  useEffect(() => {
    const fix = () => { document.body.style.height = `${window.visualViewport?.height ?? window.innerHeight}px`; };
    fix();
    window.visualViewport?.addEventListener("resize", fix);
    return () => window.visualViewport?.removeEventListener("resize", fix);
  }, []);

  // Close drawer on desktop resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setDrawerOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const updateSetting = useCallback((k,v) => setSettings(p => ({...p,[k]:v})), []);
  const saveMood = useCallback((entry) => {
    setMoodHistory(p => [{...entry, ts:new Date().toISOString()}, ...p]);
    sendMessage(entry.note
      ? `I'm feeling ${entry.mood.label.toLowerCase()} today. ${entry.note}`
      : `I'm feeling ${entry.mood.label.toLowerCase()} today.`);
  }, [sendMessage]);

  const currentPersona = PERSONAS[activeTab] ?? PERSONAS.balu;

  const navItems = [
    {id:"balu",     label:"Balu",     Icon:Icons.Balu    },
    {id:"dora",     label:"Dora",     Icon:Icons.Dora    },
    {id:"settings", label:"Settings", Icon:Icons.Settings},
  ];

  const tools = [
    {label:"Breathe", icon:<Icons.Breath  />, onClick:()=>setShowBreath(true)  },
    {label:"Mood",    icon:"🌱",              onClick:()=>setShowMood(true)    },
    {label:"History", icon:<Icons.History />, onClick:()=>setShowHistory(true) },
    {label:"Clear",   icon:<Icons.Trash   />, onClick:clearConversation        },
  ];

  const closeSidebar = () => setDrawerOpen(false);

  return (
    <div className={`fb-root ${settings.darkMode ? "theme-dark" : "theme-light"}`}>
      <div className="fb-orb fb-orb-1" style={{"--orb-color":currentPersona.color}}/>
      <div className="fb-orb fb-orb-2" style={{"--orb-color":currentPersona.accent}}/>
      <div className="fb-grain"/>

      <div className="fb-layout">
        {/* ── Backdrop (mobile drawer) ─────────────────────────────────── */}
        <div
          className={`fb-drawer-backdrop ${drawerOpen ? "fb-drawer-backdrop--show" : ""}`}
          onClick={closeSidebar}
        />

        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <aside className={`fb-sidebar ${drawerOpen ? "fb-sidebar--open" : ""} ${railMode ? "fb-sidebar--rail" : ""}`}>

          {/* Logo */}
          <div className="fb-logo">
            <span className="fb-logo-bird">🐦</span>
            <div className="fb-logo-text">
              <h1 className="fb-logo-name">Falsebird<span>AI</span></h1>
              <p className="fb-logo-tagline">You're not alone in this.</p>
            </div>
          </div>

          {/* Persona nav */}
          <nav className="fb-sidebar-nav">
            {navItems.filter(n => n.id !== "settings").map(({id,label,Icon}) => {
              const p = PERSONAS[id];
              return (
                <button key={id}
                  title={railMode ? label : undefined}
                  className={`fb-sidebar-nav-btn ${activeTab===id?"fb-sidebar-nav-btn--active":""}`}
                  style={{"--p-color":p?.color}}
                  onClick={() => { setActiveTab(id); closeSidebar(); }}>
                  <span className="fb-snb-icon"><Icon /></span>
                  <div className="fb-snb-text">
                    <span className="fb-snb-name">{label}</span>
                    <span className="fb-snb-desc">{p?.tagline}</span>
                  </div>
                  {activeTab===id && <span className="fb-snb-dot"/>}
                </button>
              );
            })}
          </nav>

          {/* Tool buttons */}
          <div className="fb-sidebar-tools">
            {tools.map(({label,icon,onClick}) => (
              <button key={label} className="fb-tool-btn" title={railMode ? label : undefined}
                onClick={() => { onClick(); closeSidebar(); }}>
                <span className="fb-tool-icon">{icon}</span>
                <span className="fb-tool-label">{label}</span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="fb-sidebar-footer">
            <button className="fb-tool-btn" title={railMode?"Settings":undefined}
              onClick={() => { setShowSettings(true); closeSidebar(); }}>
              <span className="fb-tool-icon"><Icons.Settings /></span>
              <span className="fb-tool-label">Settings</span>
            </button>
            <p className="fb-disclaimer">
              Not a crisis service. In emergencies call <strong>103</strong>.
            </p>
          </div>

          {/* ── Desktop collapse toggle (floats on right edge of sidebar) ── */}
          <button
            className="fb-sidebar-collapse-btn"
            onClick={() => setRailMode(r => !r)}
            aria-label={railMode ? "Expand sidebar" : "Collapse sidebar"}
          >
            {railMode ? <Icons.ChevRight /> : <Icons.ChevLeft />}
          </button>
        </aside>

        {/* ── MAIN ─────────────────────────────────────────────────────── */}
        <main className="fb-chat-main">
          {/* Top bar */}
          <header className="fb-topbar">
            {/* Hamburger — mobile only (shows) / desktop shows same btn to toggle rail */}
            <button
              className="fb-topbar-menu-btn"
              onClick={() => {
                // Mobile: toggle drawer; Desktop: do nothing extra (collapse is on sidebar)
                if (window.innerWidth < 768) setDrawerOpen(o => !o);
                else setRailMode(r => !r);
              }}
              aria-label="Toggle menu"
            >
              <Icons.Menu />
            </button>

            {/* Persona */}
            <div className="fb-topbar-persona">
              <span className="fb-topbar-emoji">{currentPersona.emoji}</span>
              <div>
                <p className="fb-topbar-name">{currentPersona.name}</p>
                <p className="fb-topbar-tagline">{currentPersona.tagline}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="fb-topbar-actions">
              <button className="fb-topbar-btn" onClick={() => setShowBreath(true)} title="Breathe"><Icons.Breath /></button>
              <button className="fb-topbar-btn" onClick={() => setShowMood(true)}   title="Mood"><span style={{fontSize:"1rem"}}>🌱</span></button>
              <button className="fb-topbar-btn" onClick={clearConversation}         title="Clear"><Icons.Trash /></button>
            </div>
          </header>

          {/* Chat */}
          <div className="fb-chat-wrap">
            <ChatInterface
              messages={messages} isLoading={isLoading} error={error}
              safetyAlert={safetyAlert} activePersona={activeTab} settings={settings}
              onSendMessage={sendMessage} onClear={clearConversation} onDismissSafety={dismissSafetyAlert}
            />
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav className="fb-bottom-nav" role="navigation" aria-label="Main navigation">
        {navItems.map(({id,label,Icon}) => {
          const isActive = id==="settings" ? showSettings : activeTab===id;
          const persona  = PERSONAS[id];
          return (
            <button key={id}
              className={`fb-bnav-btn ${isActive?"fb-bnav-btn--active":""}`}
              style={{"--btn-color":persona?.color??"#94a3b8"}}
              onClick={() => {
                if (id==="settings") { setShowSettings(true); }
                else { setActiveTab(id); setShowSettings(false); closeSidebar(); }
              }}
              aria-label={label}>
              {isActive && <span className="fb-bnav-pill"/>}
              <span className="fb-bnav-icon"><Icon /></span>
              {persona && <span className={`fb-bnav-badge ${isActive?"fb-bnav-badge--show":""}`}>{persona.emoji}</span>}
              <span className="fb-bnav-label">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showSettings && <SettingsPanel settings={settings} onUpdate={updateSetting} onClose={() => setShowSettings(false)}/>}
      {showBreath   && <BreathingWidget onClose={() => setShowBreath(false)}/>}
      {showMood     && <MoodCheckIn onClose={() => setShowMood(false)} onSubmit={saveMood}/>}
      {showHistory  && (
        <div className="fb-modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="fb-modal fb-history-modal" onClick={e => e.stopPropagation()}>
            <div className="fb-modal-header">
              <h2>Mood History</h2>
              <button className="fb-modal-close static" onClick={() => setShowHistory(false)}><Icons.Close /></button>
            </div>
            {moodHistory.length === 0 ? (
              <div className="fb-history-empty"><span>🌱</span><p>No mood check-ins yet. Start with your first one!</p></div>
            ) : (
              <div className="fb-history-list">
                {moodHistory.map((entry,i) => (
                  <div key={i} className="fb-history-item">
                    <span className="fb-history-emoji">{entry.mood.emoji}</span>
                    <div>
                      <p className="fb-history-mood">{entry.mood.label}</p>
                      {entry.note && <p className="fb-history-note">{entry.note}</p>}
                      <p className="fb-history-time">{new Date(entry.ts).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}