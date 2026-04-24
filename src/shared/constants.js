// =============================================
// SHARED CONSTANTS — Madeira Lineup Planner v2.0
// =============================================

export const C = {
  navy: "#1B2A5B",
  navyLight: "#263A6E",
  navyDark: "#111B3A",
  orange: "#E86420",
  orangeLight: "#FF8C4A",
  orangeGlow: "rgba(232, 100, 32, 0.35)",
  white: "#FFFFFF",
  whiteAlpha: "rgba(255,255,255,0.12)",
  // Stat category colors
  statOffensive: "#E86420",
  statDefensive: "#4CAFB6",
  statNeutral: "#6b7280",
};

export const fontBase = "'DM Sans', system-ui, -apple-system, sans-serif";
export const fontDisplay = "'Outfit', system-ui, -apple-system, sans-serif";

// INITIAL_ROSTER and FORMATIONS moved in Plan 08-03:
//   - Roster   → src/deployments/madeira.js (export: ROSTER)
//                 consumers import ROSTER from src/config.js
//   - Formations → src/shared/formations.js (export: FORMATIONS — full library)
//                 deployment-gated subset → ALLOWED_FORMATIONS from src/config.js

// =============================================
// POSITION GROUPS — for stat categorization in Phase 5+
// =============================================
export const POSITION_GROUP = {
  GK: "GK",
  DEF: "DEF",
  MID: "MID",
  FWD: "FWD",
};

// =============================================
// STAT TYPES — grouped by category
// Legacy — use POSITION_STATS for Phase 5+
// =============================================
export const STAT_TYPES = {
  offensive: ["goal", "assist", "shot"],
  defensive: ["tackle", "clearance", "save"],
  neutral: ["foul"],
};

// =============================================
// POSITION STATS — stat list keyed by position group (Phase 5+)
// =============================================
// Each position sees its primary stats first, then adjacent categories, then
// skill at the end. Ordering per position (user-requested):
//   GK:  GK-specific → DEF → MID → OFF → skill
//   DEF: DEF → MID → OFF → skill
//   MID: MID → OFF → DEF → skill
//   FWD: OFF → MID → DEF → skill
// All field positions get the full library so a defender can log a great pass
// and a striker can log a tackle.
export const POSITION_STATS = {
  GK: [
    "save", "distribution",
    "tackle", "interception", "clearance", "block",
    "great_pass", "fifty_fifty",
    "goal", "assist", "shot_on_target",
    "skill",
  ],
  DEF: [
    "tackle", "interception", "clearance", "block",
    "great_pass", "fifty_fifty",
    "goal", "assist", "shot_on_target",
    "skill",
  ],
  MID: [
    "great_pass", "fifty_fifty",
    "goal", "assist", "shot_on_target",
    "tackle", "interception", "clearance", "block",
    "skill",
  ],
  FWD: [
    "goal", "assist", "shot_on_target",
    "great_pass", "fifty_fifty",
    "tackle", "interception", "clearance", "block",
    "skill",
  ],
};

// =============================================
// STAT COLORS — maps each stat type to a display color
// =============================================
export const STAT_COLORS = {
  // Offensive
  goal: C.statOffensive,
  assist: C.statOffensive,
  great_pass: C.statOffensive,
  shot_on_target: C.statOffensive,
  // Defensive
  save: C.statDefensive,
  tackle: C.statDefensive,
  interception: C.statDefensive,
  clearance: C.statDefensive,
  block: C.statDefensive,
  // Neutral
  fifty_fifty: C.statNeutral,
  distribution: C.statNeutral,
  skill: C.statNeutral,
  // Legacy
  shot: C.statOffensive,
  foul: C.statNeutral,
};

// =============================================
// STAT LABELS — maps snake_case stat keys to display labels
// =============================================
export const STAT_LABELS = {
  goal: "Goal",
  assist: "Assist",
  great_pass: "Great Pass",
  shot_on_target: "Shot on Target",
  save: "Save",
  tackle: "Tackle",
  interception: "Interception",
  clearance: "Clearance",
  block: "Block",
  fifty_fifty: "50/50 Won",
  distribution: "Distribution",
  skill: "+Skill",
  // Legacy
  shot: "Shot",
  foul: "Foul",
};
