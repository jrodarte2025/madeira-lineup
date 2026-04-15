import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { C, fontBase, fontDisplay } from "../shared/constants.js";
import { createGame, listGames, loadPublishedLineup, deleteGame } from "../firebase.js";

// ---------------------------------------------------------------------------
// Status badge helpers
// ---------------------------------------------------------------------------
const STATUS_LABELS = {
  setup: "Setup",
  "1st-half": "1st Half",
  halftime: "Halftime",
  "2nd-half": "2nd Half",
  completed: "Final",
};

function statusColor(status) {
  if (status === "completed") return C.statDefensive;
  if (status === "setup") return C.statNeutral;
  return C.orange;
}

// ---------------------------------------------------------------------------
// GameCard with swipe-to-delete
// ---------------------------------------------------------------------------
function GameCard({ game, onClick, onDelete }) {
  const label = STATUS_LABELS[game.status] || game.status;
  const color = statusColor(game.status);
  const dateStr = game.date
    ? new Date(game.date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  const score = game.score ? `${game.score.home} — ${game.score.away}` : "0 — 0";

  const startXRef = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleTouchStart = useCallback((e) => {
    startXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    const dx = e.touches[0].clientX - startXRef.current;
    if (dx < 0) setOffsetX(Math.max(dx, -80));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (offsetX < -40) {
      setShowDelete(true);
      setOffsetX(-70);
    } else {
      setShowDelete(false);
      setOffsetX(0);
    }
  }, [offsetX]);

  const handleDeleteTap = useCallback(() => {
    if (confirming) {
      onDelete(game.id);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  }, [confirming, game.id, onDelete]);

  const resetSwipe = useCallback(() => {
    setOffsetX(0);
    setShowDelete(false);
    setConfirming(false);
  }, []);

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 10, marginBottom: 10 }}>
      {/* Delete button behind card */}
      {showDelete && (
        <div
          onClick={handleDeleteTap}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 70,
            background: confirming ? "#c0392b" : "#e74c3c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.white,
            fontFamily: fontBase,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {confirming ? "Confirm?" : "Delete"}
        </div>
      )}

      {/* Card */}
      <div
        onClick={showDelete ? resetSwipe : onClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          background: C.navyLight,
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          padding: "14px 16px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          fontFamily: fontBase,
          transform: `translateX(${offsetX}px)`,
          transition: offsetX === 0 ? "transform 0.2s ease" : "none",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.white, fontWeight: 700, fontSize: 16, fontFamily: fontDisplay }}>
            vs. {game.opponent || "Unknown"}
          </span>
          <span
            style={{
              background: color,
              color: C.white,
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 20,
              fontFamily: fontBase,
              letterSpacing: "0.4px",
            }}
          >
            {label}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{dateStr}</span>
          <span style={{ color: C.orange, fontFamily: fontDisplay, fontWeight: 700, fontSize: 15 }}>
            {score}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GameSetupModal — two-step: enter details, then choose action
// ---------------------------------------------------------------------------
function GameSetupModal({ onClose, onGameCreated }) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState(today);
  const [step, setStep] = useState("details"); // "details" | "actions" | "pickLineup"
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedLineups, setSavedLineups] = useState([]);
  const [selectedLineup, setSelectedLineup] = useState(null); // null = use published

  // Load saved lineups from localStorage when entering lineup picker
  const loadSavedLineups = () => {
    try {
      const stored = localStorage.getItem("savedLineups");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  function handleNext() {
    if (!opponent.trim()) {
      setError("Opponent name is required.");
      return;
    }
    setError(null);
    setSavedLineups(loadSavedLineups());
    setStep("actions");
  }

  async function doCreate(andStart) {
    setSaving(true);
    setError(null);
    // Use selected lineup, or fall back to published lineup
    let lineup = selectedLineup;
    if (!lineup) {
      lineup = await loadPublishedLineup();
    }
    const gameId = await createGame({
      opponent: opponent.trim(),
      date,
      lineup: lineup || null,
    });
    setSaving(false);
    if (!gameId) {
      setError("Failed to create game. Please try again.");
      return;
    }
    if (andStart) {
      navigate(`/games/${gameId}`);
    } else {
      onGameCreated();
    }
  }

  const inputStyle = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 14px",
    fontSize: 16,
    fontFamily: fontBase,
    background: C.navyLight,
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8,
    color: C.white,
    outline: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    appearance: "none",
    maxWidth: "100%",
    minWidth: 0,
  };

  const actionBtnStyle = (bg) => ({
    padding: "13px 0",
    fontSize: 15,
    fontWeight: 700,
    fontFamily: fontDisplay,
    background: bg,
    border: bg === "transparent" ? "1px solid rgba(255,255,255,0.2)" : "none",
    borderRadius: 8,
    color: C.white,
    cursor: saving ? "not-allowed" : "pointer",
    opacity: saving ? 0.5 : 1,
    boxSizing: "border-box",
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: C.navyDark, border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14, padding: 24, width: "100%", maxWidth: 400, fontFamily: fontBase,
        maxHeight: "85dvh", overflowY: "auto", overflowX: "hidden", boxSizing: "border-box",
      }}>
        {/* ---- Step 1: Details ---- */}
        {step === "details" && (
          <>
            <h2 style={{ color: C.white, fontFamily: fontDisplay, fontSize: 20, fontWeight: 700, margin: "0 0 20px" }}>
              New Game
            </h2>

            <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Opponent Name
            </label>
            <input type="text" value={opponent} onChange={(e) => setOpponent(e.target.value)}
              placeholder="e.g. Anderson FC" style={{ ...inputStyle, marginBottom: 16 }} />

            <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Date
            </label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              style={{ ...inputStyle, marginBottom: error ? 8 : 20, colorScheme: "dark" }} />

            {error && <p style={{ color: "#F15F5E", fontSize: 13, margin: "0 0 16px", fontWeight: 600 }}>{error}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ ...actionBtnStyle("transparent"), flex: 1 }}>Cancel</button>
              <button onClick={handleNext} style={{ ...actionBtnStyle(C.orange), flex: 2 }}>Next</button>
            </div>
          </>
        )}

        {/* ---- Step 2: Actions ---- */}
        {step === "actions" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <button onClick={() => setStep("details")} style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.5)",
                cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0,
              }}>&larr;</button>
              <h2 style={{ color: C.white, fontFamily: fontDisplay, fontSize: 20, fontWeight: 700, margin: 0 }}>
                vs. {opponent.trim()}
              </h2>
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 20 }}>
              {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>

            {/* Lineup indicator */}
            {selectedLineup && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", borderRadius: 8, marginBottom: 16,
                background: "rgba(232,100,32,0.1)", border: `1px solid rgba(232,100,32,0.25)`,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Lineup</div>
                  <div style={{ fontSize: 14, color: C.orange, fontWeight: 700 }}>{selectedLineup.name || selectedLineup.formation}</div>
                </div>
                <button onClick={() => setSelectedLineup(null)} style={{
                  background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                  cursor: "pointer", fontSize: 16,
                }}>&times;</button>
              </div>
            )}

            {error && <p style={{ color: "#F15F5E", fontSize: 13, margin: "0 0 16px", fontWeight: 600 }}>{error}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => doCreate(true)} disabled={saving} style={{ ...actionBtnStyle(C.orange), width: "100%" }}>
                {saving ? "Creating..." : "Start Game Now"}
              </button>
              <button onClick={() => setStep("pickLineup")} disabled={saving} style={{ ...actionBtnStyle(C.navyLight), width: "100%" }}>
                Load Lineup
              </button>
              <button onClick={() => doCreate(false)} disabled={saving} style={{ ...actionBtnStyle("transparent"), width: "100%" }}>
                {saving ? "Saving..." : "Save for Later"}
              </button>
            </div>
          </>
        )}

        {/* ---- Step 3: Pick a lineup ---- */}
        {step === "pickLineup" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <button onClick={() => setStep("actions")} style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.5)",
                cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0,
              }}>&larr;</button>
              <h2 style={{ color: C.white, fontFamily: fontDisplay, fontSize: 20, fontWeight: 700, margin: 0 }}>
                Load Lineup
              </h2>
            </div>

            {savedLineups.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "rgba(255,255,255,0.3)", fontSize: 13, fontStyle: "italic" }}>
                No saved lineups. Save one from the Lineup tab first.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {savedLineups.map((s, i) => (
                  <div key={i} onClick={() => {
                    setSelectedLineup({
                      formation: s.formation,
                      lineup: s.lineup || (s.lineups && s.lineups["1"]) || Array(9).fill(null),
                      inactiveIds: s.inactiveIds,
                      roster: s.roster,
                      name: s.name,
                    });
                    setStep("actions");
                  }} style={{
                    display: "flex", alignItems: "center", padding: "12px 14px", borderRadius: 8,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                        {s.formation} · {s.date}
                      </div>
                    </div>
                    <span style={{ color: C.orange, fontSize: 12, fontWeight: 700 }}>Select</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GamesTab
// ---------------------------------------------------------------------------
export default function GamesTab() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listGames().then((data) => {
      if (!cancelled) {
        setGames(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleDelete = useCallback(async (gameId) => {
    const ok = await deleteGame(gameId);
    if (ok) {
      setGames((prev) => prev.filter((g) => g.id !== gameId));
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.navy,
        fontFamily: fontBase,
        padding: "16px 16px 80px",
      }}
    >
      <h1
        style={{
          color: C.white,
          fontFamily: fontDisplay,
          fontSize: 22,
          fontWeight: 700,
          margin: "0 0 16px",
        }}
      >
        Games
      </h1>

      {loading ? (
        <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", paddingTop: 60, fontSize: 15 }}>
          Loading games...
        </div>
      ) : games.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", paddingTop: 60, fontSize: 15 }}>
          No games yet. Tap + to create one.
        </div>
      ) : (
        games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onClick={() => navigate(game.status === "completed" ? `/games/${game.id}/summary` : `/games/${game.id}`)}
            onDelete={handleDelete}
          />
        ))
      )}

      {/* FAB: New Game */}
      <button
        onClick={() => setShowModal(true)}
        aria-label="New Game"
        style={{
          position: "fixed",
          bottom: 72,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: C.orange,
          border: "none",
          color: C.white,
          fontSize: 28,
          fontWeight: 300,
          lineHeight: 1,
          cursor: "pointer",
          zIndex: 150,
          boxShadow: `0 4px 16px ${C.orangeGlow}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        +
      </button>

      {showModal && <GameSetupModal onClose={() => setShowModal(false)} onGameCreated={() => {
        setShowModal(false);
        setLoading(true);
        listGames().then((data) => { setGames(data); setLoading(false); });
      }} />}
    </div>
  );
}
