import React, { useRef, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  MeshTransmissionMaterial,
  RoundedBox,
  Html,
  Environment,
} from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

/* =========================================================
   0. CONSTANTS & LEAGUE MAPPING
========================================================= */

const LEAGUE_MAP = {
  // Cricket
  ipl: "cricket",
  bbl: "cricket",
  psl: "cricket",
  cpl: "cricket",
  t20wc: "cricket",
  // Football
  epl: "football",
  laliga: "football",
  bundesliga: "football",
  seriea: "football",
  ucl: "football",
  // Tennis
  wimbledon: "tennis",
  usopen: "tennis",
  rolandgarros: "tennis",
  ausopen: "tennis",
  atptour: "tennis",
  // Badminton
  bwf: "badminton",
  bwftour: "badminton",
  allengland: "badminton",
  // Basketball
  nba: "basketball",
  euroleague: "basketball",
  fiba: "basketball",
};

const SPORT_THEMES = {
  cricket: { accent: "#0ea5e9", glow: "#0284c7" },
  football: { accent: "#10b981", glow: "#059669" },
  tennis: { accent: "#a78bfa", glow: "#7c3aed" },
  badminton: { accent: "#f472b6", glow: "#ec4899" },
  basketball: { accent: "#fb923c", glow: "#f97316" },
  fallback: { accent: "#94a3b8", glow: "#64748b" },
};

/* =========================================================
   1. UTILITY HELPERS
========================================================= */

function detectSport(league) {
  if (!league) return "fallback";
  const key = league.toLowerCase().replace(/[\s\-_]/g, "");
  return LEAGUE_MAP[key] || "fallback";
}

function avatarUrl(teamName) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    teamName
  )}&background=1a1a2e&color=fff&size=128&bold=true&rounded=true`;
}

function getInitials(name) {
  if (!name) return "??";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* =========================================================
   2. SAFE IMAGE COMPONENT (with fallback initials)
========================================================= */

function TeamLogo({ name, size = 48, style = {} }) {
  const [failed, setFailed] = useState(false);

  const fallbackStyle = {
    width: size,
    height: size,
    borderRadius: "50%",
    background: "#1a1a2e",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.36,
    fontWeight: 800,
    letterSpacing: "0.5px",
    flexShrink: 0,
    ...style,
  };

  if (failed) {
    return <div style={fallbackStyle}>{getInitials(name)}</div>;
  }

  return (
    <img
      src={avatarUrl(name)}
      alt={name}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/* =========================================================
   3. CRICKET LAYOUT
   ─────────────────────────────────
   IPL                🔴 LIVE
   India
   145/1 (25.2)
   Pakistan
   310/10 (50)
   CRR: 5.73   •   RRR: 7.94
   India need 166 runs
   ─────────────────────────────────
========================================================= */

function CricketLayout({ data, accent }) {
  const crr = data.crr || data.currentRunRate || "";
  const rrr = data.rrr || data.requiredRunRate || "";
  const summary =
    data.summary || data.status || data.statusText || "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        width: "100%",
      }}
    >
      {/* Team A Name */}
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: "#fff",
          marginTop: 4,
        }}
      >
        {data.teamA || "Team A"}
      </div>
      {/* Team A Score */}
      <div
        style={{
          fontSize: 34,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "-1px",
          lineHeight: 1.1,
        }}
      >
        {data.scoreA || "0/0"}
      </div>

      {/* Team B Name */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "rgba(255,255,255,0.65)",
          marginTop: 14,
        }}
      >
        {data.teamB || "Team B"}
      </div>
      {/* Team B Score */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.2,
        }}
      >
        {data.scoreB || "0/0"}
      </div>

      {/* CRR / RRR Row */}
      {(crr || rrr) && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,0.55)",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          {crr && <span>CRR: {crr}</span>}
          {crr && rrr && (
            <span style={{ color: "rgba(255,255,255,0.25)" }}>•</span>
          )}
          {rrr && <span>RRR: {rrr}</span>}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div
          style={{
            marginTop: crr || rrr ? 8 : 16,
            paddingTop: crr || rrr ? 0 : 12,
            borderTop:
              crr || rrr ? "none" : "1px solid rgba(255,255,255,0.08)",
            fontSize: 14,
            fontWeight: 700,
            color: accent,
          }}
        >
          {summary}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   4. FOOTBALL LAYOUT
   ─────────────────────────────────
   Premier League         🔴 LIVE
   [ Logo ]   2 – 1   [ Logo ]
    Barcelona         Madrid
              67'
   ⚽ Lewandowski 23', 58'
   ⚽ Bellingham 41'
   Barcelona leading
   ─────────────────────────────────
========================================================= */

function FootballLayout({ data, accent }) {
  const minute = data.minute || data.time || "";
  const goalsA = data.goalsA || data.scorersA || [];
  const goalsB = data.goalsB || data.scorersB || [];
  const summary =
    data.summary || data.status || data.statusText || "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        width: "100%",
        alignItems: "center",
      }}
    >
      {/* Teams with Logos + Score */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          width: "100%",
          marginTop: 4,
        }}
      >
        {/* Team A */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            flex: 1,
          }}
        >
          <TeamLogo name={data.teamA || "Team A"} size={48} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              textAlign: "center",
              maxWidth: 90,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {data.teamA || "Team A"}
          </span>
        </div>

        {/* Score */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span style={{ fontSize: 40, fontWeight: 800, color: "#fff" }}>
            {data.scoreA ?? "0"}
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 300,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            –
          </span>
          <span style={{ fontSize: 40, fontWeight: 800, color: "#fff" }}>
            {data.scoreB ?? "0"}
          </span>
        </div>

        {/* Team B */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            flex: 1,
          }}
        >
          <TeamLogo name={data.teamB || "Team B"} size={48} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              textAlign: "center",
              maxWidth: 90,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {data.teamB || "Team B"}
          </span>
        </div>
      </div>

      {/* Minute */}
      {minute && (
        <div
          style={{
            marginTop: 10,
            fontSize: 22,
            fontWeight: 800,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {minute}'
        </div>
      )}

      {/* Goals */}
      {(goalsA.length > 0 || goalsB.length > 0) && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {goalsA.map((g, i) => (
            <div
              key={`a-${i}`}
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.65)",
                fontWeight: 500,
              }}
            >
              ⚽ {g}
            </div>
          ))}
          {goalsB.map((g, i) => (
            <div
              key={`b-${i}`}
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.65)",
                fontWeight: 500,
              }}
            >
              ⚽ {g}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div
          style={{
            marginTop: 8,
            paddingTop:
              goalsA.length > 0 || goalsB.length > 0 ? 0 : 10,
            borderTop:
              goalsA.length > 0 || goalsB.length > 0
                ? "none"
                : "1px solid rgba(255,255,255,0.08)",
            fontSize: 13,
            fontWeight: 700,
            color: accent,
            textAlign: "center",
            width: "100%",
          }}
        >
          {summary}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   5. TENNIS LAYOUT
   ─────────────────────────────────
   Wimbledon            LIVE
   Nadal        6   3   4
   Federer      4   6   2
   Current: 40–30
   ─────────────────────────────────
========================================================= */

function TennisLayout({ data, accent }) {
  const setsA = data.setsA || data.sets?.[0] || [];
  const setsB = data.setsB || data.sets?.[1] || [];
  const currentScore =
    data.currentScore || data.gameScore || "";

  const renderSetRow = (name, sets, isPrimary) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <span
        style={{
          fontSize: 17,
          fontWeight: isPrimary ? 700 : 600,
          color: isPrimary ? "#fff" : "rgba(255,255,255,0.7)",
          minWidth: 110,
        }}
      >
        {name}
      </span>
      <div
        style={{
          display: "flex",
          gap: 18,
          alignItems: "center",
        }}
      >
        {(Array.isArray(sets) ? sets : [sets]).map((s, i) => (
          <span
            key={i}
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: isPrimary ? "#fff" : "rgba(255,255,255,0.7)",
              minWidth: 20,
              textAlign: "center",
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        width: "100%",
        marginTop: 8,
      }}
    >
      {renderSetRow(data.playerA || data.teamA || "Player A", setsA, true)}
      {renderSetRow(data.playerB || data.teamB || "Player B", setsB, false)}

      {currentScore && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: 14,
            fontWeight: 700,
            color: accent,
          }}
        >
          Current: {currentScore}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   6. BADMINTON LAYOUT
   ─────────────────────────────────
   BWF Tour             LIVE
   Player A     21   18
   Player B     18   21
   Current: 12–10
   ─────────────────────────────────
========================================================= */

function BadmintonLayout({ data, accent }) {
  const gamesA = data.gamesA || data.sets?.[0] || [];
  const gamesB = data.gamesB || data.sets?.[1] || [];
  const currentScore =
    data.currentScore || data.gameScore || "";

  const renderGameRow = (name, games, isPrimary) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <span
        style={{
          fontSize: 17,
          fontWeight: isPrimary ? 700 : 600,
          color: isPrimary ? "#fff" : "rgba(255,255,255,0.7)",
          minWidth: 110,
        }}
      >
        {name}
      </span>
      <div
        style={{
          display: "flex",
          gap: 18,
          alignItems: "center",
        }}
      >
        {(Array.isArray(games) ? games : [games]).map((g, i) => (
          <span
            key={i}
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: isPrimary ? "#fff" : "rgba(255,255,255,0.7)",
              minWidth: 24,
              textAlign: "center",
            }}
          >
            {g}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        width: "100%",
        marginTop: 8,
      }}
    >
      {renderGameRow(
        data.playerA || data.teamA || "Player A",
        gamesA,
        true
      )}
      {renderGameRow(
        data.playerB || data.teamB || "Player B",
        gamesB,
        false
      )}

      {currentScore && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: 14,
            fontWeight: 700,
            color: accent,
          }}
        >
          Current: {currentScore}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   7. BASKETBALL LAYOUT
   ─────────────────────────────────
   NBA                  Q3 LIVE
   [Logo] Lakers        89
   [Logo] Warriors      92
   Q3 – 5:32
   Warriors lead by 3
   ─────────────────────────────────
========================================================= */

function BasketballLayout({ data, accent }) {
  const quarter = data.quarter || data.period || "";
  const clock = data.clock || data.time || "";
  const summary =
    data.summary || data.status || data.statusText || "";

  const renderTeamRow = (name, score, isPrimary) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TeamLogo name={name} size={34} />
        <span
          style={{
            fontSize: 17,
            fontWeight: isPrimary ? 700 : 600,
            color: isPrimary ? "#fff" : "rgba(255,255,255,0.8)",
          }}
        >
          {name}
        </span>
      </div>
      <span
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: isPrimary ? "#fff" : "rgba(255,255,255,0.8)",
        }}
      >
        {score ?? "0"}
      </span>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        width: "100%",
        marginTop: 4,
      }}
    >
      {renderTeamRow(data.teamA || "Team A", data.scoreA, true)}
      {renderTeamRow(data.teamB || "Team B", data.scoreB, false)}

      {/* Quarter + Clock */}
      {(quarter || clock) && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: 14,
            fontWeight: 600,
            color: "rgba(255,255,255,0.55)",
            textAlign: "center",
          }}
        >
          {quarter}
          {quarter && clock ? " – " : ""}
          {clock}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: accent,
            textAlign: "center",
          }}
        >
          {summary}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   8. FALLBACK LAYOUT (raw key-value pairs)
========================================================= */

function FallbackLayout({ data, accent }) {
  const entries = Object.entries(data || {}).filter(
    ([k]) => k !== "league"
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
        marginTop: 4,
      }}
    >
      {entries.map(([key, value]) => (
        <div
          key={key}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            fontSize: 13,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              textTransform: "capitalize",
              flexShrink: 0,
            }}
          >
            {key}
          </span>
          <span
            style={{
              fontWeight: 700,
              color: "#fff",
              textAlign: "right",
              wordBreak: "break-word",
              maxWidth: "65%",
            }}
          >
            {typeof value === "object"
              ? JSON.stringify(value)
              : String(value)}
          </span>
        </div>
      ))}
      {entries.length === 0 && (
        <div
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          No data available
        </div>
      )}
    </div>
  );
}

/* =========================================================
   9. DOM CONTENT SHELL (Header + Sport Router)
========================================================= */

function DOMScoreContent({ data, sport, accent, isLive }) {
  const leagueLabel = data.league || sport.toUpperCase();

  const quarterLabel =
    sport === "basketball" && data.quarter
      ? `${data.quarter} `
      : "";

  return (
    <div
      style={{
        width: 312,
        padding: "26px 24px",
        color: "white",
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
        background: "transparent",
        boxSizing: "border-box",
        userSelect: "none",
      }}
    >
      {/* ── GLOBAL HEADER ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "rgba(255,255,255,0.75)",
            letterSpacing: "0.4px",
            textTransform: "uppercase",
          }}
        >
          {leagueLabel}
        </span>

        {isLive && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#ef4444",
                boxShadow: "0 0 10px #ef4444, 0 0 20px rgba(239,68,68,0.3)",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#ef4444",
                letterSpacing: "1px",
              }}
            >
              {quarterLabel}LIVE
            </span>
          </div>
        )}
      </div>

      {/* ── SPORT LAYOUT ROUTER ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sport}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {sport === "cricket" && (
            <CricketLayout data={data} accent={accent} />
          )}
          {sport === "football" && (
            <FootballLayout data={data} accent={accent} />
          )}
          {sport === "tennis" && (
            <TennisLayout data={data} accent={accent} />
          )}
          {sport === "badminton" && (
            <BadmintonLayout data={data} accent={accent} />
          )}
          {sport === "basketball" && (
            <BasketballLayout data={data} accent={accent} />
          )}
          {sport === "fallback" && (
            <FallbackLayout data={data} accent={accent} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   10. VOLUMETRIC LIGHT RAYS (WebGL)
========================================================= */

function VolumetricRays({ accent, glow }) {
  const meshRef = useRef();
  const startTime = useRef(Date.now());

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = (Date.now() - startTime.current) / 1000;
    meshRef.current.rotation.z = elapsed * 0.15;
    meshRef.current.material.opacity =
      0.04 + Math.sin(elapsed * 0.8) * 0.015;
  });

  return (
    <group>
      {/* Central ambient glow */}
      <mesh position={[0, 0, -1.5]}>
        <sphereGeometry args={[2.8, 32, 32]} />
        <meshBasicMaterial
          color={glow}
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>

      {/* Sweeping ray disk */}
      <mesh ref={meshRef} position={[0, 0, -1.2]}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.04}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Top-right accent bloom */}
      <mesh position={[2.2, 1.6, -1]}>
        <sphereGeometry args={[1.2, 24, 24]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Bottom-left accent bloom */}
      <mesh position={[-2, -1.4, -1]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color={glow}
          transparent
          opacity={0.06}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   11. GLASS SLAB WITH MOUSE PARALLAX
========================================================= */

function GlassSlab({ children, mousePos, accent }) {
  const slabRef = useRef();
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame(() => {
    if (!slabRef.current) return;

    // Target rotation from mouse position (-1 to 1 range)
    targetRotation.current.y = mousePos.current.x * 0.18;
    targetRotation.current.x = -mousePos.current.y * 0.12;

    // Smooth lerp
    slabRef.current.rotation.y = THREE.MathUtils.lerp(
      slabRef.current.rotation.y,
      targetRotation.current.y,
      0.08
    );
    slabRef.current.rotation.x = THREE.MathUtils.lerp(
      slabRef.current.rotation.x,
      targetRotation.current.x,
      0.08
    );
  });

  return (
    <group ref={slabRef}>
      {/* Glass body */}
      <mesh>
        <RoundedBox args={[3.8, 5.6, 0.12]} radius={0.22} smoothness={8}>
          <MeshTransmissionMaterial
            thickness={0.5}
            roughness={0.12}
            transmission={0.97}
            ior={1.25}
            chromaticAberration={0.04}
            distortion={0.1}
            distortionScale={0.2}
            temporalDistortion={0.04}
            color="#ffffff"
            anisotropy={0.3}
            backside
            backsideThickness={0.3}
            samples={6}
            resolution={256}
          />
        </RoundedBox>
      </mesh>

      {/* Subtle edge highlight */}
      <mesh position={[0, 0, 0.065]}>
        <RoundedBox args={[3.82, 5.62, 0.005]} radius={0.22} smoothness={8}>
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.04}
            depthWrite={false}
          />
        </RoundedBox>
      </mesh>

      {/* Html portal for DOM content */}
      <Html
        transform
        distanceFactor={2.4}
        position={[0, 0, 0.08]}
        zIndexRange={[100, 0]}
        style={{
          pointerEvents: "none",
        }}
      >
        {children}
      </Html>
    </group>
  );
}

/* =========================================================
   12. SCENE LIGHTING
========================================================= */

function SceneLights({ accent, glow }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        color="#f8fafc"
      />
      <pointLight
        position={[3, 2, 3]}
        intensity={2.5}
        color={accent}
        distance={12}
        decay={2}
      />
      <pointLight
        position={[-3, -2, 2]}
        intensity={1.8}
        color="#e2e8f0"
        distance={10}
        decay={2}
      />
      <pointLight
        position={[0, -3, 1]}
        intensity={1}
        color={glow}
        distance={8}
        decay={2}
      />
    </>
  );
}

/* =========================================================
   13. MAIN EXPORT — SportsCard
========================================================= */

export default function SportsCard({ data }) {
  const mousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Detect sport
  const sport = useMemo(
    () => detectSport(data?.league),
    [data?.league]
  );
  const theme = SPORT_THEMES[sport] || SPORT_THEMES.fallback;

  // Determine live status
  const isLive = useMemo(() => {
    if (!data) return false;
    const status = (
      data.status ||
      data.statusText ||
      data.summary ||
      ""
    ).toLowerCase();
    if (status.includes("live")) return true;
    if (data.isLive === true) return true;
    // Heuristic: if scores are present and game is not "won"/"completed"/"finished"
    if (
      data.scoreA &&
      data.scoreA !== "-" &&
      !status.includes("won") &&
      !status.includes("completed") &&
      !status.includes("finished") &&
      !status.includes("final")
    ) {
      return true;
    }
    return false;
  }, [data]);

  // Mouse handler
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mousePos.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mousePos.current = { x: 0, y: 0 };
  }, []);

  if (!data) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: 360,
        height: 560,
        position: "relative",
        borderRadius: 28,
        overflow: "hidden",
        cursor: "default",
      }}
    >
      {/* ── BACKGROUND LAYERS ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(145deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)",
          zIndex: 0,
        }}
      />

      {/* Radial accent glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 65% 30%, ${theme.accent}18 0%, transparent 55%)`,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Secondary glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 20% 85%, ${theme.glow}12 0%, transparent 50%)`,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Noise overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "128px 128px",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* ── 3D CANVAS ── */}
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 40 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
        }}
      >
        <SceneLights accent={theme.accent} glow={theme.glow} />
        <VolumetricRays accent={theme.accent} glow={theme.glow} />

        <GlassSlab mousePos={mousePos} accent={theme.accent}>
          <DOMScoreContent
            data={data}
            sport={sport}
            accent={theme.accent}
            isLive={isLive}
          />
        </GlassSlab>

        <Environment preset="city" />
      </Canvas>

      {/* ── BORDER GLINT (CSS overlay) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.06)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </div>
  );
}