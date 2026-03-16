import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { C, fontBase, fontDisplay } from "../shared/constants.js";
import { createGame, listGames, loadPublishedLineup } from "../firebase.js";

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
  return C.orange; // in-progress statuses
}

// ---------------------------------------------------------------------------
// GameCard
// ---------------------------------------------------------------------------
function GameCard({ game, onClick }) {
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

  return (
    <div
      onClick={onClick}
      style={{
        background: C.navyLight,
        border: `1px solid rgba(255,255,255,0.1)`,
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 10,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        fontFamily: fontBase,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: C.white,
            fontWeight: 700,
            fontSize: 16,
            fontFamily: fontDisplay,
          }}
        >
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
          {dateStr}
        </span>
        <span
          style={{
            color: C.orange,
            fontFamily: fontDisplay,
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GameSetupModal
// ---------------------------------------------------------------------------
function GameSetupModal({ onClose }) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate() {
    if (!opponent.trim()) {
      setError("Opponent name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const lineup = await loadPublishedLineup();
    const gameId = await createGame({
      opponent: opponent.trim(),
      date,
      lineup: lineup || null,
    });
    setSaving(false);
    if (gameId) {
      navigate(`/games/${gameId}`);
    } else {
      setError("Failed to create game. Please try again.");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: C.navyDark,
          border: `1px solid rgba(255,255,255,0.12)`,
          borderRadius: 14,
          padding: 24,
          width: "100%",
          maxWidth: 400,
          fontFamily: fontBase,
        }}
      >
        <h2
          style={{
            color: C.white,
            fontFamily: fontDisplay,
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 20px",
          }}
        >
          New Game
        </h2>

        <label
          style={{
            display: "block",
            color: "rgba(255,255,255,0.7)",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Opponent Name
        </label>
        <input
          type="text"
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          placeholder="e.g. Anderson FC"
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 14px",
            fontSize: 16, // 16px min for iOS zoom prevention
            fontFamily: fontBase,
            background: C.navyLight,
            border: `1px solid rgba(255,255,255,0.15)`,
            borderRadius: 8,
            color: C.white,
            marginBottom: 16,
            outline: "none",
          }}
        />

        <label
          style={{
            display: "block",
            color: "rgba(255,255,255,0.7)",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 14px",
            fontSize: 16, // 16px min for iOS zoom prevention
            fontFamily: fontBase,
            background: C.navyLight,
            border: `1px solid rgba(255,255,255,0.15)`,
            borderRadius: 8,
            color: C.white,
            marginBottom: error ? 8 : 20,
            colorScheme: "dark",
            outline: "none",
          }}
        />

        {error && (
          <p
            style={{
              color: "#F15F5E",
              fontSize: 13,
              margin: "0 0 16px",
              fontWeight: 600,
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: "11px 0",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: fontDisplay,
              background: "transparent",
              border: `1px solid rgba(255,255,255,0.2)`,
              borderRadius: 8,
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            style={{
              flex: 2,
              padding: "11px 0",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: fontDisplay,
              background: saving ? "rgba(232,100,32,0.5)" : C.orange,
              border: "none",
              borderRadius: 8,
              color: C.white,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Creating..." : "Create Game"}
          </button>
        </div>
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
        <div
          style={{
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
            paddingTop: 60,
            fontSize: 15,
          }}
        >
          Loading games...
        </div>
      ) : games.length === 0 ? (
        <div
          style={{
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
            paddingTop: 60,
            fontSize: 15,
          }}
        >
          No games yet. Tap + to create one.
        </div>
      ) : (
        games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onClick={() => navigate(`/games/${game.id}`)}
          />
        ))
      )}

      {/* FAB: New Game */}
      <button
        onClick={() => setShowModal(true)}
        aria-label="New Game"
        style={{
          position: "fixed",
          bottom: 72, // above tab bar (56px) + gap
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

      {showModal && <GameSetupModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
