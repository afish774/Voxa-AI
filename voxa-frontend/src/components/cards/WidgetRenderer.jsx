import React from 'react';

// ─── Batch 1: Daily Life & Utilities ─────────────────────────────────────────
import BriefingWidget from '../cards/BriefingWidget';
import FinanceWidget from '../cards/FinanceWidget';
import FitnessWidget from '../cards/FitnessWidget';
import ActionReceiptWidget from '../cards/ActionReceiptWidget';
import CountdownWidget from '../cards/CountdownWidget';
import CalculatorWidget from '../cards/CalculatorWidget';
import CalendarWidget from '../cards/CalendarWidget';

// ─── Batch 2: Weather & Environment ──────────────────────────────────────────
import WeatherWidget from '../cards/WeatherWidget';
import ForecastWidget from '../cards/ForecastWidget';
import NasaApodCard from '../cards/NasaApodCard';

// ─── Batch 3: Travel, Location & Global ──────────────────────────────────────
import FlightWidget from '../cards/FlightWidget';
import CurrencyWidget from '../cards/CurrencyWidget';
import TranslateWidget from '../cards/TranslateWidget';
import TimezoneWidget from '../cards/TimezoneWidget';
import PlacesWidget from '../cards/PlacesWidget';

// ─── Batch 4: Media, News & Culture ──────────────────────────────────────────
import NewsWidget from '../cards/NewsWidget';
import MovieWidget from '../cards/MovieWidget';
import RecipeWidget from '../cards/RecipeWidget';
import MusicWidget from '../cards/MusicWidget';
import ImageWidget from '../cards/ImageWidget';

// ─── Batch 5: Markets & Live Data ────────────────────────────────────────────
import StockWidget from '../cards/StockWidget';
import CryptoCard from '../cards/CryptoCard';
import SportsCard from '../cards/SportsCard';
import SearchWidget from '../cards/SearchWidget';

// ============================================================================
// 🎨 WidgetRenderer — Master Card Router (All 24 Types Active)
// ============================================================================
// Central switchboard that maps card.type to the correct premium React widget.
// Usage: <WidgetRenderer card={currentCard} />
// ============================================================================

const WidgetRenderer = ({ card }) => {
  if (!card || !card.type) return null;

  // 📱 RESPONSIVE FIX: Fluid container wrapper — enforces w-full + overflow-hidden
  // to prevent any child widget from causing horizontal scroll on mobile devices.
  const widget = (() => {
    switch (card.type.toLowerCase()) {

      // ── Daily Life & Utilities ──
      case 'briefing': return <BriefingWidget key="briefing-card" data={card} />;
      case 'finance': return <FinanceWidget key="finance-card" data={card} />;
      case 'fitness': return <FitnessWidget key="fitness-card" data={card} />;
      case 'receipt': return <ActionReceiptWidget key="receipt-card" data={card} />;
      case 'countdown': return <CountdownWidget key="countdown-card" data={card} />;
      case 'calculator': return <CalculatorWidget key="calculator-card" data={card} />;
      case 'calendar': return <CalendarWidget key="calendar-card" data={card} />;

      // ── Weather & Environment ──
      case 'weather': return <WeatherWidget key="weather-card" data={card} />;
      case 'forecast': return <ForecastWidget key="forecast-card" data={card} />;
      case 'apod':
      case 'nasa': return <NasaApodCard key="nasa-card" data={card} />;

      // ── Travel, Location & Global ──
      case 'flight': return <FlightWidget key="flight-card" data={card} />;
      case 'currency': return <CurrencyWidget key="currency-card" data={card} />;
      case 'translate': return <TranslateWidget key="translate-card" data={card} />;
      case 'timezone': return <TimezoneWidget key="timezone-card" data={card} />;
      case 'places': return <PlacesWidget key="places-card" data={card} />;

      // ── Media, News & Culture ──
      case 'news': return <NewsWidget key="news-card" data={card} />;
      case 'movie': return <MovieWidget key="movie-card" data={card} />;
      case 'recipe': return <RecipeWidget key="recipe-card" data={card} />;
      case 'music': return <MusicWidget key="music-card" data={card} />;
      case 'image': return <ImageWidget key="image-card" data={card} />;

      // ── Markets & Live Data ──
      case 'stock': return <StockWidget key="stock-card" data={card} />;
      case 'crypto': return <CryptoCard key="crypto-card" {...card} />; // Note: CryptoCard uses destructured props usually, adjust if data={card} is needed
      case 'sports': return <SportsCard key="sports-card" data={card} />;
      case 'search': return <SearchWidget key="search-card" data={card} />;

      default:
        console.warn(`[WidgetRenderer] Unhandled card type: ${card.type}`);
        return null;
    }
  })();

  if (!widget) return null;

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