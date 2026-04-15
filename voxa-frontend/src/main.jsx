import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ TITANIUM AUTH — MODULE-LEVEL SYNCHRONOUS BOOT SEQUENCE
// ═══════════════════════════════════════════════════════════════════════════════
// This code runs at IMPORT TIME — before React mounts, before any component,
// hook, or useEffect fires. It guarantees the auth state is fully resolved
// before the first render cycle begins.
// ═══════════════════════════════════════════════════════════════════════════════

let __bootUser = null;
let __bootToken = null;
let __bootError = null;

(function titaniumBoot() {
  // ── STAGE 1: Check URL params for an OAuth redirect ──
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  const urlUser = params.get('user');
  const urlError = params.get('error');

  if (urlError) {
    __bootError = urlError.replace(/_/g, ' ');
  }

  if (urlToken && urlUser) {
    // ── STAGE 2: Multi-stage decoding chain ──
    let decoded = null;

    // Step 2a: Base64 decode
    try {
      decoded = atob(urlUser);
    } catch (e) {
      console.error('🛡️ Titanium Boot: Base64 decode failed:', e);
    }

    // Step 2b: decodeURIComponent (handles any percent-encoding remnants)
    if (decoded) {
      try {
        decoded = decodeURIComponent(decoded);
      } catch (e) {
        // If decodeURIComponent fails, the raw Base64 output is still valid JSON
        console.warn('🛡️ Titanium Boot: decodeURIComponent pass-through (non-fatal):', e);
      }
    }

    // Step 2c: JSON.parse
    if (decoded) {
      try {
        const parsedUser = JSON.parse(decoded);
        __bootUser = parsedUser;
        __bootToken = urlToken;

        // ── STAGE 3: Persist to localStorage ──
        try { localStorage.setItem('voxa_token', urlToken); } catch (e) { /* Private mode */ }
        try { localStorage.setItem('voxa_user', JSON.stringify(parsedUser)); } catch (e) { /* Private mode */ }
      } catch (e) {
        console.error('🛡️ Titanium Boot: JSON.parse failed:', e);
      }
    }

    // ── STAGE 4: Scrub URL (remove tokens from browser address bar) ──
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) { /* Edge case: sandboxed iframe */ }
  }

  // ── STAGE 5: If no OAuth redirect, try restoring from localStorage ──
  if (!__bootUser) {
    try {
      const savedUser = localStorage.getItem('voxa_user');
      const savedToken = localStorage.getItem('voxa_token');
      if (savedUser && savedToken) {
        __bootUser = JSON.parse(savedUser);
        __bootToken = savedToken;
      }
    } catch (e) {
      // Private browsing OR corrupted data — continue gracefully
      console.warn('🛡️ Titanium Boot: localStorage restore failed (non-fatal):', e);
    }
  }
})();

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT — Single source of truth for view routing
// ═══════════════════════════════════════════════════════════════════════════════

function Root() {
  // The initial state is computed SYNCHRONOUSLY from the boot sequence above.
  // No useEffect, no useLayoutEffect, no async delay. First render is correct.
  const [user, setUser] = useState(__bootUser);
  const [showAuth, setShowAuth] = useState(false);
  const [isInitializing, setIsInitializing] = useState(() => {
    // Show the boot error alert synchronously if one occurred
    if (__bootError) {
      // We use setTimeout(0) ONLY for the alert — state itself is already resolved
      setTimeout(() => alert(`Login Failed: ${__bootError}. Please check the backend logs.`), 0);
    }
    // Initialization is already complete — the module-level boot did all the work.
    return false;
  });

  const handleAuthSuccess = useCallback((userData) => {
    try { localStorage.setItem('voxa_user', JSON.stringify(userData)); } catch (e) { /* Private mode */ }
    // Token is already stored by AuthPage on email/password login
    setUser(userData);
    setShowAuth(false);
  }, []);

  const handleLogout = useCallback(() => {
    try { localStorage.removeItem('voxa_token'); } catch (e) { /* Private mode */ }
    try { localStorage.removeItem('voxa_user'); } catch (e) { /* Private mode */ }
    setUser(null);
    setShowAuth(false);
  }, []);

  const handleLaunch = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleBack = useCallback(() => {
    setShowAuth(false);
  }, []);

  // ─── INITIALIZATION LOCK: Nothing renders until boot completes ───
  if (isInitializing) {
    return (
      <div style={{ height: '100dvh', width: '100vw', backgroundColor: '#05050a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(124, 58, 237, 0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── DETERMINISTIC ROUTING: Clean conditional rendering ───
  return (
    <React.StrictMode>
      <App
        user={user}
        showAuth={showAuth}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        onLaunch={handleLaunch}
        onBack={handleBack}
      />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);