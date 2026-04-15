import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { PHASES, THEMES } from "./config/constants";
import { streamChatResponse } from "./services/apiStream";
import GlobalStyles from "./components/layout/GlobalStyles";
import WaveCanvas from "./components/visuals/WaveCanvas";
import SpatialCameraWindow from "./components/camera/SpatialCameraWindow";
import Navbar from "./components/layout/Navbar";
import ChatDisplay from "./components/layout/ChatDisplay";
import ActionDock from "./components/layout/ActionDock";
import ModalManager from "./components/modals/ModalManager";
import LandingPage from "./LandingPage";
import AuthPage from "./AuthPage";

import './index.css';

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ TITANIUM AUTH — App.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// This component is NOW a pure view router. All auth interception and
// initialization happens in main.jsx at module load time. App.jsx receives
// its state as props and renders the correct view deterministically.
// ═══════════════════════════════════════════════════════════════════════════════

export default function App({ user, showAuth, onAuthSuccess, onLogout, onLaunch, onBack }) {
  // ─── DETERMINISTIC CONDITIONAL ROUTING ───
  // Priority: user → showAuth → LandingPage
  // No window.location.href, no window.location.replace, no hard redirects.

  // 1. Authenticated user → VoiceAssistant
  if (user) {
    return <VoiceAssistant user={user} onLogout={onLogout} />;
  }

  // 2. User clicked "Log in" → AuthPage
  if (showAuth) {
    return <AuthPage onAuthSuccess={onAuthSuccess} onBack={onBack} />;
  }

  // 3. Default → LandingPage
  return <LandingPage onLaunch={onLaunch} />;
}

// ─────────────────────────────────────────────
// VOICE ASSISTANT COMPONENT
// ─────────────────────────────────────────────
function VoiceAssistant({ user, onLogout }) {
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
  const [userMood, setUserMood] = useState("neutral");

  const [showGreeting, setShowGreeting] = useState(true);
  const [showQuery, setShowQuery] = useState(false);
  const [ribbonSplit, setRibbonSplit] = useState(false);
  const [greetingText, setGreetingText] = useState("Good day");

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
    const hour = new Date().getHours();
    setGreetingText(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
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

  const endCall = useCallback(() => {
    loopRef.current.isVoiceCall = false; loopRef.current.isBotSpeaking = false; loopRef.current.pendingHangup = false;
    if (loopRef.current.silenceTimer) clearTimeout(loopRef.current.silenceTimer);
    if (micRef.current) { try { micRef.current.stop(); } catch (e) { } }
    if (loopRef.current.audioPlayer) { try { loopRef.current.audioPlayer.pause(); loopRef.current.audioPlayer.currentTime = 0; } catch (e) { } }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPhase(PHASES.IDLE); setCurrentCard(null); setShowQuery(false); setShowGreeting(true); setRibbonSplit(false); setIsCameraMode(false);
  }, []);

  const startSilenceTimer = useCallback(() => {
    if (loopRef.current.silenceTimer) clearTimeout(loopRef.current.silenceTimer);
    loopRef.current.silenceTimer = setTimeout(() => { endCall(); }, 15000);
  }, [endCall]);

  const triggerVoiceContinuation = useCallback(() => {
    loopRef.current.isBotSpeaking = false;
    if (loopRef.current.pendingHangup) { endCall(); } else if (loopRef.current.isVoiceCall) {
      setPhase(PHASES.LISTENING); setCurrentPrompt("Listening..."); setCurrentResponse("");
      if (micRef.current) { try { micRef.current.start(); } catch (e) { } }
      startSilenceTimer();
    }
  }, [endCall, startSilenceTimer]);

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
      setPhase(PHASES.LISTENING); setShowGreeting(false); setRibbonSplit(true); setShowQuery(true); setCurrentPrompt("Listening..."); setCurrentResponse(""); setCurrentCard(null);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (loopRef.current.audioPlayer) { try { loopRef.current.audioPlayer.pause(); loopRef.current.audioPlayer.currentTime = 0; } catch (e) { } }
      try { micRef.current.start(); } catch (e) { }
    }
  };

  const runQuery = async (q) => {
    loopRef.current.isBotSpeaking = true;
    if (loopRef.current.silenceTimer) clearTimeout(loopRef.current.silenceTimer);
    if (micRef.current) { try { micRef.current.abort(); } catch (e) { } }

    if (q && typeof q === 'string') {
      const exitRegex = /\b(okay|ok)?\s*(goodbye|bye|see ya|see you|end conversation|close the chat|close chat|that'?s it|that'?s all|stop listening|stop|exit|cancel|quit|we are done|we'?re done|no more|good night|stop the mic)\b/i;
      if (exitRegex.test(q)) loopRef.current.pendingHangup = true;
    }

    setPhase(PHASES.PROCESSING); setShowGreeting(false); setRibbonSplit(true); setShowQuery(true); setTyping(false); setCurrentPrompt(q); setCurrentResponse("Thinking..."); setCurrentCard(null);

    let finalImage = uploadedImage;

    if (cameraModeRef.current) {
      try {
        const videoElement = document.getElementById("voxa-camera-feed");
        if (videoElement && videoElement.videoWidth) {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 512;
          const scale = MAX_WIDTH / videoElement.videoWidth;
          canvas.width = MAX_WIDTH;
          canvas.height = videoElement.videoHeight * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          finalImage = canvas.toDataURL("image/jpeg", 0.4);
        }
      } catch (err) { console.error("Image capture failed:", err); }
    }

    // Retrieve token from localStorage with private-browsing failsafe
    let currentToken = null;
    try { currentToken = localStorage.getItem('voxa_token'); } catch (e) { /* Private mode */ }

    await streamChatResponse(
      { prompt: q, image: finalImage, voice: selectedVoice, mood: userMood, token: currentToken },
      {
        onStatus: (text) => {
          let cleanStream = text.replace("SYSTEM_DIRECTIVE_DO_NOT_PARAPHRASE: ", "");
          if (cleanStream.includes('||CARD:')) cleanStream = cleanStream.split('||CARD:')[0];
          if (cleanStream.includes('{"league"')) cleanStream = cleanStream.split('{"league"')[0];
          setCurrentResponse(cleanStream);
        },
        onText: (text, card) => {
          setPhase(PHASES.RESPONDING);
          let finalText = text;
          if (!finalText && card) finalText = "Here is the information you requested.";
          setCurrentResponse(finalText);
          setCurrentCard(card);
          setTyping(true);
        },
        onAudio: (audio) => {
          if (!isAppMuted && audio && loopRef.current.audioPlayer) {
            loopRef.current.audioPlayer.src = `data:audio/mpeg;base64,${audio}`;
            loopRef.current.audioPlayer.play().catch(e => { triggerVoiceContinuation(); });
          } else { triggerVoiceContinuation(); }
        },
        onError: (text) => { setPhase(PHASES.RESPONDING); setCurrentResponse(text); triggerVoiceContinuation(); }
      }
    );
  };

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
  const handleAudioEnd = useCallback(() => { setTimeout(() => { triggerVoiceContinuation(); }, 500); }, [triggerVoiceContinuation]);

  return (
    <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", background: "#000", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>
      <GlobalStyles />
      <audio ref={handleAudioRef} style={{ display: "none" }} onEnded={handleAudioEnd} />

      <SpatialCameraWindow isActive={isCameraMode} onClose={() => setIsCameraMode(false)} videoRef={videoRef} onEmotionDetected={setUserMood} onDocumentScanned={(b64) => { setUploadedImage(b64); setIsCameraMode(false); setShowInput(true); }} />

      <ModalManager activeModal={activeModal} setActiveModal={setActiveModal} isDark={isDark} theme={theme} user={user} userName={userName} setUserName={setUserName} selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice} />

      <motion.div animate={{ scale: isAppMuted ? 0.90 : 1, y: isAppMuted ? -15 : 0, opacity: activeModal ? 0.35 : 1, filter: activeModal ? "blur(12px)" : "blur(0px)", borderRadius: isAppMuted ? 44 : 0 }} transition={{ type: "spring", stiffness: 220, damping: 30 }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 10, background: theme.bg, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: isAppMuted ? "none" : "auto" }}>
        {activeModal && <div onClick={() => setActiveModal(null)} style={{ position: "absolute", inset: 0, zIndex: 999, cursor: "pointer", pointerEvents: "auto" }} />}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, background: `radial-gradient(ellipse 80% 60% at 50% 70%, ${theme.radialGlow} 0%, transparent 72%)`, transition: "background 0.7s" }} />

        <WaveCanvas phase={phase} ribbonSplit={effectiveSplit} isAppMuted={isAppMuted} />
        <Navbar theme={theme} isDark={isDark} onToggleTheme={handleToggleTheme} ribbonSplit={effectiveSplit} isAppMuted={isAppMuted} isCameraMode={isCameraMode} onOpenModal={setActiveModal} activeModal={activeModal} onLogout={onLogout} />

        <ChatDisplay theme={theme} showGreeting={showGreeting} isCameraMode={isCameraMode} greetingText={greetingText} userName={userName} handleRandomQuerySelect={handleRandomQuerySelect} showQuery={showQuery} effectiveSplit={effectiveSplit} currentPrompt={currentPrompt} currentResponse={currentResponse} phase={phase} typing={typing} handleTypingDone={handleTypingDone} currentCard={currentCard} />

        <ActionDock theme={theme} showInput={showInput} isCameraMode={isCameraMode} uploadedImage={uploadedImage} setUploadedImage={setUploadedImage} fileInputRef={fileInputRef} handleFileChange={handleFileChange} inputValue={inputValue} setInputValue={setInputValue} handleTextSubmit={handleTextSubmit} setIsDockHovered={setIsDockHovered} isDockExpanded={isDockExpanded} setShowInput={setShowInput} phase={phase} handleOrbTap={handleOrbTap} setIsCameraMode={setIsCameraMode} isAppMuted={isAppMuted} />
      </motion.div>
    </div>
  );
}