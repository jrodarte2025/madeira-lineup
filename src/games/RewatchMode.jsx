import { useMemo, useState } from "react";
import { C, fontBase, fontDisplay, FORMATIONS } from "../shared/constants";
import { abbreviateName, getPositionGroup } from "../shared/utils";
import FieldPosition from "../shared/FieldPosition";
import PitchSVG from "../shared/PitchSVG";
import StatBar from "./StatBar";

// =============================================
// REWATCH MODE — tap-to-log-stats for completed games
// Mirrors the live-game interaction model so the coach can watch film
// and click on players to credit stats, instead of filling out forms.
// =============================================

function BenchChip({ player, displayName, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "6px 8px",
        minWidth: 52,
        flexShrink: 0,
        cursor: "pointer",
        borderRadius: 8,
        border: isSelected ? `2px solid ${C.orange}` : "2px solid transparent",
        background: isSelected ? "rgba(232,100,32,0.25)" : "transparent",
        transition: "all 0.15s ease",
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: `linear-gradient(145deg, ${C.navy}, ${C.navyLight})`,
          border: `2px solid ${isSelected ? C.orange : "rgba(255,255,255,0.25)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontDisplay,
          fontWeight: 800,
          fontSize: 14,
          color: "rgba(255,255,255,0.8)",
        }}
      >
        {player.num}
      </div>
      <div
        style={{
          fontFamily: fontBase,
          fontSize: 10,
          fontWeight: 600,
          color: "rgba(255,255,255,0.7)",
          maxWidth: 60,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        {displayName || player.name.split(" ")[0]}
      </div>
    </div>
  );
}

export default function RewatchMode({ game, onEventAdd, disabled }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [half, setHalf] = useState(1);

  const roster = game?.lineup?.roster || [];
  const formation = game?.lineup?.formation || "3-3-2";
  const positionDefs = FORMATIONS[formation] || [];

  // Resolve the starting lineup for visual context (same as LiveGameScreen mount)
  const fieldPositions = useMemo(() => {
    const lineupData = game?.lineup?.lineup;
    const lineups = game?.lineup?.lineups;
    const lineupArray = Array.isArray(lineupData)
      ? lineupData
      : lineups && lineups["1"]
      ? lineups["1"]
      : Array.isArray(lineups)
      ? lineups
      : [];
    return positionDefs.map((pos, idx) => {
      const playerId = lineupArray[idx];
      const player = playerId ? roster.find((p) => p.id === playerId) : null;
      return { pos, player };
    });
  }, [game, positionDefs, roster]);

  const benchPlayers = useMemo(() => {
    const assignedIds = new Set(
      fieldPositions.map(({ player }) => player?.id).filter(Boolean)
    );
    return roster.filter((p) => !assignedIds.has(p.id));
  }, [fieldPositions, roster]);

  const dupFirstNames = useMemo(() => {
    const counts = {};
    roster.forEach((p) => {
      const f = p.name.split(" ")[0];
      counts[f] = (counts[f] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((f) => counts[f] > 1));
  }, [roster]);

  const displayName = (p) => {
    const parts = p.name.split(" ");
    if (dupFirstNames.has(parts[0]) && parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
    return parts[0];
  };

  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerId) return null;
    return roster.find((p) => p.id === selectedPlayerId) || null;
  }, [selectedPlayerId, roster]);

  // Figure out the position group for the selected player. If they started
  // on the field, use that slot's label. Otherwise default to FWD — every
  // position group now contains the full stat library so this only affects
  // button ordering, not availability.
  const selectedPositionGroup = useMemo(() => {
    if (!selectedPlayer) return null;
    const slot = fieldPositions.find(({ player }) => player?.id === selectedPlayer.id);
    if (slot) return getPositionGroup(slot.pos.label);
    return "FWD";
  }, [selectedPlayer, fieldPositions]);

  const handleStatTap = (statKey) => {
    if (!selectedPlayer) return;
    const evt = {
      id: (crypto?.randomUUID && crypto.randomUUID()) || `e_${Date.now()}_${Math.random()}`,
      type: "stat",
      playerId: selectedPlayer.id,
      playerName: abbreviateName(selectedPlayer.name),
      stat: statKey,
      half,
      t: Date.now(),
    };
    onEventAdd(evt);
    // Keep the selection so the coach can log multiple stats for the same player
    // without re-tapping them (common during film review).
  };

  return (
    <div
      style={{
        margin: "16px",
        padding: "16px 12px 20px",
        background: C.navyDark,
        borderRadius: 10,
        position: "relative",
      }}
    >
      {/* Header: title + half toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, fontFamily: fontDisplay, fontSize: 16, fontWeight: 700, color: C.white }}>
          Rewatch · Tap to log
        </h2>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2].map((h) => (
            <button
              key={h}
              onClick={() => setHalf(h)}
              disabled={disabled}
              style={{
                padding: "6px 12px",
                border: `1px solid ${half === h ? C.orange : "rgba(255,255,255,0.2)"}`,
                borderRadius: 6,
                background: half === h ? C.orange : "transparent",
                color: half === h ? C.white : "rgba(255,255,255,0.7)",
                fontFamily: fontBase,
                fontWeight: 700,
                fontSize: 12,
                cursor: disabled ? "not-allowed" : "pointer",
                letterSpacing: "0.3px",
              }}
            >
              {h === 1 ? "1st Half" : "2nd Half"}
            </button>
          ))}
        </div>
      </div>

      {/* Pitch with starting lineup */}
      <div
        style={{
          position: "relative",
          aspectRatio: "3 / 4",
          maxWidth: 340,
          margin: "0 auto 12px",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <PitchSVG />
        {fieldPositions.map(({ pos, player }, idx) => (
          <FieldPosition
            key={idx}
            pos={pos}
            player={player}
            idx={idx}
            isHighlighted={false}
            isSelected={!!player && player.id === selectedPlayerId}
            compact={false}
            onClick={() => {
              if (disabled || !player) return;
              setSelectedPlayerId((prev) => (prev === player.id ? null : player.id));
            }}
          />
        ))}
      </div>

      {/* Bench chips */}
      {benchPlayers.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            padding: "4px 0 8px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {benchPlayers.map((p) => (
            <BenchChip
              key={p.id}
              player={p}
              displayName={displayName(p)}
              isSelected={p.id === selectedPlayerId}
              onClick={() => {
                if (disabled) return;
                setSelectedPlayerId((prev) => (prev === p.id ? null : p.id));
              }}
            />
          ))}
        </div>
      )}

      {/* Footer hint */}
      <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "center", fontFamily: fontBase }}>
        {selectedPlayer
          ? `Logging stats for ${abbreviateName(selectedPlayer.name)} · ${half === 1 ? "1st" : "2nd"} Half · tap again to deselect`
          : "Tap a player to start logging stats"}
      </div>

      {/* Stat bar appears while a player is selected */}
      {selectedPlayer && (
        <StatBar
          positionGroup={selectedPositionGroup}
          playerName={abbreviateName(selectedPlayer.name)}
          onStatTap={handleStatTap}
          disabled={disabled}
        />
      )}

      {/* Spacer so the stat bar doesn't overlap the rewatch footer */}
      {selectedPlayer && <div style={{ height: 110 }} />}
    </div>
  );
}
