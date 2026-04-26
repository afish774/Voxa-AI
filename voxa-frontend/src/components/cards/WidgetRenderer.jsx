import React from 'react';

// ─── Batch 1: Daily Life Suite ───────────────────────────────────────────────
import BriefingWidget from '../cards/BriefingWidget';
import FinanceWidget from '../cards/FinanceWidget';
import FitnessWidget from '../cards/FitnessWidget';
import ForecastWidget from '../cards/ForecastWidget';
import ActionReceiptWidget from '../cards/ActionReceiptWidget';

// ─── Existing Widgets (already integrated in ChatDisplay.jsx) ────────────────
// Weather, Sports, Crypto, NasaApod are rendered directly in ChatDisplay.jsx
// They will be migrated here in a future cleanup pass.

// ─── Batch 2: Travel & Global Suite ─────────────────────────────────────────
import FlightWidget from '../cards/FlightWidget';
import CurrencyWidget from '../cards/CurrencyWidget';
import TranslateWidget from '../cards/TranslateWidget';
import TimezoneWidget from '../cards/TimezoneWidget';

// ─── Batch 3: Intelligence & Utility Suite ──────────────────────────────────
import NewsWidget from '../cards/NewsWidget';
import MovieWidget from '../cards/MovieWidget';
import RecipeWidget from '../cards/RecipeWidget';
import StockWidget from '../cards/StockWidget';
import MedicineWidget from '../cards/MedicineWidget';
import CountdownWidget from '../cards/CountdownWidget';
import CalculatorWidget from '../cards/CalculatorWidget';
import SearchWidget from '../cards/SearchWidget';

// ============================================================================
// 🎨 WidgetRenderer — Master Card Router (All 17 Types Active)
// ============================================================================
// Central switchboard that maps card.type to the correct premium React widget.
// Usage: <WidgetRenderer card={currentCard} />
// ============================================================================

const WidgetRenderer = ({ card }) => {
  if (!card || !card.type) return null;

  // 📱 RESPONSIVE FIX: Fluid container wrapper — enforces w-full + overflow-hidden
  // to prevent any child widget from causing horizontal scroll on mobile devices.
  // All individual widgets use max-w constraints internally (e.g., max-w-[460px]).
  const widget = (() => {
    switch (card.type) {
      // ── Batch 1: Daily Life Suite ──────────────────────────────────────────
      case 'briefing':
        return <BriefingWidget key="briefing-card" data={card} />;
      case 'finance':
        return <FinanceWidget key="finance-card" data={card} />;
      case 'fitness':
        return <FitnessWidget key="fitness-card" data={card} />;
      case 'forecast':
        return <ForecastWidget key="forecast-card" data={card} />;
      case 'receipt':
        return <ActionReceiptWidget key="receipt-card" data={card} />;

      // ── Batch 2: Travel & Global Suite ─────────────────────────────────────
      case 'flight':
        return <FlightWidget key="flight-card" data={card} />;
      case 'currency':
        return <CurrencyWidget key="currency-card" data={card} />;
      case 'translate':
        return <TranslateWidget key="translate-card" data={card} />;
      case 'timezone':
        return <TimezoneWidget key="timezone-card" data={card} />;

      // ── Batch 3: Intelligence & Utility Suite ──────────────────────────────
      case 'news':
        return <NewsWidget key="news-card" data={card} />;
      case 'movie':
        return <MovieWidget key="movie-card" data={card} />;
      case 'recipe':
        return <RecipeWidget key="recipe-card" data={card} />;
      case 'stock':
        return <StockWidget key="stock-card" data={card} />;
      case 'medicine':
        return <MedicineWidget key="medicine-card" data={card} />;
      case 'countdown':
        return <CountdownWidget key="countdown-card" data={card} />;
      case 'calculator':
        return <CalculatorWidget key="calculator-card" data={card} />;
      case 'search':
        return <SearchWidget key="search-card" data={card} />;

      default:
        return null;
    }
  })();

  if (!widget) return null;

  // 📱 RESPONSIVE FIX: Fluid wrapper ensures no widget overflows its parent
  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden',
      overflowY: 'visible',
    }}>
      {widget}
    </div>
  );
};

export default WidgetRenderer;
