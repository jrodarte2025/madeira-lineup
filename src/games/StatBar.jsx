import { C, fontBase, POSITION_STATS, STAT_COLORS, STAT_LABELS } from "../shared/constants";

// =============================================
// STAT BAR — position-aware stat buttons (wrapping grid, only visible when player selected)
// =============================================
export default function StatBar({ positionGroup, playerName, onStatTap, onSwap, disabled }) {
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
        padding: "8px 8px calc(8px + env(safe-area-inset-bottom, 0px))",
        zIndex: 100,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {/* Player name label + optional swap button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            fontFamily: fontBase,
            fontSize: 10,
            fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.3px",
          }}
        >
          <span style={{ color: C.orange, fontWeight: 700 }}>{playerName}</span>
        </div>
        {onSwap && (
          <button
            onClick={isActive ? onSwap : undefined}
            disabled={!isActive}
            aria-label={`Swap ${playerName} with another field player`}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 6,
              color: C.white,
              fontFamily: fontBase,
              fontSize: 11,
              fontWeight: 700,
              padding: "6px 10px",
              minHeight: 32,
              cursor: isActive ? "pointer" : "not-allowed",
              letterSpacing: "0.3px",
              WebkitTapHighlightColor: "transparent",
              userSelect: "none",
              touchAction: "manipulation",
              whiteSpace: "nowrap",
            }}
          >
            ⇄ Swap
          </button>
        )}
      </div>

      {/* Stat buttons — wrapping grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 5,
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
                padding: "10px 12px",
                minHeight: 42,
                cursor: isActive ? "pointer" : "not-allowed",
                letterSpacing: "0.2px",
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
                touchAction: "manipulation",
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
