import { useRef, useCallback } from "react";
import { C, fontBase, fontDisplay } from "../shared/constants";

// =============================================
// GAME HEADER — fixed top bar with score + timer
// =============================================

function ScoreColumn({ value, side, label, onScoreChange }) {
  const longPressRef = useRef(null);
  const touchHandledRef = useRef(false);
  const isHome = side === "home";

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    touchHandledRef.current = false;
    longPressRef.current = setTimeout(() => {
      longPressRef.current = null;
      touchHandledRef.current = true;
      onScoreChange(side, -1);
    }, 500);
  }, [side, onScoreChange]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
      touchHandledRef.current = true;
      onScoreChange(side, 1);
    }
  }, [side, onScoreChange]);

  // Desktop fallback: touch events never fire, so onClick handles the +1 path.
  // Long-press decrement is touch-only (mouse can't long-press meaningfully);
  // desktop users can right-click instead.
  const handleClick = useCallback(() => {
    if (touchHandledRef.current) {
      touchHandledRef.current = false;
      return;
    }
    onScoreChange(side, 1);
  }, [side, onScoreChange]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    onScoreChange(side, -1);
  }, [side, onScoreChange]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={isHome ? "Tap +1 · long-press or right-click -1" : "Tap +1 · long-press or right-click -1"}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "manipulation",
        padding: "6px 14px",
        borderRadius: 8,
        minWidth: 56,
        minHeight: 44,
      }}
    >
      <div
        style={{
          fontFamily: fontDisplay,
          fontSize: 30,
          fontWeight: 800,
          color: isHome ? C.orange : C.white,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: fontBase,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: isHome ? C.orange : "rgba(255,255,255,0.5)",
          opacity: isHome ? 0.7 : 1,
          lineHeight: 1,
          marginTop: 2,
          maxWidth: 72,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
}

const HALF_SECONDS = 1800;

function formatCountdown(elapsed) {
  const remaining = Math.max(0, HALF_SECONDS - elapsed);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatStoppage(elapsed) {
  const extra = elapsed - HALF_SECONDS;
  const m = Math.floor(extra / 60);
  const s = extra % 60;
  return `+${m}:${String(s).padStart(2, "0")}`;
}

function getTimerDisplay(gameStatus, displaySeconds) {
  if (gameStatus === "setup") return "30:00";
  if (gameStatus === "halftime") return "HT";
  if (gameStatus === "completed") return "FT";
  if (displaySeconds < HALF_SECONDS) return formatCountdown(displaySeconds);
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
    displaySeconds >= HALF_SECONDS;
  const showEndHalf = gameStatus === "1st-half";
  const showStartSecondHalf = gameStatus === "halftime";
  const showEndGame = gameStatus === "2nd-half";
  const showActionButton = showEndHalf || showStartSecondHalf || showEndGame;

  const timerColor =
    gameStatus === "halftime"
      ? "#4CAFB6"
      : gameStatus === "completed"
      ? "rgba(255,255,255,0.5)"
      : isStoppage
      ? C.orange
      : "rgba(255,255,255,0.7)";

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
      {/* Score row: Back | Home | clock | Away */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 16px 6px",
          gap: 4,
        }}
      >
        {/* Back arrow — absolute left so it doesn't push the scoreboard off center */}
        {onBack && (
          <div
            onClick={onBack}
            style={{
              position: "absolute",
              left: 12,
              cursor: "pointer",
              padding: "8px",
              color: "rgba(255,255,255,0.5)",
              fontSize: 18,
              fontFamily: fontBase,
              fontWeight: 700,
              lineHeight: 1,
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            &#8592;
          </div>
        )}

        {/* Home score + label */}
        <ScoreColumn
          value={score.home}
          side="home"
          label="MFC"
          onScoreChange={onScoreChange}
        />

        {/* Center: clock between scores */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 52,
          }}
        >
          <div
            style={{
              fontFamily: fontDisplay,
              fontSize: 16,
              fontWeight: 800,
              color: timerColor,
              letterSpacing: "0.5px",
              lineHeight: 1,
            }}
          >
            {timerStr}
          </div>
        </div>

        {/* Away score + label */}
        <ScoreColumn
          value={score.away}
          side="away"
          label={opponent || "AWAY"}
          onScoreChange={onScoreChange}
        />
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
