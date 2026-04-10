import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────
// CONFIG & EXTERNAL COMPONENTS
// ─────────────────────────────────────────────
import { PHASES, THEMES, SAMPLE_QUERIES } from "./config/constants";
import { VoxaLogo, IconImage } from "./components/icons/Icons";
import WeatherCard from "./components/visuals/WeatherCard";
import WaveCanvas from "./components/visuals/WaveCanvas";
import LiquidOrb from "./components/visuals/LiquidOrb";
import SpatialCameraWindow from "./components/camera/SpatialCameraWindow";
import {
  ProfileScreen, HistoryScreen, MemoryScreen,
  PersonalizationScreen, FeedbackScreen, SupportScreen
} from "./components/modals/ModalScreens";

// ─────────────────────────────────────────────
// LOCAL UI COMPONENTS (Navbar & Query Elements)
// ─────────────────────────────────────────────

function QuerySlider({ theme, onSelect }) {
  const [idx, setIdx] = useState(Math.floor(Math.random() * SAMPLE_QUERIES.length));
  useEffect(() => {
    const t = setInterval(() => setIdx(Math.floor(Math.random() * SAMPLE_QUERIES.length)), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="query-slider-container" style={{ position: "relative", overflow: "hidden", width: "100%", cursor: "pointer", padding: "0 10px" }} onClick={() => onSelect(SAMPLE_QUERIES[idx])}>
      <AnimatePresence mode="wait">
        <motion.p key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ position: "absolute", width: "100%", left: 0, textAlign: "center", fontSize: "clamp(13px, 1.5vw, 15px)", color: theme.textMuted, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.4, transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = theme.text} onMouseLeave={(e) => e.target.style.color = theme.textMuted}>
          "{SAMPLE_QUERIES[idx]}"
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function TypingText({ text, speed = 38, onDone }) {
  const [shown, setShown] = useState(""); const [idx, setIdx] = useState(0); const timeoutsRef = useRef([]);
  useEffect(() => { setShown(""); setIdx(0); }, [text]);
  useEffect(() => {
    if (idx >= text?.length) { onDone?.(); return; }
    const ms = text[idx] === " " ? speed * 1.3 : speed;
    const t = setTimeout(() => { setShown(p => p + text[idx]); setIdx(p => p + 1); }, ms);
    timeoutsRef.current.push(t); return () => clearTimeout(t);
  }, [idx, text, speed, onDone]);
  useEffect(() => { return () => timeoutsRef.current.forEach(clearTimeout); }, []);
  return (
    <>{shown}{idx < text?.length && <span style={{ display: "inline-block", width: 2, height: "0.85em", background: "rgba(255,255,255,0.75)", marginLeft: 3, verticalAlign: "middle", animation: "blinkCursor 0.85s step-end infinite" }} />}</>
  );
}

function NavPill({ theme }) {
  return <motion.div layoutId="nav-pill" style={{ position: "absolute", inset: 0, borderRadius: 999, background: theme.bgSecondary, zIndex: 1, pointerEvents: "none" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />;
}

function SettingsDropdown({ theme, isDark, onToggleTheme, onClose, onOpenModal, onLogout }) {
  const items = [
    { label: isDark ? "Light Mode" : "Dark Mode", action: onToggleTheme },
    { label: "Profile Setup", action: () => onOpenModal("profile") },
    { label: "Chat History", action: () => onOpenModal("history") },
    { label: "Core Memories (Brain)", action: () => onOpenModal("brain") },
    { label: "Voice Personalization", action: () => onOpenModal("personalization") },
    { label: "Submit Feedback", action: () => onOpenModal("feedback") },
    { label: "Contact Support", action: () => onOpenModal("support") },
    { label: "Logout", action: () => { onLogout(); onClose(); }, danger: true },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ position: "absolute", top: "calc(100% + 14px)", right: 0, minWidth: 210, background: theme.dropdownBg, border: `1px solid ${theme.dropdownBorder}`, borderRadius: 16, backdropFilter: "blur(64px)", WebkitBackdropFilter: "blur(64px)", boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.6)" : "0 24px 64px rgba(0,0,0,0.15)", zIndex: 2000, padding: "8px 0" }}>
      {items.map((item, i) => (
        <div key={i}>
          {i === items.length - 1 && <div style={{ height: 1, background: theme.dropdownBorder, margin: "6px 0" }} />}
          <button onClick={() => { item.action?.(); if (item.label !== "Light Mode" && item.label !== "Dark Mode" && item.label !== "Logout") onClose(); }} style={{ display: "flex", alignItems: "center", width: "100%", padding: "10px 20px", background: "transparent", border: "none", color: item.danger ? theme.danger : theme.text, fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "background 0.15s ease", outline: "none" }} onMouseEnter={e => e.currentTarget.style.background = theme.dropdownHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{item.label}</button>
        </div>
      ))}
    </motion.div>
  );
}

function Navbar({ theme, isDark, onToggleTheme, ribbonSplit, isAppMuted, isCameraMode, onOpenModal, activeModal, onLogout }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);
  const settingsRef = useRef(null);
  const isExpanded = !ribbonSplit && !isCameraMode;

  useEffect(() => {
    const handler = (e) => { if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false); };
    document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler);
  }, []);
  useEffect(() => { if (isAppMuted) { setSettingsOpen(false); setHoveredTab(null); } }, [isAppMuted]);

  const navBtnStyle = (isActive) => ({ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 500, letterSpacing: "0.01em", color: isActive ? theme.text : theme.textMuted, fontFamily: "inherit", padding: "6px 14px", borderRadius: 999, outline: "none", whiteSpace: "nowrap", zIndex: 10, transition: "color 0.2s" });

  return (
    <div style={{ position: "fixed", top: "clamp(16px, 3vh, 24px)", left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <motion.nav initial={false} animate={{ width: isExpanded ? "auto" : 44, background: isAppMuted ? "rgba(0,0,0,0.6)" : theme.navBg, borderColor: isAppMuted ? "rgba(255,255,255,0.15)" : theme.navBorder }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ height: 44, borderRadius: 22, display: "flex", alignItems: "center", pointerEvents: isAppMuted ? "none" : "auto", backdropFilter: "blur(44px)", WebkitBackdropFilter: "blur(44px)", boxShadow: "0 12px 32px rgba(0,0,0,0.15)", borderStyle: "solid", borderWidth: 1, overflow: settingsOpen ? "visible" : "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", width: "max-content", padding: "0 8px" }}>
          <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><VoxaLogo /></div>
          <motion.div animate={{ opacity: isExpanded ? 1 : 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", alignItems: "center", pointerEvents: isExpanded ? "auto" : "none" }}>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", color: theme.text, whiteSpace: "nowrap", paddingLeft: 10, paddingRight: 10 }}>Voxa</span>
            <div style={{ width: 1, height: 16, background: theme.navBorder, margin: "0 12px" }} />
            <div style={{ display: "flex", gap: "2px", position: "relative" }} onMouseLeave={() => setHoveredTab(null)}>
              <div style={{ position: "relative" }}>{hoveredTab === "history" && <NavPill theme={theme} />}<button style={navBtnStyle(activeModal === "history" || hoveredTab === "history")} onClick={() => onOpenModal("history")} onMouseEnter={() => setHoveredTab("history")}>History</button></div>
              <div style={{ position: "relative" }}>{hoveredTab === "profile" && <NavPill theme={theme} />}<button style={navBtnStyle(activeModal === "profile" || hoveredTab === "profile")} onClick={() => onOpenModal("profile")} onMouseEnter={() => setHoveredTab("profile")}>Profile</button></div>
              <div ref={settingsRef} style={{ position: "relative" }}>
                {hoveredTab === "settings" && <NavPill theme={theme} />}
                <button style={navBtnStyle(settingsOpen || hoveredTab === "settings")} onClick={() => setSettingsOpen(!settingsOpen)} onMouseEnter={() => setHoveredTab("settings")}>Settings ▾</button>
                <AnimatePresence>{settingsOpen && <SettingsDropdown theme={theme} isDark={isDark} onToggleTheme={onToggleTheme} onClose={() => setSettingsOpen(false)} onOpenModal={onOpenModal} onLogout={onLogout} />}</AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.nav>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP COMPONENT
// ─────────────────────────────────────────────

export default function VoiceAssistant({ user, onLogout }) {
  const [isDark, setIsDark] = useState(() => { try { return localStorage.getItem('voxa_theme') !== 'light'; } catch (e) { return true; } });
  const [userName, setUserName] = useState(() => { try { return user?.name || localStorage.getItem('voxa_username') || "Guest"; } catch (e) { return user?.name || "Guest"; } });
  const [selectedVoice, setSelectedVoice] = useState(() => { try { return localStorage.getItem('voxa_voice_preference') || "female"; } catch (e) { return "female"; } });

  const [phase, setPhase] = useState(PHASES.IDLE);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentResponse, setCurrentResponse] = useState("");
  const [currentCard, setCurrentCard] = useState(null);
  const [typing, setTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [isDockHovered, setIsDockHovered] = useState(false);

  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);

  const [showGreeting, setShowGreeting] = useState(true);
  const [showQuery, setShowQuery] = useState(false);
  const [greetingVisible, setGreetingVisible] = useState(true);
  const [ribbonSplit, setRibbonSplit] = useState(false);

  const [greetingText, setGreetingText] = useState("Good day");
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreetingText("Good morning");
    else if (hour < 18) setGreetingText("Good afternoon");
    else setGreetingText("Good evening");
  }, []);

  const loopRef = useRef({ isVoiceCall: false, isBotSpeaking: false, pendingHangup: false, silenceTimer: null, audioPlayer: null });
  const micRef = useRef(null);
  const videoRef = useRef(null);
  const cameraModeRef = useRef(false);
  const availableVoicesRef = useRef([]);

  const theme = isDark ? THEMES.dark : THEMES.light;
  const isDockExpanded = isDockHovered || showInput;
  const isAppMuted = activeModal !== null;
  const effectiveSplit = ribbonSplit || isCameraMode;

  const handleToggleTheme = () => { setIsDark(prev => { const newTheme = !prev; try { localStorage.setItem('voxa_theme', newTheme ? 'dark' : 'light'); } catch (e) { } return newTheme; }); };
  useEffect(() => { cameraModeRef.current = isCameraMode; }, [isCameraMode]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => { availableVoicesRef.current = window.speechSynthesis.getVoices(); };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setUploadedImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ENGINE LOGIC
  const endCall = useCallback(() => {
    loopRef.current.isVoiceCall = false; loopRef.current.isBotSpeaking = false; loopRef.current.pendingHangup = false;
    if (loopRef.current.silenceTimer) clearTimeout(loopRef.current.silenceTimer);
    if (micRef.current) { try { micRef.current.stop(); } catch (e) { } }
    if (loopRef.current.audioPlayer) { try { loopRef.current.audioPlayer.pause(); loopRef.current.audioPlayer.currentTime = 0; } catch (e) { } }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPhase(PHASES.IDLE); setCurrentCard(null); setShowQuery(false); setShowGreeting(true); setGreetingVisible(true); setRibbonSplit(false); setIsCameraMode(false);
  }, []);

  const startSilenceTimer = useCallback(() => {
    if (loopRef.current.silenceTimer) clearTimeout(loopRef.current.silenceTimer);
    loopRef.current.silenceTimer = setTimeout(() => { endCall(); }, 15000);
  }, [endCall]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR(); rec.continuous = true; rec.interimResults = false; rec.lang = 'en-US';
    rec.onstart = () => { if (loopRef.current.isVoiceCall && !loopRef.current.isBotSpeaking) { setPhase(PHASES.LISTENING); setCurrentPrompt("Listening..."); startSilenceTimer(); } };
    rec.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      if (!transcript) return;
      startSilenceTimer();
      if (loopRef.current.isBotSpeaking) return;
      if (window.activeRunQuery) window.activeRunQuery(transcript);
    };
    rec.onend = () => { if (loopRef.current.isVoiceCall && !loopRef.current.isBotSpeaking) { setTimeout(() => { try { rec.start(); } catch (e) { } }, 200); } };
    micRef.current = rec;
  }, [startSilenceTimer]);

  const handleOrbTap = () => {
    if (loopRef.current.isBotSpeaking) return;
    if (loopRef.current.isVoiceCall) { endCall(); } else {
      loopRef.current.isVoiceCall = true; loopRef.current.isBotSpeaking = false; loopRef.current.pendingHangup = false;
      setPhase(PHASES.LISTENING); setGreetingVisible(false); setShowGreeting(false); setRibbonSplit(true); setShowQuery(true); setCurrentPrompt("Listening..."); setCurrentResponse(""); setCurrentCard(null);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (loopRef.current.audioPlayer) { try { loopRef.current.audioPlayer.pause(); loopRef.current.audioPlayer.currentTime = 0; } catch (e) { } }
      try { micRef.current.start(); } catch (e) { }
    }
  };

  const triggerVoiceContinuation = useCallback(() => {
    loopRef.current.isBotSpeaking = false;
    if (loopRef.current.pendingHangup) { endCall(); } else if (loopRef.current.isVoiceCall) {
      setPhase(PHASES.LISTENING); setCurrentPrompt("Listening..."); setCurrentResponse("");
      if (micRef.current) { try { micRef.current.start(); } catch (e) { } }
      startSilenceTimer();
    }
  }, [endCall, startSilenceTimer]);

  const runQuery = async (q) => {
    loopRef.current.isBotSpeaking = true;
    if (loopRef.current.silenceTimer) clearTimeout(loopRef.current.silenceTimer);
    if (micRef.current) { try { micRef.current.abort(); } catch (e) { } }

    if (q && typeof q === 'string') {
      const exitRegex = /\b(okay|ok)?\s*(goodbye|bye|see ya|see you|end conversation|close the chat|close chat|that'?s it|that'?s all|stop listening|stop|exit|cancel|quit|we are done|we'?re done|no more|good night|stop the mic)\b/i;
      if (exitRegex.test(q)) loopRef.current.pendingHangup = true;
    }

    setPhase(PHASES.PROCESSING); setGreetingVisible(false); setShowGreeting(false); setRibbonSplit(true); setShowQuery(true); setTyping(false); setCurrentPrompt(q); setCurrentResponse("Thinking..."); setCurrentCard(null);

    let finalImage = uploadedImage;
    if (cameraModeRef.current) {
      try {
        const videoElement = document.getElementById("voxa-camera-feed");
        if (videoElement) {
          const canvas = document.createElement("canvas"); canvas.width = videoElement.videoWidth || 1080; canvas.height = videoElement.videoHeight || 1920;
          const ctx = canvas.getContext("2d"); ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          finalImage = canvas.toDataURL("image/jpeg", 0.5);
        }
      } catch (err) { }
    }

    try {
      const response = await fetch("https://voxa-ai-zh5o.onrender.com/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user?.token}` },
        body: JSON.stringify({ prompt: q, image: finalImage, voice: selectedVoice }),
      });
      if (!response.body) throw new Error("No readable stream");

      const reader = response.body.getReader(); const decoder = new TextDecoder("utf-8");
      let done = false; let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read(); done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n'); buffer = events.pop();
          for (const event of events) {
            const lines = event.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  if (data.type === 'status') { setCurrentResponse(data.text); }
                  else if (data.type === 'text') { setPhase(PHASES.RESPONDING); setCurrentResponse(data.text); if (data.card) setCurrentCard(data.card); setTyping(true); }
                  else if (data.type === 'audio') {
                    if (!isAppMuted && data.audio && loopRef.current.audioPlayer) {
                      loopRef.current.audioPlayer.src = `data:audio/mpeg;base64,${data.audio}`;
                      loopRef.current.audioPlayer.play().catch(e => { triggerVoiceContinuation(); });
                    } else { triggerVoiceContinuation(); }
                  }
                  else if (data.type === 'error') { setPhase(PHASES.RESPONDING); setCurrentResponse(data.text); triggerVoiceContinuation(); }
                } catch (e) { }
              }
            }
          }
        }
      }
    } catch (err) { setPhase(PHASES.RESPONDING); setCurrentResponse("Network error."); triggerVoiceContinuation(); }
  };

  const handleAudioEnd = useCallback(() => { setTimeout(() => { triggerVoiceContinuation(); }, 500); }, [triggerVoiceContinuation]);
  useEffect(() => { window.activeRunQuery = runQuery; }, [runQuery]);

  const handleTextSubmit = () => {
    const q = inputValue.trim(); if (!q || loopRef.current.isBotSpeaking) return;
    setInputValue(""); setShowInput(false); loopRef.current.isVoiceCall = false; loopRef.current.pendingHangup = false;
    if (loopRef.current.silenceTimer) clearTimeout(loopRef.current.silenceTimer);
    if (micRef.current) { try { micRef.current.stop(); } catch (e) { } }
    runQuery(q); setUploadedImage(null);
  };

  const handleRandomQuerySelect = (query) => { setInputValue(query); setShowInput(true); };
  const handleTypingDone = () => { setTyping(false); };
  const handleAudioRef = useCallback((node) => { if (node) loopRef.current.audioPlayer = node; }, []);

  const renderModalContent = () => {
    switch (activeModal) {
      case 'profile': return { title: "Profile Setup", component: <ProfileScreen theme={theme} user={user} userName={userName} setUserName={setUserName} /> };
      case 'history': return { title: "Recent Activity", component: <HistoryScreen theme={theme} user={user} onClose={() => setActiveModal(null)} /> };
      case 'brain': return { title: "Voxa's Brain", component: <MemoryScreen theme={theme} user={user} /> };
      case 'personalization': return { title: "Personalization", component: <PersonalizationScreen theme={theme} selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice} /> };
      case 'feedback': return { title: "Submit Feedback", component: <FeedbackScreen theme={theme} /> };
      case 'support': return { title: "Contact Support", component: <SupportScreen theme={theme} /> };
      default: return { title: "", component: null };
    }
  };
  const modalData = renderModalContent();

  return (
    <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", background: "#000", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>
      <style>{`html, body { margin: 0; padding: 0; background: #000; overscroll-behavior-y: none; } * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; } ::-webkit-scrollbar { display: none; } button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid #7c3aed; outline-offset: 2px; } input:focus, textarea:focus { border-color: rgba(124,58,237,0.5) !important; } input::placeholder, textarea::placeholder { color: rgba(140,140,160,0.45); } @keyframes blinkCursor { 0%,100%{opacity:1} 50%{opacity:0} } @keyframes dotBeat { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} } .query-slider-container { margin-top: 6px; height: 32px; } @media (max-aspect-ratio: 3/4), (max-width: 600px) { .query-slider-container { margin-top: 12vh; height: 48px; } }`}</style>

      <audio ref={handleAudioRef} style={{ display: "none" }} onEnded={handleAudioEnd} />
      <SpatialCameraWindow isActive={isCameraMode} onClose={() => setIsCameraMode(false)} videoRef={videoRef} />

      <AnimatePresence>
        {activeModal === 'history' && (
          <motion.div key="history-modal" initial={{ opacity: 0, x: -40, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -30, scale: 0.95, transition: { duration: 0.2 } }} transition={{ type: "spring", stiffness: 250, damping: 28 }} style={{ position: "absolute", top: 16, bottom: 16, left: 16, width: "clamp(280px, 80vw, 420px)", zIndex: 100, background: isDark ? "rgba(15,15,20,0.65)" : "rgba(250,250,252,0.65)", backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)", border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 40, padding: 28, display: "flex", flexDirection: "column", color: theme.text, overflowY: "auto", WebkitOverflowScrolling: "touch", boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)" }}>
            <h2 style={{ margin: "0 0 24px 0", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: theme.text }}>{modalData.title}</h2>
            {modalData.component}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(activeModal && activeModal !== 'history') && (
          <motion.div key="general-modal" initial={{ opacity: 0, y: 60, scale: 0.9, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(8px)", transition: { duration: 0.25 } }} transition={{ type: "spring", stiffness: 250, damping: 28 }} style={{ position: "absolute", zIndex: 100, width: "min(90vw, 540px)", maxHeight: "85dvh", background: isDark ? "rgba(15,15,20,0.65)" : "rgba(250,250,252,0.65)", backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)", border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 40, padding: "clamp(24px, 4vw, 40px)", display: "flex", flexDirection: "column", color: theme.text, overflowY: "auto", WebkitOverflowScrolling: "touch", boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)" }}>
            <h2 style={{ margin: "0 0 28px 0", fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: theme.text }}>{modalData?.title}</h2>
            {modalData?.component}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div animate={{ scale: isAppMuted ? 0.90 : 1, y: isAppMuted ? -15 : 0, opacity: activeModal ? 0.35 : 1, filter: activeModal ? "blur(12px)" : "blur(0px)", borderRadius: isAppMuted ? 44 : 0 }} transition={{ type: "spring", stiffness: 220, damping: 30 }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 10, background: theme.bg, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: isAppMuted ? "none" : "auto" }}>
        {activeModal && <div onClick={() => setActiveModal(null)} style={{ position: "absolute", inset: 0, zIndex: 999, cursor: "pointer", pointerEvents: "auto" }} />}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, background: `radial-gradient(ellipse 80% 60% at 50% 70%, ${theme.radialGlow} 0%, transparent 72%)`, transition: "background 0.7s" }} />

        <WaveCanvas phase={phase} ribbonSplit={effectiveSplit} isAppMuted={isAppMuted} />
        <Navbar theme={theme} isDark={isDark} onToggleTheme={handleToggleTheme} ribbonSplit={effectiveSplit} isAppMuted={isAppMuted} isCameraMode={isCameraMode} onOpenModal={setActiveModal} activeModal={activeModal} onLogout={onLogout} />

        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: effectiveSplit ? "flex-start" : "center", justifyContent: "center", width: "100%", textAlign: effectiveSplit ? "left" : "center", paddingLeft: effectiveSplit ? "clamp(90px, 12vw, 200px)" : "clamp(28px,8vw,130px)", paddingRight: "clamp(28px,8vw,130px)", paddingBottom: "18dvh", paddingTop: 100, transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <AnimatePresence mode="wait">
            {showGreeting && !isCameraMode && (
              <motion.div key="greeting" initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} animate={{ opacity: greetingVisible ? 1 : 0, y: greetingVisible ? 0 : -30, filter: greetingVisible ? "blur(0px)" : "blur(12px)", scale: greetingVisible ? 1 : 0.9 }} exit={{ opacity: 0, y: -30, filter: "blur(12px)", scale: 0.9 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <p style={{ margin: 0, fontSize: "clamp(15px, 2vw, 18px)", color: theme.textMuted, fontWeight: 400, letterSpacing: "0.01em" }}>{greetingText}, {userName?.split(' ')[0] || "Guest"}</p>
                <p style={{ margin: 0, fontSize: "clamp(32px, 4.5vw, 46px)", color: theme.text, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.2 }}>How can I help you?</p>
                <QuerySlider theme={theme} onSelect={handleRandomQuerySelect} />
              </motion.div>
            )}

            {showQuery && (
              <motion.div key="query" initial={{ opacity: 0, y: 30, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -20, filter: "blur(8px)" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: effectiveSplit ? "flex-start" : "center", width: "100%" }}>
                <div style={{ minHeight: "clamp(36px, 6vw, 70px)", display: "flex", alignItems: "flex-end" }}>
                  <AnimatePresence mode="wait">
                    <motion.p key={currentPrompt} initial={{ opacity: 0, y: 15, filter: "blur(8px)", scale: 0.98 }} animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }} exit={{ opacity: 0, y: -10, filter: "blur(4px)", scale: 0.98, transition: { duration: 0.15 } }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ margin: 0, fontSize: "clamp(28px, 4.5vw, 48px)", color: theme.text, fontWeight: 400, letterSpacing: "-0.04em", lineHeight: 1.1, maxWidth: "min(900px, 85vw)", transformOrigin: effectiveSplit ? "left center" : "center" }}>{currentPrompt}</motion.p>
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                  {currentResponse && (
                    <motion.div key={phase === PHASES.PROCESSING ? "thinking" : "responding"} initial={{ opacity: 0, y: 15, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.15 } }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                      <p style={{ margin: 0, fontSize: "clamp(16px, 2.2vw, 22px)", color: theme.textMuted, fontWeight: 400, lineHeight: 1.4, letterSpacing: "-0.01em", maxWidth: "min(720px, 75vw)" }}>{typing && phase === PHASES.RESPONDING ? <TypingText text={currentResponse} speed={36} onDone={handleTypingDone} /> : currentResponse}</p>
                      <AnimatePresence>{currentCard && currentCard.type === 'weather' && phase === PHASES.RESPONDING && <WeatherCard key="weather-card" data={currentCard} theme={theme} />}</AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "calc(env(safe-area-inset-bottom, 12px) + clamp(24px, 5vh, 56px))", gap: 16 }}>
          <AnimatePresence>
            {showInput && !isCameraMode && (
              <motion.div key="textinput" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "min(520px,86vw)", marginBottom: 8 }}>
                <AnimatePresence>
                  {uploadedImage && (
                    <motion.div initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ width: "100%", display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                      <div style={{ position: "relative", width: 80, height: 80, borderRadius: 12, border: `1px solid ${theme.buttonBorder}`, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                        <img src={uploadedImage} alt="Upload preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button onClick={() => setUploadedImage(null)} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }}>✕</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div style={{ display: "flex", gap: 10, width: "100%" }}>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
                  <motion.button onClick={() => fileInputRef.current?.click()} whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.04 }} style={{ height: 50, width: 50, borderRadius: "50%", border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", color: theme.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, outline: "none" }}><IconImage /></motion.button>
                  <input autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleTextSubmit()} placeholder="Type your question…" style={{ flex: 1, height: 50, borderRadius: 999, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", color: theme.text, fontSize: "16px", fontWeight: 400, padding: "0 22px", outline: "none", fontFamily: "inherit", letterSpacing: "-0.01em", transition: "border-color 0.28s cubic-bezier(0.16,1,0.3,1), background 0.4s", WebkitAppearance: "none" }} />
                  <motion.button onClick={handleTextSubmit} whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.04 }} style={{ height: 50, borderRadius: 999, border: "1px solid rgba(124,58,237,0.4)", background: "rgba(124,58,237,0.32)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", color: "rgba(255,255,255,0.9)", fontSize: "clamp(13px,1.4vw,15px)", fontWeight: 500, letterSpacing: "0.01em", padding: "0 26px", cursor: "pointer", fontFamily: "inherit", outline: "none" }}>Ask</motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div onMouseEnter={() => setIsDockHovered(true)} onMouseLeave={() => setIsDockHovered(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", height: "clamp(60px, 8vw, 80px)", width: "clamp(200px, 25vw, 240px)" }}>
            <motion.button onClick={() => { if (phase !== PHASES.PROCESSING && phase !== PHASES.RESPONDING) setShowInput(p => !p); }} animate={{ x: isDockExpanded ? -80 : 0, opacity: isDockExpanded ? 1 : 0, scale: isDockExpanded ? 1 : 0.5 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} whileHover={{ scale: isDockExpanded ? 1.05 : 1, backgroundColor: theme.buttonBg }} whileTap={{ scale: 0.92 }} style={{ position: "absolute", zIndex: 5, width: "clamp(46px,5vw,56px)", height: "clamp(46px,5vw,56px)", borderRadius: "50%", border: `1px solid ${theme.buttonBorder}`, background: showInput ? theme.bgSecondary : theme.navBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", cursor: (phase === PHASES.PROCESSING || phase === PHASES.RESPONDING) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", pointerEvents: isDockExpanded ? "auto" : "none" }}>
              <svg width="clamp(18px,2.2vw,22px)" height="clamp(18px,2.2vw,22px)" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M7 8h.01M11 8h.01M15 8h.01M7 12h.01M11 12h.01M15 12h.01M7 16h10" /></svg>
            </motion.button>
            <div style={{ position: "relative", zIndex: 10 }}><LiquidOrb onTap={handleOrbTap} onCameraMode={() => setIsCameraMode(true)} phase={phase} theme={theme} isCameraMode={isCameraMode} isAppMuted={isAppMuted} /></div>
            <motion.button onClick={handleOrbTap} animate={{ x: isDockExpanded ? 80 : 0, opacity: isDockExpanded ? 1 : 0, scale: isDockExpanded ? 1 : 0.5 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} whileHover={{ scale: isDockExpanded ? 1.05 : 1, backgroundColor: theme.buttonBg }} whileTap={{ scale: 0.92 }} style={{ position: "absolute", zIndex: 5, width: "clamp(46px,5vw,56px)", height: "clamp(46px,5vw,56px)", borderRadius: "50%", border: `1px solid ${theme.buttonBorder}`, background: theme.navBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", cursor: (phase === PHASES.PROCESSING || phase === PHASES.RESPONDING) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: "none", pointerEvents: isDockExpanded ? "auto" : "none" }}>
              <svg width="clamp(18px,2.2vw,22px)" height="clamp(18px,2.2vw,22px)" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /></svg>
            </motion.button>
          </motion.div>

          {!isCameraMode && <motion.p onClick={() => { if (!isAppMuted) setIsCameraMode(true) }} animate={{ backgroundPosition: ["200% center", "-200% center"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} style={{ marginTop: "clamp(4px, 1vh, 8px)", fontSize: "clamp(9px,1vw,11px)", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase", userSelect: "none", cursor: "pointer", pointerEvents: "auto", textAlign: "center", backgroundImage: `linear-gradient(90deg, ${theme.textFaint} 0%, ${theme.text} 50%, ${theme.textFaint} 100%)`, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SWIPE UP ↑ FOR CAMERA</motion.p>}
        </div>
      </motion.div>
    </div>
  );
}