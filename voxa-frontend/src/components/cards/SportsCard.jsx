import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, MeshTransmissionMaterial, Environment, Float, Sparkles, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

/* =========================================================
   SAMPLE DATA CONSTANTS
========================================================= */

const CRICKET_DATA = {
    league: 'ipl', battingTeam: 'India', battingScore: '145/1', battingOvers: '25.2',
    bowlingTeam: 'Pakistan', bowlingScore: '310/10', bowlingOvers: '50',
    crr: 5.73, rrr: 7.94, status: 'India need 166 runs', isLive: true
};

const FOOTBALL_DATA = {
    league: 'epl',
    team1: { name: 'Barcelona', score: 2 },
    team2: { name: 'Real Madrid', score: 1 },
    matchSeconds: 67 * 60 + 22,
    goals: [
        { team: 1, scorer: 'Lewandowski', minute: 23 },
        { team: 1, scorer: 'Lewandowski', minute: 58 },
        { team: 2, scorer: 'Bellingham', minute: 41 },
    ],
    status: 'Barcelona leading', isLive: true
};

const TENNIS_DATA = {
    league: 'wimbledon',
    players: [
        { name: 'Nadal', sets: [6, 3, 4] },
        { name: 'Federer', sets: [4, 6, 2] },
    ],
    serving: 0, currentScore: '40 – 30', isLive: true
};

const BADMINTON_DATA = {
    league: 'bwf',
    players: [
        { name: 'Player A', games: [21, 18] },
        { name: 'Player B', games: [18, 21] },
    ],
    currentScore: '12 – 10', isLive: true
};

const BASKETBALL_DATA = {
    league: 'nba',
    teams: [
        { name: 'Lakers', score: 89 },
        { name: 'Warriors', score: 92 },
    ],
    quarter: 3, quarterSeconds: 5 * 60 + 32,
    status: 'Warriors lead by 3', isLive: true
};

/* =========================================================
   LEAGUE DETECTION
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

/* =========================================================
   TEAM THEMES + AVATAR BADGE
========================================================= */

const TEAM_THEMES = {
    'Barcelona': { bg: 'a50044', color: 'fff' },
    'Real Madrid': { bg: '00529f', color: 'fff' },
    'Lakers': { bg: '552583', color: 'FDB927' },
    'Warriors': { bg: '1D428A', color: 'FFC72C' },
    'India': { bg: 'FF9933', color: 'fff' },
    'Pakistan': { bg: '01411C', color: 'fff' },
};

function AvatarBadge({ name, size = 44 }) {
    const theme = TEAM_THEMES[name] || { bg: '1a2a5e', color: '7eb8ff' };
    const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${theme.bg}&color=${theme.color}&size=128&bold=true&font-size=0.45&rounded=false`;
    const initials = (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const [failed, setFailed] = useState(false);
    const boxStyle = {
        width: size, height: size,
        borderRadius: 10,
        border: '2px solid rgba(255,255,255,0.15)',
        background: `#${theme.bg}`,
        objectFit: 'cover',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, color: `#${theme.color}`,
        flexShrink: 0,
    };
    if (failed) return <div style={boxStyle}>{initials}</div>;
    return <img src={url} style={boxStyle} onError={() => setFailed(true)} alt={name} />;
}

/* =========================================================
   SHARED STYLE TOKENS
========================================================= */

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

const T = {
    league: { fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.1em', textTransform: 'uppercase' },
    teamName: { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.82)' },
    bigScore: { fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
    overs: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' },
    rate: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' },
    status: { fontSize: 11.5, color: 'rgba(100,170,255,0.8)', fontStyle: 'italic', textAlign: 'center', marginTop: 6 },
    divider: { width: '100%', height: 1, background: 'rgba(255,255,255,0.09)', margin: '11px 0' },
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
    cur: { fontSize: 20, fontWeight: 800, color: '#7ab8ff', textAlign: 'center', width: '100%', marginTop: 6, fontVariantNumeric: 'tabular-nums' },
};

/* =========================================================
   LIVE BADGES
========================================================= */

function RedLivePill() {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,50,50,0.13)',
            border: '1px solid rgba(255,80,80,0.28)',
            borderRadius: 99, padding: '3px 10px',
        }}>
            <motion.div
                animate={{ opacity: [1, 0.35, 1], scale: [1, 1.4, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4444' }}
            />
            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#ff6a6a', letterSpacing: '0.07em' }}>
                LIVE
            </span>
        </div>
    );
}

function StaticLiveBadge({ text = 'LIVE' }) {
    return (
        <div style={{
            fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 7, padding: '3px 9px', letterSpacing: '0.05em',
        }}>
            {text}
        </div>
    );
}

/* =========================================================
   LAYOUT 1 · CricketLayout
========================================================= */

function CricketLayout({ data }) {
    const label = leagueLabel(data.league);

    return (
        <div style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ ...T.row, marginBottom: 2 }}>
                <span style={T.league}>{label}</span>
                {data.isLive && <RedLivePill />}
            </div>

            {/* Batting Team */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11 }}>
                <AvatarBadge name={data.battingTeam || data.teamA || 'Team A'} size={36} />
                <span style={T.teamName}>{data.battingTeam || data.teamA || 'Team A'}</span>
            </div>
            <div style={{ ...T.row, marginTop: 3 }}>
                <span style={T.bigScore}>{data.battingScore || data.scoreA || '0/0'}</span>
                <span style={T.overs}>{data.battingOvers || '0'} ov</span>
            </div>

            {/* Divider */}
            <div style={T.divider} />

            {/* Bowling Team */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 0 }}>
                <AvatarBadge name={data.bowlingTeam || data.teamB || 'Team B'} size={36} />
                <span style={T.teamName}>{data.bowlingTeam || data.teamB || 'Team B'}</span>
            </div>
            <div style={{ ...T.row, marginTop: 3 }}>
                <span style={T.bigScore}>{data.bowlingScore || data.scoreB || '0/0'}</span>
                <span style={T.overs}>{data.bowlingOvers || '0'} ov</span>
            </div>

            {/* Divider */}
            <div style={T.divider} />

            {/* Rates Row */}
            <div style={{ ...T.row }}>
                <span style={T.rate}>CRR: {data.crr ?? '–'}</span>
                <span style={{ ...T.rate, color: 'rgba(255,255,255,0.18)' }}>•</span>
                <span style={T.rate}>RRR: {data.rrr ?? '–'}</span>
            </div>

            {/* Status */}
            {data.status && (
                <div style={T.status}>{data.status}</div>
            )}
        </div>
    );
}

/* =========================================================
   LAYOUT 2 · FootballLayout
========================================================= */

function FootballLayout({ data }) {
    const label = leagueLabel(data.league);
    const t1 = data.team1 || { name: data.teamA || 'Home', score: data.scoreA || 0 };
    const t2 = data.team2 || { name: data.teamB || 'Away', score: data.scoreB || 0 };
    const goals = data.goals || [];

    /* Timer: count UP from matchSeconds, direct DOM update */
    useEffect(() => {
        let secs = data.matchSeconds || 0;
        const el = document.getElementById('fl-timer');
        if (!el) return;
        const fmt = (s) => {
            const m = Math.floor(s / 60);
            const sec = s % 60;
            return `${m}:${String(sec).padStart(2, '0')}`;
        };
        el.textContent = fmt(secs);
        const iv = setInterval(() => {
            secs++;
            const target = document.getElementById('fl-timer');
            if (target) target.textContent = fmt(secs);
        }, 1000);
        return () => clearInterval(iv);
    }, [data.matchSeconds]);

    /* Goal grid — team separation */
    const team1Goals = goals.filter(g => g.team === 1);
    const team2Goals = goals.filter(g => g.team === 2);
    const rowCount = Math.max(team1Goals.length, team2Goals.length);

    return (
        <div style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ ...T.row, marginBottom: 6 }}>
                <span style={T.league}>{label}</span>
                {data.isLive && <RedLivePill />}
            </div>

            {/* Timer Bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '5px 12px',
                marginBottom: 12,
            }}>
                <motion.div
                    animate={{ opacity: [1, 0.35, 1], scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4444', flexShrink: 0 }}
                />
                <span id="fl-timer" style={{
                    fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.85)',
                    fontVariantNumeric: 'tabular-nums', minWidth: 36,
                }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.04em' }}>
                    match time
                </span>
            </div>

            {/* Score Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Team 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                    <AvatarBadge name={t1.name} size={44} />
                    <span style={{ ...T.teamName, fontSize: 11, textAlign: 'center', maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t1.name}
                    </span>
                </div>

                {/* Score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                        {t1.score ?? 0}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 300, color: 'rgba(255,255,255,0.22)' }}>–</span>
                    <span style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                        {t2.score ?? 0}
                    </span>
                </div>

                {/* Team 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                    <AvatarBadge name={t2.name} size={44} />
                    <span style={{ ...T.teamName, fontSize: 11, textAlign: 'center', maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t2.name}
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div style={T.divider} />

            {/* Goal Grid — 2-column */}
            {rowCount > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', width: '100%', marginTop: 2 }}>
                    {Array.from({ length: rowCount }).map((_, i) => {
                        const g1 = team1Goals[i];
                        const g2 = team2Goals[i];
                        return (
                            <React.Fragment key={i}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-start' }}>
                                    {g1 && <>
                                        <span style={{ fontSize: 10 }}>⚽</span>
                                        <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.52)' }}>{g1.scorer} {g1.minute}'</span>
                                    </>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                                    {g2 && <>
                                        <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.52)' }}>{g2.scorer} {g2.minute}'</span>
                                        <span style={{ fontSize: 10 }}>⚽</span>
                                    </>}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            )}

            {/* Status */}
            {data.status && (
                <div style={T.status}>{data.status}</div>
            )}
        </div>
    );
}

/* =========================================================
   LAYOUT 3 · TennisLayout
========================================================= */

function TennisLayout({ data }) {
    const label = leagueLabel(data.league);
    const players = data.players || [
        { name: data.teamA || 'Player 1', sets: [] },
        { name: data.teamB || 'Player 2', sets: [] },
    ];
    const serving = data.serving ?? 0;
    const maxSets = Math.max(
        players[0]?.sets?.length || 0,
        players[1]?.sets?.length || 0,
        1
    );

    const SetPill = ({ value, won }) => (
        <div style={{
            width: 28, height: 28, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: won ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)',
            color: won ? '#fff' : 'rgba(255,255,255,0.28)',
            fontSize: 14, fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
        }}>
            {value !== undefined ? value : '–'}
        </div>
    );

    const PlayerRow = ({ player, opponentSets, idx }) => {
        const isServing = serving === idx;
        const sets = player.sets || [];
        const oppSets = opponentSets || [];

        return (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 6, padding: '7px 0' }}>
                {/* Serving indicator */}
                {isServing ? (
                    <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#7ab8ff', flexShrink: 0,
                    }} />
                ) : (
                    <div style={{ width: 7, flexShrink: 0 }} />
                )}

                {/* Name */}
                <span style={{
                    ...T.teamName,
                    flex: 1,
                    fontWeight: isServing ? 700 : 600,
                    color: isServing ? '#fff' : 'rgba(255,255,255,0.55)',
                }}>
                    {player.name}
                </span>

                {/* Set pills */}
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {Array.from({ length: maxSets }).map((_, si) => {
                        const val = sets[si];
                        const opp = oppSets[si];
                        const won = val !== undefined && opp !== undefined && val > opp;
                        return <SetPill key={si} value={val} won={won} />;
                    })}
                </div>
            </div>
        );
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ ...T.row, marginBottom: 6 }}>
                <span style={T.league}>{label}</span>
                {data.isLive && <StaticLiveBadge text="LIVE" />}
            </div>

            {/* Player rows */}
            <PlayerRow player={players[0]} opponentSets={players[1]?.sets} idx={0} />
            <PlayerRow player={players[1]} opponentSets={players[0]?.sets} idx={1} />

            {/* Divider */}
            <div style={T.divider} />

            {/* Current Score */}
            {data.currentScore && (
                <div style={T.cur}>{data.currentScore}</div>
            )}
        </div>
    );
}

/* =========================================================
   LAYOUT 4 · BadmintonLayout
========================================================= */

function BadmintonLayout({ data }) {
    const label = leagueLabel(data.league);
    const players = data.players || [
        { name: data.teamA || 'Player A', games: [] },
        { name: data.teamB || 'Player B', games: [] },
    ];
    const maxGames = Math.max(
        players[0]?.games?.length || 0,
        players[1]?.games?.length || 0,
        1
    );

    const PlayerRow = ({ player, opponentGames, isFirst }) => {
        const games = player.games || [];
        const oppGames = opponentGames || [];

        return (
            <div style={{
                display: 'flex', alignItems: 'center', width: '100%', gap: 9,
                paddingTop: 8, paddingBottom: 8,
            }}>
                <AvatarBadge name={player.name} size={36} />
                <span style={{ ...T.teamName, flex: 1 }}>{player.name}</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {Array.from({ length: maxGames }).map((_, gi) => {
                        const val = games[gi];
                        const opp = oppGames[gi];
                        const won = val !== undefined && opp !== undefined && val > opp;
                        return (
                            <span key={gi} style={{
                                fontSize: 18, fontWeight: 800,
                                color: won ? '#fff' : 'rgba(255,255,255,0.25)',
                                minWidth: 24, textAlign: 'center',
                                fontVariantNumeric: 'tabular-nums',
                            }}>
                                {val !== undefined ? val : '–'}
                            </span>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ ...T.row, marginBottom: 4 }}>
                <span style={T.league}>{label}</span>
                {data.isLive && <StaticLiveBadge text="LIVE" />}
            </div>

            {/* Player A */}
            <PlayerRow player={players[0]} opponentGames={players[1]?.games} isFirst={true} />

            {/* Divider */}
            <div style={T.divider} />

            {/* Player B */}
            <PlayerRow player={players[1]} opponentGames={players[0]?.games} isFirst={false} />

            {/* Divider */}
            <div style={T.divider} />

            {/* Current Score */}
            {data.currentScore && (
                <div style={T.cur}>{data.currentScore}</div>
            )}
        </div>
    );
}

/* =========================================================
   LAYOUT 5 · BasketballLayout
========================================================= */

function BasketballLayout({ data }) {
    const label = leagueLabel(data.league);
    const teams = data.teams || [
        { name: data.teamA || 'Team A', score: data.scoreA || 0 },
        { name: data.teamB || 'Team B', score: data.scoreB || 0 },
    ];

    /* Timer: count DOWN from quarterSeconds, direct DOM update */
    useEffect(() => {
        let secs = data.quarterSeconds || 0;
        const el = document.getElementById('bk-timer');
        if (!el) return;
        const fmt = (s) => {
            const m = Math.floor(s / 60);
            const sec = s % 60;
            return `${m}:${String(sec).padStart(2, '0')}`;
        };
        el.textContent = fmt(secs);
        const iv = setInterval(() => {
            if (secs <= 0) {
                const target = document.getElementById('bk-timer');
                if (target) target.textContent = '0:00';
                clearInterval(iv);
                return;
            }
            secs--;
            const target = document.getElementById('bk-timer');
            if (target) target.textContent = fmt(secs);
        }, 1000);
        return () => clearInterval(iv);
    }, [data.quarterSeconds]);

    const TeamRow = ({ team }) => (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 9, padding: '6px 0' }}>
            <AvatarBadge name={team.name} size={36} />
            <span style={{ ...T.teamName, flex: 1 }}>{team.name}</span>
            <span style={{
                fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
            }}>
                {team.score ?? 0}
            </span>
        </div>
    );

    return (
        <div style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ ...T.row, marginBottom: 6 }}>
                <span style={T.league}>{label}</span>
                {data.isLive && <StaticLiveBadge text={`Q${data.quarter || '?'} LIVE`} />}
            </div>

            {/* Timer Bar (countdown) */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '5px 12px',
                marginBottom: 10,
            }}>
                <span id="bk-timer" style={{
                    fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.85)',
                    fontVariantNumeric: 'tabular-nums',
                }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.04em' }}>
                    quarter time
                </span>
            </div>

            {/* Team rows */}
            <TeamRow team={teams[0]} />
            <TeamRow team={teams[1]} />

            {/* Divider */}
            <div style={T.divider} />

            {/* Footer: quarter info + lead */}
            <div style={{ ...T.row }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                    Quarter {data.quarter || '?'}
                </span>
                {data.status && (
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#7ab8ff' }}>
                        {data.status}
                    </span>
                )}
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
            <div style={{ ...T.row, marginBottom: 8 }}>
                <span style={T.league}>{data?.league?.toUpperCase() || 'UNKNOWN'}</span>
            </div>
            {entries.map(([key, value]) => (
                <div key={key} style={{ ...T.row, marginBottom: 5 }}>
                    <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: 'rgba(255,255,255,0.38)',
                        textTransform: 'capitalize',
                    }}>
                        {key}
                    </span>
                    <span style={{
                        fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)',
                        maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word',
                        fontVariantNumeric: 'tabular-nums',
                    }}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                </div>
            ))}
            {entries.length === 0 && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '20px 0' }}>
                    No data
                </div>
            )}
        </div>
    );
}

/* =========================================================
   GLASS SCENE (3D)
========================================================= */

function GlassScene({ data, sport, mouseRef }) {
    const groupRef = useRef();

    useFrame(() => {
        if (!groupRef.current || !mouseRef.current) return;
        const { x, y } = mouseRef.current;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y, x * 0.12, 0.06
        );
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
            groupRef.current.rotation.x, y * 0.12, 0.06
        );
    });

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 4, 2]} intensity={1.2} />

            {/* Light planes behind glass */}
            <mesh position={[-0.8, 0.6, -2]} rotation={[0, 0, 0.3]}>
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial color="#3060ff" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh position={[0.9, -0.4, -2.5]} rotation={[0, 0, -0.2]}>
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial color="#8040ff" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0.3, -3]} rotation={[0, 0, 0.1]}>
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial color="#20c8ff" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>

            {/* Sparkles */}
            <group position={[0, 0, -0.5]}>
                <Sparkles count={90} scale={5} size={0.7} speed={0.3} opacity={0.55} color="#a0c4ff" />
            </group>

            {/* Glass Slab */}
            <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.4}>
                <group ref={groupRef}>
                    <mesh>
                        <RoundedBox args={[3.2, 5.0, 0.18]} radius={0.12} smoothness={6}>
                            <MeshTransmissionMaterial
                                backside={true}
                                samples={12}
                                thickness={0.3}
                                roughness={0.04}
                                transmission={1}
                                ior={1.5}
                                chromaticAberration={0.06}
                                anisotropy={0.15}
                                distortion={0.1}
                                distortionScale={0.3}
                                temporalDistortion={0.2}
                                color="#c8d8ff"
                            />
                        </RoundedBox>
                    </mesh>

                    {/* Html portal — DOM content on glass */}
                    <Html
                        center
                        transform
                        position={[0, 0, 0.15]}
                        zIndexRange={[100, 0]}
                        style={{ width: '280px', pointerEvents: 'none' }}
                    >
                        <div style={{
                            fontFamily: FONT,
                            color: '#fff',
                            width: 280,
                            userSelect: 'none',
                        }}>
                            {sport === 'cricket' && <CricketLayout data={data} />}
                            {sport === 'football' && <FootballLayout data={data} />}
                            {sport === 'tennis' && <TennisLayout data={data} />}
                            {sport === 'badminton' && <BadmintonLayout data={data} />}
                            {sport === 'basketball' && <BasketballLayout data={data} />}
                            {sport === 'fallback' && <FallbackLayout data={data} />}
                        </div>
                    </Html>
                </group>
            </Float>

            <Environment preset="city" />
        </>
    );
}

/* =========================================================
   MAIN COMPONENT — SportsCard
========================================================= */

function SportsCard({ data }) {
    const wrapperRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    const sport = useMemo(() => detectSport(data?.league), [data?.league]);

    /* Mouse tracking on wrapper div */
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const onMove = (e) => {
            const rect = el.getBoundingClientRect();
            mouseRef.current = {
                x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
                y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
            };
        };
        const onLeave = () => {
            mouseRef.current = { x: 0, y: 0 };
        };
        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseleave', onLeave);
        return () => {
            el.removeEventListener('mousemove', onMove);
            el.removeEventListener('mouseleave', onLeave);
        };
    }, []);

    if (!data) return null;

    return (
        <motion.div
            ref={wrapperRef}
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
                width: 360,
                height: 560,
                position: 'relative',
                borderRadius: 28,
                overflow: 'hidden',
                cursor: 'default',
            }}
        >
            <Canvas
                gl={{ antialias: true, alpha: true }}
                camera={{ position: [0, 0, 6.5], fov: 42 }}
                dpr={[1, 2]}
                style={{ position: 'absolute', inset: 0 }}
            >
                <GlassScene data={data} sport={sport} mouseRef={mouseRef} />
            </Canvas>
        </motion.div>
    );
}

/* =========================================================
   EXPORTS
========================================================= */

export default SportsCard;
export { CricketLayout, FootballLayout, TennisLayout, BadmintonLayout, BasketballLayout };