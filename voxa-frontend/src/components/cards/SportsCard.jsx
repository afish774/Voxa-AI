import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

/* =========================================================
   0. DATA NORMALIZER (🚀 INDESTRUCTIBLE JSON PARSER)
========================================================= */

const getV = (data, keys) => {
    if (!data) return null;
    const normData = {};
    for (const [k, v] of Object.entries(data)) {
        normData[k.toLowerCase().replace(/[\s\-_]/g, '')] = v;
    }
    for (const k of keys) {
        const val = normData[k.toLowerCase()];
        if (val !== undefined && val !== null && val !== 'null' && val !== '') {
            return val;
        }
    }
    return null;
};

/* =========================================================
   1. CONSTANTS & LEAGUE MAPPING
========================================================= */

const LEAGUE_MAP = {
    ipl: 'cricket', bbl: 'cricket', psl: 'cricket', cpl: 'cricket', t20wc: 'cricket', t20: 'cricket', odi: 'cricket', test: 'cricket', cricket: 'cricket',
    epl: 'football', laliga: 'football', bundesliga: 'football', seriea: 'football', ucl: 'football', football: 'football', soccer: 'football',
    wimbledon: 'tennis', usopen: 'tennis', rolandgarros: 'tennis', ausopen: 'tennis', atptour: 'tennis', tennis: 'tennis',
    bwf: 'badminton', bwftour: 'badminton', allengland: 'badminton', badminton: 'badminton',
    nba: 'basketball', euroleague: 'basketball', fiba: 'basketball', basketball: 'basketball',
};

const LEAGUE_LABELS = {
    ipl: 'IPL', bbl: 'BBL', psl: 'PSL', cpl: 'CPL', t20wc: 'T20 World Cup', t20: 'T20 Match', odi: 'ODI', test: 'Test Match', cricket: 'Cricket',
    epl: 'Premier League', laliga: 'La Liga', bundesliga: 'Bundesliga', seriea: 'Serie A', ucl: 'Champions League',
    wimbledon: 'Wimbledon', usopen: 'US Open', rolandgarros: 'Roland Garros', ausopen: 'Australian Open', atptour: 'ATP Tour',
    bwf: 'BWF World Tour', bwftour: 'BWF Tour', allengland: 'All England Open',
    nba: 'NBA', euroleague: 'EuroLeague', fiba: 'FIBA',
};

// 🦆 Duck Typing: If it looks like Cricket, it IS Cricket!
function detectSport(data) {
    if (getV(data, ['battingteam', 'battingscore', 'bowlingteam', 'crr', 'rrr'])) return 'cricket';
    if (getV(data, ['goals', 'matchseconds'])) return 'football';
    if (getV(data, ['setsa', 'serving'])) return 'tennis';
    if (getV(data, ['gamesa'])) return 'badminton';
    if (getV(data, ['quarterseconds', 'quarter'])) return 'basketball';

    const league = getV(data, ['league']);
    if (!league) return 'fallback';
    const key = String(league).toLowerCase().replace(/[\s\-_]/g, '');
    return LEAGUE_MAP[key] || 'fallback';
}

function leagueLabel(league) {
    if (!league) return 'LIVE';
    const key = String(league).toLowerCase().replace(/[\s\-_]/g, '');
    return LEAGUE_LABELS[key] || String(league).toUpperCase();
}

const SPORT_THEMES = {
    cricket: { accent: "#0ea5e9", glow: "rgba(14, 165, 233, 0.15)" },
    football: { accent: "#10b981", glow: "rgba(16, 185, 129, 0.15)" },
    tennis: { accent: "#a78bfa", glow: "rgba(167, 139, 250, 0.15)" },
    badminton: { accent: "#f472b6", glow: "rgba(244, 114, 182, 0.15)" },
    basketball: { accent: "#fb923c", glow: "rgba(251, 146, 60, 0.15)" },
    fallback: { accent: "#94a3b8", glow: "rgba(148, 163, 184, 0.15)" },
};

/* =========================================================
   2. TEAM THEMES + AVATAR BADGE
========================================================= */

const TEAM_THEMES = {
    'Barcelona': { bg: 'a50044', color: 'fff' },
    'Real Madrid': { bg: '00529f', color: 'fff' },
    'Lakers': { bg: '552583', color: 'FDB927' },
    'Warriors': { bg: '1D428A', color: 'FFC72C' },
    'India': { bg: 'FF9933', color: 'fff' },
    'Pakistan': { bg: '01411C', color: 'fff' },
    'Mumbai Indians': { bg: '004BA0', color: 'fff' },
    'Royal Challengers Bengaluru': { bg: 'EC1C24', color: 'fff' },
    'Chennai Super Kings': { bg: 'FFFF3C', color: '000' },
    'Sunrisers Hyderabad': { bg: 'F26522', color: 'fff' },
    'Rajasthan Royals': { bg: 'EA1A85', color: 'fff' },
    'Kolkata Knight Riders': { bg: '3A225D', color: 'fff' },
    'Delhi Capitals': { bg: '00008B', color: 'fff' },
    'Punjab Kings': { bg: 'DD1F2D', color: 'fff' }
};

function AvatarBadge({ name, size = 36 }) {
    const theme = TEAM_THEMES[name] || { bg: '1a2a5e', color: '7eb8ff' };
    const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${theme.bg}&color=${theme.color}&size=128&bold=true&font-size=0.45&rounded=false`;
    const initials = (name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const [failed, setFailed] = useState(false);

    const boxStyle = {
        width: size, height: size,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        background: `#${theme.bg}`,
        objectFit: 'cover',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, fontWeight: 800, color: `#${theme.color}`,
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    };

    if (failed) return <div style={boxStyle}>{initials}</div>;
    return <img src={url} style={boxStyle} onError={() => setFailed(true)} alt={name} draggable="false" />;
}

/* =========================================================
   3. SHARED STYLE TOKENS
========================================================= */

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif";

const T = {
    league: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase' },
    teamName: { fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' },
    bigScore: { fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
    overs: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums', fontWeight: 500 },
    rate: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 },
    status: { fontSize: 13, color: '#fff', fontWeight: 700, textAlign: 'center', marginTop: 12, letterSpacing: '0.3px' },
    divider: { width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', margin: '14px 0' },
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
    cur: { fontSize: 22, fontWeight: 800, color: '#fff', textAlign: 'center', width: '100%', marginTop: 8, fontVariantNumeric: 'tabular-nums' },
};

function RedLivePill() {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 99, padding: '4px 10px',
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)'
        }}>
            <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }}
            />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', letterSpacing: '0.1em' }}>LIVE</span>
        </div>
    );
}

function StaticLiveBadge({ text = 'LIVE' }) {
    return (
        <div style={{
            fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8, padding: '4px 10px', letterSpacing: '0.08em',
        }}>
            {text}
        </div>
    );
}

/* =========================================================
   LAYOUT 1 · CricketLayout (PERFECT ALIGNMENT)
========================================================= */

function CricketLayout({ data, accent }) {
    const rawLeague = getV(data, ['league', 'type']) || 'Cricket';
    const label = leagueLabel(rawLeague);

    const isLive = String(getV(data, ['islive', 'live'])).toLowerCase() === 'true';

    const parseCricketScore = (scoreStr, oversStr) => {
        if (!scoreStr || scoreStr === '-' || scoreStr === 'null') return { score: "-", overs: null };
        const str = String(scoreStr).trim();
        const match = str.match(/^([\d\/]+)\s*(?:\(([^)]+)\))?/);
        if (match) {
            return {
                score: match[1] || "-",
                overs: (oversStr && oversStr !== 'null') ? String(oversStr).trim() : (match[2] || null)
            };
        }
        return { score: str, overs: (oversStr && oversStr !== 'null') ? String(oversStr).trim() : null };
    };

    const teamA = getV(data, ['battingteam', 'teama', 'team1', 'home']) || 'Team 1';
    const teamB = getV(data, ['bowlingteam', 'teamb', 'team2', 'away']) || 'Team 2';

    const scoreA = parseCricketScore(getV(data, ['battingscore', 'scorea']), getV(data, ['battingovers', 'oversa']));
    const scoreB = parseCricketScore(getV(data, ['bowlingscore', 'scoreb']), getV(data, ['bowlingovers', 'oversb']));

    const crr = getV(data, ['crr', 'currentrunrate']);
    const rrr = getV(data, ['rrr', 'requiredrunrate']);
    const status = getV(data, ['status', 'matchstatus', 'result']);

    const isFinished = status === 'FT' || String(status).toLowerCase().includes('won') || String(status).toLowerCase().includes('defeated');

    return (
        <div style={{ width: '100%' }}>
            <div style={{ ...T.row, marginBottom: 8 }}>
                <span style={T.league}>{label}</span>
                {isLive ? <RedLivePill /> : (isFinished ? <StaticLiveBadge text="FT" /> : null)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                <AvatarBadge name={teamA} size={36} />
                <span style={T.teamName}>{teamA}</span>
            </div>

            {/* MATCHES THE 'NEEDED' SCREENSHOT PERFECTLY */}
            <div style={{ ...T.row, marginTop: 8, alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <span style={T.bigScore}>{scoreA.score}</span>
                {scoreA.overs && <span style={T.overs}>({scoreA.overs} ov)</span>}
            </div>

            <div style={T.divider} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <AvatarBadge name={teamB} size={36} />
                <span style={T.teamName}>{teamB}</span>
            </div>

            <div style={{ ...T.row, marginTop: 8, alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <span style={T.bigScore}>{scoreB.score}</span>
                {scoreB.overs && <span style={T.overs}>({scoreB.overs} ov)</span>}
            </div>

            <div style={T.divider} />

            {(crr || rrr) && (
                <div style={{ ...T.row, background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8, justifyContent: 'center', gap: 12 }}>
                    {crr && <span style={T.rate}>CRR: {crr}</span>}
                    {crr && rrr && <span style={{ ...T.rate, color: 'rgba(255,255,255,0.2)' }}>•</span>}
                    {rrr && <span style={T.rate}>RRR: {rrr}</span>}
                </div>
            )}

            {status && status !== 'FT' && <div style={{ ...T.status, color: accent }}>{status}</div>}
        </div>
    );
}

/* =========================================================
   LAYOUT 2 · FootballLayout
========================================================= */

function FootballLayout({ data, accent }) {
    const rawLeague = getV(data, ['league']) || 'Football';
    const label = leagueLabel(rawLeague);
    const timerRef = useRef(null);
    const isLive = String(getV(data, ['islive', 'live'])).toLowerCase() === 'true';

    const t1Obj = getV(data, ['teama', 'team1', 'home']) || {};
    const t2Obj = getV(data, ['teamb', 'team2', 'away']) || {};

    const t1Name = t1Obj.name || getV(data, ['hometeam']) || 'Home';
    const t2Name = t2Obj.name || getV(data, ['awayteam']) || 'Away';

    const t1Score = t1Obj.score ?? getV(data, ['homescore', 'scorea']) ?? "-";
    const t2Score = t2Obj.score ?? getV(data, ['awayscore', 'scoreb']) ?? "-";

    const goals = Array.isArray(data.goals) ? data.goals : (Array.isArray(getV(data, ['goals'])) ? getV(data, ['goals']) : []);
    const team1Goals = goals.filter(g => g.team === 1 || g.team === 'A' || g.team === t1Name);
    const team2Goals = goals.filter(g => g.team === 2 || g.team === 'B' || g.team === t2Name);
    const rowCount = Math.max(team1Goals.length, team2Goals.length);

    const status = getV(data, ['status', 'matchstatus']);
    const isFinished = status === 'FT' || String(status).toLowerCase().includes('won') || String(status).toLowerCase().includes('time');
    const matchSeconds = getV(data, ['matchseconds', 'seconds', 'minute']);

    useEffect(() => {
        let secs = matchSeconds || 0;
        if (!timerRef.current || isFinished) return;

        const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        timerRef.current.textContent = fmt(secs);

        if (!isLive) return;

        const iv = setInterval(() => {
            secs++;
            if (timerRef.current) timerRef.current.textContent = fmt(secs);
        }, 1000);
        return () => clearInterval(iv);
    }, [matchSeconds, isLive, isFinished]);

    return (
        <div style={{ width: '100%' }}>
            <div style={{ ...T.row, marginBottom: 12 }}>
                <span style={T.league}>{label}</span>
                {isLive ? <RedLivePill /> : (isFinished ? <StaticLiveBadge text="FT" /> : null)}
            </div>

            {(!isFinished && (isLive || matchSeconds > 0)) && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12, padding: '6px 16px', marginBottom: 20, alignSelf: 'center', width: 'fit-content', margin: '0 auto 20px'
                }}>
                    {isLive && <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />}
                    <span ref={timerRef} style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'center' }}>0:00</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</span>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                    <AvatarBadge name={t1Name} size={54} />
                    <span style={{ ...T.teamName, textAlign: 'center', maxWidth: 80 }}>{t1Name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 40, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{t1Score}</span>
                    <span style={{ fontSize: 20, fontWeight: 300, color: 'rgba(255,255,255,0.3)' }}>–</span>
                    <span style={{ fontSize: 40, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{t2Score}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                    <AvatarBadge name={t2Name} size={54} />
                    <span style={{ ...T.teamName, textAlign: 'center', maxWidth: 80 }}>{t2Name}</span>
                </div>
            </div>

            {rowCount > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', width: '100%' }}>
                    {Array.from({ length: rowCount }).map((_, i) => (
                        <React.Fragment key={i}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-start' }}>
                                {team1Goals[i] && <><span style={{ fontSize: 11 }}>⚽</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{team1Goals[i].scorer} {team1Goals[i].minute}'</span></>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                {team2Goals[i] && <><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{team2Goals[i].scorer} {team2Goals[i].minute}'</span><span style={{ fontSize: 11 }}>⚽</span></>}
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            )}

            {status && status !== 'FT' && <div style={{ ...T.status, color: accent }}>{status}</div>}
        </div>
    );
}

/* =========================================================
   LAYOUT 3 · TennisLayout
========================================================= */

function TennisLayout({ data, accent }) {
    const label = leagueLabel(getV(data, ['league']));
    const isLive = String(getV(data, ['islive'])).toLowerCase() === 'true';
    const isFinished = getV(data, ['status']) === 'FT';

    const p1Name = getV(data, ['teama', 'player1']) || 'Player 1';
    const p2Name = getV(data, ['teamb', 'player2']) || 'Player 2';
    const p1Sets = getV(data, ['setsa']) || [];
    const p2Sets = getV(data, ['setsb']) || [];
    const maxSets = Math.max(p1Sets.length, p2Sets.length, 1);

    const serving = getV(data, ['serving']) ?? -1;
    const currentScore = getV(data, ['currentscore']);

    const SetPill = ({ value, won }) => (
        <div style={{
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: won ? 'rgba(255,255,255,0.15)' : 'transparent', color: won ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
        }}>
            {value !== undefined ? value : '–'}
        </div>
    );

    const PlayerRow = ({ name, sets, opponentSets, isServing }) => (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8, padding: '10px 0' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isServing ? accent : 'transparent' }} />
            <span style={{ ...T.teamName, flex: 1, fontWeight: isServing ? 700 : 500, color: isServing ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                {name}
            </span>
            {(sets.length > 0 || opponentSets.length > 0) && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {Array.from({ length: maxSets }).map((_, si) => {
                        const val = sets[si], opp = opponentSets[si];
                        return <SetPill key={si} value={val} won={val !== undefined && opp !== undefined && val > opp} />;
                    })}
                </div>
            )}
        </div>
    );

    return (
        <div style={{ width: '100%' }}>
            <div style={{ ...T.row, marginBottom: 12 }}>
                <span style={T.league}>{label}</span>
                {isLive ? <StaticLiveBadge text="LIVE" /> : (isFinished ? <StaticLiveBadge text="FT" /> : null)}
            </div>
            <PlayerRow name={p1Name} sets={p1Sets} opponentSets={p2Sets} isServing={serving === 0} />
            <div style={T.divider} />
            <PlayerRow name={p2Name} sets={p2Sets} opponentSets={p1Sets} isServing={serving === 1} />
            <div style={T.divider} />
            {currentScore && <div style={{ ...T.cur, color: accent }}>Current: {currentScore}</div>}
        </div>
    );
}

/* =========================================================
   LAYOUT 4 · BadmintonLayout
========================================================= */

function BadmintonLayout({ data, accent }) {
    const label = leagueLabel(getV(data, ['league']));
    const isLive = String(getV(data, ['islive'])).toLowerCase() === 'true';
    const isFinished = getV(data, ['status']) === 'FT';

    const p1Name = getV(data, ['teama', 'player1']) || 'Player A';
    const p2Name = getV(data, ['teamb', 'player2']) || 'Player B';
    const p1Games = getV(data, ['gamesa']) || [];
    const p2Games = getV(data, ['gamesb']) || [];
    const maxGames = Math.max(p1Games.length, p2Games.length, 1);

    const currentScore = getV(data, ['currentscore']);

    const PlayerRow = ({ name, games, opponentGames }) => (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12, padding: '10px 0' }}>
            <AvatarBadge name={name} size={40} />
            <span style={{ ...T.teamName, flex: 1 }}>{name}</span>
            {(games.length > 0 || opponentGames.length > 0) && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    {Array.from({ length: maxGames }).map((_, gi) => {
                        const val = games[gi], opp = opponentGames[gi], won = val !== undefined && opp !== undefined && val > opp;
                        return (
                            <span key={gi} style={{ fontSize: 20, fontWeight: 800, color: won ? '#fff' : 'rgba(255,255,255,0.4)', minWidth: 26, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                                {val !== undefined ? val : '–'}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <div style={{ width: '100%' }}>
            <div style={{ ...T.row, marginBottom: 8 }}>
                <span style={T.league}>{label}</span>
                {isLive ? <StaticLiveBadge text="LIVE" /> : (isFinished ? <StaticLiveBadge text="FT" /> : null)}
            </div>
            <PlayerRow name={p1Name} games={p1Games} opponentGames={p2Games} />
            <div style={T.divider} />
            <PlayerRow name={p2Name} games={p2Games} opponentGames={p1Games} />
            <div style={T.divider} />
            {currentScore && <div style={{ ...T.cur, color: accent }}>Current: {currentScore}</div>}
        </div>
    );
}

/* =========================================================
   LAYOUT 5 · BasketballLayout
========================================================= */

function BasketballLayout({ data, accent }) {
    const label = leagueLabel(getV(data, ['league']));
    const timerRef = useRef(null);
    const isLive = String(getV(data, ['islive'])).toLowerCase() === 'true';

    const t1Obj = getV(data, ['teama', 'team1', 'home']) || {};
    const t2Obj = getV(data, ['teamb', 'team2', 'away']) || {};

    const t1Name = t1Obj.name || getV(data, ['hometeam']) || 'Home';
    const t2Name = t2Obj.name || getV(data, ['awayteam']) || 'Away';

    const t1Score = t1Obj.score ?? getV(data, ['homescore', 'scorea']) ?? "-";
    const t2Score = t2Obj.score ?? getV(data, ['awayscore', 'scoreb']) ?? "-";

    const quarter = getV(data, ['quarter', 'period']);
    const status = getV(data, ['status', 'matchstatus']);
    const isFinished = status === 'FT' || String(status).toLowerCase().includes('won');
    const quarterSeconds = getV(data, ['quarterseconds', 'clock']);

    useEffect(() => {
        let secs = quarterSeconds || 0;
        if (!timerRef.current || isFinished) return;

        const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        timerRef.current.textContent = fmt(secs);

        if (!isLive) return;

        const iv = setInterval(() => {
            if (secs <= 0) {
                if (timerRef.current) timerRef.current.textContent = '0:00';
                clearInterval(iv);
                return;
            }
            secs--;
            if (timerRef.current) timerRef.current.textContent = fmt(secs);
        }, 1000);
        return () => clearInterval(iv);
    }, [quarterSeconds, isLive, isFinished]);

    const TeamRow = ({ name, score }) => (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12, padding: '8px 0' }}>
            <AvatarBadge name={name} size={40} />
            <span style={{ ...T.teamName, flex: 1, fontSize: 15 }}>{name}</span>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{score}</span>
        </div>
    );

    return (
        <div style={{ width: '100%' }}>
            <div style={{ ...T.row, marginBottom: 12 }}>
                <span style={T.league}>{label}</span>
                {isLive ? <StaticLiveBadge text={`Q${quarter || ''} LIVE`} /> : (isFinished ? <StaticLiveBadge text="FINAL" /> : null)}
            </div>

            {(!isFinished && (isLive || quarterSeconds > 0)) && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12, padding: '6px 16px', marginBottom: 16, alignSelf: 'center', width: 'fit-content', margin: '0 auto 16px'
                }}>
                    <span ref={timerRef} style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'center' }}>0:00</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clock</span>
                </div>
            )}

            <TeamRow name={t1Name} score={t1Score} />
            <TeamRow name={t2Name} score={t2Score} />

            <div style={T.divider} />

            <div style={T.row}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    {quarter ? `Quarter ${quarter}` : ''}
                </span>
                {status && status !== 'FT' && <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>{status}</span>}
            </div>
        </div>
    );
}

/* =========================================================
   FALLBACK LAYOUT
========================================================= */

function FallbackLayout({ data }) {
    const entries = Object.entries(data || {}).filter(([k]) => k.toLowerCase() !== 'league');
    return (
        <div style={{ width: '100%' }}>
            <div style={{ ...T.row, marginBottom: 16 }}>
                <span style={T.league}>{data?.league?.toUpperCase() || 'UNKNOWN SPORT'}</span>
            </div>
            {entries.map(([key, value]) => (
                <div key={key} style={{ ...T.row, marginBottom: 8, background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{String(key).replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                </div>
            ))}
        </div>
    );
}

/* =========================================================
   MAIN COMPONENT — Studio Glass Card
========================================================= */

export default function SportsCard({ data }) {
    const sport = useMemo(() => detectSport(data), [data]);
    const theme = SPORT_THEMES[sport] || SPORT_THEMES.fallback;

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [6, -6]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-6, 6]);

    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], [100, -100]);
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], [100, -100]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    if (!data) return null;

    return (
        <div style={{ perspective: 1200, padding: 20, display: 'inline-block' }}>
            <motion.div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    width: 340,
                    minHeight: 400,
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                    position: 'relative',
                    borderRadius: 32,
                    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(2, 6, 23, 0.95) 100%)',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    cursor: 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 28,
                    fontFamily: FONT,
                }}
            >
                {/* Accent Glow */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: `radial-gradient(circle at 50% 0%, ${theme.glow} 0%, transparent 70%)`,
                    pointerEvents: 'none', zIndex: 0
                }} />

                {/* Noise Texture */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.04,
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                    pointerEvents: 'none', zIndex: 0
                }} />

                {/* Interactive Glare */}
                <motion.div style={{
                    position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, transparent 40%)',
                    x: glareX, y: glareY,
                    pointerEvents: 'none', zIndex: 1
                }} />

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {sport === 'cricket' && <CricketLayout data={data} accent={theme.accent} />}
                    {sport === 'football' && <FootballLayout data={data} accent={theme.accent} />}
                    {sport === 'tennis' && <TennisLayout data={data} accent={theme.accent} />}
                    {sport === 'badminton' && <BadmintonLayout data={data} accent={theme.accent} />}
                    {sport === 'basketball' && <BasketballLayout data={data} accent={theme.accent} />}
                    {sport === 'fallback' && <FallbackLayout data={data} accent={theme.accent} />}
                </div>
            </motion.div>
        </div>
    );
}

export { CricketLayout, FootballLayout, TennisLayout, BadmintonLayout, BasketballLayout };