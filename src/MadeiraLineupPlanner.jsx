import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { loadPublishedLineup, savePublishedLineup } from "./firebase";

// =============================================
// MADEIRA FC — 9v9 LINEUP PLANNER
// =============================================

// =============================================
// SHARE UTILS — encode/decode lineup state for URL sharing
// =============================================
function encodeLineup({ formation, lineups, inactiveIds, roster, name }) {
  const payload = { f: formation, l: lineups, i: inactiveIds, r: roster, n: name || "" };
  return btoa(JSON.stringify(payload));
}

function decodeLineup(encoded) {
  try {
    const payload = JSON.parse(atob(encoded));
    return { formation: payload.f, lineups: payload.l, inactiveIds: payload.i, roster: payload.r, name: payload.n || "" };
  } catch { return null; }
}

function buildShareUrl(data) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?lineup=${encodeLineup(data)}`;
}

async function shareLineup(data) {
  const url = buildShareUrl(data);
  const title = data.name ? `Madeira FC — ${data.name}` : "Madeira FC Lineup";

  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (e) {
      if (e.name === "AbortError") return null;
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}

const C = {
  navy: "#1B2A5B",
  navyLight: "#263A6E",
  navyDark: "#111B3A",
  orange: "#E86420",
  orangeLight: "#FF8C4A",
  orangeGlow: "rgba(232, 100, 32, 0.35)",
  white: "#FFFFFF",
  whiteAlpha: "rgba(255,255,255,0.12)",
};

const fontBase = "'DM Sans', system-ui, -apple-system, sans-serif";
const fontDisplay = "'Outfit', system-ui, -apple-system, sans-serif";

// =============================================
// NAME ABBREVIATION UTILITY
// =============================================
function abbreviateName(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  if (parts[0].includes(".")) return name.trim();
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

// =============================================
// RESPONSIVE HOOK
// =============================================
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

const INITIAL_ROSTER = [
  { id: 1, name: "Alex Rodarte", num: 2 },
  { id: 2, name: "Avery Paulin", num: 6 },
  { id: 3, name: "Avery Zara", num: 89 },
  { id: 4, name: "Bella McDermott", num: 33 },
  { id: 5, name: "Brooklynn Green", num: 4 },
  { id: 6, name: "Caroline Jones", num: 11 },
  { id: 7, name: "Catherine Quiles", num: 7 },
  { id: 8, name: "Cecilia Ethier", num: 12 },
  { id: 9, name: "Hope Frazier", num: 21 },
  { id: 10, name: "Mary Claire Whitted", num: 28 },
  { id: 11, name: "Natalie Brooks", num: 3 },
  { id: 12, name: "Rosslyn Dahm", num: 43 },
  { id: 13, name: "Violet Guttman", num: 42 },
];

const FORMATIONS = {
  "3-3-2": [
    { label: "GK", x: 50, y: 93 }, { label: "LB", x: 22, y: 73 }, { label: "CB", x: 50, y: 76 },
    { label: "RB", x: 78, y: 73 }, { label: "LM", x: 22, y: 51 }, { label: "CM", x: 50, y: 54 },
    { label: "RM", x: 78, y: 51 }, { label: "LS", x: 36, y: 30 }, { label: "RS", x: 64, y: 30 },
  ],
  "3-2-3": [
    { label: "GK", x: 50, y: 93 }, { label: "LB", x: 22, y: 73 }, { label: "CB", x: 50, y: 76 },
    { label: "RB", x: 78, y: 73 }, { label: "LCM", x: 36, y: 54 }, { label: "RCM", x: 64, y: 54 },
    { label: "LW", x: 20, y: 30 }, { label: "CF", x: 50, y: 27 }, { label: "RW", x: 80, y: 30 },
  ],
  "2-3-3": [
    { label: "GK", x: 50, y: 93 }, { label: "LB", x: 33, y: 74 }, { label: "RB", x: 67, y: 74 },
    { label: "LM", x: 20, y: 51 }, { label: "CM", x: 50, y: 54 }, { label: "RM", x: 80, y: 51 },
    { label: "LW", x: 20, y: 30 }, { label: "CF", x: 50, y: 27 }, { label: "RW", x: 80, y: 30 },
  ],
  "4-3-1": [
    { label: "GK", x: 50, y: 93 }, { label: "LB", x: 16, y: 72 }, { label: "LCB", x: 39, y: 76 },
    { label: "RCB", x: 61, y: 76 }, { label: "RB", x: 84, y: 72 }, { label: "LM", x: 22, y: 51 },
    { label: "CM", x: 50, y: 54 }, { label: "RM", x: 78, y: 51 }, { label: "ST", x: 50, y: 30 },
  ],
};

// =============================================
// PITCH SVG
// =============================================
function PitchSVG({ lineColor = "rgba(255,255,255,0.75)" }) {
  return (
    <svg viewBox="0 0 400 540" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} preserveAspectRatio="none">
      <rect x="20" y="22" width="360" height="496" fill="none" stroke={lineColor} strokeWidth="2" />
      <line x1="20" y1="270" x2="380" y2="270" stroke={lineColor} strokeWidth="2" />
      <circle cx="200" cy="270" r="46" fill="none" stroke={lineColor} strokeWidth="2" />
      <circle cx="200" cy="270" r="3" fill={lineColor} />
      <rect x="100" y="22" width="200" height="80" fill="none" stroke={lineColor} strokeWidth="2" />
      <rect x="145" y="22" width="110" height="36" fill="none" stroke={lineColor} strokeWidth="2" />
      <rect x="168" y="6" width="64" height="16" fill="none" stroke={lineColor} strokeWidth="1.5" rx="1" />
      <path d="M 155 102 A 40 40 0 0 0 245 102" fill="none" stroke={lineColor} strokeWidth="2" />
      <circle cx="200" cy="80" r="2.5" fill={lineColor} />
      <rect x="100" y="438" width="200" height="80" fill="none" stroke={lineColor} strokeWidth="2" />
      <rect x="145" y="482" width="110" height="36" fill="none" stroke={lineColor} strokeWidth="2" />
      <rect x="168" y="518" width="64" height="16" fill="none" stroke={lineColor} strokeWidth="1.5" rx="1" />
      <path d="M 155 438 A 40 40 0 0 1 245 438" fill="none" stroke={lineColor} strokeWidth="2" />
      <circle cx="200" cy="460" r="2.5" fill={lineColor} />
      <path d="M 20 34 A 12 12 0 0 0 32 22" fill="none" stroke={lineColor} strokeWidth="2" />
      <path d="M 368 22 A 12 12 0 0 0 380 34" fill="none" stroke={lineColor} strokeWidth="2" />
      <path d="M 20 506 A 12 12 0 0 1 32 518" fill="none" stroke={lineColor} strokeWidth="2" />
      <path d="M 368 518 A 12 12 0 0 1 380 506" fill="none" stroke={lineColor} strokeWidth="2" />
    </svg>
  );
}

// =============================================
// INTERACTIVE FIELD POSITION
// =============================================
function FieldPosition({ pos, player, isHighlighted, onDragStart, onDragEnd, onDragOver, onDrop, onClick, onDoubleClick, compact, dragSource, idx, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, isTouchDragOver }) {
  const has = !!player;
  const circleSize = 50;
  const numSize = has ? 18 : 10;
  const nameSize = has ? 11 : 10;
  const isBeingDragged = dragSource && dragSource.source === idx;
  const shouldGlow = (dragSource && !isBeingDragged) || isTouchDragOver;
  return (
    <div
      data-drop-id={`field-${idx}`}
      draggable={has} onDragStart={has ? onDragStart : undefined} onDragEnd={onDragEnd}
      onDragOver={onDragOver} onDrop={onDrop} onClick={onClick} onDoubleClick={onDoubleClick}
      onTouchStart={has ? onTouchStart : undefined}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      style={{
        position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: compact ? 1 : 2,
        cursor: has ? "grab" : isHighlighted ? "pointer" : "default", zIndex: 5,
        transition: "left 0.4s cubic-bezier(0.4,0,0.2,1), top 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
        userSelect: "none", opacity: isBeingDragged ? 0.35 : 1,
        touchAction: "none",
      }}>
      <div style={{
        width: circleSize, height: circleSize, borderRadius: "50%",
        background: has ? `linear-gradient(145deg, ${C.navy}, ${C.navyLight})` : isHighlighted ? "rgba(232,100,32,0.25)" : "rgba(0,0,0,0.2)",
        border: has ? `2.5px solid ${C.orange}` : isHighlighted ? `2px dashed ${C.orange}` : "2px dashed rgba(255,255,255,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: fontDisplay, fontSize: numSize, fontWeight: 800,
        color: has ? C.orange : "rgba(255,255,255,0.45)",
        boxShadow: shouldGlow
          ? `0 4px 14px rgba(0,0,0,0.45), 0 0 12px 3px rgba(232,100,32,0.4)`
          : has ? `0 4px 14px rgba(0,0,0,0.45), 0 0 20px ${C.orangeGlow}` : "none",
        transition: "all 0.2s ease",
      }}>{has ? player.num : pos.label}</div>
      <div style={{
        fontSize: nameSize, fontWeight: 700, color: has ? C.white : "rgba(255,255,255,0.35)",
        textAlign: "center", textShadow: "0 1px 4px rgba(0,0,0,0.9)",
        maxWidth: compact ? 68 : 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: fontBase,
      }}>{has ? abbreviateName(player.name) : pos.label}</div>
      {has && <div style={{ fontSize: compact ? 7 : 10, fontWeight: 700, color: C.orange, letterSpacing: "1.2px", WebkitTextStroke: "0.5px rgba(255,255,255,0.7)", textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>{pos.label}</div>}
    </div>
  );
}

// =============================================
// ROSTER PLAYER CHIP
// =============================================
function PlayerChip({ player, isSelected, isDimmed, isInactive, onDragStart, onDragEnd, onClick, onRemove, onToggleInactive, showRemove, showEdit }) {
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
      }}>{player.num}</div>
      <div style={{ fontSize: isDimmed ? 12 : 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
        {player.name}
      </div>
      {showEdit && !isDimmed && onToggleInactive && (
        <button onClick={(e) => { e.stopPropagation(); onToggleInactive(); }}
          style={{ background: "rgba(255,120,80,0.15)", border: "none", color: "rgba(255,120,80,0.7)", borderRadius: 4, cursor: "pointer", fontSize: 10, padding: "2px 6px", flexShrink: 0, lineHeight: 1, fontWeight: 700 }}>SIT</button>
      )}
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
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: fontDisplay, fontSize: player ? 10 : 5.5, fontWeight: 800,
                color: player ? C.navy : "#bbb",
              }}>{player ? player.num : pos.label}</div>
              <div style={{
                fontSize: 6, fontWeight: 700, color: C.navy,
                maxWidth: 50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: fontBase, textAlign: "center",
              }}>{player ? abbreviateName(player.name) : pos.label}</div>
              {player && <div style={{ fontSize: 5, fontWeight: 700, color: C.orange, letterSpacing: "0.6px" }}>{pos.label}</div>}
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
              <span style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 7 }}>{p.num}</span>
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
                <span style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 7 }}>{p.num}</span>
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
// SAVE / LOAD MODAL
// =============================================
function SaveLoadModal({ isOpen, mode, savedLineups, onSave, onLoad, onDelete, onShare, onClose, isMobile }) {
  const [name, setName] = useState("");
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 100,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.navyLight, borderRadius: isMobile ? "14px 14px 0 0" : 14, padding: 24,
        width: isMobile ? "100%" : 360, maxHeight: "80vh",
        border: `1px solid rgba(255,255,255,0.12)`, boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 800, color: C.white }}>
            {mode === "save" ? "Save Lineup" : "Load Lineup"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {mode === "save" && (
          <div>
            <input placeholder="Lineup name (e.g. vs. Anderson Twp)" value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onSave(name.trim()); setName(""); } }}
              style={{
                width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: C.white,
                fontSize: 14, fontFamily: fontBase, outline: "none", marginBottom: 10,
              }} autoFocus />
            <button onClick={() => { if (name.trim()) { onSave(name.trim()); setName(""); } }}
              style={{
                width: "100%", padding: 10, background: C.orange, border: "none", borderRadius: 8,
                color: C.white, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: fontBase,
                opacity: name.trim() ? 1 : 0.4,
              }}>Save</button>
          </div>
        )}

        {mode === "load" && (
          <div style={{ overflowY: "auto", flex: 1 }}>
            {savedLineups.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "rgba(255,255,255,0.3)", fontSize: 13, fontStyle: "italic" }}>No saved lineups yet</div>
            ) : (
              savedLineups.map((s, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", padding: "10px 12px", marginBottom: 4, borderRadius: 8,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer", transition: "all 0.15s ease",
                }} onClick={() => onLoad(i)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                      {s.formation} · {s.date}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onShare(i); }} title="Share lineup"
                    style={{ background: "rgba(232,100,32,0.1)", border: "none", color: C.orange, borderRadius: 4, cursor: "pointer", fontSize: 11, padding: "3px 7px", marginLeft: 8, display: "flex", alignItems: "center", gap: 3 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    Share
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(i); }}
                    style={{ background: "rgba(255,60,60,0.1)", border: "none", color: "rgba(255,100,100,0.6)", borderRadius: 4, cursor: "pointer", fontSize: 11, padding: "3px 7px" }}>
                    Del
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// ROSTER SIDEBAR CONTENT (shared between sidebar and mobile drawer)
// =============================================
function RosterContent({ roster, availablePlayers, onFieldPlayers, inactivePlayers, selectedPlayer, showEdit, setShowEdit,
  handleDragStart, handleDragEnd, handlePlayerClick, removePlayer, toggleInactive, newName, setNewName, newNum, setNewNum,
  addPlayer, copyToOtherHalf, clearLineup, clearAll, activeHalf, inactiveHover, setInactiveHover }) {

  const handleInactiveDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setInactiveHover(true); };
  const handleInactiveDragLeave = () => setInactiveHover(false);
  const handleInactiveDrop = (e) => {
    e.preventDefault();
    setInactiveHover(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.playerId && data.source !== "inactive") {
        toggleInactive(data.playerId);
      }
    } catch {}
  };

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
          <PlayerChip key={p.id} player={p} isSelected={selectedPlayer === p.id} isDimmed={false} isInactive={false}
            onDragStart={(e) => handleDragStart(e, p.id, "roster")} onDragEnd={handleDragEnd}
            onClick={() => handlePlayerClick(p.id)} onRemove={() => removePlayer(p.id)} onToggleInactive={() => toggleInactive(p.id)} showRemove={showEdit} showEdit={showEdit} />
        ))}

        {onFieldPlayers.length > 0 && (
          <>
            <div style={{ padding: "12px 0 5px", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              On Field · {onFieldPlayers.length}
            </div>
            {onFieldPlayers.map((p) => (
              <PlayerChip key={p.id} player={p} isSelected={false} isDimmed={true} isInactive={false} showRemove={false} />
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

      {/* INACTIVE DROP ZONE */}
      <div
        onDragOver={handleInactiveDragOver}
        onDragLeave={handleInactiveDragLeave}
        onDrop={handleInactiveDrop}
        style={{
          margin: "0 10px", padding: inactivePlayers.length > 0 ? "8px 10px" : "10px",
          borderRadius: 8, minHeight: inactivePlayers.length > 0 ? "auto" : 44,
          background: inactiveHover ? "rgba(255,120,80,0.15)" : "rgba(255,255,255,0.03)",
          border: inactiveHover ? `2px dashed ${C.orange}` : inactivePlayers.length > 0 ? "1px solid rgba(255,120,80,0.15)" : "2px dashed rgba(255,255,255,0.08)",
          transition: "all 0.2s ease",
          display: "flex", flexDirection: "column", gap: 3,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: inactivePlayers.length > 0 ? 4 : 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={inactiveHover ? C.orange : "rgba(255,120,80,0.5)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", color: inactiveHover ? C.orange : "rgba(255,120,80,0.5)", textTransform: "uppercase" }}>
            {inactivePlayers.length > 0 ? `Inactive · ${inactivePlayers.length}` : "Drag here to sit out"}
          </span>
        </div>
        {inactivePlayers.map((p) => (
          <div key={p.id} draggable
            onDragStart={(e) => handleDragStart(e, p.id, "inactive")}
            onDragEnd={handleDragEnd}
            onClick={() => toggleInactive(p.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6,
              cursor: "grab", opacity: 0.55,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              textDecoration: "line-through", textDecorationColor: "rgba(255,255,255,0.2)",
              transition: "all 0.15s ease", userSelect: "none",
            }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: fontDisplay, fontSize: 9, fontWeight: 800, flexShrink: 0, color: C.white,
            }}>{p.num}</div>
            <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, color: "rgba(255,255,255,0.5)" }}>
              {p.name}
            </div>
            {showEdit && (
              <button onClick={(e) => { e.stopPropagation(); removePlayer(p.id); }}
                style={{ background: "rgba(255,80,80,0.15)", border: "none", color: "#ff7b7b", borderRadius: 4, cursor: "pointer", fontSize: 12, padding: "2px 6px", flexShrink: 0, lineHeight: 1 }}>×</button>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: 10, borderTop: `1px solid ${C.whiteAlpha}`, display: "flex", flexDirection: "column", gap: 5 }}>
        <button onClick={copyToOtherHalf} style={{ padding: 7, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: fontBase }}>
          Copy to {activeHalf === 1 ? "2nd" : "1st"} Half
        </button>
        <button onClick={clearLineup} style={{ padding: 7, background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.15)", borderRadius: 7, color: "rgba(255,100,100,0.7)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: fontBase }}>
          Clear {activeHalf === 1 ? "1st" : "2nd"} Half
        </button>
        <button onClick={clearAll} style={{ padding: 7, background: "rgba(255,60,60,0.15)", border: "1px solid rgba(255,60,60,0.25)", borderRadius: 7, color: "rgba(255,100,100,0.9)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fontBase }}>
          Clear All
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
      // Was a tap — execute tap callback
      pendingDragRef.current = null;
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

  const [roster, setRoster] = useState(() => loadStored("roster", INITIAL_ROSTER));
  const [inactiveIds, setInactiveIds] = useState(() => loadStored("inactiveIds", []));
  const [formation, setFormation] = useState(() => loadStored("formation", "3-3-2"));
  const [activeHalf, setActiveHalf] = useState(1);
  const [lineups, setLineups] = useState(() => loadStored("lineups", { 1: Array(9).fill(null), 2: Array(9).fill(null) }));
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNum, setNewNum] = useState("");
  const [savedLineups, setSavedLineups] = useState(() => loadStored("savedLineups", []));
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("save");
  const [rosterOpen, setRosterOpen] = useState(false);
  const [inactiveHover, setInactiveHover] = useState(false);
  const [rosterHover, setRosterHover] = useState(false);
  const [toast, setToast] = useState(null);
  const [sharedName, setSharedName] = useState(null);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const toastTimer = useRef(null);

  // --- Persist state to localStorage ---
  useEffect(() => saveStored("roster", roster), [roster]);
  useEffect(() => saveStored("inactiveIds", inactiveIds), [inactiveIds]);
  useEffect(() => saveStored("formation", formation), [formation]);
  useEffect(() => saveStored("lineups", lineups), [lineups]);
  useEffect(() => saveStored("savedLineups", savedLineups), [savedLineups]);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  // Load shared lineup from URL on mount, or load published lineup from Firestore
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("lineup");
    if (encoded) {
      const data = decodeLineup(encoded);
      if (data) {
        if (data.roster) setRoster(data.roster);
        setFormation(data.formation);
        setLineups({ 1: [...data.lineups[1]], 2: [...data.lineups[2]] });
        setInactiveIds([...data.inactiveIds]);
        if (data.name) setSharedName(data.name);
        window.history.replaceState({}, "", window.location.pathname);
        setCloudLoaded(true);
        return;
      }
    }
    // No URL share — load published lineup from Firestore
    loadPublishedLineup().then((data) => {
      if (data) {
        if (data.roster) setRoster(data.roster);
        if (data.formation) setFormation(data.formation);
        if (data.lineups) setLineups({ 1: [...data.lineups[1]], 2: [...data.lineups[2]] });
        if (data.inactiveIds) setInactiveIds([...data.inactiveIds]);
        if (data.name) setSharedName(data.name);
      }
      setCloudLoaded(true);
    });
  }, []);

  const currentLineup = lineups[activeHalf];
  const positions = FORMATIONS[formation];
  const assignedIds = currentLineup.filter(Boolean);
  const availablePlayers = roster.filter((p) => !assignedIds.includes(p.id) && !inactiveIds.includes(p.id));
  const onFieldPlayers = roster.filter((p) => assignedIds.includes(p.id));
  const inactivePlayers = roster.filter((p) => inactiveIds.includes(p.id));
  const getPlayer = (id) => roster.find((p) => p.id === id);

  // --- LINEUP ACTIONS ---
  const assignPlayer = useCallback((playerId, posIndex) => {
    if (inactiveIds.includes(playerId)) return;
    setLineups((prev) => {
      const next = { ...prev };
      const arr = [...next[activeHalf]];
      const existingPos = arr.indexOf(playerId);
      if (existingPos !== -1) arr[existingPos] = null;
      arr[posIndex] = playerId;
      next[activeHalf] = arr;
      return next;
    });
    setSelectedPlayer(null);
  }, [activeHalf, inactiveIds]);

  const swapPositions = useCallback((fromIdx, toIdx) => {
    setLineups((prev) => {
      const next = { ...prev };
      const arr = [...next[activeHalf]];
      [arr[fromIdx], arr[toIdx]] = [arr[toIdx], arr[fromIdx]];
      next[activeHalf] = arr;
      return next;
    });
  }, [activeHalf]);

  const removeFromPosition = useCallback((posIndex) => {
    setLineups((prev) => {
      const next = { ...prev };
      const arr = [...next[activeHalf]];
      arr[posIndex] = null;
      next[activeHalf] = arr;
      return next;
    });
  }, [activeHalf]);

  // Touch drag-and-drop (mobile only — HTML5 drag API does not fire on touch screens)
  const { touchDragState, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel } = useTouchDrag({
    assignPlayer,
    swapPositions,
    removeFromPosition,
  });

  const clearLineup = () => setLineups((prev) => ({ ...prev, [activeHalf]: Array(9).fill(null) }));
  const clearAll = () => {
    setLineups({ 1: Array(9).fill(null), 2: Array(9).fill(null) });
    setInactiveIds([]);
    setSelectedPlayer(null);
  };
  const copyToOtherHalf = () => {
    const other = activeHalf === 1 ? 2 : 1;
    setLineups((prev) => ({ ...prev, [other]: [...prev[activeHalf]] }));
  };

  // --- INACTIVE ---
  const toggleInactive = (playerId) => {
    setInactiveIds((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      } else {
        setLineups((prevL) => ({
          1: prevL[1].map((id) => (id === playerId ? null : id)),
          2: prevL[2].map((id) => (id === playerId ? null : id)),
        }));
        return [...prev, playerId];
      }
    });
    setSelectedPlayer(null);
  };

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
    setLineups((prev) => ({ 1: prev[1].map((id) => (id === playerId ? null : id)), 2: prev[2].map((id) => (id === playerId ? null : id)) }));
  };

  // --- SAVE / LOAD ---
  const saveLineup = async (name) => {
    const snapshot = {
      name,
      formation,
      lineups: { 1: [...lineups[1]], 2: [...lineups[2]] },
      inactiveIds: [...inactiveIds],
      roster: roster.map((p) => ({ ...p })),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setSavedLineups((prev) => [...prev, snapshot]);
    setModalOpen(false);
    // Publish to Firestore so all devices see this lineup
    const ok = await savePublishedLineup(snapshot);
    if (ok) showToast("Lineup saved & published!");
    else showToast("Saved locally (cloud sync failed)");
  };
  const loadLineup = (index) => {
    const s = savedLineups[index];
    if (s.roster) setRoster(s.roster.map((p) => ({ ...p })));
    setFormation(s.formation);
    setLineups({ 1: [...s.lineups[1]], 2: [...s.lineups[2]] });
    setInactiveIds([...s.inactiveIds]);
    setSelectedPlayer(null);
    setModalOpen(false);
  };
  const deleteLineup = (index) => {
    setSavedLineups((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SHARE ---
  const handleShareSaved = async (index) => {
    const s = savedLineups[index];
    const result = await shareLineup({ formation: s.formation, lineups: s.lineups, inactiveIds: s.inactiveIds, roster: s.roster || roster, name: s.name });
    if (result === "copied") showToast("Link copied to clipboard!");
    else if (result === "shared") showToast("Lineup shared!");
  };
  const handleShareCurrent = async () => {
    const result = await shareLineup({ formation, lineups, inactiveIds, roster, name: "" });
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
      if (data.source === "inactive") {
        // Reactivate and assign to position
        toggleInactive(data.playerId);
        // Use setTimeout so the inactive state clears before assigning
        setTimeout(() => assignPlayer(data.playerId, posIndex), 0);
      } else if (data.source === "roster") {
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
  const handlePositionClick = (posIndex) => {
    if (!selectedPlayer) {
      // No selection — select the field player at this position (if any)
      if (currentLineup[posIndex]) setSelectedPlayer(currentLineup[posIndex]);
      return;
    }

    // A player is selected — determine source
    const selectedPosIndex = currentLineup.indexOf(selectedPlayer);
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
  const handlePrint = () => window.print();

  const pitchBg = "repeating-linear-gradient(to bottom, #338740 0px, #338740 28px, #2E7D39 28px, #2E7D39 56px)";
  const sidebarWidth = isTablet ? 190 : 230;

  // Shared roster props
  const rosterProps = {
    roster, availablePlayers, onFieldPlayers, inactivePlayers, selectedPlayer, showEdit, setShowEdit,
    handleDragStart, handleDragEnd, handlePlayerClick, removePlayer, toggleInactive,
    newName, setNewName, newNum, setNewNum, addPlayer, copyToOtherHalf, clearLineup, clearAll, activeHalf,
    inactiveHover, setInactiveHover,
    rosterHover,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
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
            <img src="/madeira-fc-logo.png" alt="Madeira FC" style={{ width: 32, height: "auto" }} />
            <div>
              <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 800, color: C.navy, letterSpacing: "-0.3px", lineHeight: 1.1 }}>MADEIRA FC</div>
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

        <div style={{ display: "flex", gap: 16, flex: 1 }}>
          <PrintPitch halfLabel="1st Half" lineup={lineups[1]} positions={positions} roster={roster} formation={formation} inactiveIds={inactiveIds} />
          <PrintPitch halfLabel="2nd Half" lineup={lineups[2]} positions={positions} roster={roster} formation={formation} inactiveIds={inactiveIds} />
        </div>

        <div style={{ marginTop: 8, paddingTop: 5, borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 6.5, color: "#ccc", letterSpacing: "1px", textTransform: "uppercase" }}>Madeira FC Lineup Planner</div>
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
          padding: isMobile ? "10px 12px" : "14px 24px",
          borderBottom: `1px solid ${C.whiteAlpha}`, flexWrap: "wrap", gap: isMobile ? 8 : 12,
        }}>
          {/* Logo + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
            <img src="/madeira-fc-logo.png" alt="Madeira FC" style={{ width: isMobile ? 36 : 48, height: "auto" }} />
            <div>
              <h1 style={{ fontFamily: fontDisplay, fontSize: isMobile ? 16 : 21, fontWeight: 800, letterSpacing: "-0.3px", lineHeight: 1.1 }}>MADEIRA FC</h1>
              <div style={{ fontSize: isMobile ? 8 : 10, color: "rgba(255,255,255,0.4)", letterSpacing: "2.5px", fontWeight: 700, textTransform: "uppercase", marginTop: 1 }}>Lineup Planner</div>
            </div>
          </div>

          {/* Formation selector */}
          <div style={{ display: "flex", gap: 3, background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 3, order: isMobile ? 3 : 0, flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
            {Object.keys(FORMATIONS).map((f) => (
              <button key={f} onClick={() => setFormation(f)} style={{
                padding: isMobile ? "6px 0" : "7px 16px", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: fontDisplay, fontWeight: 700, fontSize: isMobile ? 12 : 13,
                background: formation === f ? C.orange : "transparent",
                color: formation === f ? C.white : "rgba(255,255,255,0.45)", transition: "all 0.2s ease",
                flex: isMobile ? 1 : "0 0 auto",
              }}>{f}</button>
            ))}
          </div>

          {/* Controls: half toggle, save/load, print */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 3 }}>
              {[1, 2].map((h) => (
                <button key={h} onClick={() => { setActiveHalf(h); setSelectedPlayer(null); }} style={{
                  padding: isMobile ? "6px 12px" : "7px 18px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontFamily: fontDisplay, fontWeight: 700, fontSize: isMobile ? 11 : 12,
                  background: activeHalf === h ? C.orange : "transparent",
                  color: activeHalf === h ? C.white : "rgba(255,255,255,0.45)", transition: "all 0.2s ease",
                }}>{h === 1 ? "1ST" : "2ND"}</button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 3 }}>
              <button onClick={() => { setModalMode("save"); setModalOpen(true); }} style={{
                padding: isMobile ? "6px 8px" : "7px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.18)",
                background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer",
                fontFamily: fontBase, fontSize: isMobile ? 11 : 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                {!isMobile && "Save"}
              </button>
              <button onClick={() => { setModalMode("load"); setModalOpen(true); }} style={{
                padding: isMobile ? "6px 8px" : "7px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.18)",
                background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer",
                fontFamily: fontBase, fontSize: isMobile ? 11 : 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                {!isMobile && "Load"}
                {savedLineups.length > 0 && (
                  <span style={{ background: C.orange, borderRadius: 10, padding: "1px 5px", fontSize: 9, fontWeight: 800, color: C.white }}>
                    {savedLineups.length}
                  </span>
                )}
              </button>
            </div>

            <button onClick={handlePrint} style={{
              padding: isMobile ? "6px 8px" : "7px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.18)",
              background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer",
              fontFamily: fontBase, fontSize: isMobile ? 11 : 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              {!isMobile && "Print"}
            </button>

            <button onClick={handleShareCurrent} style={{
              padding: isMobile ? "6px 8px" : "7px 12px", borderRadius: 7, border: `1px solid ${C.orange}`,
              background: "rgba(232,100,32,0.1)", color: C.orange, cursor: "pointer",
              fontFamily: fontBase, fontSize: isMobile ? 11 : 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              {!isMobile && "Share"}
            </button>
          </div>
        </div>

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
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: isMobile ? "flex-start" : "center", padding: isMobile ? 10 : 20, overflow: "auto" }}>

            {/* MOBILE CHIP STRIP — bench players as draggable chips above the pitch */}
            {isMobile && (
              <div
                data-drop-id="chipstrip"
                onTouchMove={handleTouchMove}
                onTouchEnd={(e) => handleTouchEnd(e, null)}
                onTouchCancel={handleTouchCancel}
                style={{
                  width: "100%", maxWidth: 360,
                  minHeight: 52, marginBottom: 8,
                  display: "flex", alignItems: "center",
                  padding: "6px 8px",
                  borderRadius: 10,
                  background: touchDragState.overTarget === "chipstrip"
                    ? "rgba(232,100,32,0.15)"
                    : "rgba(0,0,0,0.2)",
                  border: touchDragState.overTarget === "chipstrip"
                    ? `2px dashed ${C.orange}`
                    : "1px solid rgba(255,255,255,0.08)",
                  transition: "background 0.15s ease, border 0.15s ease",
                  overflowX: "auto",
                  gap: 6,
                  flexShrink: 0,
                  WebkitOverflowScrolling: "touch",
                }}>
                {availablePlayers.length === 0 ? (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic", whiteSpace: "nowrap", padding: "0 4px" }}>
                    All players assigned
                  </div>
                ) : (
                  <>
                    {availablePlayers.map((p) => (
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
                        <span style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 13, color: selectedPlayer === p.id ? C.white : C.orange }}>{p.num}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.white }}>{p.name.split(" ")[0]}</span>
                      </div>
                    ))}
                    {!touchDragState.isDragging && !selectedPlayer && (
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", whiteSpace: "nowrap", padding: "0 6px", fontStyle: "italic", flexShrink: 0 }}>
                        Drag to position
                      </div>
                    )}
                  </>
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
              }}>{formation} · {activeHalf === 1 ? "1ST" : "2ND"} HALF</div>
              {positions.map((pos, idx) => {
                const player = currentLineup[idx] ? getPlayer(currentLineup[idx]) : null;
                const isTouchDragOver = touchDragState.overTarget === `field-${idx}`;
                return (
                  <FieldPosition key={`${formation}-${idx}`} pos={pos} player={player}
                    isHighlighted={!!selectedPlayer && !player} compact={false}
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

        {/* BENCH BAR */}
        <div
          onDragOver={handleRosterDragOver} onDrop={handleRosterDrop} onDragLeave={handleRosterDragLeave}
          style={{
            padding: isMobile ? "8px 12px" : "9px 24px",
            borderTop: `1px solid ${C.whiteAlpha}`, display: "flex", alignItems: "center",
            gap: isMobile ? 8 : 14, background: rosterHover ? "rgba(232,100,32,0.08)" : "rgba(0,0,0,0.12)",
            flexWrap: isMobile ? "nowrap" : "nowrap", transition: "background 0.2s ease",
          }}>
          {/* Mobile: roster toggle button */}
          {isMobile && (
            <button onClick={() => setRosterOpen(true)} style={{
              padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.orange}`,
              background: "rgba(232,100,32,0.12)", color: C.orange, cursor: "pointer",
              fontFamily: fontDisplay, fontSize: 10, fontWeight: 700, letterSpacing: "1px",
              flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              ROSTER
            </button>
          )}
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", flexShrink: 0, display: isMobile ? "none" : "block" }}>BENCH</div>
          <div style={{ display: "flex", gap: 5, flex: 1, overflowX: "auto", padding: "2px 0" }}>
            {availablePlayers.length === 0 ? (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", fontStyle: "italic" }}>All players assigned</div>
            ) : (
              availablePlayers.map((p) => (
                <div key={p.id} draggable={!isMobile} onDragStart={!isMobile ? (e) => handleDragStart(e, p.id, "roster") : undefined} onDragEnd={handleDragEnd}
                  onClick={() => handlePlayerClick(p.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: isMobile ? 4 : 6,
                    padding: isMobile ? "4px 8px" : "5px 10px", borderRadius: 20, cursor: "pointer",
                    background: selectedPlayer === p.id ? C.orange : "rgba(255,255,255,0.05)",
                    border: `1px solid ${selectedPlayer === p.id ? C.orange : "rgba(255,255,255,0.08)"}`,
                    whiteSpace: "nowrap", fontSize: isMobile ? 10 : 11, fontWeight: 500, transition: "all 0.15s ease", flexShrink: 0, userSelect: "none",
                  }}>
                  <span style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: isMobile ? 9 : 10 }}>{p.num}</span>
                  <span>{p.name.split(" ")[0]}</span>
                </div>
              ))
            )}
          </div>
          {inactivePlayers.length > 0 && !isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, opacity: 0.4 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1px", color: "rgba(255,120,80,0.8)" }}>INACTIVE: {inactivePlayers.length}</span>
            </div>
          )}
          <div style={{ fontSize: isMobile ? 9 : 10, color: "rgba(255,255,255,0.25)", flexShrink: 0, fontStyle: "italic", display: isMobile ? "none" : "block" }}>
            {selectedPlayer ? "Tap a position to assign" : "Click or drag players"}
          </div>
        </div>
      </div>

      {/* MOBILE ROSTER DRAWER */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {rosterOpen && (
            <div onClick={() => setRosterOpen(false)} style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50,
            }} />
          )}
          {/* Drawer */}
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            height: rosterOpen ? "75vh" : 0,
            background: C.navyDark, borderRadius: "16px 16px 0 0",
            zIndex: 51, transition: "height 0.3s cubic-bezier(0.4,0,0.2,1)",
            overflow: "hidden", display: "flex", flexDirection: "column",
            boxShadow: rosterOpen ? "0 -10px 40px rgba(0,0,0,0.4)" : "none",
          }}>
            {/* Drawer handle */}
            <div onClick={() => setRosterOpen(false)} style={{
              padding: "10px 0 6px", display: "flex", justifyContent: "center", cursor: "pointer", flexShrink: 0,
            }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", color: C.white, fontFamily: fontBase }}>
              <RosterContent {...rosterProps} />
            </div>
          </div>
        </>
      )}

      {/* SAVE/LOAD MODAL */}
      <SaveLoadModal isOpen={modalOpen} mode={modalMode} savedLineups={savedLineups} isMobile={isMobile}
        onSave={saveLineup} onLoad={loadLineup} onDelete={deleteLineup} onShare={handleShareSaved} onClose={() => setModalOpen(false)} />

      {/* SHARED LINEUP BANNER */}
      {sharedName && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
          background: C.orange, color: C.white, padding: "8px 16px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: fontBase, fontSize: 13, fontWeight: 600,
        }}>
          <span>Shared lineup: {sharedName}</span>
          <button onClick={() => setSharedName(null)} style={{
            background: "rgba(255,255,255,0.2)", border: "none", color: C.white, borderRadius: 4,
            cursor: "pointer", fontSize: 11, padding: "2px 8px", fontWeight: 700,
          }}>Dismiss</button>
        </div>
      )}

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
              {ghostPlayer ? ghostPlayer.num : "?"}
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
