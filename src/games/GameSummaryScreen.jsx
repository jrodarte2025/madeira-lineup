import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { toBlob } from "html-to-image";
import { C, fontBase, fontDisplay, STAT_LABELS } from "../shared/constants";
import { abbreviateName } from "../shared/utils";
import { buildSummaryRows, buildCSV } from "../shared/summaryUtils";
import { loadGame } from "../firebase";
import ShareCard from "./ShareCard";

// =============================================
// GAME SUMMARY SCREEN
// =============================================
export default function GameSummaryScreen() {
  const { id: gameId } = useParams();
  const navigate = useNavigate();

  // Determine public mode from query param (HashRouter uses window.location.hash)
  const hash = window.location.hash; // e.g. "#/games/abc123/summary?public=true"
  const isPublic = hash.includes("?public=true") || hash.includes("&public=true");

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  const cardRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchGame() {
      setLoading(true);
      const data = await loadGame(gameId);
      if (cancelled) return;
      if (!data) {
        setError("Game not found.");
      } else {
        setGame(data);
      }
      setLoading(false);
    }
    fetchGame();
    return () => { cancelled = true; };
  }, [gameId]);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  }

  // ---- Derived data (only when game is loaded) ----
  const summary = game ? buildSummaryRows(game) : null;
  const { rows = [], activeCols = [], totals = { mins: 0, stats: {} } } = summary || {};

  // Build share URL
  const shareUrl = `${window.location.origin}${window.location.pathname}#/games/${gameId}/summary`;

  // ---- Handlers ----
  function handleExportCSV() {
    if (!game) return;
    const csv = buildCSV(rows, activeCols, game);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const opponentSlug = (game.opponent || "opponent").toLowerCase().replace(/\s+/g, "-");
    const dateSlug = (game.date || "").replace(/\//g, "-");
    a.href = url;
    a.download = `madeira-vs-${opponentSlug}-${dateSlug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShareLink() {
    if (!game) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Madeira FC vs ${game.opponent}`, url: shareUrl });
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied!");
    } catch {
      showToast("Copy failed");
    }
  }

  async function handleShareImage() {
    const node = cardRef.current;
    if (!node) return;
    try {
      const blob = await toBlob(node, { pixelRatio: 2, cacheBust: true });
      if (!blob) return;
      // Mobile: share as file
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "game-summary.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Madeira FC Game Summary" });
          return;
        }
      }
      // Desktop fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `madeira-vs-${(game.opponent || "opponent").toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Share image failed:", err);
    }
  }

  // ---- Date formatting ----
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // ---- Styles ----
  const containerStyle = {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    fontFamily: fontBase,
  };

  const headerStyle = {
    backgroundColor: C.navy,
    color: C.white,
    padding: "16px 20px 20px",
    position: "relative",
  };

  const backBtnStyle = {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.7)",
    fontFamily: fontBase,
    fontSize: 14,
    cursor: "pointer",
    padding: "0 0 12px 0",
    display: "flex",
    alignItems: "center",
    gap: 6,
  };

  const scoreStyle = {
    fontFamily: fontDisplay,
    fontSize: 28,
    fontWeight: 700,
    color: C.white,
    margin: "0 0 6px 0",
    lineHeight: 1.2,
  };

  const dateStyle = {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    margin: 0,
  };

  const exportRowStyle = {
    display: "flex",
    gap: 10,
    padding: "14px 16px",
    backgroundColor: C.navyLight,
    overflowX: "auto",
    flexWrap: "wrap",
  };

  const exportBtnStyle = {
    backgroundColor: C.orange,
    color: C.white,
    border: "none",
    borderRadius: 8,
    padding: "10px 16px",
    fontFamily: fontBase,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };

  const tableWrapStyle = {
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    margin: "16px",
    borderRadius: 10,
    boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
    fontFamily: fontBase,
    backgroundColor: C.white,
  };

  const thStyle = {
    backgroundColor: C.navy,
    color: C.white,
    padding: "8px 12px",
    textAlign: "left",
    fontWeight: 600,
    whiteSpace: "nowrap",
    fontSize: 13,
  };

  const tdStyle = {
    padding: "8px 12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#111827",
    whiteSpace: "nowrap",
  };

  const tdAltStyle = {
    ...tdStyle,
    backgroundColor: "#f9fafb",
  };

  const tdTotalsStyle = {
    ...tdStyle,
    fontWeight: 700,
    backgroundColor: "#f0f2f8",
    borderBottom: "none",
  };

  // ---- Loading / Error states ----
  if (loading) {
    return (
      <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.navy, fontFamily: fontDisplay, fontSize: 18 }}>Loading summary...</div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div style={{ ...containerStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ color: "#ef4444", fontFamily: fontDisplay, fontSize: 18 }}>{error || "Game not found."}</div>
        <button onClick={() => navigate("/games")} style={{ ...exportBtnStyle, backgroundColor: C.navy }}>
          Back to Games
        </button>
      </div>
    );
  }

  const homeScore = game.score?.home ?? 0;
  const awayScore = game.score?.away ?? 0;

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button style={backBtnStyle} onClick={() => navigate("/games")}>
          ← Back to Games
        </button>
        <p style={scoreStyle}>
          Madeira FC {homeScore} – {awayScore} {game.opponent}
        </p>
        <p style={dateStyle}>{formatDate(game.date)}</p>
      </div>

      {/* Export buttons — coach mode only */}
      {!isPublic && (
        <div style={exportRowStyle}>
          <button style={exportBtnStyle} onClick={handleExportCSV}>
            Export CSV
          </button>
          <button style={exportBtnStyle} onClick={handleShareLink}>
            Share Link
          </button>
          <button style={exportBtnStyle} onClick={handleShareImage}>
            Share Image
          </button>
        </div>
      )}

      {/* Stats table */}
      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Player</th>
              <th style={{ ...thStyle, textAlign: "center" }}>MIN</th>
              {activeCols.map((col) => (
                <th key={col} style={{ ...thStyle, textAlign: "center" }}>
                  {STAT_LABELS[col] || col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const cellStyle = i % 2 === 0 ? tdStyle : tdAltStyle;
              return (
                <tr key={row.player.id}>
                  <td style={cellStyle}>{abbreviateName(row.player.name)}</td>
                  <td style={{ ...cellStyle, textAlign: "center" }}>{row.mins}</td>
                  {activeCols.map((col) => (
                    <td key={col} style={{ ...cellStyle, textAlign: "center" }}>
                      {row.stats[col] || "–"}
                    </td>
                  ))}
                </tr>
              );
            })}
            {/* Team totals row */}
            <tr>
              <td style={tdTotalsStyle}>TEAM</td>
              <td style={{ ...tdTotalsStyle, textAlign: "center" }}>{totals.mins}</td>
              {activeCols.map((col) => (
                <td key={col} style={{ ...tdTotalsStyle, textAlign: "center" }}>
                  {totals.stats[col] || 0}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Off-screen ShareCard for image export */}
      {!isPublic && (
        <div style={{ position: "absolute", left: -9999, top: -9999, pointerEvents: "none" }}>
          <ShareCard ref={cardRef} game={game} rows={rows} shareUrl={shareUrl} />
        </div>
      )}

      {/* Toast notification */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#111827",
            color: C.white,
            padding: "10px 20px",
            borderRadius: 8,
            fontFamily: fontBase,
            fontSize: 14,
            fontWeight: 500,
            zIndex: 9999,
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
