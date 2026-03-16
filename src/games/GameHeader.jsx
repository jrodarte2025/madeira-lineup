import { useRef, useCallback } from "react";
import { C, fontBase, fontDisplay } from "../shared/constants";

// =============================================
// GAME HEADER — fixed top bar with score + timer + opponent
// =============================================

function ScoreButton({ value, side, onScoreChange }) {
  const longPressRef = useRef(null);
  const handledRef = useRef(false);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault(); // prevent text selection
    handledRef.current = false;
    longPressRef.current = setTimeout(() => {
      longPressRef.current = null;
      handledRef.current = true;
      onScoreChange(side, -1);
    }, 500);
  }, [side, onScoreChange]);

  const handlePointerUp = useCallback((e) => {
    e.preventDefault();
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    if (!handledRef.current) {
      onScoreChange(side, 1);
    }
    handledRef.current = false;
  }, [side, onScoreChange]);

  const handlePointerCancel = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    handledRef.current = false;
  }, []);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      style={{
        fontFamily: fontDisplay,
        fontSize: 40,
        fontWeight: 800,
        color: C.orange,
        minWidth: 48,
        textAlign: "center",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        lineHeight: 1,
        padding: "4px 8px",
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
  if (gameStatus === "halftime") return "HALFTIME";
  if (gameStatus === "completed") return "FULL TIME";
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
      {/* Score row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          padding: "6px 12px 2px",
          position: "relative",
        }}
      >
        {/* Back button */}
        <div
          onClick={onBack}
          style={{
            position: "absolute",
            left: 8,
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            padding: "6px 8px",
            color: "rgba(255,255,255,0.5)",
            fontSize: 20,
            lineHeight: 1,
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          ‹
        </div>

        {/* Home score */}
        <ScoreButton
          value={score.home}
          side="home"
          onScoreChange={onScoreChange}
        />

        {/* Center labels */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontFamily: fontBase,
              fontSize: 10,
              fontWeight: 600,
              color: "rgba(255,255,255,0.4)",
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
              color: "rgba(255,255,255,0.65)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
          >
            vs {opponent}
          </div>
        </div>

        {/* Away score */}
        <ScoreButton
          value={score.away}
          side="away"
          onScoreChange={onScoreChange}
        />
      </div>

      {/* Timer row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "0 12px 6px",
        }}
      >
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize:
              gameStatus === "halftime" || gameStatus === "completed" ? 16 : 24,
            fontWeight: 800,
            color:
              gameStatus === "halftime"
                ? "#4CAFB6"
                : gameStatus === "completed"
                ? "rgba(255,255,255,0.5)"
                : isStoppage
                ? C.orange
                : C.white,
            letterSpacing: "1px",
            lineHeight: 1,
            minWidth: 70,
            textAlign: "center",
          }}
        >
          {timerStr}
        </div>

        {showEndHalf && (
          <button
            onClick={onEndHalf}
            style={{
              background: C.orange,
              border: "none",
              borderRadius: 8,
              color: C.white,
              fontFamily: fontBase,
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 12px",
              cursor: "pointer",
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
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 12px",
              cursor: "pointer",
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
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 12px",
              cursor: "pointer",
            }}
          >
            Full Time!
          </button>
        )}
      </div>
    </div>
  );
}
