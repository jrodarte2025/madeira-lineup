import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { deleteGame } from "../firebase";
import { C, fontBase } from "../shared/constants";

// =============================================
// DELETE GAME BUTTON
// Two-step inline confirm — same UX as the mobile swipe-to-delete
// on the games list card. First tap → "Tap again to confirm" for 3s.
// Second tap → deletes the game and navigates back to /games.
// =============================================
export default function DeleteGameButton({ gameId, compact = false }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (deleting) return;

    if (!confirming) {
      setConfirming(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDeleting(true);
    const ok = await deleteGame(gameId);
    if (ok) {
      navigate("/games");
    } else {
      setDeleting(false);
      setConfirming(false);
    }
  }, [confirming, deleting, gameId, navigate]);

  const label = deleting
    ? "Deleting…"
    : confirming
    ? "Tap again to confirm"
    : "Delete Game";

  return (
    <button
      onClick={handleClick}
      disabled={deleting}
      style={{
        backgroundColor: confirming || deleting ? "#c0392b" : "transparent",
        border: `1px solid ${confirming || deleting ? "#c0392b" : "rgba(231,76,60,0.5)"}`,
        color: confirming || deleting ? C.white : "rgba(231,76,60,0.9)",
        fontFamily: fontBase,
        fontSize: compact ? 12 : 13,
        fontWeight: 600,
        padding: compact ? "6px 12px" : "8px 16px",
        borderRadius: 6,
        cursor: deleting ? "default" : "pointer",
        transition: "all 0.15s ease",
        letterSpacing: "0.3px",
      }}
    >
      {label}
    </button>
  );
}
