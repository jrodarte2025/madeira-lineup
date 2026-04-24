import { C, fontBase, fontDisplay } from "./constants";
import { abbreviateName, formatJerseyNum } from "./utils";

// =============================================
// INTERACTIVE FIELD POSITION — player circle on pitch
// =============================================
export default function FieldPosition({ pos, player, isHighlighted, onDragStart, onDragEnd, onDragOver, onDrop, onClick, onDoubleClick, compact, dragSource, idx, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, isTouchDragOver, minuteDisplay, isSelected, statCount }) {
  const has = !!player;
  const circleSize = 50;
  const numSize = has ? 18 : 10;
  const nameSize = has ? 11 : 10;
  const isBeingDragged = dragSource && dragSource.source === idx;
  const shouldGlow = (dragSource && !isBeingDragged) || isTouchDragOver;

  // isSelected: brighter border glow for stat selection (Plan 05-04)
  const borderStyle = has
    ? (isSelected ? `3px solid ${C.orange}` : `2.5px solid ${C.orange}`)
    : isHighlighted
    ? `2px dashed ${C.orange}`
    : "2px dashed rgba(255,255,255,0.3)";

  const boxShadowStyle = isSelected
    ? `0 4px 14px rgba(0,0,0,0.45), 0 0 16px 5px rgba(232,100,32,0.65)`
    : shouldGlow
    ? `0 4px 14px rgba(0,0,0,0.45), 0 0 12px 3px rgba(232,100,32,0.4)`
    : has
    ? `0 4px 14px rgba(0,0,0,0.45), 0 0 20px ${C.orangeGlow}`
    : "none";

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
      {/* Player circle with optional stat badge */}
      <div style={{ position: "relative" }}>
        <div style={{
          width: circleSize, height: circleSize, borderRadius: "50%",
          background: has ? `linear-gradient(145deg, ${C.navy}, ${C.navyLight})` : isHighlighted ? "rgba(232,100,32,0.25)" : "rgba(0,0,0,0.2)",
          border: borderStyle,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          fontFamily: fontDisplay, fontWeight: 800,
          color: has ? C.orange : "rgba(255,255,255,0.45)",
          boxShadow: boxShadowStyle,
          transition: "all 0.2s ease",
        }}>
          {has ? (
            formatJerseyNum(player.num) != null ? (
              <>
                <span style={{ fontSize: 16, lineHeight: 1 }}>{formatJerseyNum(player.num)}</span>
                <span style={{ fontSize: 7, letterSpacing: "0.8px", color: "rgba(255,255,255,0.55)", lineHeight: 1, marginTop: 2 }}>{pos.label}</span>
              </>
            ) : (
              <span style={{ fontSize: 11, letterSpacing: "0.8px", color: "rgba(255,255,255,0.85)", lineHeight: 1 }}>{pos.label}</span>
            )
          ) : (
            <span style={{ fontSize: numSize }}>{pos.label}</span>
          )}
        </div>

        {/* Stat count badge (Plan 05-04) */}
        {has && statCount > 0 && (
          <div style={{
            position: "absolute", top: -2, right: -2,
            width: 16, height: 16, borderRadius: "50%",
            background: C.orange,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 800, fontFamily: fontDisplay,
            color: C.white,
            boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
            zIndex: 10,
          }}>
            {statCount > 9 ? "9+" : statCount}
          </div>
        )}
      </div>

      {has && <div style={{
        fontSize: nameSize, fontWeight: 700, color: C.white,
        textAlign: "center", textShadow: "0 1px 4px rgba(0,0,0,0.9)",
        maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: fontBase,
      }}>{abbreviateName(player.name)}</div>}

      {/* Minute display (Plan 05-03) */}
      {has && minuteDisplay !== null && minuteDisplay !== undefined && (
        <div style={{
          fontSize: 9, fontWeight: 600, fontFamily: fontBase,
          color: "rgba(255,255,255,0.7)",
          lineHeight: 1,
          marginTop: -1,
        }}>
          {minuteDisplay}m
        </div>
      )}
    </div>
  );
}
