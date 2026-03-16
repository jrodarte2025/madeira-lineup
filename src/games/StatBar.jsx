import { C, fontBase, POSITION_STATS, STAT_COLORS, STAT_LABELS } from "../shared/constants";

// =============================================
// STAT BAR — position-aware stat buttons (compact, only visible when player selected)
// =============================================
export default function StatBar({ positionGroup, playerName, onStatTap, disabled }) {
  if (!positionGroup) return null; // hidden when no player selected

  const isActive = !disabled;
  const statKeys = POSITION_STATS[positionGroup] || [];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(17, 27, 58, 0.97)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        padding: "6px 8px calc(6px + env(safe-area-inset-bottom, 0px))",
        zIndex: 100,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {/* Player name label */}
      <div
        style={{
          fontFamily: fontBase,
          fontSize: 10,
          fontWeight: 600,
          color: "rgba(255,255,255,0.45)",
          marginBottom: 4,
          letterSpacing: "0.3px",
        }}
      >
        <span style={{ color: C.orange, fontWeight: 700 }}>{playerName}</span>
      </div>

      {/* Stat buttons — single row, scroll if needed */}
      <div
        style={{
          display: "flex",
          gap: 5,
          overflowX: "auto",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {statKeys.map((statKey) => {
          const color = STAT_COLORS[statKey] || C.statNeutral;
          const label = STAT_LABELS[statKey] || statKey;
          return (
            <button
              key={statKey}
              onClick={isActive ? () => onStatTap(statKey) : undefined}
              disabled={!isActive}
              style={{
                background: isActive ? color : "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: 6,
                color: isActive ? C.white : "rgba(255,255,255,0.3)",
                fontFamily: fontBase,
                fontSize: 12,
                fontWeight: 700,
                padding: "6px 10px",
                cursor: isActive ? "pointer" : "not-allowed",
                letterSpacing: "0.2px",
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
                touchAction: "manipulation",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
