/**
 * Per-deployment configuration module.
 *
 * This is the single source of truth for everything that differs between
 * deployments (Madeira FC, the friend's team, any future instance). Every
 * value here is resolved at Vite build time from environment variables so
 * that the same source tree can ship multiple isolated Firebase-backed
 * deployments without code edits.
 *
 * ---------------------------------------------------------------------------
 * Required environment variables (put in .env.local per deployment):
 * ---------------------------------------------------------------------------
 *   VITE_DEPLOYMENT_ID              — Short slug identifying this deployment
 *                                     (e.g. "madeira", "friendsteam"). Reserved
 *                                     for future telemetry / DEPLOYMENT.id; not
 *                                     currently consumed but expected in env.
 *
 *   VITE_FIREBASE_API_KEY           — Firebase Web API key
 *   VITE_FIREBASE_AUTH_DOMAIN       — e.g. my-project.firebaseapp.com
 *   VITE_FIREBASE_PROJECT_ID        — Firebase project ID
 *   VITE_FIREBASE_STORAGE_BUCKET    — e.g. my-project.firebasestorage.app
 *   VITE_FIREBASE_MESSAGING_SENDER_ID — Numeric sender ID
 *   VITE_FIREBASE_APP_ID            — Firebase App ID
 *   VITE_FIREBASE_MEASUREMENT_ID    — GA measurement ID (G-XXXXXX)
 *
 *   VITE_GAME_STRUCTURE             — "halves" | "quarters" (default: "halves")
 *                                     Controls Phase-10 game-flow branching.
 *
 *   VITE_TEAM_NAME                  — Display team name (e.g. "Madeira",
 *                                     "Friends Team"). Used everywhere the app
 *                                     previously rendered "Madeira FC". REQUIRED —
 *                                     a missing value throws at import time
 *                                     (deployment misconfiguration, not a silent
 *                                     default).
 *
 * ---------------------------------------------------------------------------
 * DEPLOYMENT shape (consumers should destructure, not reach into internals):
 * ---------------------------------------------------------------------------
 *   DEPLOYMENT = {
 *     firebase:      FIREBASE_CONFIG,   // populated in Plan 08-01
 *     gameStructure: GAME_STRUCTURE,    // populated in Plan 08-01
 *     teamName:      TEAM_NAME,         // populated in Plan 08-02
 *     roster:        undefined,         // filled by Plan 08-03
 *     formations:    undefined,         // filled by Plan 08-03
 *   }
 *
 * The undefined placeholders are intentional — later Phase-8 plans can fill
 * them without restructuring imports in downstream consumers.
 */

// ---------------------------------------------------------------------------
// Firebase
// ---------------------------------------------------------------------------

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ---------------------------------------------------------------------------
// Game structure
// ---------------------------------------------------------------------------

const VALID_GAME_STRUCTURES = ["halves", "quarters"];
const DEFAULT_GAME_STRUCTURE = "halves";

function resolveGameStructure() {
  const raw = import.meta.env.VITE_GAME_STRUCTURE;
  if (raw === undefined || raw === null || raw === "") {
    return DEFAULT_GAME_STRUCTURE;
  }
  const normalized = String(raw).toLowerCase();
  if (!VALID_GAME_STRUCTURES.includes(normalized)) {
    throw new Error(
      `Invalid VITE_GAME_STRUCTURE: expected 'halves' or 'quarters', got '${raw}'`
    );
  }
  return normalized;
}

export const GAME_STRUCTURE = resolveGameStructure();

// ---------------------------------------------------------------------------
// Team name
// ---------------------------------------------------------------------------
// Replaces every hardcoded "Madeira FC" / "MADEIRA FC" string that used to be
// sprinkled through the UI. REQUIRED — a deployment without a team name is a
// misconfiguration, so we fail fast at import time instead of silently
// rendering " FC" everywhere.

function resolveTeamName() {
  const raw = import.meta.env.VITE_TEAM_NAME;
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    throw new Error(
      "VITE_TEAM_NAME is required — set it in .env.local or .env.example"
    );
  }
  return String(raw);
}

export const TEAM_NAME = resolveTeamName();

// ---------------------------------------------------------------------------
// Umbrella deployment object
// ---------------------------------------------------------------------------
// Later Phase-8 plans (08-03 roster + formations) plug into this same object
// so downstream consumers never have to restructure imports.

export const DEPLOYMENT = {
  firebase: FIREBASE_CONFIG,
  gameStructure: GAME_STRUCTURE,
  teamName: TEAM_NAME,  // filled by 08-02
  roster: undefined,    // filled by 08-03
  formations: undefined, // filled by 08-03
};

export default DEPLOYMENT;
