import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';
import VoiceAssistant from './App'; // 🚀 FIXED: Pointing back to App.jsx

function Root() {
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);

  // ─────────────────────────────────────────────
  // 1. HANDLE BROWSER "UNDO/BACK" BUTTON
  // ─────────────────────────────────────────────
  useEffect(() => {
    const handlePopState = (event) => {
      // When the user clicks the browser's back arrow, read the history state
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
      } else {
        setCurrentView('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ─────────────────────────────────────────────
  // 2. FIX THE "REFRESH AMNESIA" BUG
  // ─────────────────────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem('voxa_session');

    if (storedUser) {
      // If they refresh and are logged in, restore data AND jump to the app
      setUser(JSON.parse(storedUser));
      setCurrentView('app');
      window.history.replaceState({ view: 'app' }, '', '/app');
    } else {
      // Otherwise, keep them on the landing page
      window.history.replaceState({ view: 'landing' }, '', '/');
    }
  }, []);

  // ─────────────────────────────────────────────
  // SMART ROUTING CONTROLLER
  // ─────────────────────────────────────────────
  const navigateTo = (view) => {
    setCurrentView(view);

    // Change the browser URL so the Back button works logically
    let path = '/';
    if (view === 'auth') path = '/login';
    if (view === 'app') path = '/app';

    window.history.pushState({ view }, '', path);
  };

  const handleAuthSuccess = (userData) => {
    localStorage.setItem('voxa_session', JSON.stringify(userData));
    setUser(userData);
    navigateTo('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('voxa_session');
    setUser(null);
    navigateTo('landing');
  };

  const handleLaunch = () => {
    if (user) {
      navigateTo('app'); // Skip login if already authenticated
    } else {
      navigateTo('auth');
    }
  };

  return (
    <React.StrictMode>
      {currentView === 'landing' && (
        <LandingPage onLaunch={handleLaunch} />
      )}

      {currentView === 'auth' && (
        <AuthPage
          onBack={() => navigateTo('landing')}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {currentView === 'app' && (
        <VoiceAssistant
          user={user}
          onLogout={handleLogout}
        />
      )}
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);