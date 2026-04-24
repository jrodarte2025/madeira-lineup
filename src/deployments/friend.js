// =============================================
// FRIEND FC DEPLOYMENT
// Roster + allowed-formation-key list for the friend's team.
// Loaded by src/config.js when VITE_DEPLOYMENT_ID=friend.
//
// Phase 8 scope: valid shape only — no live Firebase project, no 7v7
// formations yet.
// Phase 9  will swap ALLOWED_FORMATION_KEYS to the 7v7 starter set.
// Phase 11 will supply real Firebase credentials via .env.friend.local
// pointing at a real second Firebase project.
// =============================================

export const ROSTER = [
  { id: 101, name: "Bodhi",     num: null },
  { id: 102, name: "Kurry",     num: null },
  { id: 103, name: "Henry",     num: null },
  { id: 104, name: "Will",      num: null },
  { id: 105, name: "Broderick", num: null },
  { id: 106, name: "Nurdil",    num: null },
  { id: 107, name: "Lucas",     num: null },
  { id: 108, name: "Crew",      num: null },
  { id: 109, name: "Max",       num: null },
  { id: 110, name: "Mason",     num: null },
  { id: 111, name: "Cooper",    num: null },
];

// Phase 9: 7v7 starter set. The friend's team plays 7v7, so the picker
// UI only exposes these three formations. The 9v9 formations remain in
// the library (src/shared/formations.js) for saved-game back-compat but
// are not selectable in this deployment.
export const ALLOWED_FORMATION_KEYS = ["2-3-1", "3-2-1", "2-2-2"];
