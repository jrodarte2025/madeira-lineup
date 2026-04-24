import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { C, fontBase, fontDisplay } from "../shared/constants";
import { FORMATIONS } from "../shared/formations";
import { TEAM_NAME } from "../config";
import { decodeLineup, encodeLineup, abbreviateName, formatJerseyNum } from "../shared/utils";
import { loadSharedLineup } from "../firebase";
import PitchSVG from "../shared/PitchSVG";

export default function SharedLineupView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // New short link: ?id=abc123
    const id = params.get("id");
    if (id) {
      loadSharedLineup(id).then((doc) => {
        if (doc) { setData(doc); }
        else { navigate("/lineup", { replace: true }); }
        setLoading(false);
      });
      return;
    }

    // Legacy inline link: ?lineup=base64...
    const encoded = params.get("lineup");
    if (encoded) {
      const decoded = decodeLineup(encoded);
      if (decoded) { setData(decoded); setLoading(false); return; }
    }

    navigate("/lineup", { replace: true });
  }, [location, navigate]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.navyDark, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontFamily: fontBase, fontSize: 15 }}>
      Loading lineup...
    </div>
  );
  if (!data) return null;

  const { formation, lineup, inactiveIds = [], roster = [], name } = data;
  const positions = FORMATIONS[formation] || FORMATIONS["3-3-2"];
  const getPlayer = (id) => roster.find((p) => p.id === id);
  const assignedIds = lineup.filter(Boolean);
  const benchPlayers = roster.filter((p) => !assignedIds.includes(p.id) && !inactiveIds.includes(p.id));
  const inactivePlayers = roster.filter((p) => inactiveIds.includes(p.id));

  return (
    <div style={{
      fontFamily: fontBase, minHeight: "100vh", color: C.white,
      background: `linear-gradient(145deg, ${C.navyDark} 0%, ${C.navy} 40%, ${C.navyDark} 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "env(safe-area-inset-top, 16px) 16px calc(16px + env(safe-area-inset-bottom, 0px))",
    }}>
      {/* Logo + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, marginTop: 8 }}>
        <img src="/madeira-fc-logo.png" alt={`${TEAM_NAME} FC`} style={{ width: 36, height: "auto" }} />
        <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" }}>{TEAM_NAME.toUpperCase()} FC</div>
      </div>

      {/* Lineup name */}
      {name && (
        <div style={{
          fontFamily: fontDisplay, fontSize: 15, fontWeight: 700, color: C.orange,
          marginBottom: 4, textAlign: "center",
        }}>{name}</div>
      )}

      {/* Formation badge */}
      <div style={{
        display: "inline-block", padding: "3px 14px", borderRadius: 6,
        border: `2px solid ${C.orange}`, fontFamily: fontDisplay, fontSize: 12,
        fontWeight: 800, letterSpacing: "2px", color: C.orange, marginBottom: 12,
      }}>{formation}</div>

      {/* Pitch */}
      <div style={{
        position: "relative", width: "100%", maxWidth: 360, aspectRatio: "3 / 4",
        borderRadius: 10, overflow: "hidden",
        background: "repeating-linear-gradient(to bottom, #338740 0px, #338740 28px, #2E7D39 28px, #2E7D39 56px)",
      }}>
        <PitchSVG />
        {positions.map((pos, idx) => {
          const player = lineup[idx] ? getPlayer(lineup[idx]) : null;
          return (
            <div key={idx} style={{
              position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`,
              transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 1, zIndex: 5,
            }}>
              <div style={{
                width: player ? 38 : 28, height: player ? 38 : 28, borderRadius: "50%",
                background: player ? C.orange : "rgba(255,255,255,0.15)",
                border: player ? `2px solid rgba(255,255,255,0.3)` : "1px dashed rgba(255,255,255,0.3)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                boxShadow: player ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
              }}>
                {player ? (
                  formatJerseyNum(player.num) != null ? (
                    <>
                      <span style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 14, lineHeight: 1, color: C.white }}>{formatJerseyNum(player.num)}</span>
                      <span style={{ fontSize: 6, letterSpacing: "0.5px", color: "rgba(255,255,255,0.7)", lineHeight: 1, marginTop: 1 }}>{pos.label}</span>
                    </>
                  ) : (
                    <span style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 10, letterSpacing: "0.5px", color: C.white, lineHeight: 1 }}>{pos.label}</span>
                  )
                ) : (
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{pos.label}</span>
                )}
              </div>
              {player && (
                <div style={{
                  fontSize: 9, fontWeight: 700, color: C.white, textAlign: "center",
                  textShadow: "0 1px 3px rgba(0,0,0,0.6)", maxWidth: 70,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{abbreviateName(player.name)}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bench */}
      {benchPlayers.length > 0 && (
        <div style={{ width: "100%", maxWidth: 360, marginTop: 16 }}>
          <div style={{
            fontFamily: fontDisplay, fontSize: 11, fontWeight: 800, letterSpacing: "2px",
            textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8,
          }}>Bench</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {benchPlayers.map((p) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                borderRadius: 8, background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: fontDisplay, fontSize: 12, fontWeight: 800,
                }}>{formatJerseyNum(p.num) ?? ""}</div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive */}
      {inactivePlayers.length > 0 && (
        <div style={{ width: "100%", maxWidth: 360, marginTop: 14 }}>
          <div style={{
            fontFamily: fontDisplay, fontSize: 11, fontWeight: 800, letterSpacing: "2px",
            textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 8,
          }}>Inactive</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {inactivePlayers.map((p) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                borderRadius: 8, background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)", opacity: 0.4,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: fontDisplay, fontSize: 11, fontWeight: 800,
                }}>{formatJerseyNum(p.num) ?? ""}</div>
                <span style={{ fontSize: 12, fontWeight: 500, textDecoration: "line-through" }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open in Editor button */}
      <button onClick={() => {
        navigate(`/lineup?lineup=${encodeLineup(data)}`, { replace: true });
      }} style={{
        marginTop: 24, padding: "12px 28px", background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
        color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600,
        fontFamily: fontBase, cursor: "pointer",
      }}>Open in Editor</button>
    </div>
  );
}
