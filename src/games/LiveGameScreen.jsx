import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
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
function BenchChip({ player, minuteCount, draggable, onDragStart, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, isTouchDragOver }) {
  return (
    <div
      data-drop-id={`bench-${player.id}`}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onTouchStart={draggable ? onTouchStart : undefined}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "4px 6px",
        minWidth: 48,
        flexShrink: 0,
        cursor: draggable ? "grab" : "default",
        borderRadius: 8,
        border: isTouchDragOver ? `2px solid ${C.orange}` : "2px solid transparent",
        background: isTouchDragOver ? "rgba(232,100,32,0.15)" : "transparent",
        transition: "all 0.15s ease",
        touchAction: "none",
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

  // --- Drag state (desktop HTML5) ---
  const [dragSource, setDragSource] = useState(null);
  // dragSource shape: { type: "field"|"bench", idx: number|null, playerId: string, player: object }

  // --- Touch drag state ---
  const [touchDragState, setTouchDragState] = useState({
    isDragging: false,
    playerId: null,
    player: null,
    source: null, // { type: "field"|"bench", idx: number|null }
    ghostX: 0,
    ghostY: 0,
    overTarget: null,
  });

  const touchDragStateRef = useRef(touchDragState);
  touchDragStateRef.current = touchDragState;
  const activateTimerRef = useRef(null);
  const pendingDragRef = useRef(null);

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

        const { opponent: opp, score: sc, status, lineup } = data;
        const resolvedStatus = status || "setup";
        const resolvedScore = sc || { home: 0, away: 0 };

        // Build fieldPositions from lineup snapshot
        let resolvedFieldPositions = [];
        let resolvedBenchPlayers = [];

        if (lineup) {
          const { formation, lineups, roster } = lineup;
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
    setSelectedPlayerId(null);
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
    setSelectedPlayerId(null);
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
  // Desktop HTML5 drag handlers
  // ---------------------------------------------------------------------------
  const isInteractive = gameStatus === "1st-half" || gameStatus === "2nd-half" || gameStatus === "halftime";

  const handleFieldDragStart = useCallback((idx, e) => {
    const player = fieldPositions[idx]?.player;
    if (!player || !isInteractive) return;
    setDragSource({ type: "field", idx, playerId: player.id, player });
    e.dataTransfer.effectAllowed = "move";
  }, [fieldPositions, isInteractive]);

  const handleBenchDragStart = useCallback((player, e) => {
    if (!player || !isInteractive) return;
    setDragSource({ type: "bench", idx: null, playerId: player.id, player });
    e.dataTransfer.effectAllowed = "move";
  }, [isInteractive]);

  const handleFieldDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleFieldDrop = useCallback((targetIdx, e) => {
    e.preventDefault();
    if (!dragSource || !isInteractive) {
      setDragSource(null);
      return;
    }
    handleSubstitution(dragSource, targetIdx);
    setDragSource(null);
  }, [dragSource, isInteractive, handleSubstitution]);

  const handleBenchStripDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleBenchStripDrop = useCallback((e) => {
    e.preventDefault();
    if (!dragSource || !isInteractive) {
      setDragSource(null);
      return;
    }
    if (dragSource.type === "field" && dragSource.idx !== null) {
      handleBenchDrop(dragSource.idx);
    }
    setDragSource(null);
  }, [dragSource, isInteractive, handleBenchDrop]);

  const handleDragEnd = useCallback(() => {
    setDragSource(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Touch drag handlers (inline, same pattern as MadeiraLineupPlanner)
  // ---------------------------------------------------------------------------

  const handleTouchStart = useCallback((sourceInfo, player, e) => {
    if (!isInteractive || !player) return;
    pendingDragRef.current = {
      sourceInfo,
      player,
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
    };

    activateTimerRef.current = setTimeout(() => {
      const pending = pendingDragRef.current;
      if (!pending) return;
      setTouchDragState({
        isDragging: true,
        playerId: pending.player.id,
        player: pending.player,
        source: pending.sourceInfo,
        ghostX: pending.startX,
        ghostY: pending.startY,
        overTarget: null,
      });
    }, 150);
  }, [isInteractive]);

  const handleTouchMove = useCallback((e) => {
    if (!touchDragStateRef.current.isDragging && pendingDragRef.current) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - pendingDragRef.current.startX);
      const dy = Math.abs(touch.clientY - pendingDragRef.current.startY);
      const moved = dx > 8 || dy > 8;
      if (moved) {
        if (dx > dy) {
          // Horizontal swipe — cancel drag
          clearTimeout(activateTimerRef.current);
          activateTimerRef.current = null;
          pendingDragRef.current = null;
          return;
        } else {
          // Vertical drag — activate early
          clearTimeout(activateTimerRef.current);
          activateTimerRef.current = null;
          const pending = pendingDragRef.current;
          setTouchDragState({
            isDragging: true,
            playerId: pending.player.id,
            player: pending.player,
            source: pending.sourceInfo,
            ghostX: touch.clientX,
            ghostY: touch.clientY,
            overTarget: null,
          });
        }
      }
      return;
    }
    if (!touchDragStateRef.current.isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    const el = document.elementFromPoint(clientX, clientY);
    let overTarget = null;
    if (el) {
      let node = el;
      while (node && node !== document.body) {
        if (node.dataset && node.dataset.dropId) {
          overTarget = node.dataset.dropId;
          break;
        }
        node = node.parentElement;
      }
    }

    setTouchDragState((prev) => ({ ...prev, ghostX: clientX, ghostY: clientY, overTarget }));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (activateTimerRef.current) {
      clearTimeout(activateTimerRef.current);
      activateTimerRef.current = null;
    }

    const state = touchDragStateRef.current;
    pendingDragRef.current = null;

    if (!state.isDragging) {
      setTouchDragState({
        isDragging: false, playerId: null, player: null, source: null,
        ghostX: 0, ghostY: 0, overTarget: null,
      });
      return;
    }

    const { source, overTarget } = state;

    if (overTarget && overTarget.startsWith("field-")) {
      const targetIdx = parseInt(overTarget.replace("field-", ""), 10);
      if (source) {
        handleSubstitution(source, targetIdx);
      }
    } else if (overTarget === "bench-strip") {
      if (source && source.type === "field" && source.idx !== null) {
        handleBenchDrop(source.idx);
      }
    }

    setTouchDragState({
      isDragging: false, playerId: null, player: null, source: null,
      ghostX: 0, ghostY: 0, overTarget: null,
    });
  }, [handleSubstitution, handleBenchDrop]);

  const handleTouchCancel = useCallback(() => {
    if (activateTimerRef.current) {
      clearTimeout(activateTimerRef.current);
      activateTimerRef.current = null;
    }
    pendingDragRef.current = null;
    setTouchDragState({
      isDragging: false, playerId: null, player: null, source: null,
      ghostX: 0, ghostY: 0, overTarget: null,
    });
  }, []);

  // Prevent page scroll during active touch drag
  useEffect(() => {
    const preventScroll = (e) => {
      if (touchDragStateRef.current.isDragging) e.preventDefault();
    };
    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => document.removeEventListener("touchmove", preventScroll);
  }, []);

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

  const handlePlayerSelect = useCallback((player) => {
    if (!isActiveHalfForStats) return;
    setSelectedPlayerId((prev) => (prev === player.id ? null : player.id));
  }, [isActiveHalfForStats]);

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
  }, [selectedPlayerId, isActiveHalfForStats, fieldPositions, gameStatus, gameId]);

  const handleUndo = useCallback((eventId) => {
    setEvents((prev) => {
      const updated = prev.filter((e) => e.id !== eventId);
      saveStored("events", updated);
      replaceGameEvents(gameId, updated); // fire-and-forget
      return updated;
    });
  }, [gameId]);

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

  // Estimate header height: ~110px (score row + timer row + safe area)
  const HEADER_HEIGHT = 110;
  const BENCH_HEIGHT = 72;

  const isFieldBeingDraggedOver = (idx) => {
    if (dragSource) return true; // highlight all during desktop drag
    return touchDragState.overTarget === `field-${idx}`;
  };

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
          data-drop-id="bench-strip"
          onDragOver={isInteractive ? handleBenchStripDragOver : undefined}
          onDrop={isInteractive ? handleBenchStripDrop : undefined}
          style={{
            height: BENCH_HEIGHT,
            display: "flex",
            alignItems: "center",
            overflowX: "auto",
            overflowY: "hidden",
            padding: "0 12px",
            gap: 4,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: dragSource?.type === "field"
              ? "rgba(232,100,32,0.08)"
              : touchDragState.overTarget === "bench-strip" && touchDragState.source?.type === "field"
              ? "rgba(232,100,32,0.08)"
              : "rgba(0,0,0,0.2)",
            flexShrink: 0,
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            transition: "background 0.15s ease",
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
              <BenchChip
                key={player.id}
                player={player}
                minuteCount={playerMinutes[player.id] || 0}
                draggable={isInteractive}
                onDragStart={(e) => handleBenchDragStart(player, e)}
                onTouchStart={(e) => handleTouchStart({ type: "bench", idx: null }, player, e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
                isTouchDragOver={touchDragState.overTarget === `bench-${player.id}`}
              />
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
                isHighlighted={isInteractive && !player}
                compact={false}
                dragSource={dragSource}
                isTouchDragOver={touchDragState.overTarget === `field-${idx}`}
                minuteDisplay={
                  (gameStatus === "1st-half" || gameStatus === "2nd-half" || gameStatus === "halftime" || gameStatus === "completed") && player
                    ? String(playerMinutes[player.id] ?? 0)
                    : null
                }
                isSelected={!!player && player.id === selectedPlayerId}
                statCount={player ? (statCounts[player.id] || 0) : 0}
                onClick={isActiveHalfForStats && player ? () => handlePlayerSelect(player) : undefined}
                onDragStart={isInteractive ? (e) => handleFieldDragStart(idx, e) : undefined}
                onDragEnd={handleDragEnd}
                onDragOver={isInteractive ? handleFieldDragOver : undefined}
                onDrop={isInteractive ? (e) => handleFieldDrop(idx, e) : undefined}
                onTouchStart={isInteractive ? (e) => handleTouchStart({ type: "field", idx }, player, e) : undefined}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
              />
            ))}
          </div>
        </div>

        {/* Events feed below pitch */}
        <EventsFeed events={events} onUndo={handleUndo} />

        {/* Stat bar spacer — prevents pitch from being obscured by fixed StatBar */}
        <div style={{ height: isActiveHalfForStats ? 80 : 0 }} />
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

      {/* Touch drag ghost element */}
      {touchDragState.isDragging && touchDragState.player && createPortal(
        <div
          style={{
            position: "fixed",
            left: touchDragState.ghostX - 18,
            top: touchDragState.ghostY - 18,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `linear-gradient(145deg, ${C.navy}, ${C.navyLight})`,
            border: `2.5px solid ${C.orange}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fontDisplay,
            fontWeight: 800,
            fontSize: 14,
            color: C.orange,
            pointerEvents: "none",
            zIndex: 9999,
            opacity: 0.85,
            boxShadow: `0 4px 16px rgba(0,0,0,0.5), 0 0 12px 3px rgba(232,100,32,0.4)`,
            transform: "scale(1.15)",
          }}
        >
          {touchDragState.player.num}
        </div>,
        document.body
      )}
    </div>
  );
}
