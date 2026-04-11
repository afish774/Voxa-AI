import React from 'react';

export default function GlobalStyles() {
    return (
        <style>{`
      html, body { margin: 0; padding: 0; background: #000; overscroll-behavior-y: none; }
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      ::-webkit-scrollbar { display: none; }
      button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid #7c3aed; outline-offset: 2px; }
      input:focus, textarea:focus { border-color: rgba(124,58,237,0.5) !important; }
      input::placeholder, textarea::placeholder { color: rgba(140,140,160,0.45); }
      @keyframes blinkCursor { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes dotBeat { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
      .query-slider-container { margin-top: 6px; height: 32px; }
      @media (max-aspect-ratio: 3/4), (max-width: 600px) { .query-slider-container { margin-top: 12vh; height: 48px; } }
    `}</style>
    );
}