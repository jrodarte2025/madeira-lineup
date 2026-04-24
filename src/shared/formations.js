// =============================================
// FORMATION LIBRARY
// Full formation library, available to every deployment as a lookup source.
// Deployments select a subset via ALLOWED_FORMATION_KEYS in their
// deployment file — see src/deployments/*.js. The picker UI in
// MadeiraLineupPlanner reads `ALLOWED_FORMATIONS` from src/config.js
// (deployment-gated); saved-lineup render sites (SharedLineupView,
// LiveGameScreen) read FORMATIONS directly so older share links whose
// formation is no longer in the active allowlist still resolve.
// =============================================

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
