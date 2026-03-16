import { useRef, useCallback } from "react";
import { C, fontBase, fontDisplay } from "../shared/constants";

// =============================================
// GAME HEADER — fixed top bar with score + timer + opponent
// =============================================

function ScoreButton({ value, side, onScoreChange }) {
  const longPressRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    longPressRef.current = setTimeout(() => {
      longPressRef.current = null;
      onScoreChange(side, -1);
    }, 500);
  }, [side, onScoreChange]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
      onScoreChange(side, 1);
    }
  }, [side, onScoreChange]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        fontFamily: fontDisplay,
        fontSize: 36,
        fontWeight: 800,
        color: C.orange,
        minWidth: 40,
        textAlign: "center",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        lineHeight: 1,
        padding: "4px 6px",
        borderRadius: 8,
        touchAction: "manipulation",
      }}
    >
      {value}
    </div>
  );
}

function formatCountdown(elapsed) {
  const remaining = Math.max(0, 1500 - elapsed);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatStoppage(elapsed) {
  const extra = elapsed - 1500;
  const m = Math.floor(extra / 60);
  const s = extra % 60;
  return `+${m}:${String(s).padStart(2, "0")}`;
}

function getTimerDisplay(gameStatus, displaySeconds) {
  if (gameStatus === "setup") return "25:00";
  if (gameStatus === "halftime") return "HT";
  if (gameStatus === "completed") return "FT";
  if (displaySeconds < 1500) return formatCountdown(displaySeconds);
  return formatStoppage(displaySeconds);
}

export default function GameHeader({
  score,
  opponent,
  displaySeconds,
  gameStatus,
  onScoreChange,
  onEndHalf,
  onStartSecondHalf,
  onEndGame,
  onBack,
}) {
  const timerStr = getTimerDisplay(gameStatus, displaySeconds);
  const isStoppage =
    (gameStatus === "1st-half" || gameStatus === "2nd-half") &&
    displaySeconds >= 1500;
  const showEndHalf = isStoppage;
  const showStartSecondHalf = gameStatus === "halftime";
  const showEndGame =
    gameStatus === "2nd-half" && displaySeconds >= 1500;
  const showActionButton = showEndHalf || showStartSecondHalf || showEndGame;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: C.navyDark,
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* Single row: Back | Score | Teams | Score | Clock */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "6px 8px 6px",
        }}
      >
        {/* Back arrow */}
        {onBack && (
          <div
            onClick={onBack}
            style={{
              cursor: "pointer",
              padding: "4px 6px",
              color: "rgba(255,255,255,0.5)",
              fontSize: 18,
              fontFamily: fontBase,
              fontWeight: 700,
              lineHeight: 1,
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTapHighlightColor: "transparent",
              flexShrink: 0,
            }}
          >
            &#8592;
          </div>
        )}

        {/* Scoreboard — centered, compact */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <ScoreButton
            value={score.home}
            side="home"
            onScoreChange={onScoreChange}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: 60,
            }}
          >
            <div
              style={{
                fontFamily: fontBase,
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Madeira FC
            </div>
            <div
              style={{
                fontFamily: fontBase,
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.7)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 120,
              }}
            >
              vs {opponent}
            </div>
          </div>

          <ScoreButton
            value={score.away}
            side="away"
            onScoreChange={onScoreChange}
          />
        </div>

        {/* Clock — right side */}
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: gameStatus === "halftime" || gameStatus === "completed" ? 14 : 18,
            fontWeight: 800,
            color:
              gameStatus === "halftime"
                ? "#4CAFB6"
                : gameStatus === "completed"
                ? "rgba(255,255,255,0.5)"
                : isStoppage
                ? C.orange
                : C.white,
            letterSpacing: "0.5px",
            lineHeight: 1,
            minWidth: 50,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {timerStr}
        </div>
      </div>

      {/* Action button row — only when needed (stoppage/halftime) */}
      {showActionButton && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "0 16px 6px",
          }}
        >
          {showEndHalf && (
            <button
              onClick={onEndHalf}
              style={{
                background: C.orange,
                border: "none",
                borderRadius: 8,
                color: C.white,
                fontFamily: fontBase,
                fontSize: 13,
                fontWeight: 700,
                padding: "6px 14px",
                cursor: "pointer",
                letterSpacing: "0.3px",
              }}
            >
              End Half
            </button>
          )}

          {showStartSecondHalf && (
            <button
              onClick={onStartSecondHalf}
              style={{
                background: "#4CAFB6",
                border: "none",
                borderRadius: 8,
                color: C.white,
                fontFamily: fontBase,
                fontSize: 13,
                fontWeight: 700,
                padding: "6px 14px",
                cursor: "pointer",
                letterSpacing: "0.3px",
              }}
            >
              Start 2nd Half
            </button>
          )}

          {showEndGame && (
            <button
              onClick={onEndGame}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 8,
                color: C.white,
                fontFamily: fontBase,
                fontSize: 13,
                fontWeight: 700,
                padding: "6px 14px",
                cursor: "pointer",
                letterSpacing: "0.3px",
                marginLeft: 8,
              }}
            >
              Full Time!
            </button>
          )}
        </div>
      )}
    </div>
  );
}
