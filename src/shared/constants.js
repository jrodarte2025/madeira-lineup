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

export const INITIAL_ROSTER = [
  { id: 1, name: "Alex Rodarte", num: 2 },
  { id: 2, name: "Avery Paulin", num: 6 },
  { id: 3, name: "Avery Zara", num: 89 },
  { id: 4, name: "Bella McDermott", num: 33 },
  { id: 5, name: "Brooklynn Green", num: 4 },
  { id: 6, name: "Caroline Jones", num: 11 },
  { id: 7, name: "Catherine Quiles", num: 7 },
  { id: 8, name: "Cecilia Ethier", num: 12 },
  { id: 9, name: "Hope Frazier", num: 21 },
  { id: 10, name: "Mary Claire Whitted", num: 28 },
  { id: 11, name: "Natalie Brooks", num: 3 },
  { id: 12, name: "Rosslyn Dahm", num: 43 },
  { id: 13, name: "Violet Guttman", num: 42 },
];

export const FORMATIONS = {
  "3-3-2": [
    { label: "GK", x: 50, y: 89 }, { label: "LB", x: 22, y: 69 }, { label: "CB", x: 50, y: 72 },
    { label: "RB", x: 78, y: 69 }, { label: "LM", x: 22, y: 51 }, { label: "CM", x: 50, y: 54 },
    { label: "RM", x: 78, y: 51 }, { label: "LS", x: 36, y: 30 }, { label: "RS", x: 64, y: 30 },
  ],
  "3-2-3": [
    { label: "GK", x: 50, y: 89 }, { label: "LB", x: 22, y: 73 }, { label: "CB", x: 50, y: 76 },
    { label: "RB", x: 78, y: 73 }, { label: "LCM", x: 36, y: 54 }, { label: "RCM", x: 64, y: 54 },
    { label: "LW", x: 20, y: 30 }, { label: "CF", x: 50, y: 27 }, { label: "RW", x: 80, y: 30 },
  ],
  "2-3-3": [
    { label: "GK", x: 50, y: 89 }, { label: "LB", x: 33, y: 74 }, { label: "RB", x: 67, y: 74 },
    { label: "LM", x: 20, y: 51 }, { label: "CM", x: 50, y: 54 }, { label: "RM", x: 80, y: 51 },
    { label: "LW", x: 20, y: 30 }, { label: "CF", x: 50, y: 27 }, { label: "RW", x: 80, y: 30 },
  ],
  "4-3-1": [
    { label: "GK", x: 50, y: 89 }, { label: "LB", x: 16, y: 72 }, { label: "LCB", x: 39, y: 76 },
    { label: "RCB", x: 61, y: 76 }, { label: "RB", x: 84, y: 72 }, { label: "LM", x: 22, y: 51 },
    { label: "CM", x: 50, y: 54 }, { label: "RM", x: 78, y: 51 }, { label: "ST", x: 50, y: 30 },
  ],
};

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
export const POSITION_STATS = {
  GK: ["save", "distribution", "clearance", "fifty_fifty", "skill"],
  DEF: ["tackle", "interception", "clearance", "block", "fifty_fifty", "skill"],
  MID: ["goal", "assist", "great_pass", "shot_on_target", "tackle", "interception", "fifty_fifty", "skill"],
  FWD: ["goal", "assist", "great_pass", "shot_on_target", "fifty_fifty", "skill"],
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
