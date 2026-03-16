import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router";
import { loadGame, updateGameStatus, updateGameScore } from "../firebase";
import { C, fontBase, fontDisplay, FORMATIONS } from "../shared/constants";
import PitchSVG from "../shared/PitchSVG";
import FieldPosition from "../shared/FieldPosition";
import GameHeader from "./GameHeader";

// =============================================
// LIVE GAME SCREEN — orchestrator
// =============================================

// ---------------------------------------------------------------------------
// localStorage helpers (same pattern as MadeiraLineupPlanner)
// ---------------------------------------------------------------------------
const loadStored = (key, fallback) => {
  try {
    const v = localStorage.getItem(`madeira_${key}`);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const saveStored = (key, value) => {
  try {
    localStorage.setItem(`madeira_${key}`, JSON.stringify(value));
  } catch {}
};

const clearGameStorage = () => {
  const keys = [
    "activeGameId",
    "gameStatus",
    "halfStartTs",
    "fieldPositions",
    "benchPlayers",
    "events",
    "halfIntervals",
    "playerIntervals",
    "score",
    "opponent",
  ];
  keys.forEach((k) => {
    try {
      localStorage.removeItem(`madeira_${k}`);
    } catch {}
  });
};

// ---------------------------------------------------------------------------
// Bench chip for the horizontal bench strip
// ---------------------------------------------------------------------------
function BenchChip({ player }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "4px 6px",
        minWidth: 48,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: `linear-gradient(145deg, ${C.navy}, ${C.navyLight})`,
          border: `2px solid rgba(255,255,255,0.25)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontDisplay,
          fontWeight: 800,
          fontSize: 14,
          color: "rgba(255,255,255,0.8)",
        }}
      >
        {player.num}
      </div>
      <div
        style={{
          fontFamily: fontBase,
          fontSize: 10,
          fontWeight: 600,
          color: "rgba(255,255,255,0.55)",
          maxWidth: 52,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        {player.name.split(" ")[0]}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function LiveGameScreen() {
  const { id: gameId } = useParams();

  // --- Game state ---
  const [gameStatus, setGameStatus] = useState("setup");
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [opponent, setOpponent] = useState("");
  const [fieldPositions, setFieldPositions] = useState([]);
  const [benchPlayers, setBenchPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [halfIntervals, setHalfIntervals] = useState([]);
  const [playerIntervals, setPlayerIntervals] = useState({});
  const [halfStartTs, setHalfStartTs] = useState(null);

  // --- Timer state ---
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const startTsRef = useRef(null);
  const rafRef = useRef(null);

  // --- UI state ---
  const [loading, setLoading] = useState(true);
  const [resumeBanner, setResumeBanner] = useState(false);
  const [resumeOpponent, setResumeOpponent] = useState("");

  // Wake lock
  const wakeLockRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Wake Lock
  // ---------------------------------------------------------------------------
  const acquireWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch {
      // Graceful fallback — WebKit bug #254545
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
    }
  }, []);

  // Reacquire wake lock on visibility change when game is active
  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        (gameStatus === "1st-half" || gameStatus === "2nd-half")
      ) {
        acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [gameStatus, acquireWakeLock]);

  // ---------------------------------------------------------------------------
  // Drift-proof timer using requestAnimationFrame
  // ---------------------------------------------------------------------------
  const tick = useCallback(() => {
    if (!startTsRef.current) return;
    const elapsed = Math.floor((Date.now() - startTsRef.current) / 1000);
    setDisplaySeconds((prev) => {
      if (prev !== elapsed) return elapsed;
      return prev;
    });
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startHalf = useCallback(
    (ts) => {
      startTsRef.current = ts;
      rafRef.current = requestAnimationFrame(tick);
    },
    [tick]
  );

  const stopTimer = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startTsRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  // ---------------------------------------------------------------------------
  // Load game on mount — check localStorage first for crash recovery
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const storedId = loadStored("activeGameId", null);

    if (storedId === gameId) {
      // Crash recovery: restore from localStorage
      const status = loadStored("gameStatus", "setup");
      const storedScore = loadStored("score", { home: 0, away: 0 });
      const storedOpponent = loadStored("opponent", "");
      const storedFieldPositions = loadStored("fieldPositions", []);
      const storedBenchPlayers = loadStored("benchPlayers", []);
      const storedEvents = loadStored("events", []);
      const storedHalfIntervals = loadStored("halfIntervals", []);
      const storedPlayerIntervals = loadStored("playerIntervals", {});
      const storedHalfStartTs = loadStored("halfStartTs", null);

      setGameStatus(status);
      setScore(storedScore);
      setOpponent(storedOpponent);
      setFieldPositions(storedFieldPositions);
      setBenchPlayers(storedBenchPlayers);
      setEvents(storedEvents);
      setHalfIntervals(storedHalfIntervals);
      setPlayerIntervals(storedPlayerIntervals);
      setHalfStartTs(storedHalfStartTs);

      // Restart timer if in active half
      if (
        (status === "1st-half" || status === "2nd-half") &&
        storedHalfStartTs
      ) {
        startHalf(storedHalfStartTs);
      }

      setResumeOpponent(storedOpponent);
      setResumeBanner(true);
      setTimeout(() => setResumeBanner(false), 2000);
      setLoading(false);
    } else {
      // Fresh load from Firestore
      loadGame(gameId).then((data) => {
        if (!data) {
          setLoading(false);
          return;
        }

        const { opponent: opp, score: sc, status, lineup } = data;
        const resolvedStatus = status || "setup";
        const resolvedScore = sc || { home: 0, away: 0 };

        // Build fieldPositions from lineup snapshot
        let resolvedFieldPositions = [];
        let resolvedBenchPlayers = [];

        if (lineup) {
          const { formation, lineups, roster } = lineup;
          // lineups comes from MadeiraLineupPlanner's state:
          // { [formationKey]: [playerId | null, ...] }
          // From createGame: lineup = { formation, lineups, roster }
          const positionDefs = FORMATIONS[formation] || [];
          const lineupArray =
            lineups && lineups[formation]
              ? lineups[formation]
              : Array.isArray(lineups)
              ? lineups
              : [];

          const assignedIds = lineupArray.filter(Boolean);

          resolvedFieldPositions = positionDefs.map((pos, idx) => {
            const playerId = lineupArray[idx];
            const player = playerId
              ? (roster || []).find((p) => p.id === playerId)
              : null;
            return { pos, player };
          });

          resolvedBenchPlayers = (roster || []).filter(
            (p) => !assignedIds.includes(p.id)
          );
        }

        setGameStatus(resolvedStatus);
        setScore(resolvedScore);
        setOpponent(opp || "");
        setFieldPositions(resolvedFieldPositions);
        setBenchPlayers(resolvedBenchPlayers);

        // Save to localStorage immediately so we can recover on reload
        saveStored("activeGameId", gameId);
        saveStored("gameStatus", resolvedStatus);
        saveStored("score", resolvedScore);
        saveStored("opponent", opp || "");
        saveStored("fieldPositions", resolvedFieldPositions);
        saveStored("benchPlayers", resolvedBenchPlayers);
        saveStored("events", []);
        saveStored("halfIntervals", []);
        saveStored("playerIntervals", {});
        saveStored("halfStartTs", null);

        setLoading(false);
      });
    }
  }, [gameId, startHalf]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Persist state to localStorage on every mutation
  // ---------------------------------------------------------------------------
  useEffect(() => { saveStored("gameStatus", gameStatus); }, [gameStatus]);
  useEffect(() => { saveStored("score", score); }, [score]);
  useEffect(() => { saveStored("opponent", opponent); }, [opponent]);
  useEffect(() => { saveStored("fieldPositions", fieldPositions); }, [fieldPositions]);
  useEffect(() => { saveStored("benchPlayers", benchPlayers); }, [benchPlayers]);
  useEffect(() => { saveStored("events", events); }, [events]);
  useEffect(() => { saveStored("halfIntervals", halfIntervals); }, [halfIntervals]);
  useEffect(() => { saveStored("playerIntervals", playerIntervals); }, [playerIntervals]);
  useEffect(() => { saveStored("halfStartTs", halfStartTs); }, [halfStartTs]);

  // ---------------------------------------------------------------------------
  // State machine transitions
  // ---------------------------------------------------------------------------

  const handleStartGame = useCallback(() => {
    const now = Date.now();
    const newIntervals = [{ startAt: now, endAt: null }];
    const newPlayerIntervals = {};
    fieldPositions.forEach(({ player }) => {
      if (player) {
        newPlayerIntervals[player.id] = [{ inAt: now, outAt: null }];
      }
    });

    setGameStatus("1st-half");
    setHalfStartTs(now);
    setHalfIntervals(newIntervals);
    setPlayerIntervals(newPlayerIntervals);
    saveStored("activeGameId", gameId);
    saveStored("halfStartTs", now);

    startHalf(now);
    acquireWakeLock();
    updateGameStatus(gameId, "1st-half");
  }, [gameId, fieldPositions, startHalf, acquireWakeLock]);

  const handleEndHalf = useCallback(() => {
    const now = Date.now();
    stopTimer();
    releaseWakeLock();

    // Close current half interval
    setHalfIntervals((prev) =>
      prev.map((interval, i) =>
        i === prev.length - 1 ? { ...interval, endAt: now } : interval
      )
    );

    // Close all active player intervals
    setPlayerIntervals((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((pid) => {
        updated[pid] = updated[pid].map((interval, i) =>
          i === updated[pid].length - 1 && interval.outAt === null
            ? { ...interval, outAt: now }
            : interval
        );
      });
      return updated;
    });

    setGameStatus("halftime");
    setDisplaySeconds(0);
    updateGameStatus(gameId, "halftime");
  }, [gameId, stopTimer, releaseWakeLock]);

  const handleStartSecondHalf = useCallback(() => {
    const now = Date.now();

    // Open a new half interval
    setHalfIntervals((prev) => [...prev, { startAt: now, endAt: null }]);

    // Re-open player intervals for all on-field players
    setPlayerIntervals((prev) => {
      const updated = { ...prev };
      fieldPositions.forEach(({ player }) => {
        if (player) {
          const existing = updated[player.id] || [];
          updated[player.id] = [...existing, { inAt: now, outAt: null }];
        }
      });
      return updated;
    });

    setGameStatus("2nd-half");
    setHalfStartTs(now);
    saveStored("halfStartTs", now);

    startHalf(now);
    acquireWakeLock();
    updateGameStatus(gameId, "2nd-half");
  }, [gameId, fieldPositions, startHalf, acquireWakeLock]);

  const handleEndGame = useCallback(() => {
    const now = Date.now();
    stopTimer();
    releaseWakeLock();

    // Close current half interval
    setHalfIntervals((prev) =>
      prev.map((interval, i) =>
        i === prev.length - 1 ? { ...interval, endAt: now } : interval
      )
    );

    // Close all active player intervals
    setPlayerIntervals((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((pid) => {
        updated[pid] = updated[pid].map((interval, i) =>
          i === updated[pid].length - 1 && interval.outAt === null
            ? { ...interval, outAt: now }
            : interval
        );
      });
      return updated;
    });

    setGameStatus("completed");
    setDisplaySeconds(0);
    updateGameStatus(gameId, "completed");
    clearGameStorage();
  }, [gameId, stopTimer, releaseWakeLock]);

  const handleScoreChange = useCallback(
    (side, delta) => {
      setScore((prev) => {
        const newVal = Math.max(0, prev[side] + delta);
        const newScore = { ...prev, [side]: newVal };
        updateGameScore(gameId, newScore);
        return newScore;
      });
    },
    [gameId]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: C.navyDark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.4)",
          fontFamily: fontBase,
          fontSize: 14,
        }}
      >
        Loading game...
      </div>
    );
  }

  // Estimate header height: ~110px (score row + timer row + safe area)
  const HEADER_HEIGHT = 110;
  const BENCH_HEIGHT = 72;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.navyDark,
        display: "flex",
        flexDirection: "column",
        fontFamily: fontBase,
        overflowX: "hidden",
      }}
    >
      {/* Fixed Header */}
      <GameHeader
        score={score}
        opponent={opponent}
        displaySeconds={displaySeconds}
        gameStatus={gameStatus}
        onScoreChange={handleScoreChange}
        onEndHalf={handleEndHalf}
        onStartSecondHalf={handleStartSecondHalf}
        onEndGame={handleEndGame}
      />

      {/* Resume banner */}
      {resumeBanner && (
        <div
          style={{
            position: "fixed",
            top: HEADER_HEIGHT + 8,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#4CAFB6",
            color: C.white,
            fontFamily: fontBase,
            fontSize: 13,
            fontWeight: 700,
            padding: "8px 16px",
            borderRadius: 20,
            zIndex: 300,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          Game in progress — vs {resumeOpponent}
        </div>
      )}

      {/* Content below fixed header */}
      <div style={{ paddingTop: HEADER_HEIGHT, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Bench strip */}
        <div
          style={{
            height: BENCH_HEIGHT,
            display: "flex",
            alignItems: "center",
            overflowX: "auto",
            overflowY: "hidden",
            padding: "0 12px",
            gap: 4,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.2)",
            flexShrink: 0,
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
          {benchPlayers.length === 0 ? (
            <div
              style={{
                fontFamily: fontBase,
                fontSize: 12,
                color: "rgba(255,255,255,0.25)",
                fontStyle: "italic",
              }}
            >
              No bench players
            </div>
          ) : (
            benchPlayers.map((player) => (
              <BenchChip key={player.id} player={player} />
            ))
          )}
        </div>

        {/* Pitch area */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {/* "Start Game" overlay — shown when status is setup */}
          {gameStatus === "setup" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
                gap: 16,
                background: "rgba(17,27,58,0.75)",
                backdropFilter: "blur(2px)",
              }}
            >
              <div
                style={{
                  fontFamily: fontDisplay,
                  fontSize: 20,
                  fontWeight: 800,
                  color: C.white,
                }}
              >
                Ready to kick off
              </div>
              <button
                onClick={handleStartGame}
                style={{
                  background: C.orange,
                  border: "none",
                  borderRadius: 12,
                  color: C.white,
                  fontFamily: fontBase,
                  fontSize: 16,
                  fontWeight: 700,
                  padding: "14px 36px",
                  cursor: "pointer",
                  boxShadow: `0 4px 20px ${C.orangeGlow}`,
                  letterSpacing: "0.3px",
                }}
              >
                Start Game
              </button>
              <div
                style={{
                  fontFamily: fontBase,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                vs {opponent}
              </div>
            </div>
          )}

          {/* Pitch */}
          <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 340 }}>
            {/* Green pitch background */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, #2d5a27 0%, #1e3d1b 100%)",
              }}
            />
            <PitchSVG />

            {/* Field positions */}
            {fieldPositions.map(({ pos, player }, idx) => (
              <FieldPosition
                key={idx}
                pos={pos}
                player={player}
                idx={idx}
                isHighlighted={false}
                compact={false}
              />
            ))}
          </div>
        </div>

        {/* Bottom reserved area for Plans 05-03/05-04 */}
        <div style={{ height: 0 }} />
      </div>
    </div>
  );
}
