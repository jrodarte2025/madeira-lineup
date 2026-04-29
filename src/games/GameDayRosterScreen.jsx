import { useState } from "react";
import { C, fontBase, fontDisplay } from "../shared/constants.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatJerseyNum(num) {
  if (num === null || num === undefined || num === "") return "?";
  const n = parseInt(String(num), 10);
  return isNaN(n) ? "?" : String(n);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// GameDayRosterScreen
// ---------------------------------------------------------------------------
export default function GameDayRosterScreen({
  roster = [],
  initialInactiveIds = [],
  onConfirm,
  onBack,
  opponent = "",
  date = "",
}) {
  const [inactiveIds, setInactiveIds] = useState(initialInactiveIds);
  const [saving, setSaving] = useState(false);

  function togglePlayer(id) {
    setInactiveIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleConfirm() {
    setSaving(true);
    await onConfirm(inactiveIds);
    setSaving(false);
  }

  const activeCount = roster.length - inactiveIds.length;
  const sittingCount = inactiveIds.length;

  const noRoster = !roster || roster.length === 0;

  return (
    <div style={{
      background: C.navyDark,
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 12px" }}>
        <h2 style={{ color: C.white, fontFamily: fontDisplay, fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>
          Game-Day Roster
        </h2>
        {(opponent || date) && (
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontFamily: fontBase, marginBottom: 8 }}>
            {opponent ? `vs. ${opponent}` : ""}{opponent && date ? " · " : ""}{date ? formatDate(date) : ""}
          </div>
        )}
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: fontBase, lineHeight: 1.4, marginBottom: 12 }}>
          Tap players who aren&apos;t playing today. They&apos;ll be excluded from the bench.
        </div>

        {/* Active / Sitting counter */}
        {!noRoster && (
          <div style={{
            display: "flex",
            gap: 16,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 8,
            padding: "8px 14px",
            marginBottom: 4,
          }}>
            <span style={{ fontFamily: fontBase, fontSize: 13, color: C.statDefensive, fontWeight: 700 }}>
              Active · {activeCount}
            </span>
            <span style={{ fontFamily: fontBase, fontSize: 13, color: C.orange, fontWeight: 700 }}>
              Sitting · {sittingCount}
            </span>
          </div>
        )}
      </div>

      {/* Player list */}
      <div style={{ flex: 1, padding: "0 16px", overflowY: "auto" }}>
        {noRoster ? (
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "rgba(255,255,255,0.35)",
            fontSize: 14,
            fontFamily: fontBase,
            fontStyle: "italic",
          }}>
            No roster available — load a lineup first.
          </div>
        ) : (
          roster.map((p) => {
            const isSitting = inactiveIds.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => togglePlayer(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  marginBottom: 8,
                  borderRadius: 10,
                  background: isSitting
                    ? "rgba(232,100,32,0.1)"
                    : "rgba(255,255,255,0.04)",
                  border: isSitting
                    ? "1px solid rgba(232,100,32,0.3)"
                    : "1px solid rgba(255,255,255,0.07)",
                  cursor: "pointer",
                  minHeight: 44,
                  userSelect: "none",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {/* Jersey number circle */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: isSitting ? C.orange : C.navyLight,
                  border: `2px solid ${isSitting ? C.orange : "rgba(255,255,255,0.15)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: fontDisplay,
                  fontWeight: 700,
                  fontSize: 13,
                  color: C.white,
                }}>
                  {formatJerseyNum(p.num)}
                </div>

                {/* Name */}
                <span style={{
                  flex: 1,
                  fontFamily: fontBase,
                  fontSize: 15,
                  fontWeight: 600,
                  color: isSitting ? "rgba(255,255,255,0.5)" : C.white,
                }}>
                  {p.name || "Unknown"}
                </span>

                {/* Status pill */}
                <span style={{
                  background: isSitting ? C.orange : C.statDefensive,
                  color: C.white,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontFamily: fontBase,
                  letterSpacing: "0.3px",
                  flexShrink: 0,
                }}>
                  {isSitting ? "Sitting Today" : "Active"}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 16px 20px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        gap: 10,
        background: C.navyDark,
      }}>
        <button
          onClick={onBack}
          disabled={saving}
          style={{
            flex: 1,
            padding: "13px 0",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: fontDisplay,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            color: C.white,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.5 : 1,
          }}
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={saving}
          style={{
            flex: 2,
            padding: "13px 0",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: fontDisplay,
            background: C.orange,
            border: "none",
            borderRadius: 8,
            color: C.white,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? "Starting..." : "Confirm & Start"}
        </button>
      </div>
    </div>
  );
}
