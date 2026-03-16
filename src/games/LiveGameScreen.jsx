import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router";
import { loadGame, updateGameStatus, updateGameScore, appendGameEvent, replaceGameEvents } from "../firebase";
import { C, fontBase, fontDisplay, FORMATIONS } from "../shared/constants";
import { calcMinutes, abbreviateName, getPositionGroup } from "../shared/utils";
import PitchSVG from "../shared/PitchSVG";
import FieldPosition from "../shared/FieldPosition";
import GameHeader from "./GameHeader";
import StatBar from "./StatBar";
import EventsFeed from "./EventsFeed";

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
function BenchChip({ player, minuteCount, onClick, isSubSelected }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "4px 6px",
        minWidth: 48,
        flexShrink: 0,
        cursor: "pointer",
        borderRadius: 8,
        border: isSubSelected ? `2px solid ${C.orange}` : "2px solid transparent",
        background: isSubSelected ? "rgba(232,100,32,0.25)" : "transparent",
        transition: "all 0.15s ease",
        userSelect: "none",
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
      {minuteCount > 0 && (
        <div style={{
          fontFamily: fontBase,
          fontSize: 9,
          fontWeight: 700,
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1,
        }}>
          {minuteCount}m
        </div>
      )}
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
  const [displayMinute, setDisplayMinute] = useState(0);
  const startTsRef = useRef(null);
  const rafRef = useRef(null);

  // --- Tap-to-sub state (tap bench player, then tap field position to swap) ---
  const [subSource, setSubSource] = useState(null); // bench player selected for sub

  // --- Stat selection state ---
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

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

  // Update displayMinute only when minute changes to avoid expensive recalc every frame
  useEffect(() => {
    const newMinute = Math.floor(displaySeconds / 60);
    setDisplayMinute((prev) => (prev !== newMinute ? newMinute : prev));
  }, [displaySeconds]);

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

        const { opponent: opp, score: sc, status, lineup, halfStartTs: firestoreHalfStartTs } = data;
        const resolvedStatus = status || "setup";
        const resolvedScore = sc || { home: 0, away: 0 };

        // Build fieldPositions from lineup snapshot
        let resolvedFieldPositions = [];
        let resolvedBenchPlayers = [];

        if (lineup) {
          const { formation, lineup: lineupData, lineups, roster } = lineup;
          const positionDefs = FORMATIONS[formation] || [];
          // Support both new shape (lineup: [...]) and legacy (lineups: {"1": [...]})
          const lineupArray = Array.isArray(lineupData)
            ? lineupData
            : lineups && lineups["1"]
              ? lineups["1"]
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

        // Restart timer if game is in active half (Firestore has the halfStartTs)
        const resolvedHalfStartTs = firestoreHalfStartTs || null;
        if (
          (resolvedStatus === "1st-half" || resolvedStatus === "2nd-half") &&
          resolvedHalfStartTs
        ) {
          setHalfStartTs(resolvedHalfStartTs);
          startHalf(resolvedHalfStartTs);
          acquireWakeLock();
        }

        // Save to localStorage immediately so we can recover on reload
        saveStored("activeGameId", gameId);
        saveStored("gameStatus", resolvedStatus);
        saveStored("score", resolvedScore);
        saveStored("opponent", opp || "");
        saveStored("fieldPositions", resolvedFieldPositions);
        saveStored("benchPlayers", resolvedBenchPlayers);
        saveStored("events", data.events || []);
        saveStored("halfIntervals", []);
        saveStored("playerIntervals", {});
        saveStored("halfStartTs", resolvedHalfStartTs);

        // Also restore events from Firestore if available
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
        }

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
    updateGameStatus(gameId, "1st-half", now);
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
    setSelectedPlayerId(null);
    setSubSource(null);
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
    updateGameStatus(gameId, "2nd-half", now);
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
    setSelectedPlayerId(null);
    setSubSource(null);
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
  // Substitution handler — core logic for bench<->field swap during active game
  // ---------------------------------------------------------------------------
  const handleSubstitution = useCallback(
    (source, targetFieldIdx) => {
      // source: { type: "field"|"bench", idx: number|null, player: object }
      // targetFieldIdx: the field slot index being dropped on
      const isActiveHalf = gameStatus === "1st-half" || gameStatus === "2nd-half";

      if (source.type === "field" && source.idx !== undefined && source.idx !== null) {
        // Field-to-field swap: no sub event, just reposition
        const fromIdx = source.idx;
        if (fromIdx === targetFieldIdx) return;
        setFieldPositions((prev) => {
          const updated = [...prev];
          const tmp = updated[fromIdx];
          updated[fromIdx] = { ...updated[fromIdx], player: updated[targetFieldIdx].player };
          updated[targetFieldIdx] = { ...updated[targetFieldIdx], player: tmp.player };
          return updated;
        });
      } else if (source.type === "bench") {
        // Bench-to-field: swap the bench player with the field player at targetFieldIdx
        const benchPlayer = source.player;
        if (!benchPlayer) return;

        // Collect outgoing player from current state before updating
        const outgoingPlayer = fieldPositions[targetFieldIdx]?.player || null;

        setFieldPositions((prev) => {
          const updated = [...prev];
          updated[targetFieldIdx] = { ...updated[targetFieldIdx], player: benchPlayer };
          return updated;
        });

        setBenchPlayers((prev) => {
          const withoutBenchPlayer = prev.filter((p) => p.id !== benchPlayer.id);
          if (outgoingPlayer) {
            return [...withoutBenchPlayer, outgoingPlayer];
          }
          return withoutBenchPlayer;
        });

        // Only log sub event and update intervals during active halves
        if (isActiveHalf) {
          const now = Date.now();
          const currentHalf = gameStatus === "1st-half" ? 1 : 2;

          // Build sub event
          const subEvent = {
            id: crypto.randomUUID(),
            type: "sub",
            playerIn: { id: benchPlayer.id, name: benchPlayer.name, num: benchPlayer.num },
            playerOut: outgoingPlayer ? { id: outgoingPlayer.id, name: outgoingPlayer.name, num: outgoingPlayer.num } : null,
            half: currentHalf,
            t: now,
          };

          setEvents((prev) => [...prev, subEvent]);
          appendGameEvent(gameId, subEvent); // fire-and-forget

          // Update intervals: close outgoing, open incoming
          setPlayerIntervals((prev) => {
            const updated = { ...prev };

            // Close outgoing player's last open interval
            if (outgoingPlayer) {
              const outIntervals = updated[outgoingPlayer.id] || [];
              if (outIntervals.length > 0 && outIntervals[outIntervals.length - 1].outAt === null) {
                updated[outgoingPlayer.id] = outIntervals.map((interval, i) =>
                  i === outIntervals.length - 1 ? { ...interval, outAt: now } : interval
                );
              }
            }

            // Open new interval for incoming player
            const inIntervals = updated[benchPlayer.id] || [];
            updated[benchPlayer.id] = [...inIntervals, { inAt: now, outAt: null }];

            return updated;
          });
        }
        // During halftime: allow bench-to-field pre-positioning, no intervals updated
      }
    },
    [gameId, gameStatus, fieldPositions]
  );

  const handleBenchDrop = useCallback(
    (sourceFieldIdx) => {
      // Field-to-bench: remove player from field, add to bench
      const isActiveHalf = gameStatus === "1st-half" || gameStatus === "2nd-half";
      const leavingPlayer = fieldPositions[sourceFieldIdx]?.player;
      if (!leavingPlayer) return;

      setFieldPositions((prev) => {
        const updated = [...prev];
        updated[sourceFieldIdx] = { ...updated[sourceFieldIdx], player: null };
        return updated;
      });

      setBenchPlayers((prev) => [...prev, leavingPlayer]);

      if (isActiveHalf) {
        const now = Date.now();
        const currentHalf = gameStatus === "1st-half" ? 1 : 2;

        const subEvent = {
          id: crypto.randomUUID(),
          type: "sub",
          playerIn: null,
          playerOut: { id: leavingPlayer.id, name: leavingPlayer.name, num: leavingPlayer.num },
          half: currentHalf,
          t: now,
        };

        setEvents((prev) => [...prev, subEvent]);
        appendGameEvent(gameId, subEvent); // fire-and-forget

        // Close outgoing player's interval
        setPlayerIntervals((prev) => {
          const updated = { ...prev };
          const outIntervals = updated[leavingPlayer.id] || [];
          if (outIntervals.length > 0 && outIntervals[outIntervals.length - 1].outAt === null) {
            updated[leavingPlayer.id] = outIntervals.map((interval, i) =>
              i === outIntervals.length - 1 ? { ...interval, outAt: now } : interval
            );
          }
          return updated;
        });
      }
    },
    [gameId, gameStatus, fieldPositions]
  );

  // ---------------------------------------------------------------------------
  const isInteractive = gameStatus === "1st-half" || gameStatus === "2nd-half" || gameStatus === "halftime";

  // ---------------------------------------------------------------------------
  // Live minute calculations — recompute once per minute (when displayMinute changes)
  // ---------------------------------------------------------------------------
  const playerMinutes = useMemo(() => {
    const result = {};
    // Collect all player IDs across field and bench
    const allPlayerIds = new Set();
    fieldPositions.forEach(({ player }) => { if (player) allPlayerIds.add(player.id); });
    benchPlayers.forEach((p) => allPlayerIds.add(p.id));

    allPlayerIds.forEach((pid) => {
      const intervals = playerIntervals[pid] || [];
      result[pid] = calcMinutes(intervals, halfIntervals);
    });
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMinute, playerIntervals, halfIntervals, fieldPositions, benchPlayers]);

  // ---------------------------------------------------------------------------
  // Stat recording handlers
  // ---------------------------------------------------------------------------
  const isActiveHalfForStats = gameStatus === "1st-half" || gameStatus === "2nd-half";

  // Tap a bench player to select them for substitution
  const handleBenchTap = useCallback((player) => {
    if (!isInteractive) return;
    setSubSource((prev) => (prev?.id === player.id ? null : player));
    setSelectedPlayerId(null); // clear stat selection when picking a sub
  }, [isInteractive]);

  // Tap a field position — if a bench sub is queued, perform the swap; otherwise select for stats
  const handleFieldTap = useCallback((idx) => {
    if (subSource) {
      handleSubstitution({ type: "bench", idx: null, player: subSource }, idx);
      setSubSource(null);
      return;
    }
    const player = fieldPositions[idx]?.player;
    if (!player || !isActiveHalfForStats) return;
    setSelectedPlayerId((prev) => (prev === player.id ? null : player.id));
  }, [subSource, fieldPositions, isActiveHalfForStats, handleSubstitution]);

  // Determine the selected player's position group
  const selectedPositionGroup = useMemo(() => {
    if (!selectedPlayerId) return null;
    const slot = fieldPositions.find(({ player }) => player?.id === selectedPlayerId);
    if (!slot) return null;
    return getPositionGroup(slot.pos.label);
  }, [selectedPlayerId, fieldPositions]);

  // Selected player's abbreviated name for StatBar label
  const selectedPlayerName = useMemo(() => {
    if (!selectedPlayerId) return "";
    const slot = fieldPositions.find(({ player }) => player?.id === selectedPlayerId);
    return slot?.player ? abbreviateName(slot.player.name) : "";
  }, [selectedPlayerId, fieldPositions]);

  const handleStatTap = useCallback((statKey) => {
    if (!selectedPlayerId || !isActiveHalfForStats) return;
    const slot = fieldPositions.find(({ player }) => player?.id === selectedPlayerId);
    if (!slot?.player) return;

    const currentHalf = gameStatus === "1st-half" ? 1 : 2;
    const event = {
      id: crypto.randomUUID(),
      type: "stat",
      playerId: selectedPlayerId,
      playerName: abbreviateName(slot.player.name),
      stat: statKey,
      half: currentHalf,
      t: Date.now(),
    };

    setEvents((prev) => {
      const updated = [...prev, event];
      saveStored("events", updated);
      return updated;
    });

    appendGameEvent(gameId, event); // fire-and-forget

    // Auto-increment home score when recording a goal
    if (statKey === "goal") {
      setScore((prev) => {
        const newScore = { ...prev, home: prev.home + 1 };
        updateGameScore(gameId, newScore);
        return newScore;
      });
    }
  }, [selectedPlayerId, isActiveHalfForStats, fieldPositions, gameStatus, gameId]);

  const handleUndo = useCallback((eventId) => {
    // Find the event before removing it
    const removed = events.find((e) => e.id === eventId);

    setEvents((prev) => {
      const updated = prev.filter((e) => e.id !== eventId);
      saveStored("events", updated);
      replaceGameEvents(gameId, updated);
      return updated;
    });

    // Decrement home score when undoing a goal
    if (removed && removed.type === "stat" && removed.stat === "goal") {
      setScore((s) => {
        const newScore = { ...s, home: Math.max(0, s.home - 1) };
        updateGameScore(gameId, newScore);
        return newScore;
      });
    }
  }, [gameId, events]);

  // Stat badge counts — per field player for current half only
  const currentHalf = gameStatus === "1st-half" ? 1 : gameStatus === "2nd-half" ? 2 : null;

  const statCounts = useMemo(() => {
    const counts = {};
    if (!currentHalf) return counts;
    events.forEach((e) => {
      if (e.type === "stat" && e.half === currentHalf) {
        counts[e.playerId] = (counts[e.playerId] || 0) + 1;
      }
    });
    return counts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length, currentHalf]);

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

  const HEADER_HEIGHT = 56;

  return (
    <div
      style={{
        height: "100vh",
        background: C.navyDark,
        display: "flex",
        flexDirection: "column",
        fontFamily: fontBase,
        overflow: "hidden",
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
        onBack={() => { window.location.hash = "#/games"; }}
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

      {/* Scrollable content below fixed header */}
      <div style={{
        paddingTop: HEADER_HEIGHT,
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Bench section */}
        <div style={{
          flexShrink: 0,
          padding: "6px 12px 4px",
          background: "rgba(0,0,0,0.2)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          {/* Bench label */}
          <div style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "1.5px",
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            fontFamily: fontDisplay,
            marginBottom: 4,
          }}>
            BENCH
          </div>
          {/* Bench chips */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              overflowX: "auto",
              gap: 4,
              paddingBottom: 4,
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            {benchPlayers.length === 0 ? (
              <div
                style={{
                  fontFamily: fontBase,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.25)",
                  fontStyle: "italic",
                  padding: "8px 0",
                }}
              >
                No bench players
              </div>
            ) : (
              benchPlayers.map((player) => (
                <BenchChip
                  key={player.id}
                  player={player}
                  minuteCount={playerMinutes[player.id] || 0}
                  onClick={() => handleBenchTap(player)}
                  isSubSelected={subSource?.id === player.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Pitch area */}
        <div style={{ position: "relative", padding: "6px 10px 0" }}>
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
                borderRadius: 8,
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
          <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 3.5", borderRadius: 8, overflow: "visible" }}>
            {/* Green pitch background */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, #2d5a27 0%, #1e3d1b 100%)",
                borderRadius: 8,
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
                isHighlighted={isInteractive && !player}
                compact={false}
                minuteDisplay={
                  (gameStatus === "1st-half" || gameStatus === "2nd-half" || gameStatus === "halftime" || gameStatus === "completed") && player
                    ? String(playerMinutes[player.id] ?? 0)
                    : null
                }
                isSelected={!!player && player.id === selectedPlayerId}
                statCount={player ? (statCounts[player.id] || 0) : 0}
                onClick={isInteractive ? () => handleFieldTap(idx) : undefined}
              />
            ))}
          </div>
          {/* Bottom padding for GK name/minutes that extend below pitch */}
          <div style={{ height: 20 }} />
        </div>

        {/* Events feed below pitch */}
        <EventsFeed events={events} onUndo={handleUndo} />

        {/* Stat bar spacer — only when a player is selected and stat bar visible */}
        {isActiveHalfForStats && selectedPlayerId && <div style={{ height: 110 }} />}

        {/* Bottom safe area padding */}
        <div style={{ height: 8, flexShrink: 0 }} />
      </div>

      {/* Stat bar — fixed at bottom, visible during active halves */}
      {isActiveHalfForStats && (
        <StatBar
          positionGroup={selectedPositionGroup}
          playerName={selectedPlayerName}
          onStatTap={handleStatTap}
          disabled={false}
        />
      )}

    </div>
  );
}
