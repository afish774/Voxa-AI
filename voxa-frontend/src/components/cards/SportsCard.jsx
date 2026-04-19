import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// NATIONAL FLAG CODES — Source 1: flagcdn.com (free, no API key)
// ═══════════════════════════════════════════════════════════════════
const nationalFlagCodes = {
  'Pakistan': 'pk',
  'India': 'in',
  'Australia': 'au',
  'England': 'gb-eng',
  'Portugal': 'pt',
  'Turkey': 'tr',
  'Brazil': 'br',
  'Argentina': 'ar',
  'France': 'fr',
  'Germany': 'de',
  'Spain': 'es',
  'Netherlands': 'nl',
  'Italy': 'it',
  'Croatia': 'hr',
  'Belgium': 'be',
  'Uruguay': 'uy',
  'Mexico': 'mx',
  'USA': 'us',
  'Japan': 'jp',
  'South Korea': 'kr',
  'South Africa': 'za',
  'New Zealand': 'nz',
  'Sri Lanka': 'lk',
  'Bangladesh': 'bd',
  'Afghanistan': 'af',
  'Ireland': 'ie',
  'Zimbabwe': 'zw',
  'Scotland': 'gb-sct',
  'Wales': 'gb-wls',
  'UAE': 'ae',
  'Nepal': 'np',
  'Oman': 'om',
  'Namibia': 'na',
};

// ═══════════════════════════════════════════════════════════════════
// CLUB LOGO URLS — Source 2: Wikipedia Commons (official crests)
// ═══════════════════════════════════════════════════════════════════
const clubLogoUrls = {
  // IPL
  'Mumbai Indians': 'https://upload.wikimedia.org/wikipedia/en/c/cd/Mumbai_Indians_Logo.svg',
  'Chennai Super Kings': 'https://upload.wikimedia.org/wikipedia/en/2/2b/Chennai_Super_Kings_Logo.svg',
  'Royal Challengers Bangalore': 'https://upload.wikimedia.org/wikipedia/en/d/d4/Royal_Challengers_Bengaluru_Logo.svg',
  'Kolkata Knight Riders': 'https://upload.wikimedia.org/wikipedia/en/4/4c/Kolkata_Knight_Riders_Logo.svg',
  'Delhi Capitals': 'https://upload.wikimedia.org/wikipedia/en/2/2f/Delhi_Capitals.svg',
  'Sunrisers Hyderabad': 'https://upload.wikimedia.org/wikipedia/en/5/51/Sunrisers_Hyderabad_Logo.svg',
  'Rajasthan Royals': 'https://upload.wikimedia.org/wikipedia/en/5/5c/This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg',
  'Punjab Kings': 'https://upload.wikimedia.org/wikipedia/en/d/d4/Punjab_Kings_Logo.svg',
  'Lucknow Super Giants': 'https://upload.wikimedia.org/wikipedia/en/3/34/Lucknow_Super_Giants_Logo.svg',
  'Gujarat Titans': 'https://upload.wikimedia.org/wikipedia/en/0/09/Gujarat_Titans_Logo.svg',
  // Premier League
  'Arsenal': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  'Chelsea': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'Manchester City': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'Manchester United': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  'Liverpool': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  'Tottenham': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  'Newcastle United': 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
  'Aston Villa': 'https://upload.wikimedia.org/wikipedia/en/9/9a/Aston_Villa_FC_new_crest.svg',
  'West Ham': 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg',
  'Everton': 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg',
  'Wolves': 'https://upload.wikimedia.org/wikipedia/en/c/c9/Wolverhampton_Wanderers_FC_crest.svg',
  'Burnley': 'https://upload.wikimedia.org/wikipedia/en/6/6d/Burnley_FC_Logo.svg',
  'Nottm Forest': 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg',
  'Leeds': 'https://upload.wikimedia.org/wikipedia/en/5/54/Leeds_United_F.C._logo.svg',
  'Crystal Palace': 'https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg',
  'Fulham': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg',
  'Sunderland': 'https://upload.wikimedia.org/wikipedia/en/7/77/Logo_Sunderland.svg',
  'Brighton': 'https://upload.wikimedia.org/wikipedia/en/d/d0/Brighton_and_Hove_Albion_FC_crest.svg',
  'Bournemouth': 'https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg',
  'Brentford': 'https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg',
  // La Liga
  'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'Barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'Atletico Madrid': 'https://upload.wikimedia.org/wikipedia/en/f/f9/Atletico_Madrid_Logo_2024.svg',
  'Villarreal': 'https://upload.wikimedia.org/wikipedia/en/b/b9/Villarreal_CF_logo-en.svg',
  'Real Betis': 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg',
  'Celta Vigo': 'https://upload.wikimedia.org/wikipedia/en/1/12/RC_Celta_de_Vigo_logo.svg',
  'Real Sociedad': 'https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg',
  'Getafe': 'https://upload.wikimedia.org/wikipedia/en/4/46/Getafe_logo.svg',
  'Osasuna': 'https://upload.wikimedia.org/wikipedia/en/3/38/CA_Osasuna_2024_crest.svg',
  'Espanyol': 'https://upload.wikimedia.org/wikipedia/en/9/92/RCD_Espanyol_crest.svg',
  'Girona': 'https://upload.wikimedia.org/wikipedia/en/f/f7/Girona_FC_Logo.svg',
  'Athletic Club': 'https://upload.wikimedia.org/wikipedia/en/9/98/Club_Athletic_Bilbao_logo.svg',
  'Rayo Vellecano': 'https://upload.wikimedia.org/wikipedia/en/d/d8/Rayo_Vallecano_logo.svg',
  'Valencia': 'https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg',
  'Mallorca': 'https://upload.wikimedia.org/wikipedia/en/e/e0/Rcd_mallorca.svg',
  'Sevilla': 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg',
  'Alavés': 'https://upload.wikimedia.org/wikipedia/en/f/f8/Deportivo_Alaves_logo_%282020%29.svg',
  'Elche': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Elche_CF_logo.svg',
  'Levante': 'https://upload.wikimedia.org/wikipedia/en/7/7b/Levante_Uni%C3%B3n_Deportiva%2C_S.A.D._logo.svg',
  'Real Oviedo': 'https://upload.wikimedia.org/wikipedia/en/6/6e/Real_Oviedo_logo.svg',
  // Bundesliga
  'Bayern Munich': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg',
  'Borussia Dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'RB Leipzig': 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg',
  'VfB Stuttgart': 'https://upload.wikimedia.org/wikipedia/commons/e/eb/VfB_Stuttgart_1893_Logo.svg',
  'Hoffenheim': 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Logo_TSG_Hoffenheim.svg',
  'Leverkusen': 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  'Eintracht Frankfurt': 'https://upload.wikimedia.org/wikipedia/en/7/7e/Eintracht_Frankfurt_crest.svg',
  'SC Freiburg': 'https://upload.wikimedia.org/wikipedia/en/6/6d/SC_Freiburg_logo.svg',
  'Augsburg': 'https://upload.wikimedia.org/wikipedia/en/c/c5/FC_Augsburg_logo.svg',
  'Mainz': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/1._FSV_Mainz_05_logo.svg',
  'Union Berlin': 'https://upload.wikimedia.org/wikipedia/commons/4/44/1._FC_Union_Berlin_Logo.svg',
  'Köln': 'https://upload.wikimedia.org/wikipedia/commons/0/01/1._FC_Koeln_Logo_2014%E2%80%93.svg',
  'Hamburg': 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Hamburger_SV_logo.svg',
  'Werder': 'https://upload.wikimedia.org/wikipedia/commons/b/be/SV-Werder-Bremen-Logo.svg',
  'Mönchengladbach': 'https://upload.wikimedia.org/wikipedia/commons/8/81/Borussia_M%C3%B6nchengladbach_logo.svg',
  'St. Pauli': 'https://upload.wikimedia.org/wikipedia/en/8/8f/FC_St._Pauli_logo_%282018%29.svg',
  'Wolfsburg': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/VfL_Wolfsburg_Logo.svg',
  'Heidenheim': 'https://en.wikipedia.org/wiki/1._FC_Heidenheim',
  // Serie A
  'Juventus': 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg',
  'AC Milan': 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  'Inter Milan': 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  'Napoli': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/SSC_Napoli_2025_%28white_and_azure%29.svg',
  'Como': 'https://upload.wikimedia.org/wikipedia/commons/9/99/Calcio_Como_-_logo_%28Italy%2C_2019-%29.svg',
  'Roma': 'https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg',
  'Atalanta': 'https://upload.wikimedia.org/wikipedia/en/6/66/AtalantaBC.svg',
  'Bologna': 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Bologna_F.C._1909_logo.svg',
  'Lazio': 'https://upload.wikimedia.org/wikipedia/en/c/ce/S.S._Lazio_badge.svg',
  'Sassuolo': 'https://upload.wikimedia.org/wikipedia/en/1/1c/US_Sassuolo_Calcio_logo.svg',
  'Udinese': 'https://upload.wikimedia.org/wikipedia/it/a/ae/Logo_Udinese_Calcio_2010.svg',
  'Torino': 'https://upload.wikimedia.org/wikipedia/en/2/2e/Torino_FC_Logo.svg',
  'Parma': 'https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_Parma_Calcio_1913_%28adozione_2016%29.svg',
  'Genoa': 'https://upload.wikimedia.org/wikipedia/en/2/2c/Genoa_CFC_crest.svg',
  'Fiorentina': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/ACF_Fiorentina_-_logo_%28Italy%2C_2022%29.svg',
  'Cagliari': 'https://upload.wikimedia.org/wikipedia/en/6/61/Cagliari_Calcio_1920.svg',
  'Cremonese': 'https://upload.wikimedia.org/wikipedia/en/e/e1/US_Cremonese_logo.svg',
  'Lecce': 'https://upload.wikimedia.org/wikipedia/en/2/23/US_Lecce_crest.svg',
  'Verona': 'https://upload.wikimedia.org/wikipedia/en/9/92/Hellas_Verona_FC_logo_%282020%29.svg',
  'Pisa': 'https://upload.wikimedia.org/wikipedia/en/6/6b/Pisa_SC_crest.svg',
  // Ligue 1
  'PSG': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  'Lens': 'https://upload.wikimedia.org/wikipedia/en/c/cc/RC_Lens_logo.svg',
  'LOSC': 'https://upload.wikimedia.org/wikipedia/en/3/3f/Lille_OSC_2018_logo.svg',
  'Marseille': 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Olympique_de_Marseille_2026_logo.svg',
  'Lyon': 'https://upload.wikimedia.org/wikipedia/en/1/1c/Olympique_Lyonnais_logo.svg',
  'Rennais': 'https://upload.wikimedia.org/wikipedia/en/9/9e/Stade_Rennais_FC.svg',
  'Monaco': 'https://upload.wikimedia.org/wikipedia/en/c/cf/LogoASMonacoFC2021.svg',
  'Strasbourg': 'https://upload.wikimedia.org/wikipedia/en/8/80/Racing_Club_de_Strasbourg_logo.svg',
  'Lorient': 'https://upload.wikimedia.org/wikipedia/en/4/4c/FC_Lorient_logo.svg',
  'Toulouse ': 'https://upload.wikimedia.org/wikipedia/en/6/63/Toulouse_FC_2018_logo.svg',
  'Brest': 'https://upload.wikimedia.org/wikipedia/en/6/63/Toulouse_FC_2018_logo.svg',
  'Paris FC': 'https://upload.wikimedia.org/wikipedia/en/9/9f/Paris_FC_logo.svg',
  'Angers ': 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Angers_Sporting_Club_de_l%27Ouest_logo.svg',
  'Le Havre': 'https://upload.wikimedia.org/wikipedia/en/f/fc/Le_Havre_AC_logo.svg',
  'Nice': 'https://upload.wikimedia.org/wikipedia/en/2/2e/OGC_Nice_logo.svg',
  'Auxerre': 'https://upload.wikimedia.org/wikipedia/en/5/51/AJAuxerreLogo.svg',
  'Nantes': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Logo_FC_Nantes_%28avec_fond%29_-_2019.svg',
  'Metz': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/FC_Metz_2021_Logo.svg',
  // Cricket
  'West Indies': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Cricket_West_Indies_Logo_2017.svg',
  'England': 'https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg',
  'Australia': 'https://upload.wikimedia.org/wikipedia/commons/8/88/Flag_of_Australia_%28converted%29.svg',
  'South Africa': 'https://upload.wikimedia.org/wikipedia/commons/a/af/Flag_of_South_Africa.svg',
  'New Zealand': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Flag_of_New_Zealand.svg',
  'India': 'https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg',
  'Pakistan': 'https://upload.wikimedia.org/wikipedia/commons/3/32/Flag_of_Pakistan.svg',
  'Sri Lanka': 'https://upload.wikimedia.org/wikipedia/commons/1/11/Flag_of_Sri_Lanka.svg',
  'Zimbabwe': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Flag_of_Zimbabwe.svg',
  'Bangladesh': 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Flag_of_Bangladesh.svg',
  'Afganistan': 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Flag_of_Afghanistan_%282013%E2%80%932021%29.svg',
  'Ireland': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Ireland_cricket_logo.svg',
};

// ⚽ LOGO FIX: Robust team name normalizer for fuzzy matching against clubLogoUrls
// The Football-Data.org API returns formal names like "Manchester United FC",
// "Real Madrid CF", "AFC Bournemouth" which don't match our dictionary keys.
const normalizeTeamName = (name) => {
  if (!name) return '';
  return name
    .replace(/\b(FC|CF|AFC|SC|SL|FK|SK|BVB|BSC|SSC|AS|US|SS|1\.\s*FC|1\.\s*FSV)\b/gi, '')
    .replace(/\b(Football Club|Club de Fútbol|Calcio|Associazione)\b/gi, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

// ⚽ LOGO FIX: Fuzzy lookup — normalize both the input name and every dictionary key,
// then check for partial substring matches in both directions.
const findClubLogoUrl = (teamName) => {
  if (!teamName) return null;
  const normalized = normalizeTeamName(teamName);

  // Pass 1: Exact match on raw key
  if (clubLogoUrls[teamName]) return clubLogoUrls[teamName];

  // Pass 2: Normalized exact match
  for (const key of Object.keys(clubLogoUrls)) {
    if (normalizeTeamName(key) === normalized) return clubLogoUrls[key];
  }

  // Pass 3: Partial substring match (handles "Manchester United FC" → "Manchester United")
  for (const key of Object.keys(clubLogoUrls)) {
    const normKey = normalizeTeamName(key);
    if (normKey.length > 3 && (normalized.includes(normKey) || normKey.includes(normalized))) {
      return clubLogoUrls[key];
    }
  }

  return null;
};

// ═══════════════════════════════════════════════════════════════════
// getTeamLogo — Three-source waterfall (flags → clubs → SVG shield)
// ═══════════════════════════════════════════════════════════════════
const getTeamLogo = (teamName) => {
  if (!teamName) return null;

  // Source 1: National flags via flagcdn.com — rendered as a circle
  if (nationalFlagCodes[teamName]) {
    return (
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-zinc-800 flex-shrink-0">
        <img
          src={`https://flagcdn.com/w80/${nationalFlagCodes[teamName]}.png`}
          alt={teamName}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
    );
  }

  // ⚽ LOGO FIX: Use fuzzy matching instead of exact key lookup
  const logoUrl = findClubLogoUrl(teamName);
  if (logoUrl) {
    return (
      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 bg-white p-1 flex-shrink-0">
        <img
          src={logoUrl}
          alt={teamName}
          className="w-full h-full object-contain"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
    );
  }

  // Source 3: Fallback heraldic SVG shield (Rule C — camelCase attributes only)
  const hue = teamName.charCodeAt(0) * 7 % 360;
  return (
    <svg width={48} height={48} viewBox="0 0 48 48" className="flex-shrink-0">
      <path
        d="M24 3 L44 11 L44 28 C44 39 24 46 24 46 C24 46 4 39 4 28 L4 11 Z"
        fill={`hsl(${hue}, 55%, 28%)`}
        stroke={`hsl(${hue}, 55%, 48%)`}
        strokeWidth={1.5}
      />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fill="white"
        fontSize={18}
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {teamName[0].toUpperCase()}
      </text>
    </svg>
  );
};


// ═══════════════════════════════════════════════════════════════════
// FootballCard — Dark two-zone layout with gradient separator
// ═══════════════════════════════════════════════════════════════════
const FootballCard = ({ data }) => {
  const matchSec = data.matchSeconds || 0;
  const mins = Math.floor(matchSec / 60).toString().padStart(2, '0');
  const secs = (matchSec % 60).toString().padStart(2, '0');
  const timer = `${mins}:${secs}`;

  const scoreA = data.teamA?.score ?? 0;
  const scoreB = data.teamB?.score ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-zinc-950 rounded-3xl overflow-hidden w-full max-w-md"
      style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)' }}
    >
      {/* ─── Zone 1: League Banner ─── */}
      <div className="bg-zinc-900 px-4 py-4 flex flex-col items-center">
        <span className="text-white font-bold text-sm tracking-wide text-center">
          {data.league}
        </span>
      </div>

      {/* Green/Red gradient separator line */}
      <div
        className="h-px w-full"
        style={{
          background: 'linear-gradient(to right, transparent, rgba(16,185,129,0.6) 35%, rgba(239,68,68,0.6) 65%, transparent)',
        }}
      />

      {/* ─── Zone 2: Scoreboard ─── */}
      <div className="bg-zinc-950 px-6 py-5">
        {/* Timer pill */}
        <div className="flex justify-center mb-4">
          <div className="bg-zinc-800 rounded-full px-4 py-1">
            <span className="text-white font-mono text-sm tabular-nums tracking-widest">
              {timer}
            </span>
          </div>
        </div>

        {/* Score row: Team A | Score | Team B */}
        <div className="flex items-center justify-between">
          {/* Team A */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {getTeamLogo(data.teamA?.name)}
            <span
              className={
                scoreA > scoreB
                  ? 'text-white font-medium text-sm'
                  : scoreA === scoreB
                    ? 'text-white font-medium text-sm'
                    : 'text-white/40 font-medium text-sm'
              }
            >
              {data.teamA?.code || data.teamA?.name}
            </span>
          </div>

          {/* Center score */}
          <div className="flex items-center gap-2 px-4">
            <span className="text-5xl font-bold text-white tabular-nums">{scoreA}</span>
            <span className="text-3xl font-light text-white/40">:</span>
            <span className="text-5xl font-bold text-white tabular-nums">{scoreB}</span>
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {getTeamLogo(data.teamB?.name)}
            <span
              className={
                scoreB > scoreA
                  ? 'text-white font-medium text-sm'
                  : scoreB === scoreA
                    ? 'text-white font-medium text-sm'
                    : 'text-white/40 font-medium text-sm'
              }
            >
              {data.teamB?.code || data.teamB?.name}
            </span>
          </div>
        </div>

        {/* Live indicator (emerald green for football) */}
        {data.isLive && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full bg-emerald-500"
            />
            <span className="text-emerald-400 text-xs font-semibold">Live</span>
          </div>
        )}

        {/* Venue */}
        {data.venue && (
          <p className="text-zinc-500 text-xs text-center mt-2">{data.venue}</p>
        )}

        {/* Status (if not live — e.g. "1st Half") */}
        {data.status && !data.isLive && (
          <p className="text-zinc-500 text-xs text-center mt-2">{data.status}</p>
        )}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// CricketCard — Light blue gradient (only light-themed component)
// ═══════════════════════════════════════════════════════════════════
const CricketCard = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="bg-gradient-to-br from-blue-300/90 via-blue-400/80 to-purple-400/70 backdrop-blur-xl rounded-3xl p-5 relative overflow-hidden border border-white/30 w-full max-w-md"
      style={{ boxShadow: '0 20px 40px -12px rgba(96, 165, 250, 0.25)' }}
    >
      {/* ─── Top Row: Live Pill + Arrow Button ─── */}
      <div className="flex items-center justify-between mb-3">
        {data.isLive ? (
          <div className="bg-red-500 text-white rounded-full px-3 py-1 flex items-center gap-2 text-sm font-semibold">
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full bg-white"
            />
            Live
          </div>
        ) : (
          <div />
        )}
        <div className="bg-blue-400/50 rounded-full p-2">
          <ArrowUpRight className="w-4 h-4 text-slate-700" />
        </div>
      </div>

      {/* ─── League Title ─── */}
      <p className="text-slate-800 font-medium text-sm mb-4">{data.league}</p>

      {/* ─── Batting Team Row (full brightness — active team) ─── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getTeamLogo(data.battingTeam)}
        </div>
        <span className="text-slate-900 font-bold text-2xl">
          {data.battingScore}
          {data.battingOvers && (
            <span className="text-slate-600 font-normal text-base"> ({data.battingOvers})</span>
          )}
        </span>
      </div>

      {/* ─── Bowling Team Row (faded — secondary team) ─── */}
      <div className="opacity-60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getTeamLogo(data.bowlingTeam)}
          </div>
          <span className="text-slate-900 font-bold text-2xl">
            {data.bowlingScore || '-'}
            {data.bowlingOvers && (
              <span className="text-slate-600 font-normal text-base"> ({data.bowlingOvers})</span>
            )}
          </span>
        </div>
      </div>

      {/* ─── Status + CRR ─── */}
      <div className="mt-3">
        {data.status && (
          <p className="text-slate-800 font-medium text-sm">{data.status}</p>
        )}
        {data.crr !== undefined && data.crr !== null && (
          <p className="text-slate-600 text-xs mt-1">
            CRR: {typeof data.crr === 'number' ? data.crr.toFixed(2) : data.crr}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SportsCard — Pure router component (no UI logic, just field check)
// ═══════════════════════════════════════════════════════════════════
const SportsCard = ({ data }) => {
  if (data?.teamA) return <FootballCard data={data} />;
  if (data?.battingTeam) return <CricketCard data={data} />;
  return null;
};

export default SportsCard;