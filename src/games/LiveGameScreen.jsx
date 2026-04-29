import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { loadGame, updateGameStatus, updateGameScore, appendGameEvent, replaceGameEvents, finalizeGame, updateSeasonStats, updateGame } from "../firebase";
import { getSeasonId, computeSeasonDeltas } from "../shared/seasonUtils";
import { C, fontBase, fontDisplay } from "../shared/constants";
import { FORMATIONS } from "../shared/formations";
import { GAME_STRUCTURE, ALLOWED_FORMATIONS } from "../config";
import {
  INITIAL_ACTIVE_STATUS,
  isActiveStatus,
  isBreakStatus,
  getBreakStatusAfter,
  getNextActiveStatus,
  getNextActiveStatusFromHalftime,
  getPeriodNumber,
} from "../shared/gameStructure";
import { calcMinutes, abbreviateName, getPositionGroup, formatJerseyNum } from "../shared/utils";
import { computeBench, computeEmptySlotIndices } from "./lineupUtils";
import PitchSVG from "../shared/PitchSVG";
import FieldPosition from "../shared/FieldPosition";
import GameHeader from "./GameHeader";
import StatBar from "./StatBar";
import EventsFeed from "./EventsFeed";
import DeleteGameButton from "./DeleteGameButton";

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
    "gameMeta",
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
function BenchChip({ player, displayName, minuteCount, onClick, isSubSelected }) {
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
        {formatJerseyNum(player.num) ?? ""}
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
        {displayName || player.name.split(" ")[0]}
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
  const navigate = useNavigate();

  // --- Game state ---
  const [game, setGame] = useState(null); // stores { date, lineup } for season stats computation
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
  const [pendingSwapIdx, setPendingSwapIdx] = useState(null); // field idx awaiting swap target

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
        isActiveStatus(gameStatus)
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
      const storedGameMeta = loadStored("gameMeta", null);

      setGame(storedGameMeta);
      setGameStatus(status);
      setScore(storedScore);
      setOpponent(storedOpponent);
      setFieldPositions(storedFieldPositions);
      setBenchPlayers(storedBenchPlayers);
      setEvents(storedEvents);
      setHalfIntervals(storedHalfIntervals);
      setPlayerIntervals(storedPlayerIntervals);
      setHalfStartTs(storedHalfStartTs);

      // Restart timer if in an active period (1st-half/2nd-half/q1/q2/q3/q4)
      if (
        isActiveStatus(status) &&
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

        const { opponent: opp, score: sc, status, lineup, date, halfStartTs: firestoreHalfStartTs } = data;
        const resolvedStatus = status || "setup";
        const resolvedScore = sc || { home: 0, away: 0 };

        // Build fieldPositions from lineup snapshot
        let resolvedFieldPositions = [];
        let resolvedBenchPlayers = [];

        if (lineup) {
          const { formation, lineup: lineupData, lineups, roster, inactiveIds } = lineup;
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

          // Positions where a now-inactive player was assigned render as empty slots
          // (dashed border + "FILL" text) so the coach can fill them before kickoff.
          const emptySlotSet = new Set(computeEmptySlotIndices(lineupArray, inactiveIds));

          resolvedFieldPositions = positionDefs.map((pos, idx) => {
            const playerId = lineupArray[idx];
            const isInactiveAssigned = emptySlotSet.has(idx);
            const player = (playerId && !isInactiveAssigned)
              ? (roster || []).find((p) => p.id === playerId)
              : null;
            return { pos, player, isEmptySlot: isInactiveAssigned };
          });

          resolvedBenchPlayers = computeBench(roster, assignedIds, inactiveIds);
        }

        // Store game metadata needed for season stats computation
        const gameMeta = { date: date || null, lineup: lineup || null };
        setGame(gameMeta);

        setGameStatus(resolvedStatus);
        setScore(resolvedScore);
        setOpponent(opp || "");
        setFieldPositions(resolvedFieldPositions);
        setBenchPlayers(resolvedBenchPlayers);

        // Restart timer if game is in an active period (Firestore has the halfStartTs)
        const resolvedHalfStartTs = firestoreHalfStartTs || null;
        if (
          isActiveStatus(resolvedStatus) &&
          resolvedHalfStartTs
        ) {
          setHalfStartTs(resolvedHalfStartTs);
          startHalf(resolvedHalfStartTs);
          acquireWakeLock();
        }

        // Restore intervals from Firestore if available (e.g. game in progress)
        const resolvedHalfIntervals = data.halfIntervals || [];
        const resolvedPlayerIntervals = data.playerIntervals || {};
        setHalfIntervals(resolvedHalfIntervals);
        setPlayerIntervals(resolvedPlayerIntervals);

        // Save to localStorage immediately so we can recover on reload
        saveStored("activeGameId", gameId);
        saveStored("gameStatus", resolvedStatus);
        saveStored("score", resolvedScore);
        saveStored("opponent", opp || "");
        saveStored("fieldPositions", resolvedFieldPositions);
        saveStored("benchPlayers", resolvedBenchPlayers);
        saveStored("events", data.events || []);
        saveStored("halfIntervals", resolvedHalfIntervals);
        saveStored("playerIntervals", resolvedPlayerIntervals);
        saveStored("halfStartTs", resolvedHalfStartTs);
        saveStored("gameMeta", gameMeta);

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
  // Safety net: open intervals for on-field players that don't have one
  // Covers edge cases: game started with empty field, app reloaded losing
  // intervals, or players placed on field without going through sub handler.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isActiveStatus(gameStatus)) return;

    const needsUpdate = [];
    fieldPositions.forEach(({ player }) => {
      if (!player) return;
      const intervals = playerIntervals[player.id] || [];
      const hasOpenInterval = intervals.length > 0 && intervals[intervals.length - 1].outAt === null;
      if (!hasOpenInterval) {
        needsUpdate.push(player.id);
      }
    });

    if (needsUpdate.length === 0) return;

    const now = Date.now();
    setPlayerIntervals((prev) => {
      const updated = { ...prev };
      needsUpdate.forEach((pid) => {
        const existing = updated[pid] || [];
        updated[pid] = [...existing, { inAt: now, outAt: null }];
      });
      return updated;
    });
  }, [gameStatus, fieldPositions, playerIntervals]);

  // Ensure halfIntervals has an open interval during any active period
  useEffect(() => {
    if (!isActiveStatus(gameStatus)) return;
    const hasOpenHalf = halfIntervals.length > 0 && halfIntervals[halfIntervals.length - 1].endAt === null;
    if (!hasOpenHalf) {
      const now = Date.now();
      setHalfIntervals((prev) => [...prev, { startAt: now, endAt: null }]);
    }
  }, [gameStatus, halfIntervals]);

  // ---------------------------------------------------------------------------
  // State machine transitions
  // ---------------------------------------------------------------------------

  const handleStartGame = useCallback(() => {
    const now = Date.now();
    const initialStatus = INITIAL_ACTIVE_STATUS[GAME_STRUCTURE];
    const newIntervals = [{ startAt: now, endAt: null }];
    const newPlayerIntervals = {};
    fieldPositions.forEach(({ player }) => {
      if (player) {
        newPlayerIntervals[player.id] = [{ inAt: now, outAt: null }];
      }
    });

    setGameStatus(initialStatus);
    setHalfStartTs(now);
    setHalfIntervals(newIntervals);
    setPlayerIntervals(newPlayerIntervals);
    saveStored("activeGameId", gameId);
    saveStored("halfStartTs", now);

    startHalf(now);
    acquireWakeLock();
    updateGameStatus(gameId, initialStatus, now);
  }, [gameId, fieldPositions, startHalf, acquireWakeLock]);

  // Close the current active period: stop clock, close intervals, transition
  // to the next break status (halftime / break-q1 / break-q3). For the final
  // active period (2nd-half / q4), the button label is "Full Time!" and the
  // direct handleEndGame path runs instead — this handler is only invoked
  // while getBreakStatusAfter returns a non-null next status.
  const handleEndPeriod = useCallback(() => {
    const now = Date.now();
    const nextBreakStatus = getBreakStatusAfter(gameStatus, GAME_STRUCTURE);
    if (!nextBreakStatus) {
      // Shouldn't happen in normal flow — the "Full Time!" button wires
      // directly to handleEndGame. Defensive no-op.
      return;
    }

    stopTimer();
    releaseWakeLock();

    // Close current period interval
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

    setGameStatus(nextBreakStatus);
    setSelectedPlayerId(null);
    setSubSource(null);
    setDisplaySeconds(0);
    updateGameStatus(gameId, nextBreakStatus);
  }, [gameId, gameStatus, stopTimer, releaseWakeLock]);

  // Start the next active period from a break. Handles halves' halftime →
  // 2nd-half, and quarters' break-q1 → q2, halftime → q3, break-q3 → q4.
  const handleStartNextPeriod = useCallback(() => {
    const now = Date.now();
    let nextActiveStatus = getNextActiveStatus(gameStatus);
    if (!nextActiveStatus && gameStatus === "halftime") {
      nextActiveStatus = getNextActiveStatusFromHalftime(GAME_STRUCTURE);
    }
    if (!nextActiveStatus) {
      // Shouldn't happen — break states always have a next active.
      return;
    }

    // Open a new period interval
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

    setGameStatus(nextActiveStatus);
    setHalfStartTs(now);
    saveStored("halfStartTs", now);

    startHalf(now);
    acquireWakeLock();
    updateGameStatus(gameId, nextActiveStatus, now);
  }, [gameId, gameStatus, fieldPositions, startHalf, acquireWakeLock]);

  // Primary action button dispatcher — GameHeader shows one button whose
  // action depends on status. Active → endPeriod; break → startNextPeriod.
  // (The final active period's button says "Full Time!" and wires directly
  // to handleEndGame; see GameHeader. This handler never runs for that case.)
  const handlePrimaryAction = useCallback(() => {
    if (isActiveStatus(gameStatus)) {
      handleEndPeriod();
    } else if (isBreakStatus(gameStatus)) {
      handleStartNextPeriod();
    }
  }, [gameStatus, handleEndPeriod, handleStartNextPeriod]);

  const handleEndGame = useCallback(async () => {
    const now = Date.now();
    stopTimer();
    releaseWakeLock();

    // Compute closed intervals inline (setState is async and won't flush before we need the values)
    const closedHalfIntervals = halfIntervals.map((interval, i) =>
      i === halfIntervals.length - 1 ? { ...interval, endAt: now } : interval
    );

    const closedPlayerIntervals = { ...playerIntervals };
    Object.keys(closedPlayerIntervals).forEach((pid) => {
      closedPlayerIntervals[pid] = closedPlayerIntervals[pid].map((interval, i) =>
        i === closedPlayerIntervals[pid].length - 1 && interval.outAt === null
          ? { ...interval, outAt: now }
          : interval
      );
    });

    // Persist intervals + status to Firestore atomically BEFORE clearing localStorage
    await finalizeGame(gameId, {
      playerIntervals: closedPlayerIntervals,
      halfIntervals: closedHalfIntervals,
    });

    // Push season stats (fire-and-forget — no await needed)
    const seasonId = getSeasonId(game?.date);
    if (seasonId) {
      const deltas = computeSeasonDeltas(
        { ...game, events },
        closedPlayerIntervals,
        closedHalfIntervals
      );
      for (const [pid, statDeltas] of Object.entries(deltas)) {
        updateSeasonStats(seasonId, pid, statDeltas);
      }
    }

    // Update React state to reflect closed intervals
    setHalfIntervals(closedHalfIntervals);
    setPlayerIntervals(closedPlayerIntervals);
    setGameStatus("completed");
    setSelectedPlayerId(null);
    setSubSource(null);
    setDisplaySeconds(0);

    // Clear localStorage and navigate to summary
    clearGameStorage();
    navigate(`/games/${gameId}/summary`);
  }, [gameId, game, events, halfIntervals, playerIntervals, stopTimer, releaseWakeLock, navigate]);

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
      const isActiveHalf = isActiveStatus(gameStatus);

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

        // Pre-kickoff fills must persist to Firestore so reloads preserve them.
        if (gameStatus === "setup") {
          const nextPositions = [...fieldPositions];
          const tmp = nextPositions[fromIdx];
          nextPositions[fromIdx] = { ...nextPositions[fromIdx], player: nextPositions[targetFieldIdx].player };
          nextPositions[targetFieldIdx] = { ...nextPositions[targetFieldIdx], player: tmp.player };
          const nextLineupArray = nextPositions.map(({ player }) => player?.id || null);
          updateGame(gameId, {
            lineup: { ...(game?.lineup || {}), lineup: nextLineupArray },
          }).catch((err) => console.error("Failed to persist setup-state fill:", err));
        }
      } else if (source.type === "bench") {
        // Bench-to-field: swap the bench player with the field player at targetFieldIdx
        const benchPlayer = source.player;
        if (!benchPlayer) return;

        // Collect outgoing player from current state before updating
        const outgoingPlayer = fieldPositions[targetFieldIdx]?.player || null;

        setFieldPositions((prev) => {
          const updated = [...prev];
          // Clear isEmptySlot when a bench player fills the slot
          updated[targetFieldIdx] = { ...updated[targetFieldIdx], player: benchPlayer, isEmptySlot: false };
          return updated;
        });

        setBenchPlayers((prev) => {
          const withoutBenchPlayer = prev.filter((p) => p.id !== benchPlayer.id);
          if (outgoingPlayer) {
            return [...withoutBenchPlayer, outgoingPlayer];
          }
          return withoutBenchPlayer;
        });

        // Pre-kickoff fills must persist to Firestore so reloads preserve them.
        if (gameStatus === "setup") {
          const nextPositions = [...fieldPositions];
          nextPositions[targetFieldIdx] = { ...nextPositions[targetFieldIdx], player: benchPlayer, isEmptySlot: false };
          const nextLineupArray = nextPositions.map(({ player }) => player?.id || null);
          updateGame(gameId, {
            lineup: { ...(game?.lineup || {}), lineup: nextLineupArray },
          }).catch((err) => console.error("Failed to persist setup-state fill:", err));
        }

        // Only log sub event and update intervals during active halves
        if (isActiveHalf) {
          const now = Date.now();
          const currentHalf = getPeriodNumber(gameStatus) ?? 1;

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
    [gameId, gameStatus, fieldPositions, game]
  );

  const handleBenchDrop = useCallback(
    (sourceFieldIdx) => {
      // Field-to-bench: remove player from field, add to bench
      const isActiveHalf = isActiveStatus(gameStatus);
      const leavingPlayer = fieldPositions[sourceFieldIdx]?.player;
      if (!leavingPlayer) return;

      setFieldPositions((prev) => {
        const updated = [...prev];
        updated[sourceFieldIdx] = { ...updated[sourceFieldIdx], player: null };
        return updated;
      });

      setBenchPlayers((prev) => [...prev, leavingPlayer]);

      // Pre-kickoff field-to-bench moves must persist to Firestore so reloads preserve them.
      if (gameStatus === "setup") {
        const nextPositions = [...fieldPositions];
        nextPositions[sourceFieldIdx] = { ...nextPositions[sourceFieldIdx], player: null };
        const nextLineupArray = nextPositions.map(({ player }) => player?.id || null);
        updateGame(gameId, {
          lineup: { ...(game?.lineup || {}), lineup: nextLineupArray },
        }).catch((err) => console.error("Failed to persist setup-state bench drop:", err));
      }

      if (isActiveHalf) {
        const now = Date.now();
        const currentHalf = getPeriodNumber(gameStatus) ?? 1;

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
    [gameId, gameStatus, fieldPositions, game]
  );

  // ---------------------------------------------------------------------------
  // Formation change — pre-kickoff or halftime/break only. Index-preserving:
  // each player stays at their current slot index; positions get the new
  // formation's labels + coordinates. Coach uses field-to-field swap to
  // fine-tune. Slot count is constant within a deployment's allowlist
  // (Madeira: all 9-slot, friend: all 7-slot).
  // ---------------------------------------------------------------------------
  const handleFormationChange = useCallback((newKey) => {
    const currentFormation = game?.lineup?.formation;
    if (!newKey || newKey === currentFormation) return;
    const newPositionDefs = FORMATIONS[newKey];
    if (!newPositionDefs) return;

    setFieldPositions((prev) =>
      newPositionDefs.map((pos, idx) => ({
        pos,
        player: prev[idx]?.player ?? null,
        isEmptySlot: !!prev[idx]?.isEmptySlot,
      }))
    );

    setPendingSwapIdx(null);
    setSubSource(null);

    setGame((prev) => {
      if (!prev) return prev;
      return { ...prev, lineup: { ...(prev.lineup || {}), formation: newKey } };
    });

    updateGame(gameId, {
      lineup: { ...(game?.lineup || {}), formation: newKey },
    }).catch((err) => console.error("Failed to persist formation change:", err));
  }, [gameId, game]);

  // ---------------------------------------------------------------------------
  // Setup state is interactive so coaches can manually fill empty slots pre-kickoff.
  // Active/break states remain interactive for substitutions during the game.
  const isInteractive = isActiveStatus(gameStatus) || isBreakStatus(gameStatus) || gameStatus === "setup";

  // Formation picker is only shown when the clock isn't running.
  const isFormationPickerVisible = gameStatus === "setup" || isBreakStatus(gameStatus);
  const currentFormation = game?.lineup?.formation || null;

  // ---------------------------------------------------------------------------
  // Live minute calculations — recompute every 15 seconds via tick counter
  // ---------------------------------------------------------------------------
  const [minuteTick, setMinuteTick] = useState(0);
  useEffect(() => {
    if (!isActiveStatus(gameStatus)) return;
    const id = setInterval(() => setMinuteTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, [gameStatus]);

  const playerMinutes = useMemo(() => {
    const result = {};
    const allPlayerIds = new Set();
    fieldPositions.forEach(({ player }) => { if (player) allPlayerIds.add(player.id); });
    benchPlayers.forEach((p) => allPlayerIds.add(p.id));

    allPlayerIds.forEach((pid) => {
      const intervals = playerIntervals[pid] || [];
      result[pid] = calcMinutes(intervals, halfIntervals);
    });
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minuteTick, displayMinute, playerIntervals, halfIntervals, fieldPositions, benchPlayers]);

  // Duplicate first-name detection across the FULL in-game roster (field +
  // bench). A bench chip for "Avery" must display a last-initial when another
  // Avery is on the field — matches the planner's disambiguation.
  const dupFirstNames = useMemo(() => {
    const counts = {};
    fieldPositions.forEach(({ player }) => {
      if (!player) return;
      const f = player.name.split(" ")[0];
      counts[f] = (counts[f] || 0) + 1;
    });
    benchPlayers.forEach((p) => {
      const f = p.name.split(" ")[0];
      counts[f] = (counts[f] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((f) => counts[f] > 1));
  }, [fieldPositions, benchPlayers]);
  const benchDisplayName = useCallback((p) => {
    const parts = p.name.split(" ");
    if (dupFirstNames.has(parts[0]) && parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
    return parts[0];
  }, [dupFirstNames]);

  // ---------------------------------------------------------------------------
  // Stat recording handlers
  // ---------------------------------------------------------------------------
  const isActiveHalfForStats = isActiveStatus(gameStatus);

  // Tap a bench player to select them for substitution
  const handleBenchTap = useCallback((player) => {
    if (!isInteractive) return;
    setSubSource((prev) => (prev?.id === player.id ? null : player));
    setSelectedPlayerId(null); // clear stat selection when picking a sub
  }, [isInteractive]);

  // Tap a field position — priority order:
  //   1. pending field-to-field swap → swap the two positions
  //   2. pending bench sub → sub bench player in
  //   3. active half → select for stats
  //   4. setup or halftime/break → park tapped field player as swap source
  const handleFieldTap = useCallback((idx) => {
    if (pendingSwapIdx !== null) {
      if (pendingSwapIdx === idx) {
        // Tapped the same player — cancel swap mode
        setPendingSwapIdx(null);
        return;
      }
      const source = fieldPositions[pendingSwapIdx];
      if (source?.player) {
        handleSubstitution(
          { type: "field", idx: pendingSwapIdx, player: source.player },
          idx
        );
      }
      setPendingSwapIdx(null);
      return;
    }
    if (subSource) {
      handleSubstitution({ type: "bench", idx: null, player: subSource }, idx);
      setSubSource(null);
      return;
    }
    const player = fieldPositions[idx]?.player;
    if (!player) return;
    if (isActiveHalfForStats) {
      setSelectedPlayerId((prev) => (prev === player.id ? null : player.id));
      return;
    }
    // Setup or halftime/break — park as field-to-field swap source.
    // Existing pendingSwapIdx visuals (highlighted slot + swap-prompt banner) apply.
    setSelectedPlayerId(null);
    setPendingSwapIdx(idx);
  }, [pendingSwapIdx, subSource, fieldPositions, isActiveHalfForStats, handleSubstitution]);

  // Swap button in StatBar — park the currently-selected field player as the
  // swap source; next field tap picks the partner.
  const handleSwapInitiate = useCallback(() => {
    if (!selectedPlayerId) return;
    const sourceIdx = fieldPositions.findIndex(
      ({ player }) => player?.id === selectedPlayerId
    );
    if (sourceIdx === -1) return;
    setPendingSwapIdx(sourceIdx);
    setSelectedPlayerId(null);
  }, [selectedPlayerId, fieldPositions]);

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

    const currentHalf = getPeriodNumber(gameStatus) ?? 1;
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

  // Stat badge counts — per field player, whole-game running total (both halves).
  // Previously filtered by current half, which reset badges at halftime (STAT-04).
  const statCounts = useMemo(() => {
    const counts = {};
    events.forEach((e) => {
      if (e.type === "stat") {
        counts[e.playerId] = (counts[e.playerId] || 0) + 1;
      }
    });
    return counts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

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

  // Header has a score row (~56px) plus, whenever we're in an active or
  // break state, a primary-action button row ("End Q1" / "Start Q2" /
  // "Full Time!" / etc.) that adds ~36px. During setup and completed the
  // button is hidden so the header is score-row-only.
  const hasActionButton = isActiveStatus(gameStatus) || isBreakStatus(gameStatus);
  const HEADER_HEIGHT = hasActionButton ? 92 : 56;

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
        onPrimaryAction={handlePrimaryAction}
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
                  displayName={benchDisplayName(player)}
                  minuteCount={playerMinutes[player.id] || 0}
                  onClick={() => handleBenchTap(player)}
                  isSubSelected={subSource?.id === player.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Pre-kickoff header — small confirmation banner, no blur */}
        {gameStatus === "setup" && (
          <div
            style={{
              textAlign: "center",
              padding: "6px 12px 8px",
              fontFamily: fontDisplay,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            Ready to kick off · vs {opponent}
          </div>
        )}

        {/* Formation picker — visible during setup and halftime/breaks only.
            Index-preserving: changing formation re-labels each slot but keeps
            the same player at each slot index. */}
        {isFormationPickerVisible && currentFormation && (
          <div style={{ display: "flex", justifyContent: "center", padding: "0 12px 8px" }}>
            <div
              style={{
                display: "flex",
                gap: 3,
                background: "rgba(0,0,0,0.3)",
                borderRadius: 10,
                padding: 3,
              }}
            >
              {Object.keys(ALLOWED_FORMATIONS).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFormationChange(f)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: fontDisplay,
                    fontWeight: 700,
                    fontSize: 12,
                    background: currentFormation === f ? C.orange : "transparent",
                    color: currentFormation === f ? C.white : "rgba(255,255,255,0.45)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pitch area */}
        <div style={{ position: "relative", padding: "6px 10px 0" }}>
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
            {fieldPositions.map(({ pos, player, isEmptySlot }, idx) => (
              <FieldPosition
                key={idx}
                pos={pos}
                player={player}
                idx={idx}
                isHighlighted={isInteractive && !player}
                isEmptySlot={!!isEmptySlot}
                compact={false}
                minuteDisplay={
                  (isActiveStatus(gameStatus) || isBreakStatus(gameStatus) || gameStatus === "completed") && player
                    ? String(playerMinutes[player.id] ?? 0)
                    : null
                }
                isSelected={(!!player && player.id === selectedPlayerId) || pendingSwapIdx === idx}
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

        {/* Delete game — subtle danger action at the bottom of the live view */}
        <div style={{ display: "flex", justifyContent: "center", padding: "16px 12px 8px" }}>
          <DeleteGameButton gameId={gameId} compact />
        </div>

        {/* Stat bar spacer — only when a player is selected and stat bar visible */}
        {isActiveHalfForStats && selectedPlayerId && <div style={{ height: 110 }} />}

        {/* Start Game CTA spacer — prevents fixed-bottom button from covering bench/events */}
        {gameStatus === "setup" && <div style={{ height: 80 }} />}

        {/* Bottom safe area padding */}
        <div style={{ height: 8, flexShrink: 0 }} />
      </div>

      {/* Start Game CTA — fixed at bottom, shown only during setup state */}
      {gameStatus === "setup" && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "12px 16px calc(12px + env(safe-area-inset-bottom, 0px))",
            background: C.navyDark,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            zIndex: 90,
            boxShadow: "0 -4px 16px rgba(0,0,0,0.3)",
          }}
        >
          <button
            onClick={handleStartGame}
            style={{
              width: "100%",
              background: C.orange,
              border: "none",
              borderRadius: 12,
              color: C.white,
              fontFamily: fontBase,
              fontSize: 16,
              fontWeight: 700,
              padding: "16px 0",
              cursor: "pointer",
              boxShadow: `0 4px 20px ${C.orangeGlow}`,
              letterSpacing: "0.3px",
            }}
          >
            Start Game
          </button>
        </div>
      )}

      {/* Stat bar — fixed at bottom, visible during active halves */}
      {isActiveHalfForStats && (
        <StatBar
          positionGroup={selectedPositionGroup}
          playerName={selectedPlayerName}
          onStatTap={handleStatTap}
          onSwap={handleSwapInitiate}
          disabled={false}
        />
      )}

      {/* Swap-pending banner */}
      {pendingSwapIdx !== null && (
        <div
          onClick={() => setPendingSwapIdx(null)}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: C.orange,
            color: C.white,
            padding: "14px 16px calc(14px + env(safe-area-inset-bottom, 0px))",
            fontFamily: fontBase,
            fontSize: 14,
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: "0.3px",
            cursor: "pointer",
            zIndex: 100,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.3)",
          }}
        >
          Tap another field player to swap with{" "}
          <span style={{ textDecoration: "underline" }}>
            {fieldPositions[pendingSwapIdx]?.player
              ? abbreviateName(fieldPositions[pendingSwapIdx].player.name)
              : ""}
          </span>
          <span style={{ opacity: 0.75, fontWeight: 500, marginLeft: 8 }}>
            · tap to cancel
          </span>
        </div>
      )}

    </div>
  );
}
