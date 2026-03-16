import { C, fontBase, STAT_LABELS } from "../shared/constants";

// =============================================
// EVENTS FEED — recent game events with undo capability
// Displays last 5 events below the pitch
// =============================================
function describeEvent(event) {
  if (event.type === "stat") {
    const label = STAT_LABELS[event.stat] || event.stat;
    return `${label} — ${event.playerName}`;
  }
  if (event.type === "sub") {
    if (event.playerIn && event.playerOut) {
      return `${event.playerIn.name} ON for ${event.playerOut.name}`;
    }
    if (event.playerIn) {
      return `${event.playerIn.name} came on`;
    }
    if (event.playerOut) {
      return `${event.playerOut.name} came off`;
    }
  }
  return "Event";
}

export default function EventsFeed({ events, onUndo }) {
  // Show last 5 in reverse chronological order (newest first)
  const recentEvents = [...events].reverse().slice(0, 5);

  if (recentEvents.length === 0) {
    return (
      <div
        style={{
          padding: "8px 12px",
          fontFamily: fontBase,
          fontSize: 12,
          color: "rgba(255,255,255,0.25)",
          fontStyle: "italic",
          textAlign: "center",
        }}
      >
        No events yet
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "4px 0",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {recentEvents.map((event) => (
        <div
          key={event.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 12px",
            background: "rgba(0,0,0,0.25)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <span
            style={{
              fontFamily: fontBase,
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              paddingRight: 8,
            }}
          >
            {describeEvent(event)}
          </span>
          <button
            onClick={() => onUndo(event.id)}
            style={{
              background: "transparent",
              border: "none",
              color: C.orange,
              fontFamily: fontBase,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              padding: "2px 4px",
              flexShrink: 0,
              letterSpacing: "0.2px",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
          >
            Undo
          </button>
        </div>
      ))}
    </div>
  );
}
