import { useRef, useCallback } from "react";
import { C, fontBase, fontDisplay } from "../shared/constants";
import { GAME_STRUCTURE, TEAM_NAME } from "../config";
import {
  PERIOD_LENGTH_SECONDS,
  isActiveStatus,
  isBreakStatus,
  getActionButtonLabel,
  getHomeTeamCode,
} from "../shared/gameStructure";

// =============================================
// GAME HEADER — fixed top bar with score + timer
// Period length and action labels are driven by GAME_STRUCTURE so
// both halves (Madeira) and quarters (friend) share one component.
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

const PERIOD_SECONDS = PERIOD_LENGTH_SECONDS[GAME_STRUCTURE];
const HOME_CODE = getHomeTeamCode(TEAM_NAME);

function formatCountdown(elapsed) {
  const remaining = Math.max(0, PERIOD_SECONDS - elapsed);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatStoppage(elapsed) {
  const extra = elapsed - PERIOD_SECONDS;
  const m = Math.floor(extra / 60);
  const s = extra % 60;
  return `+${m}:${String(s).padStart(2, "0")}`;
}

// Short period code shown next to the clock when the clock is paused
// on a break (so coach sees "HT" for halftime, "Q2" for break-q1, etc.)
function getBreakLabel(status, gameStructure) {
  if (status === "halftime") return "HT";
  if (status === "break-q1") return "Q1"; // just ended Q1, about to start Q2
  if (status === "break-q3") return "Q3"; // just ended Q3, about to start Q4
  return "HT";
}

function getTimerDisplay(gameStatus, displaySeconds) {
  if (gameStatus === "setup") return formatCountdown(0);
  if (isBreakStatus(gameStatus)) return getBreakLabel(gameStatus);
  if (gameStatus === "completed") return "FT";
  if (displaySeconds < PERIOD_SECONDS) return formatCountdown(displaySeconds);
  return formatStoppage(displaySeconds);
}

export default function GameHeader({
  score,
  opponent,
  displaySeconds,
  gameStatus,
  onScoreChange,
  onPrimaryAction,
  onEndGame,
  onBack,
}) {
  const timerStr = getTimerDisplay(gameStatus, displaySeconds);
  const isStoppage = isActiveStatus(gameStatus) && displaySeconds >= PERIOD_SECONDS;

  const buttonLabel = getActionButtonLabel(gameStatus, GAME_STRUCTURE);
  const showActionButton = buttonLabel !== "";
  const isFullTimeLabel = buttonLabel === "Full Time!";

  // Color scheme for the action button:
  //   - active period (End ...)       → orange (primary attention)
  //   - break (Start ...)             → teal (different context)
  //   - full time (game over button)  → muted/outline (terminal)
  const actionBg = isFullTimeLabel
    ? "rgba(255,255,255,0.15)"
    : isActiveStatus(gameStatus)
    ? C.orange
    : "#4CAFB6";
  const actionBorder = isFullTimeLabel ? "1px solid rgba(255,255,255,0.3)" : "none";

  const onActionClick = isFullTimeLabel ? onEndGame : onPrimaryAction;

  const timerColor =
    isBreakStatus(gameStatus)
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
          label={HOME_CODE}
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

      {/* Action button row — shown whenever there's a transition available */}
      {showActionButton && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "0 16px 6px",
            gap: 8,
          }}
        >
          <button
            onClick={onActionClick}
            style={{
              background: actionBg,
              border: actionBorder,
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
            {buttonLabel}
          </button>
          {/* For the final active period (2nd-half / q4), the primary action IS "Full Time!"
              — but some coaches historically tapped "End 2nd Half" then confirmed.
              Keeping single-button flow: the label + handler above IS the end-game action. */}
        </div>
      )}
    </div>
  );
}
