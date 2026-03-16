import { C, fontBase, fontDisplay, POSITION_STATS, STAT_COLORS, STAT_LABELS } from "../shared/constants";

// =============================================
// STAT BAR — position-aware stat buttons for recording stats
// Fixed at the bottom of the live game screen
// =============================================
export default function StatBar({ positionGroup, playerName, onStatTap, disabled }) {
  const isActive = !!positionGroup && !disabled;
  const statKeys = positionGroup ? (POSITION_STATS[positionGroup] || []) : [];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(17, 27, 58, 0.97)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        padding: "8px 12px 12px",
        zIndex: 100,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {!positionGroup ? (
        // No player selected — show prompt
        <div
          style={{
            fontFamily: fontBase,
            fontSize: 13,
            color: "rgba(255,255,255,0.35)",
            textAlign: "center",
            padding: "10px 0",
            fontStyle: "italic",
          }}
        >
          Tap a player to record stats
        </div>
      ) : (
        <>
          {/* Player name label */}
          <div
            style={{
              fontFamily: fontBase,
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 8,
              letterSpacing: "0.3px",
            }}
          >
            Recording for:{" "}
            <span style={{ color: C.orange, fontWeight: 700 }}>{playerName}</span>
          </div>

          {/* Stat buttons */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
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
                    borderRadius: 8,
                    color: isActive ? C.white : "rgba(255,255,255,0.3)",
                    fontFamily: fontBase,
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "8px 12px",
                    minHeight: 40,
                    cursor: isActive ? "pointer" : "not-allowed",
                    letterSpacing: "0.2px",
                    transition: "opacity 0.15s ease, transform 0.1s ease",
                    WebkitTapHighlightColor: "transparent",
                    userSelect: "none",
                    touchAction: "manipulation",
                    flexShrink: 0,
                  }}
                  onPointerDown={(e) => {
                    if (isActive) e.currentTarget.style.transform = "scale(0.95)";
                  }}
                  onPointerUp={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  onPointerLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
