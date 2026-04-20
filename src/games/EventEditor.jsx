import { useMemo, useState } from "react";
import { C, fontBase, fontDisplay, STAT_LABELS, STAT_COLORS } from "../shared/constants";
import { abbreviateName } from "../shared/utils";

// Group stats for the add-event dropdown so the coach can scan quickly.
const STAT_GROUPS = [
  { label: "Offensive", keys: ["goal", "assist", "great_pass", "shot_on_target"] },
  { label: "Defensive", keys: ["save", "tackle", "interception", "clearance", "block"] },
  { label: "Neutral", keys: ["fifty_fifty", "distribution", "skill"] },
];

function EventRow({ evt, roster, onReassign, onDelete, disabled }) {
  const label = STAT_LABELS[evt.stat] || evt.stat;
  const color = STAT_COLORS[evt.stat] || C.statNeutral;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        background: C.white,
        borderBottom: "1px solid #e5e7eb",
        fontSize: 13,
      }}
    >
      <span
        style={{
          background: color,
          color: C.white,
          borderRadius: 4,
          padding: "2px 8px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.3px",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <select
        value={evt.playerId}
        onChange={(e) => onReassign(evt, e.target.value)}
        disabled={disabled}
        style={{
          flex: 1,
          minWidth: 0,
          padding: "6px 8px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          fontFamily: fontBase,
          fontSize: 13,
          color: "#111827",
          background: C.white,
        }}
      >
        {roster.map((p) => (
          <option key={p.id} value={p.id}>
            {abbreviateName(p.name)}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          if (window.confirm(`Delete this ${label} event?`)) onDelete(evt);
        }}
        disabled={disabled}
        aria-label="Delete event"
        style={{
          background: "rgba(239,68,68,0.1)",
          color: "#ef4444",
          border: "none",
          borderRadius: 4,
          width: 32,
          height: 32,
          minWidth: 32,
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

function AddEventForm({ roster, onSave, onCancel, disabled }) {
  const [playerId, setPlayerId] = useState(roster[0]?.id || "");
  const [statKey, setStatKey] = useState("goal");
  const [half, setHalf] = useState(1);

  const selectedPlayer = roster.find((p) => String(p.id) === String(playerId));

  const handleSave = () => {
    if (!selectedPlayer || !statKey) return;
    const evt = {
      id: (crypto?.randomUUID && crypto.randomUUID()) || `e_${Date.now()}_${Math.random()}`,
      type: "stat",
      playerId: selectedPlayer.id,
      playerName: abbreviateName(selectedPlayer.name),
      stat: statKey,
      half,
      t: Date.now(),
    };
    onSave(evt);
  };

  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          Player
        </label>
        <select
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          disabled={disabled}
          style={{
            padding: "10px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontFamily: fontBase,
            fontSize: 14,
            background: C.white,
          }}
        >
          {roster.map((p) => (
            <option key={p.id} value={p.id}>
              {abbreviateName(p.name)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          Stat
        </label>
        <select
          value={statKey}
          onChange={(e) => setStatKey(e.target.value)}
          disabled={disabled}
          style={{
            padding: "10px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontFamily: fontBase,
            fontSize: 14,
            background: C.white,
          }}
        >
          {STAT_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.keys.map((key) => (
                <option key={key} value={key}>
                  {STAT_LABELS[key] || key}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          Half
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2].map((h) => (
            <button
              key={h}
              onClick={() => setHalf(h)}
              disabled={disabled}
              style={{
                flex: 1,
                padding: "10px 12px",
                border: `1px solid ${half === h ? C.orange : "#d1d5db"}`,
                borderRadius: 6,
                background: half === h ? C.orange : C.white,
                color: half === h ? C.white : "#111827",
                fontFamily: fontBase,
                fontWeight: 600,
                fontSize: 14,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {h === 1 ? "1st Half" : "2nd Half"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={handleSave}
          disabled={disabled || !selectedPlayer}
          style={{
            flex: 1,
            padding: "10px 12px",
            background: C.orange,
            color: C.white,
            border: "none",
            borderRadius: 6,
            fontFamily: fontBase,
            fontWeight: 700,
            fontSize: 14,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          Save Event
        </button>
        <button
          onClick={onCancel}
          disabled={disabled}
          style={{
            padding: "10px 16px",
            background: C.white,
            color: "#4b5563",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontFamily: fontBase,
            fontWeight: 600,
            fontSize: 14,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function EventEditor({ events, roster, onEventsChange, disabled }) {
  const [adding, setAdding] = useState(false);

  const statEvents = useMemo(() => (events || []).filter((e) => e.type === "stat"), [events]);
  const byHalf = useMemo(() => {
    const h1 = [];
    const h2 = [];
    for (const e of statEvents) {
      (e.half === 2 ? h2 : h1).push(e);
    }
    return { h1, h2 };
  }, [statEvents]);

  const handleReassign = (evt, newPlayerId) => {
    const newPlayer = roster.find((p) => String(p.id) === String(newPlayerId));
    if (!newPlayer) return;
    const updated = events.map((e) =>
      e.id === evt.id
        ? { ...e, playerId: newPlayer.id, playerName: abbreviateName(newPlayer.name) }
        : e
    );
    onEventsChange(updated);
  };

  const handleDelete = (evt) => {
    onEventsChange(events.filter((e) => e.id !== evt.id));
  };

  const handleAdd = (evt) => {
    onEventsChange([...(events || []), evt]);
    setAdding(false);
  };

  const renderGroup = (label, group) => (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontFamily: fontDisplay,
          fontSize: 11,
          fontWeight: 700,
          color: "#4b5563",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          padding: "6px 10px",
          background: "#e5e7eb",
          borderRadius: "4px 4px 0 0",
        }}
      >
        {label} · {group.length}
      </div>
      {group.length === 0 ? (
        <div
          style={{
            padding: "10px",
            background: C.white,
            color: "#9ca3af",
            fontSize: 12,
            fontStyle: "italic",
            border: "1px solid #e5e7eb",
            borderTop: "none",
          }}
        >
          No events
        </div>
      ) : (
        <div style={{ border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 4px 4px", overflow: "hidden" }}>
          {group.map((evt) => (
            <EventRow
              key={evt.id}
              evt={evt}
              roster={roster}
              onReassign={handleReassign}
              onDelete={handleDelete}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ margin: "16px", padding: 16, background: "#f3f4f6", borderRadius: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, fontFamily: fontDisplay, fontSize: 16, fontWeight: 700, color: C.navy }}>
          Edit Events ({statEvents.length})
        </h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            disabled={disabled || roster.length === 0}
            style={{
              background: C.orange,
              color: C.white,
              border: "none",
              borderRadius: 6,
              padding: "8px 14px",
              fontFamily: fontBase,
              fontWeight: 700,
              fontSize: 13,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            + Add Event
          </button>
        )}
      </div>

      {adding && (
        <AddEventForm
          roster={roster}
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
          disabled={disabled}
        />
      )}

      {renderGroup("1st Half", byHalf.h1)}
      {renderGroup("2nd Half", byHalf.h2)}
    </div>
  );
}
