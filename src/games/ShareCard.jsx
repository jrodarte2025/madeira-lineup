import { forwardRef } from "react";
import { getTopMVPs, formatMVPStats } from "../shared/summaryUtils";
import { abbreviateName } from "../shared/utils";

// =============================================
// SHARE CARD — off-screen DOM node for html-to-image capture
// Uses system fonts only (not Google Fonts) to avoid iOS embedding issues.
// =============================================
const ShareCard = forwardRef(function ShareCard({ game, rows, shareUrl }, ref) {
  if (!game) return null;

  const homeScore = game.score?.home ?? 0;
  const awayScore = game.score?.away ?? 0;
  const mvps = getTopMVPs(game, 3);

  // System font stack — intentionally no Google Fonts for html-to-image compatibility
  const fontSystem = "system-ui, -apple-system, 'Segoe UI', sans-serif";

  const navy = "#1B2A5B";
  const orange = "#E86420";
  const white = "#FFFFFF";
  const whiteMuted = "rgba(255,255,255,0.6)";

  const cardStyle = {
    width: 360,
    background: navy,
    borderRadius: 16,
    overflow: "hidden",
    fontFamily: fontSystem,
    padding: "24px 24px 20px",
    boxSizing: "border-box",
  };

  const teamLabelStyle = {
    color: white,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "2px",
    textTransform: "uppercase",
    margin: "0 0 12px 0",
    opacity: 0.7,
  };

  const scoreStyle = {
    color: orange,
    fontSize: 52,
    fontWeight: 700,
    lineHeight: 1,
    margin: "0 0 8px 0",
    letterSpacing: "-1px",
  };

  const opponentStyle = {
    color: white,
    fontSize: 18,
    fontWeight: 600,
    margin: "0 0 4px 0",
  };

  const dateStyle = {
    color: whiteMuted,
    fontSize: 13,
    margin: "0 0 18px 0",
  };

  const dividerStyle = {
    height: 2,
    backgroundColor: orange,
    borderRadius: 1,
    margin: "0 0 14px 0",
    opacity: 0.7,
  };

  const sectionLabelStyle = {
    color: orange,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "2px",
    textTransform: "uppercase",
    margin: "0 0 10px 0",
  };

  const mvpRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  };

  const mvpNameStyle = {
    color: white,
    fontSize: 14,
    fontWeight: 600,
  };

  const mvpStatsStyle = {
    color: orange,
    fontSize: 13,
    fontWeight: 500,
  };

  const footerTextStyle = {
    color: whiteMuted,
    fontSize: 12,
    fontStyle: "italic",
    margin: "0 0 4px 0",
  };

  const urlStyle = {
    color: orange,
    fontSize: 11,
    wordBreak: "break-all",
    margin: 0,
    opacity: 0.85,
  };

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // Truncate share URL for display
  const displayUrl = shareUrl && shareUrl.length > 50
    ? shareUrl.slice(0, 47) + "..."
    : shareUrl;

  return (
    <div ref={ref} style={cardStyle}>
      {/* Team label */}
      <p style={teamLabelStyle}>MADEIRA FC</p>

      {/* Score */}
      <p style={scoreStyle}>{homeScore} – {awayScore}</p>

      {/* Opponent */}
      <p style={opponentStyle}>vs {game.opponent}</p>

      {/* Date */}
      <p style={dateStyle}>{formatDate(game.date)}</p>

      {/* Divider */}
      <div style={dividerStyle} />

      {/* Top performers section */}
      {mvps.length > 0 && (
        <>
          <p style={sectionLabelStyle}>TOP PERFORMERS</p>
          {mvps.map((mvp) => (
            <div key={mvp.player.id} style={mvpRowStyle}>
              <span style={mvpNameStyle}>{abbreviateName(mvp.player.name)}</span>
              <span style={mvpStatsStyle}>{formatMVPStats(mvp.stats)}</span>
            </div>
          ))}
          <div style={{ ...dividerStyle, marginTop: 14 }} />
        </>
      )}

      {/* Footer */}
      <p style={footerTextStyle}>Tap for full box score</p>
      {displayUrl && <p style={urlStyle}>{displayUrl}</p>}
    </div>
  );
});

export default ShareCard;
