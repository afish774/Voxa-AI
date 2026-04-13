import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

/* =========================================================
   0. CONSTANTS & LEAGUE MAPPING
========================================================= */

const LEAGUE_MAP = {
    ipl: 'cricket', bbl: 'cricket', psl: 'cricket', cpl: 'cricket', t20wc: 'cricket',
    epl: 'football', laliga: 'football', bundesliga: 'football', seriea: 'football', ucl: 'football',
    wimbledon: 'tennis', usopen: 'tennis', rolandgarros: 'tennis', ausopen: 'tennis', atptour: 'tennis',
    bwf: 'badminton', bwftour: 'badminton', allengland: 'badminton',
    nba: 'basketball', euroleague: 'basketball', fiba: 'basketball',
};

const LEAGUE_LABELS = {
    ipl: 'IPL', bbl: 'BBL', psl: 'PSL', cpl: 'CPL', t20wc: 'T20 World Cup',
    epl: 'Premier League', laliga: 'La Liga', bundesliga: 'Bundesliga', seriea: 'Serie A', ucl: 'Champions League',
    wimbledon: 'Wimbledon', usopen: 'US Open', rolandgarros: 'Roland Garros', ausopen: 'Australian Open', atptour: 'ATP Tour',
    bwf: 'BWF World Tour', bwftour: 'BWF Tour', allengland: 'All England Open',
    nba: 'NBA', euroleague: 'EuroLeague', fiba: 'FIBA',
};

function detectSport(league) {
    if (!league) return 'fallback';
    const key = league.toLowerCase().replace(/[\s\-_]/g, '');
    return LEAGUE_MAP[key] || 'fallback';
}

function leagueLabel(league) {
    if (!league) return 'LIVE';
    const key = league.toLowerCase().replace(/[\s\-_]/g, '');
    return LEAGUE_LABELS[key] || league.toUpperCase();
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
   1. TEAM THEMES + AVATAR BADGE
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
    'Chennai Super Kings': { bg: 'FFFF3C', color: '000' }
};

function AvatarBadge({ name, size = 44 }) {
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
   2. SHARED STYLE TOKENS
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

/* =========================================================
   3. LIVE BADGES
========================================================= */

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
            <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', letterSpacing: '0.1em' }}>
                LIVE
            </span>
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
   LAYOUT 1 · CricketLayout (SMART HIDING ENABLED)
========================================================= */

function CricketLayout({ data, accent }) {
    const label = leagueLabel(data.league);

    const parseCricketScore = (scoreStr, oversStr) => {
        if (!scoreStr || scoreStr === 'undefined' || scoreStr === '-') return { score: "-", overs: null };
        const str = String(scoreStr);
        const match = str.match(/^([\d\/]+)\s*(?:\(([^)]+)\))?/);
        if (match) {
            return {
                score: match[1] || "-",
                overs: oversStr || match[2] || null // Returns null if no overs exist
            };
        }
        return { score: str, overs: oversStr || null };
    };

    const teamA = data.battingTeam || data.teamA || 'Team A';
    const teamB = data.bowlingTeam || data.teamB || 'Team B';

    const scoreA = parseCricketScore(data.battingScore || data.scoreA, data.battingOvers || data.oversA);
    const scoreB = parseCricketScore(data.bowlingScore || data.scoreB, data.bowlingOvers || data.oversB);

    // Safely check if variables actually exist and aren't string 'undefined'
    const crr = (data.crr && data.crr !== 'undefined') ? data.crr : null;
    const rrr = (data.rrr && data.rrr !== 'undefined') ? data.rrr : null;
    const status = data.status || data.matchStatus || data.result;

    const isFinished = status === 'FT' || status?.toLowerCase().includes('won') || status?.toLowerCase().includes('defeated');

    return (
        <div style={{ width: '100%' }}>
            <div style={{ ...T.row, marginBottom: 8 }}>
                <span style={T.league}>{label}</span>
                {data.isLive ? <RedLivePill /> : (isFinished ? <StaticLiveBadge text="FT" /> : null)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                <AvatarBadge name={teamA} size={40} />
                <span style={T.teamName}>{teamA}</span>
            </div>

            {/* The score row will perfectly align left if overs are missing */}
            <div style={{ ...T.row, marginTop: 6, justifyContent: "flex-start", gap: 12 }}>
                <span style={T.bigScore}>{scoreA.score}</span>
                {scoreA.overs && <span style={T.overs}>({scoreA.overs} ov)</span>}
            </div>

            <div style={T.divider} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <AvatarBadge name={teamB} size={40} />
                <span style={T.teamName}>{teamB}</span>
            </div>

            <div style={{ ...T.row, marginTop: 6, justifyContent: "flex-start", gap: 12 }}>
                <span style={T.bigScore}>{scoreB.score}</span>
                {scoreB.overs && <span style={T.overs}>({scoreB.overs} ov)</span>}
            </div>

            <div style={T.divider} />

            {/* ENTIRE BLOCK HIDES IF NO CRR OR RRR */}
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
    const label = leagueLabel(data.league);
    const timerRef = useRef(null);

    const t1Name = data.teamA?.name || data.team1?.name || data.teamA || 'Home';
    const t2Name = data.teamB?.name || data.team2?.name || data.teamB || 'Away';
    const t1Score = data.teamA?.score ?? data.team1?.score ?? data.scoreA ?? "-";
    const t2Score = data.teamB?.score ?? data.team2?.score ?? data.scoreB ?? "-";

    const goals = Array.isArray(data.goals) ? data.goals : [];
    const team1Goals = goals.filter(g => g.team === 1 || g.team === 'A' || g.team === t1Name);
    const team2Goals = goals.filter(g => g.team === 2 || g.team === 'B' || g.team === t2Name);
    const rowCount = Math.max(team1Goals.length, team2Goals.length);

    const status = data.status || data.matchStatus || data.result;
    const isFinished = status === 'FT' || status?.toLowerCase().includes('won');

    useEffect(() => {
        let secs = data.matchSeconds || ((data.minute || 0) * 60);
        if (!timerRef.current || isFinished) return;

        const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        timerRef.current.textContent = fmt(secs);

        if (!data.isLive) return;

        const iv = setInterval(() => {
            secs++;
            if (timerRef.current) timerRef.current.textContent = fmt(secs);
        }, 1000);
        return () => clearInterval(iv);
    }, [data.matchSeconds, data.minute, data.isLive, isFinished]);

    return (
        <div style={{ width: '100%' }}>
            <div style={{ ...T.row, marginBottom: 12 }}>
                <span style={T.league}>{label}</span>
                {data.isLive ? <RedLivePill /> : (isFinished ? <StaticLiveBadge text="FT" /> : null)}
            </div>

            {/* ONLY SHOW TIMER IF LIVE OR DATA EXISTS */}
            {(!isFinished && (data.isLive || data.matchSeconds || data.minute)) && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12, padding: '6px 16px', marginBottom: 20, alignSelf: 'center', width: 'fit-content', margin: '0 auto 20px'
                }}>
                    {data.isLive && <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />}
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

            {/* ONLY SHOW GOALS IF GOALS EXIST */}
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
    const label = leagueLabel(data.league);
    const p1Name = data.teamA || data.player1 || data.players?.[0]?.name || 'Player 1';
    const p2Name = data.teamB || data.player2 || data.players?.[1]?.name || 'Player 2';
    const p1Sets = data.setsA || data.players?.[0]?.sets || [];
    const p2Sets = data.setsB || data.players?.[1]?.sets || [];
    const maxSets = Math.max(p1Sets.length, p2Sets.length, 1);

    const serving = data.serving ?? -1;
    const currentScore = data.currentScore || data.gameScore || null;
    const isFinished = data.status === 'FT';

    const SetPill = ({ value, won }) => (
        <div style={{
            width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: won ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: won ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
        }}>
            {value !== undefined ? value : '–'}
        </div>
    );

    const PlayerRow = ({ name, sets, opponentSets, isServing }) => {
        return (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8, padding: '10px 0' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isServing ? accent : 'transparent' }} />
                <span style={{ ...T.teamName, flex: 1, fontWeight: isServing ? 700 : 500, color: isServing ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                    {name}
                </span>
                {/* Only render sets if there are any */}
                {(sets.length > 0 || opponentSets.length > 0) && (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {Array.from({ length: maxSets }).map((_, si) => {
                            const val = sets[si];
                            const opp = opponentSets[si];
                            return <SetPill key={si} value={val} won={val !== undefined && opp !== undefined && val > opp} />;
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ width: '100%' }}>
            <div style={{ ...T.row, marginBottom: 12 }}>
                <span style={T.league}>{label}</span>
                {data.isLive ? <StaticLiveBadge text="LIVE" /> : (isFinished ? <StaticLiveBadge text="FT" /> : null)}
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
    const label = leagueLabel(data.league);
    const p1Name = data.teamA || data.player1 || data.players?.[0]?.name || 'Player A';
    const p2Name = data.teamB || data.player2 || data.players?.[1]?.name || 'Player B';
    const p1Games = data.gamesA || data.players?.[0]?.games || [];
    const p2Games = data.gamesB || data.players?.[1]?.games || [];
    const maxGames = Math.max(p1Games.length, p2Games.length, 1);

    const currentScore = data.currentScore || data.gameScore || null;
    const isFinished = data.status === 'FT';

    const PlayerRow = ({ name, games, opponentGames }) => {
        return (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12, padding: '10px 0' }}>
                <AvatarBadge name={name} size={40} />
                <span style={{ ...T.teamName, flex: 1 }}>{name}</span>
                {/* Only show game numbers if they exist */}
                {(games.length > 0 || opponentGames.length > 0) && (
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        {Array.from({ length: maxGames }).map((_, gi) => {
                            const val = games[gi];
                            const opp = opponentGames[gi];
                            const won = val !== undefined && opp !== undefined && val > opp;
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
    };

    return (
        <div style={{ width: '100%' }}>
            <div style={{ ...T.row, marginBottom: 8 }}>
                <span style={T.league}>{label}</span>
                {data.isLive ? <StaticLiveBadge text="LIVE" /> : (isFinished ? <StaticLiveBadge text="FT" /> : null)}
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
    const label = leagueLabel(data.league);
    const timerRef = useRef(null);

    const t1Name = data.teamA?.name || data.team1?.name || data.teamA || data.teams?.[0]?.name || 'Home';
    const t2Name = data.teamB?.name || data.team2?.name || data.teamB || data.teams?.[1]?.name || 'Away';
    const t1Score = data.teamA?.score ?? data.team1?.score ?? data.scoreA ?? data.teams?.[0]?.score ?? "-";
    const t2Score = data.teamB?.score ?? data.team2?.score ?? data.scoreB ?? data.teams?.[1]?.score ?? "-";

    const quarter = data.quarter || data.period || null;
    const status = data.status || data.matchStatus || data.result;
    const isFinished = status === 'FT' || status?.toLowerCase().includes('won');

    useEffect(() => {
        let secs = data.quarterSeconds || ((data.clock || 0) * 60);
        if (!timerRef.current || isFinished) return;

        const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        timerRef.current.textContent = fmt(secs);

        if (!data.isLive) return;

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
    }, [data.quarterSeconds, data.clock, data.isLive, isFinished]);

    const TeamRow = ({ name, score }) => (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12, padding: '8px 0' }}>
            <AvatarBadge name={name} size={40} />
            <span style={{ ...T.teamName, flex: 1, fontSize: 15 }}>{name}</span>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                {score}
            </span>
        </div>
    );

    return (
        <div style={{ width: '100%' }}>
            <div style={{ ...T.row, marginBottom: 12 }}>
                <span style={T.league}>{label}</span>
                {data.isLive ? <StaticLiveBadge text={`Q${quarter || ''} LIVE`} /> : (isFinished ? <StaticLiveBadge text="FINAL" /> : null)}
            </div>

            {/* ONLY SHOW TIMER IF LIVE AND NOT FINISHED */}
            {(!isFinished && (data.isLive || data.quarterSeconds || data.clock)) && (
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
    const entries = Object.entries(data || {}).filter(([k]) => k !== 'league');
    return (
        <div style={{ width: '100%' }}>
            <div style={{ ...T.row, marginBottom: 16 }}>
                <span style={T.league}>{data?.league?.toUpperCase() || 'UNKNOWN SPORT'}</span>
            </div>
            {entries.map(([key, value]) => (
                <div key={key} style={{ ...T.row, marginBottom: 8, background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{key}</span>
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
    const sport = useMemo(() => detectSport(data?.league), [data?.league]);
    const theme = SPORT_THEMES[sport] || SPORT_THEMES.fallback;

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [6, -6]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-6, 6]);

    // Dynamic Glare
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