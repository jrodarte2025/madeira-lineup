import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  loadPublishedLineup,
  savePublishedLineup,
  loadBestLineup,
  saveBestLineup,
} from "./firebase";
import { C, fontBase, fontDisplay } from "./shared/constants";
import { TEAM_NAME, ROSTER, ALLOWED_FORMATIONS, LOGO_SRC } from "./config";
import { abbreviateName, useMediaQuery, encodeLineup, decodeLineup, buildShareUrl, shareLineup, formatJerseyNum } from "./shared/utils";

// Per-deployment defaults derived from the allowed formation set.
// Madeira: "3-3-2" (9 positions). Friend: "2-3-1" (7 positions).
// All formations within a single deployment have the same position
// count, so one DEFAULT_POSITION_COUNT covers every formation in
// this bundle.
const DEFAULT_FORMATION = Object.keys(ALLOWED_FORMATIONS)[0];
const DEFAULT_POSITION_COUNT = ALLOWED_FORMATIONS[DEFAULT_FORMATION].length;
const emptyLineup = () => Array(DEFAULT_POSITION_COUNT).fill(null);
import PitchSVG from "./shared/PitchSVG";
import FieldPosition from "./shared/FieldPosition";

// =============================================
// MADEIRA FC — 9v9 LINEUP PLANNER
// =============================================

// =============================================
// ROSTER PLAYER CHIP
// =============================================
function PlayerChip({ player, isSelected, isDimmed, onDragStart, onDragEnd, onClick, onRemove, showRemove, showEdit, isMobile }) {
  const canInteract = !isDimmed;
  return (
    <div draggable={canInteract} onDragStart={canInteract ? onDragStart : undefined} onDragEnd={onDragEnd}
      onClick={canInteract ? onClick : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: isDimmed ? "5px 10px" : "8px 10px", marginBottom: 3, borderRadius: 8,
        cursor: canInteract ? "grab" : "default", opacity: isDimmed ? 0.28 : 1,
        background: isSelected ? C.orange : "rgba(255,255,255,0.05)",
        border: isSelected ? "1px solid transparent" : isDimmed ? "1px solid transparent" : "1px solid rgba(255,255,255,0.07)",
        transition: "all 0.15s ease", userSelect: "none",
      }}>
      <div style={{
        width: isDimmed ? 24 : 28, height: isDimmed ? 24 : 28, borderRadius: "50%",
        background: isSelected ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: fontDisplay, fontSize: isDimmed ? 10 : 12, fontWeight: 800, flexShrink: 0, color: C.white,
      }}>{formatJerseyNum(player.num) ?? ""}</div>
      <div style={{ fontSize: isDimmed ? 12 : 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
        {player.name}
      </div>
      {showRemove && !isDimmed && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ background: "rgba(255,80,80,0.15)", border: "none", color: "#ff7b7b", borderRadius: 4, cursor: "pointer", fontSize: 12, padding: "2px 6px", flexShrink: 0, lineHeight: 1 }}>×</button>
      )}
    </div>
  );
}

// =============================================
// PRINT PITCH — ink-friendly version (white bg, navy outlines)
// =============================================
function PrintPitch({ halfLabel, lineup, positions, roster, formation, inactiveIds }) {
  const getPlayer = (id) => roster.find((p) => p.id === id);
  const assignedIds = lineup.filter(Boolean);
  const benchPlayers = roster.filter((p) => !assignedIds.includes(p.id) && !inactiveIds.includes(p.id));
  const inactivePlayers = roster.filter((p) => inactiveIds.includes(p.id));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
      <div style={{
        fontFamily: fontDisplay, fontSize: 11, fontWeight: 800, letterSpacing: "2px",
        textTransform: "uppercase", marginBottom: 5, border: `2px solid ${C.orange}`,
        padding: "2px 14px", borderRadius: 4, color: C.orange,
      }}>{halfLabel}</div>
      <div style={{
        position: "relative", width: "100%", maxWidth: 240, aspectRatio: "3 / 4",
        background: "white", borderRadius: 4, overflow: "hidden", border: `1.5px solid ${C.navy}`,
      }}>
        <PitchSVG lineColor={C.navy} />
        <div style={{
          position: "absolute", top: 3, left: "50%", transform: "translateX(-50%)",
          padding: "1px 8px", borderRadius: 6, border: `1px solid #ccc`,
          fontSize: 6.5, fontWeight: 700, fontFamily: fontDisplay, letterSpacing: "1px",
          color: C.navy, zIndex: 10, background: "white",
        }}>{formation}</div>
        {positions.map((pos, idx) => {
          const player = lineup[idx] ? getPlayer(lineup[idx]) : null;
          return (
            <div key={idx} style={{
              position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 0, zIndex: 5,
            }}>
              <div style={{
                width: player ? 24 : 18, height: player ? 24 : 18, borderRadius: "50%",
                background: "white",
                border: player ? `2px solid ${C.orange}` : `1px dashed #bbb`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                fontFamily: fontDisplay, fontWeight: 800,
                color: player ? C.navy : "#bbb",
              }}>
                {player ? (
                  formatJerseyNum(player.num) != null ? (
                    <>
                      <span style={{ fontSize: 9, lineHeight: 1 }}>{formatJerseyNum(player.num)}</span>
                      <span style={{ fontSize: 4, letterSpacing: "0.4px", color: C.orange, lineHeight: 1, marginTop: 1 }}>{pos.label}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 7, letterSpacing: "0.4px", color: C.orange, lineHeight: 1 }}>{pos.label}</span>
                  )
                ) : (
                  <span style={{ fontSize: 5.5 }}>{pos.label}</span>
                )}
              </div>
              {player && <div style={{
                fontSize: 6, fontWeight: 700, color: C.navy,
                maxWidth: 50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: fontBase, textAlign: "center",
              }}>{abbreviateName(player.name)}</div>}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 5, width: "100%", maxWidth: 240 }}>
        <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: "1.5px", color: C.navy, textTransform: "uppercase", marginBottom: 2, opacity: 0.5 }}>Bench</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {benchPlayers.map((p) => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 2, padding: "1px 5px", borderRadius: 6,
              border: `1px solid #ddd`, fontSize: 7, fontFamily: fontBase, color: C.navy,
            }}>
              {formatJerseyNum(p.num) != null && (
                <span style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 7 }}>{formatJerseyNum(p.num)}</span>
              )}
              <span style={{ fontWeight: 600 }}>{p.name}</span>
            </div>
          ))}
          {benchPlayers.length === 0 && <div style={{ fontSize: 7, color: "#999", fontStyle: "italic" }}>All assigned</div>}
        </div>
      </div>

      {inactivePlayers.length > 0 && (
        <div style={{ marginTop: 3, width: "100%", maxWidth: 240 }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: "1.5px", color: "#999", textTransform: "uppercase", marginBottom: 2 }}>Inactive</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {inactivePlayers.map((p) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 2, padding: "1px 5px", borderRadius: 6,
                border: "1px solid #e0e0e0", fontSize: 7, fontFamily: fontBase, color: "#999",
                textDecoration: "line-through",
              }}>
                {formatJerseyNum(p.num) != null && (
                  <span style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 7 }}>{formatJerseyNum(p.num)}</span>
                )}
                <span style={{ fontWeight: 600 }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// Lineup-array equality — used for the dirty flag against the saved best.
// Both arrays are aligned by index; entries are player-id strings or null.
// =============================================
function lineupsEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if ((a[i] ?? null) !== (b[i] ?? null)) return false;
  }
  return true;
}

// =============================================
// ROSTER SIDEBAR CONTENT (shared between sidebar and mobile drawer)
// =============================================
function RosterContent({ roster, availablePlayers, onFieldPlayers, selectedPlayer, showEdit, setShowEdit,
  handleDragStart, handleDragEnd, handlePlayerClick, removePlayer, newName, setNewName, newNum, setNewNum,
  addPlayer, clearAll, isMobile }) {

  return (
    <>
      <div style={{ padding: "14px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Roster · {roster.length}</span>
        <button onClick={() => setShowEdit(!showEdit)} style={{
          background: "none", border: "none", color: showEdit ? C.orange : "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 15, padding: "2px 6px", lineHeight: 1,
        }}>{showEdit ? "×" : "✎"}</button>
      </div>

      <div style={{ padding: "0 14px 6px", fontSize: 9, fontWeight: 700, color: C.orange, letterSpacing: "1.5px", textTransform: "uppercase" }}>
        Available · {availablePlayers.length}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px" }}>
        {availablePlayers.map((p) => (
          <PlayerChip key={p.id} player={p} isSelected={selectedPlayer === p.id} isDimmed={false}
            onDragStart={(e) => handleDragStart(e, p.id, "roster")} onDragEnd={handleDragEnd}
            onClick={() => handlePlayerClick(p.id)} onRemove={() => removePlayer(p.id)} showRemove={showEdit} showEdit={showEdit} isMobile={isMobile} />
        ))}

        {onFieldPlayers.length > 0 && (
          <>
            <div style={{ padding: "12px 0 5px", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              On Field · {onFieldPlayers.length}
            </div>
            {onFieldPlayers.map((p) => (
              <PlayerChip key={p.id} player={p} isSelected={false} isDimmed={true} showRemove={false} />
            ))}
          </>
        )}

        {showEdit && (
          <div style={{ marginTop: 14, padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", color: "rgba(255,255,255,0.3)", marginBottom: 8, textTransform: "uppercase" }}>Add Player</div>
            <input placeholder="Player name" value={newName} onChange={(e) => setNewName(e.target.value)}
              style={{ width: "100%", padding: "7px 9px", marginBottom: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: C.white, fontSize: 12, fontFamily: fontBase, outline: "none" }} />
            <div style={{ display: "flex", gap: 6 }}>
              <input placeholder="#" value={newNum} onChange={(e) => setNewNum(e.target.value)}
                style={{ width: 48, padding: "7px 9px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: C.white, fontSize: 12, fontFamily: fontBase, outline: "none" }} />
              <button onClick={addPlayer} style={{ flex: 1, padding: 7, background: C.orange, border: "none", borderRadius: 6, color: C.white, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fontBase }}>Add</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: 10, borderTop: `1px solid ${C.whiteAlpha}`, display: "flex", flexDirection: "column", gap: 5 }}>
        <button onClick={clearAll} style={{ padding: 7, background: "rgba(255,60,60,0.15)", border: "1px solid rgba(255,60,60,0.25)", borderRadius: 7, color: "rgba(255,100,100,0.9)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fontBase }}>
          Clear Lineup
        </button>
      </div>
    </>
  );
}

// =============================================
// TOUCH DRAG HOOK
// =============================================
function useTouchDrag({ assignPlayer, swapPositions, removeFromPosition }) {
  const [touchDragState, setTouchDragState] = useState({
    isDragging: false,
    playerId: null,
    source: null, // "roster" | number (field index)
    ghostX: 0,
    ghostY: 0,
    overTarget: null,
  });

  // Refs to avoid stale closures in touch event handlers
  const dragStateRef = useRef(touchDragState);
  dragStateRef.current = touchDragState;

  const activateTimerRef = useRef(null);
  const pendingDragRef = useRef(null); // { playerId, source } before activation
  const lastTapRef = useRef({ time: 0, source: null }); // double-tap detection

  const handleTouchStart = useCallback((playerId, source, e) => {
    // Store pending drag info; activate after 150ms to distinguish from taps
    pendingDragRef.current = { playerId, source, startX: e.touches[0].clientX, startY: e.touches[0].clientY };

    activateTimerRef.current = setTimeout(() => {
      const pending = pendingDragRef.current;
      if (!pending) return;
      setTouchDragState({
        isDragging: true,
        playerId: pending.playerId,
        source: pending.source,
        ghostX: pending.startX,
        ghostY: pending.startY,
        overTarget: null,
      });
    }, 150);
  }, []);

  const handleTouchMove = useCallback((e) => {
    // During pending phase (before activation), check drag direction
    if (!dragStateRef.current.isDragging && pendingDragRef.current) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - pendingDragRef.current.startX);
      const dy = Math.abs(touch.clientY - pendingDragRef.current.startY);
      const moved = dx > 8 || dy > 8; // past dead zone
      if (moved) {
        if (dx > dy) {
          // Horizontal swipe — cancel drag, allow native scroll
          clearTimeout(activateTimerRef.current);
          activateTimerRef.current = null;
          pendingDragRef.current = null;
          return;
        } else {
          // Vertical drag — activate immediately, don't wait for timer
          clearTimeout(activateTimerRef.current);
          activateTimerRef.current = null;
          const pending = pendingDragRef.current;
          setTouchDragState({
            isDragging: true,
            playerId: pending.playerId,
            source: pending.source,
            ghostX: touch.clientX,
            ghostY: touch.clientY,
            overTarget: null,
          });
        }
      }
      return;
    }
    if (!dragStateRef.current.isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    // Find what element is under the finger (ghost has pointerEvents:none)
    const el = document.elementFromPoint(clientX, clientY);
    let overTarget = null;
    if (el) {
      // Walk up the tree to find data-drop-id
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

  const handleTouchEnd = useCallback((e, tapCallback) => {
    // Clear the activation timer
    if (activateTimerRef.current) {
      clearTimeout(activateTimerRef.current);
      activateTimerRef.current = null;
    }

    const state = dragStateRef.current;

    if (!state.isDragging) {
      // Was a tap — check for double-tap on field positions
      const pending = pendingDragRef.current;
      pendingDragRef.current = null;
      if (pending && typeof pending.source === "number") {
        const now = Date.now();
        const last = lastTapRef.current;
        if (last.source === pending.source && now - last.time < 400) {
          // Double-tap on same field position — remove player
          lastTapRef.current = { time: 0, source: null };
          removeFromPosition(pending.source);
          return;
        }
        lastTapRef.current = { time: now, source: pending.source };
      }
      if (tapCallback) tapCallback();
      return;
    }

    const { playerId, source, overTarget } = state;

    // Execute drop action
    if (overTarget && overTarget.startsWith("field-")) {
      const targetIdx = parseInt(overTarget.replace("field-", ""), 10);
      if (source === "roster") {
        assignPlayer(playerId, targetIdx);
      } else if (typeof source === "number") {
        swapPositions(source, targetIdx);
      }
    } else if (overTarget === "chipstrip") {
      if (typeof source === "number") {
        removeFromPosition(source);
      }
    }
    // If no valid target, do nothing (drop ignored)

    pendingDragRef.current = null;
    setTouchDragState({
      isDragging: false,
      playerId: null,
      source: null,
      ghostX: 0,
      ghostY: 0,
      overTarget: null,
    });
  }, [assignPlayer, swapPositions, removeFromPosition]);

  // Cancel drag on any touch cancel
  const handleTouchCancel = useCallback(() => {
    if (activateTimerRef.current) {
      clearTimeout(activateTimerRef.current);
      activateTimerRef.current = null;
    }
    pendingDragRef.current = null;
    setTouchDragState({
      isDragging: false,
      playerId: null,
      source: null,
      ghostX: 0,
      ghostY: 0,
      overTarget: null,
    });
  }, []);

  // Prevent page scroll during active touch drag via non-passive document listener
  useEffect(() => {
    const preventScroll = (e) => {
      if (dragStateRef.current.isDragging) e.preventDefault();
    };
    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => document.removeEventListener("touchmove", preventScroll);
  }, []);

  return { touchDragState, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel };
}

// =============================================
// MAIN APP
// =============================================
export default function MadeiraLineupPlanner() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");

  // --- localStorage helpers ---
  const loadStored = (key, fallback) => {
    try { const v = localStorage.getItem(`madeira_${key}`); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  };
  const saveStored = (key, value) => {
    try { localStorage.setItem(`madeira_${key}`, JSON.stringify(value)); } catch {}
  };

  const [roster, setRoster] = useState(() => loadStored("roster", ROSTER));
  const [inactiveIds, setInactiveIds] = useState([]);
  const [formation, setFormation] = useState(() => {
    const stored = loadStored("formation", null);
    // Reject stored values that aren't in this deployment's allowlist
    // (e.g., Madeira's "3-3-2" leaking into the friend bundle via shared-
    // origin localStorage during dev, or a stale value after a coach
    // changed the allowlist).
    return (stored && stored in ALLOWED_FORMATIONS) ? stored : DEFAULT_FORMATION;
  });
  const [lineup, setLineup] = useState(() => {
    const stored = loadStored("lineup", null);
    if (Array.isArray(stored) && stored.length === DEFAULT_POSITION_COUNT) return stored;
    return emptyLineup();
  });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNum, setNewNum] = useState("");
  // Saved-best snapshot for the *current* formation. Drives the Save button's
  // dirty flag (current lineup ≠ snapshot → dirty → save enabled).
  // null = no saved best on file for this formation yet.
  const [bestSnapshot, setBestSnapshot] = useState(null);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [rosterHover, setRosterHover] = useState(false);
  const [toast, setToast] = useState(null);
  const [sharedName, setSharedName] = useState(null);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const toastTimer = useRef(null);
  const chipStripRef = useRef(null);
  const [chipScrollPct, setChipScrollPct] = useState(0);
  const scrubberDragRef = useRef(null); // { startX, startScrollLeft }

  // --- Persist state to localStorage ---
  useEffect(() => saveStored("roster", roster), [roster]);
  useEffect(() => saveStored("inactiveIds", inactiveIds), [inactiveIds]);
  useEffect(() => saveStored("formation", formation), [formation]);
  useEffect(() => saveStored("lineup", lineup), [lineup]);

  // --- Auto-sync working state to Firestore after cloud load ---
  const cloudSyncTimer = useRef(null);
  useEffect(() => {
    if (!cloudLoaded) return;
    if (cloudSyncTimer.current) clearTimeout(cloudSyncTimer.current);
    cloudSyncTimer.current = setTimeout(() => {
      savePublishedLineup({ formation, lineup, inactiveIds, roster }).catch(() => {});
    }, 1500);
    return () => { if (cloudSyncTimer.current) clearTimeout(cloudSyncTimer.current); };
  }, [cloudLoaded, formation, lineup, inactiveIds, roster]);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  // Load shared lineup from URL on mount, or load published lineup from Firestore.
  // Either way, fetch the saved-best for whichever formation we end up on so the
  // Save button's dirty flag is correct.
  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      let activeFormation = formation;

      const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
      const encoded = params.get("lineup");
      if (encoded) {
        const data = decodeLineup(encoded);
        if (data) {
          if (cancelled) return;
          if (data.roster) setRoster(data.roster);
          setFormation(data.formation);
          setLineup([...data.lineup]);
          setInactiveIds([]);
          if (data.name) setSharedName(data.name);
          window.history.replaceState({}, "", window.location.pathname);
          activeFormation = data.formation;
        }
      } else {
        // No URL share — load published lineup from Firestore (no banner needed)
        const data = await loadPublishedLineup();
        if (cancelled) return;
        if (data) {
          if (data.roster) setRoster(data.roster);
          if (data.formation) {
            setFormation(data.formation);
            activeFormation = data.formation;
          }
          // Support both new shape (lineup: [...]) and legacy (lineups: {"1": [...]})
          if (data.lineup) setLineup([...data.lineup]);
          else if (data.lineups) setLineup([...(data.lineups["1"] || emptyLineup())]);
          // Always reset inactiveIds to [] — the builder no longer carries template
          // inactives. Legacy published lineups with non-empty inactiveIds are
          // gracefully forgotten on load (ROSTER-01).
          setInactiveIds([]);
        }
      }

      // Independent of which path we took, fetch the saved-best for the
      // formation we ended up on. Drives the Save button's dirty flag.
      const best = await loadBestLineup(activeFormation);
      if (cancelled) return;
      if (best && Array.isArray(best.lineup)) setBestSnapshot([...best.lineup]);
      else setBestSnapshot(null);

      setCloudLoaded(true);
    }
    loadInitial();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const positions = ALLOWED_FORMATIONS[formation];
  const assignedIds = lineup.filter(Boolean);
  const availablePlayers = roster.filter((p) => !assignedIds.includes(p.id) && !inactiveIds.includes(p.id));
  const onFieldPlayers = roster.filter((p) => assignedIds.includes(p.id));
  const inactivePlayers = roster.filter((p) => inactiveIds.includes(p.id));
  const getPlayer = (id) => roster.find((p) => p.id === id);

  // Detect duplicate first names across the full roster so a bench player
  // still shows a last initial when their namesake is on the field.
  const dupFirstNames = useMemo(() => {
    const counts = {};
    roster.forEach((p) => { const f = p.name.split(" ")[0]; counts[f] = (counts[f] || 0) + 1; });
    return new Set(Object.keys(counts).filter((f) => counts[f] > 1));
  }, [roster]);
  const benchDisplayName = (p) => {
    const parts = p.name.split(" ");
    if (dupFirstNames.has(parts[0]) && parts.length > 1) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    return parts[0];
  };

  // --- LINEUP ACTIONS ---
  const assignPlayer = useCallback((playerId, posIndex) => {
    if (inactiveIds.includes(playerId)) return;
    setLineup((prev) => {
      const arr = [...prev];
      const existingPos = arr.indexOf(playerId);
      if (existingPos !== -1) arr[existingPos] = null;
      arr[posIndex] = playerId;
      return arr;
    });
    setSelectedPlayer(null);
  }, [inactiveIds]);

  const swapPositions = useCallback((fromIdx, toIdx) => {
    setLineup((prev) => {
      const arr = [...prev];
      [arr[fromIdx], arr[toIdx]] = [arr[toIdx], arr[fromIdx]];
      return arr;
    });
  }, []);

  const removeFromPosition = useCallback((posIndex) => {
    setLineup((prev) => {
      const arr = [...prev];
      arr[posIndex] = null;
      return arr;
    });
  }, []);

  // Touch drag-and-drop (mobile only — HTML5 drag API does not fire on touch screens)
  const { touchDragState, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel } = useTouchDrag({
    assignPlayer,
    swapPositions,
    removeFromPosition,
  });

  const clearAll = () => {
    setLineup(emptyLineup());
    setInactiveIds([]);
    setSelectedPlayer(null);
  };

  // Switch formation. If a saved best exists for the target formation, load it.
  // Otherwise start clear (per Jim's spec — no carry-over from previous formation).
  const handleFormationChange = useCallback(async (newKey) => {
    if (!newKey || newKey === formation) return;
    setFormation(newKey);
    setSelectedPlayer(null);
    const best = await loadBestLineup(newKey);
    if (best && Array.isArray(best.lineup)) {
      setLineup([...best.lineup]);
      setBestSnapshot([...best.lineup]);
    } else {
      setLineup(emptyLineup());
      setBestSnapshot(null);
    }
  }, [formation]);

  // --- ROSTER ---
  const addPlayer = () => {
    if (!newName.trim() || !newNum.trim()) return;
    const newId = Math.max(0, ...roster.map((p) => p.id)) + 1;
    setRoster((prev) => [...prev, { id: newId, name: newName.trim(), num: parseInt(newNum) || 0 }]);
    setNewName(""); setNewNum("");
  };
  const removePlayer = (playerId) => {
    const player = roster.find((p) => p.id === playerId);
    const name = player ? player.name : "this player";
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    setRoster((prev) => prev.filter((p) => p.id !== playerId));
    setInactiveIds((prev) => prev.filter((id) => id !== playerId));
    setLineup((prev) => prev.map((id) => (id === playerId ? null : id)));
  };

  // --- SAVE BEST ---
  // Single Save action: overwrites the saved best for the current formation.
  // Inactives are intentionally not stored on the best — it represents the
  // platonic "everyone available" lineup. Game-time availability is handled
  // separately at game-start.
  const saveBest = async () => {
    const lineupCopy = [...lineup];
    const ok = await saveBestLineup(formation, lineupCopy);
    if (ok) {
      setBestSnapshot(lineupCopy);
      showToast(`Saved best for ${formation}`);
    } else {
      showToast("Save failed — try again");
    }
  };

  const isDirty = !lineupsEqual(lineup, bestSnapshot ?? emptyLineup());

  // --- SHARE ---
  const handleShareCurrent = async () => {
    const result = await shareLineup({ formation, lineup, inactiveIds, roster, name: "" });
    if (result === "copied") showToast("Link copied to clipboard!");
    else if (result === "shared") showToast("Lineup shared!");
  };

  // --- DRAG / CLICK ---
  const handleDragStart = (e, playerId, source) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ playerId, source }));
    setDragSource({ playerId, source });
  };
  const handleDragEnd = () => setDragSource(null);
  const handlePositionDrop = (e, posIndex) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.source === "roster") {
        assignPlayer(data.playerId, posIndex);
      } else if (typeof data.source === "number") {
        swapPositions(data.source, posIndex);
      }
    } catch {}
    setDragSource(null);
  };
  const handlePositionDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleRosterDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragSource && typeof dragSource.source === "number") setRosterHover(true);
  };
  const handleRosterDragLeave = () => setRosterHover(false);
  const handleRosterDrop = (e) => {
    e.preventDefault();
    setRosterHover(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (typeof data.source === "number") {
        removeFromPosition(data.source);
      }
      // "roster" already on bench, "inactive" shouldn't go to bench via drag — both ignored
    } catch {}
    setDragSource(null);
  };
  const handlePlayerClick = (playerId) => setSelectedPlayer((prev) => (prev === playerId ? null : playerId));
  // Tap the bench background (not a chip) while a field player is selected → sub them off.
  const handleBenchTap = (e) => {
    if (e.target !== e.currentTarget) return;
    if (!selectedPlayer) return;
    const selectedPosIndex = lineup.indexOf(selectedPlayer);
    if (selectedPosIndex === -1) return;
    removeFromPosition(selectedPosIndex);
    setSelectedPlayer(null);
  };
  const handlePositionClick = (posIndex) => {
    if (!selectedPlayer) {
      // No selection — select the field player at this position (if any)
      if (lineup[posIndex]) setSelectedPlayer(lineup[posIndex]);
      return;
    }

    // A player is selected — determine source
    const selectedPosIndex = lineup.indexOf(selectedPlayer);
    const isSelectedOnField = selectedPosIndex !== -1;

    if (isSelectedOnField) {
      // Selected player is on the field
      if (selectedPosIndex === posIndex) {
        // Clicked same position — deselect
        setSelectedPlayer(null);
      } else {
        // Clicked different position — swap the two field positions
        swapPositions(selectedPosIndex, posIndex);
        setSelectedPlayer(null);
      }
    } else {
      // Selected player is on the bench — assign to this position
      // assignPlayer handles: puts bench player here, displaces occupant to bench
      assignPlayer(selectedPlayer, posIndex);
      // selectedPlayer is cleared inside assignPlayer
    }
  };
  const handlePrint = () => {
    const printContent = document.querySelector('.print-view');
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    let styleHTML = '';
    styles.forEach((s) => { styleHTML += s.outerHTML; });
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${TEAM_NAME} FC Lineup</title>${styleHTML}
      <style>.print-view { display: flex !important; flex-direction: column; width: 100%; padding: 12px 18px; background: white !important; font-family: ${fontBase}; }
      .screen-view { display: none !important; } @page { size: portrait; margin: 0.3in; }</style>
      </head><body>${printContent.outerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
  };

  const pitchBg = "repeating-linear-gradient(to bottom, #338740 0px, #338740 28px, #2E7D39 28px, #2E7D39 56px)";
  const sidebarWidth = isTablet ? 190 : 230;

  // Shared roster props
  const rosterProps = {
    roster, availablePlayers, onFieldPlayers, selectedPlayer, showEdit, setShowEdit,
    handleDragStart, handleDragEnd, handlePlayerClick, removePlayer,
    newName, setNewName, newNum, setNewNum, addPlayer, clearAll,
    rosterHover, isMobile,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
        [data-drop-id="chipstrip"]::-webkit-scrollbar { display: none; }
        .screen-view { display: flex; flex-direction: column; }
        .print-view { display: none; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; }
          .screen-view { display: none !important; }
          .print-view {
            display: flex !important; flex-direction: column; width: 100%;
            padding: 12px 18px; background: white !important; font-family: ${fontBase};
          }
          @page { size: portrait; margin: 0.3in; }
        }
      `}</style>

      {/* ============ PRINT VIEW ============ */}
      <div className="print-view">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingBottom: 6, borderBottom: `2px solid ${C.navy}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {LOGO_SRC && <img src={LOGO_SRC} alt={`${TEAM_NAME} FC`} style={{ width: 32, height: "auto" }} />}
            <div>
              <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 800, color: C.navy, letterSpacing: "-0.3px", lineHeight: 1.1 }}>{TEAM_NAME.toUpperCase()} FC</div>
              <div style={{ fontFamily: fontBase, fontSize: 7, fontWeight: 600, letterSpacing: "1.5px", color: "#999", textTransform: "uppercase", marginTop: 1 }}>Game Day Lineup Card</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: fontDisplay, fontSize: 12, fontWeight: 700, color: C.navy }}>Formation: {formation}</div>
            <div style={{ fontFamily: fontBase, fontSize: 8, color: "#999", marginTop: 1 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
          {["vs.", "Time", "Field"].map((label) => (
            <div key={label} style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: "1px", color: C.navy, textTransform: "uppercase", flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, borderBottom: "1.5px solid #ddd", height: 14 }} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", flex: 1 }}>
          <PrintPitch halfLabel="Starting Lineup" lineup={lineup} positions={positions} roster={roster} formation={formation} inactiveIds={inactiveIds} />
        </div>

        <div style={{ marginTop: 8, paddingTop: 5, borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 6.5, color: "#ccc", letterSpacing: "1px", textTransform: "uppercase" }}>{TEAM_NAME} FC Lineup Planner</div>
          <div style={{ display: "flex", gap: 12 }}>
            {["Score", "Notes"].map((label) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 6.5, fontWeight: 700, color: C.navy, letterSpacing: "1px", textTransform: "uppercase" }}>{label}</span>
                <div style={{ width: label === "Notes" ? 100 : 45, borderBottom: "1.5px solid #ddd", height: 10 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ SCREEN VIEW ============ */}
      <div className="screen-view" style={{
        fontFamily: fontBase, background: `linear-gradient(145deg, ${C.navyDark} 0%, ${C.navy} 40%, ${C.navyDark} 100%)`,
        minHeight: "100vh", color: C.white,
      }}>
        {/* HEADER */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "6px 12px" : "14px 24px",
          borderBottom: `1px solid ${C.whiteAlpha}`, flexWrap: "wrap", gap: isMobile ? 8 : 12,
        }}>
          {/* Logo + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
            {LOGO_SRC && <img src={LOGO_SRC} alt={`${TEAM_NAME} FC`} style={{ width: isMobile ? 36 : 48, height: "auto" }} />}
            <div>
              <h1 style={{ fontFamily: fontDisplay, fontSize: isMobile ? 16 : 21, fontWeight: 800, letterSpacing: "-0.3px", lineHeight: 1.1 }}>{TEAM_NAME.toUpperCase()} FC</h1>
              <div style={{ fontSize: isMobile ? 8 : 10, color: "rgba(255,255,255,0.4)", letterSpacing: "2.5px", fontWeight: 700, textTransform: "uppercase", marginTop: 1 }}>Lineup Planner</div>
            </div>
          </div>

          {/* Formation selector — desktop only in header */}
          {!isMobile && (
            <div style={{ display: "flex", gap: 3, background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 3 }}>
              {Object.keys(ALLOWED_FORMATIONS).map((f) => (
                <button key={f} onClick={() => handleFormationChange(f)} style={{
                  padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontFamily: fontDisplay, fontWeight: 700, fontSize: 13,
                  background: formation === f ? C.orange : "transparent",
                  color: formation === f ? C.white : "rgba(255,255,255,0.45)", transition: "all 0.2s ease",
                }}>{f}</button>
              ))}
            </div>
          )}

          {/* Controls — desktop only in header */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={isDirty ? saveBest : undefined}
                disabled={!isDirty}
                title={isDirty ? `Save best for ${formation}` : `Best for ${formation} is up to date`}
                style={{
                  padding: "7px 12px", borderRadius: 7,
                  border: isDirty ? `1px solid ${C.orange}` : "1px solid rgba(255,255,255,0.12)",
                  background: isDirty ? "rgba(232,100,32,0.1)" : "transparent",
                  color: isDirty ? C.orange : "rgba(255,255,255,0.3)",
                  cursor: isDirty ? "pointer" : "default",
                  fontFamily: fontBase, fontSize: 12, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save
              </button>

              <button onClick={handlePrint} style={{
                padding: "7px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.18)",
                background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer",
                fontFamily: fontBase, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print
              </button>

              <button onClick={handleShareCurrent} style={{
                padding: "7px 12px", borderRadius: 7, border: `1px solid ${C.orange}`,
                background: "rgba(232,100,32,0.1)", color: C.orange, cursor: "pointer",
                fontFamily: fontBase, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </button>
            </div>
          )}
        </div>

        {/* MOBILE CONTROLS — below header, above pitch */}
        {isMobile && (
          <div style={{ padding: "5px 12px 0", display: "flex", flexDirection: "column", gap: 5 }}>
            {/* Row 1: Roster button + Formation selector */}
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <button onClick={() => setRosterOpen(true)} style={{
                padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.orange}`,
                background: "rgba(232,100,32,0.12)", color: C.orange, cursor: "pointer",
                fontFamily: fontDisplay, fontSize: 11, fontWeight: 700, letterSpacing: "0.5px",
                display: "flex", alignItems: "center", gap: 5, minHeight: 34, flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                ROSTER
              </button>
              <div style={{ display: "flex", gap: 3, background: "rgba(0,0,0,0.3)", borderRadius: 7, padding: 3, flex: 1 }}>
                {Object.keys(ALLOWED_FORMATIONS).map((f) => (
                  <button key={f} onClick={() => handleFormationChange(f)} style={{
                    padding: "5px 0", borderRadius: 5, border: "none", cursor: "pointer",
                    fontFamily: fontDisplay, fontWeight: 700, fontSize: 12, flex: 1,
                    background: formation === f ? C.orange : "transparent",
                    color: formation === f ? C.white : "rgba(255,255,255,0.45)", transition: "all 0.2s ease",
                    minHeight: 34,
                  }}>{f}</button>
                ))}
              </div>
            </div>

            {/* Row 2: Save (best for current formation), Print, Share */}
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={isDirty ? saveBest : undefined}
                disabled={!isDirty}
                style={{
                  flex: 1, padding: "5px 0", borderRadius: 7,
                  border: isDirty ? `1px solid ${C.orange}` : "1px solid rgba(255,255,255,0.12)",
                  background: isDirty ? "rgba(232,100,32,0.1)" : "transparent",
                  color: isDirty ? C.orange : "rgba(255,255,255,0.3)",
                  cursor: isDirty ? "pointer" : "default",
                  fontFamily: fontBase, fontSize: 11, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4, minHeight: 34,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save
              </button>
              <button onClick={handlePrint} style={{
                flex: 1, padding: "5px 0", borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer",
                fontFamily: fontBase, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, minHeight: 34,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print
              </button>
              <button onClick={handleShareCurrent} style={{
                flex: 1, padding: "5px 0", borderRadius: 7, border: `1px solid ${C.orange}`,
                background: "rgba(232,100,32,0.1)", color: C.orange, cursor: "pointer",
                fontFamily: fontBase, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, minHeight: 34,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </button>
            </div>

          </div>
        )}

        {/* MAIN */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: isMobile ? "column" : "row" }}>
          {/* ROSTER SIDEBAR — desktop/tablet only */}
          {!isMobile && (
            <div
              onDragOver={handleRosterDragOver} onDrop={handleRosterDrop} onDragLeave={handleRosterDragLeave}
              style={{ width: sidebarWidth, borderRight: `1px solid ${C.whiteAlpha}`, display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.12)", flexShrink: 0, transition: "all 0.2s ease", boxShadow: rosterHover ? "inset 0 0 20px rgba(232,100,32,0.15)" : "none" }}>
              <RosterContent {...rosterProps} />
            </div>
          )}

          {/* PITCH */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: isMobile ? "flex-start" : "center", padding: isMobile ? "6px 10px" : 20, overflow: "auto" }}>

            {/* MOBILE BENCH — labeled bench with scroll indicator */}
            {isMobile && (
              <div style={{ width: "100%", maxWidth: 360, marginBottom: 4, flexShrink: 0 }}>
                {/* Bench label */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 2, padding: "0 4px",
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "2px", color: "rgba(255,255,255,0.35)",
                    fontFamily: fontDisplay, textTransform: "uppercase",
                  }}>BENCH</span>
                  {availablePlayers.length > 0 && (
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>
                      {availablePlayers.length} available
                    </span>
                  )}
                </div>

                {/* Chips container */}
                <div
                  ref={chipStripRef}
                  data-drop-id="chipstrip"
                  onClick={handleBenchTap}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={(e) => handleTouchEnd(e, null)}
                  onTouchCancel={handleTouchCancel}
                  onScroll={(e) => {
                    const el = e.target;
                    const maxScroll = el.scrollWidth - el.clientWidth;
                    setChipScrollPct(maxScroll > 0 ? el.scrollLeft / maxScroll : 0);
                  }}
                  style={{
                    width: "100%",
                    minHeight: 44,
                    display: "flex", alignItems: "center",
                    padding: "4px 8px",
                    borderRadius: 10,
                    background: touchDragState.overTarget === "chipstrip"
                      ? "rgba(232,100,32,0.15)"
                      : "rgba(0,0,0,0.2)",
                    border: touchDragState.overTarget === "chipstrip"
                      ? `2px dashed ${C.orange}`
                      : "1px solid rgba(255,255,255,0.08)",
                    transition: "background 0.15s ease, border 0.15s ease",
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    gap: 6,
                    WebkitOverflowScrolling: "touch",
                  }}>
                  {availablePlayers.length === 0 ? (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic", whiteSpace: "nowrap", padding: "0 4px" }}>
                      All players assigned
                    </div>
                  ) : (
                    availablePlayers.map((p) => (
                      <div
                        key={p.id}
                        data-drag-id={p.id}
                        data-drag-source="roster"
                        onTouchStart={(e) => handleTouchStart(p.id, "roster", e)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={(e) => handleTouchEnd(e, () => handlePlayerClick(p.id))}
                        onTouchCancel={handleTouchCancel}
                        onClick={(e) => { if ('ontouchstart' in window) return; handlePlayerClick(p.id); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "8px 12px",
                          minHeight: 44,
                          borderRadius: 22, cursor: "pointer",
                          background: selectedPlayer === p.id ? C.orange : "rgba(255,255,255,0.07)",
                          border: `1px solid ${selectedPlayer === p.id ? C.orange : "rgba(255,255,255,0.12)"}`,
                          whiteSpace: "nowrap", flexShrink: 0,
                          transition: "all 0.15s ease", userSelect: "none",
                          touchAction: "none",
                          opacity: touchDragState.isDragging && touchDragState.playerId === p.id && touchDragState.source === "roster" ? 0.35 : 1,
                        }}>
                        <span style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 13, color: selectedPlayer === p.id ? C.white : C.orange }}>{formatJerseyNum(p.num) ?? ""}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.white }}>{benchDisplayName(p)}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Scrubber — primary scroll control for bench */}
                {availablePlayers.length > 3 && (
                  <div
                    style={{
                      height: 24, marginTop: 4,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      position: "relative", overflow: "hidden",
                      cursor: "grab",
                      touchAction: "none",
                    }}
                    onTouchStart={(e) => {
                      if (!chipStripRef.current) return;
                      const touch = e.touches[0];
                      const rect = e.currentTarget.getBoundingClientRect();
                      scrubberDragRef.current = {
                        startX: touch.clientX,
                        trackWidth: rect.width,
                        startScrollLeft: chipStripRef.current.scrollLeft,
                        maxScroll: chipStripRef.current.scrollWidth - chipStripRef.current.clientWidth,
                      };
                    }}
                    onTouchMove={(e) => {
                      if (!scrubberDragRef.current || !chipStripRef.current) return;
                      e.preventDefault();
                      const touch = e.touches[0];
                      const { startX, trackWidth, startScrollLeft, maxScroll } = scrubberDragRef.current;
                      const dx = touch.clientX - startX;
                      const scrollDelta = (dx / trackWidth) * maxScroll;
                      chipStripRef.current.scrollLeft = Math.max(0, Math.min(maxScroll, startScrollLeft + scrollDelta));
                    }}
                    onTouchEnd={() => { scrubberDragRef.current = null; }}
                    onTouchCancel={() => { scrubberDragRef.current = null; }}
                    onClick={(e) => {
                      if (!chipStripRef.current) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = (e.clientX - rect.left) / rect.width;
                      const maxScroll = chipStripRef.current.scrollWidth - chipStripRef.current.clientWidth;
                      chipStripRef.current.scrollTo({ left: pct * maxScroll, behavior: "smooth" });
                    }}
                  >
                    {/* Track label */}
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      pointerEvents: "none",
                    }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "1.5px",
                        color: "rgba(255,255,255,0.18)", textTransform: "uppercase",
                        fontFamily: fontDisplay, userSelect: "none",
                      }}>SWIPE TO SCROLL</span>
                    </div>
                    {/* Thumb */}
                    <div style={{
                      position: "absolute", top: 3, bottom: 3,
                      width: "28%", minWidth: 44,
                      left: `${chipScrollPct * 72}%`,
                      borderRadius: 14,
                      background: `linear-gradient(135deg, ${C.orange}, rgba(232,100,32,0.7))`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      transition: scrubberDragRef.current ? "none" : "left 0.1s ease-out",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      pointerEvents: "none",
                    }}>
                      {/* Grip dots */}
                      <div style={{ display: "flex", gap: 3 }}>
                        {[0,1,2].map(i => (
                          <div key={i} style={{
                            width: 3, height: 3, borderRadius: "50%",
                            background: "rgba(255,255,255,0.6)",
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{
              position: "relative", width: "100%", maxWidth: isMobile ? 360 : isTablet ? 420 : 480, aspectRatio: "3 / 4",
              background: pitchBg, borderRadius: isMobile ? 10 : 14, overflow: "hidden",
              boxShadow: `0 24px 64px rgba(0,0,0,0.5), inset 0 0 100px rgba(0,0,0,0.12)`,
              border: "2px solid rgba(255,255,255,0.08)",
            }}>
              <PitchSVG />
              <div style={{
                position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", padding: "4px 14px",
                borderRadius: 20, fontSize: isMobile ? 9 : 10, fontWeight: 700, fontFamily: fontDisplay,
                letterSpacing: "1.2px", color: "rgba(255,255,255,0.65)", zIndex: 10, whiteSpace: "nowrap",
              }}>{formation}</div>
              {positions.map((pos, idx) => {
                const player = lineup[idx] ? getPlayer(lineup[idx]) : null;
                const isTouchDragOver = touchDragState.overTarget === `field-${idx}`;
                return (
                  <FieldPosition key={`${formation}-${idx}`} pos={pos} player={player}
                    isHighlighted={!!selectedPlayer && !player}
                    isSelected={!!player && player.id === selectedPlayer}
                    compact={false}
                    dragSource={dragSource} idx={idx}
                    isTouchDragOver={isTouchDragOver}
                    onDragStart={(e) => handleDragStart(e, player.id, idx)} onDragEnd={handleDragEnd}
                    onDragOver={handlePositionDragOver} onDrop={(e) => handlePositionDrop(e, idx)}
                    onClick={() => { if (isMobile) return; handlePositionClick(idx); }}
                    onDoubleClick={() => { if (isMobile) return; player && removeFromPosition(idx); }}
                    onTouchStart={isMobile ? (e) => handleTouchStart(player ? player.id : null, idx, e) : undefined}
                    onTouchMove={isMobile ? handleTouchMove : undefined}
                    onTouchEnd={isMobile ? (e) => handleTouchEnd(e, () => handlePositionClick(idx)) : undefined}
                    onTouchCancel={isMobile ? handleTouchCancel : undefined}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* BENCH BAR — desktop only */}
        {!isMobile && (
          <div
            onDragOver={handleRosterDragOver} onDrop={handleRosterDrop} onDragLeave={handleRosterDragLeave}
            onClick={handleBenchTap}
            style={{
              padding: "9px 24px",
              borderTop: `1px solid ${C.whiteAlpha}`, display: "flex", alignItems: "center",
              gap: 14, background: rosterHover ? "rgba(232,100,32,0.08)" : "rgba(0,0,0,0.12)",
              transition: "background 0.2s ease",
              cursor: selectedPlayer && lineup.indexOf(selectedPlayer) !== -1 ? "pointer" : "default",
            }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", flexShrink: 0 }}>BENCH</div>
            <div style={{ display: "flex", gap: 5, flex: 1, overflowX: "auto", padding: "2px 0" }}>
              {availablePlayers.length === 0 ? (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", fontStyle: "italic" }}>All players assigned</div>
              ) : (
                availablePlayers.map((p) => (
                  <div key={p.id} draggable onDragStart={(e) => handleDragStart(e, p.id, "roster")} onDragEnd={handleDragEnd}
                    onClick={() => handlePlayerClick(p.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "5px 10px", borderRadius: 20, cursor: "pointer",
                      background: selectedPlayer === p.id ? C.orange : "rgba(255,255,255,0.05)",
                      border: `1px solid ${selectedPlayer === p.id ? C.orange : "rgba(255,255,255,0.08)"}`,
                      whiteSpace: "nowrap", fontSize: 11, fontWeight: 500, transition: "all 0.15s ease", flexShrink: 0, userSelect: "none",
                    }}>
                    <span style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 10 }}>{formatJerseyNum(p.num) ?? ""}</span>
                    <span>{benchDisplayName(p)}</span>
                  </div>
                ))
              )}
            </div>
            {inactivePlayers.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, opacity: 0.4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1px", color: "rgba(255,120,80,0.8)" }}>INACTIVE: {inactivePlayers.length}</span>
              </div>
            )}
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", flexShrink: 0, fontStyle: "italic" }}>
              {selectedPlayer
                ? (lineup.indexOf(selectedPlayer) !== -1
                    ? "Tap a position to swap, or tap bench to sub out"
                    : "Tap a position to assign")
                : "Click or drag players"}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE ROSTER MODAL */}
      {isMobile && rosterOpen && (
        <>
          <div onClick={() => setRosterOpen(false)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)", zIndex: 50,
          }} />
          <div style={{
            position: "fixed", inset: 0, zIndex: 51,
            background: C.navyDark, display: "flex", flexDirection: "column",
            color: C.white, fontFamily: fontBase,
          }}>
            <div style={{
              padding: "14px 16px", borderBottom: `1px solid ${C.whiteAlpha}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{
                fontFamily: fontDisplay, fontSize: 16, fontWeight: 800,
              }}>Roster Management</span>
              <button onClick={() => setRosterOpen(false)} style={{
                background: "rgba(255,255,255,0.1)", border: "none",
                color: C.white, borderRadius: 8, cursor: "pointer",
                fontSize: 14, padding: "8px 14px", fontWeight: 700, minHeight: 44,
              }}>Done</button>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <RosterContent {...rosterProps} />
            </div>
          </div>
        </>
      )}

      {/* SHARED LINEUP NOTICE — subtle pill, auto-dismisses */}
      {sharedName && (
        <div style={{
          position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 60,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
          color: C.white, padding: "6px 16px",
          borderRadius: 20, display: "flex", alignItems: "center", gap: 8,
          fontFamily: fontBase, fontSize: 12, fontWeight: 500,
          border: `1px solid ${C.orange}`,
          animation: "fadeInOut 4s ease-in-out forwards",
        }} onAnimationEnd={() => setSharedName(null)}>
          <span style={{ color: C.orange, fontWeight: 700 }}>Loaded:</span>
          <span>{sharedName}</span>
        </div>
      )}
      <style>{`@keyframes fadeInOut { 0% { opacity: 0; transform: translateX(-50%) translateY(-8px); } 10% { opacity: 1; transform: translateX(-50%) translateY(0); } 80% { opacity: 1; } 100% { opacity: 0; } }`}</style>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 200,
          background: C.navy, color: C.white, padding: "10px 20px", borderRadius: 10,
          fontFamily: fontBase, fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)", border: `1px solid ${C.orange}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>
      )}

      {/* TOUCH DRAG GHOST — follows finger during touch drag */}
      {isMobile && touchDragState.isDragging && (() => {
        const ghostPlayer = touchDragState.playerId ? getPlayer(touchDragState.playerId) : null;
        return createPortal(
          <div style={{
            position: "fixed",
            left: touchDragState.ghostX,
            top: touchDragState.ghostY,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 9999,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: "50%",
              background: `linear-gradient(145deg, ${C.navy}, ${C.navyLight})`,
              border: `2.5px solid ${C.orange}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: fontDisplay, fontSize: 18, fontWeight: 800, color: C.orange,
              boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 20px ${C.orangeGlow}`,
              opacity: 0.92,
            }}>
              {ghostPlayer ? (formatJerseyNum(ghostPlayer.num) ?? "") : "?"}
            </div>
            {ghostPlayer && (
              <div style={{
                fontSize: 10, fontWeight: 700, color: C.white,
                textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                background: "rgba(0,0,0,0.5)", borderRadius: 4, padding: "1px 5px",
              }}>
                {ghostPlayer.name.split(" ")[0]}
              </div>
            )}
          </div>,
          document.body
        );
      })()}
    </>
  );
}
