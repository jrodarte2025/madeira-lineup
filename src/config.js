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
 *   VITE_TEAM_NAME                  — Team name rendered anywhere the app
 *                                     previously said "Madeira FC" (header,
 *                                     print, share, summary). Required —
 *                                     missing value throws at config load.
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

function resolveTeamName() {
  const raw = import.meta.env.VITE_TEAM_NAME;
  if (raw === undefined || raw === null || raw === "") {
    throw new Error(
      "VITE_TEAM_NAME is required — set it in .env.local or the deployment env file"
    );
  }
  return String(raw);
}

export const TEAM_NAME = resolveTeamName();

// ---------------------------------------------------------------------------
// Roster + formations (per-deployment)
// ---------------------------------------------------------------------------
// The active deployment's data is selected by VITE_DEPLOYMENT_ID. Every
// registered deployment is statically imported so Vite's tree-shaker and
// env substitution run at build time — dynamic import() doesn't work here
// because import.meta.env values are frozen at build time, not at module
// load. The registry below is the canonical list of supported deployment
// IDs; add new deployments here when onboarding a new team.
import * as madeiraDeployment from "./deployments/madeira";
import * as friendDeployment from "./deployments/friend";
import { FORMATIONS } from "./shared/formations";

const DEPLOYMENTS = {
  madeira: madeiraDeployment,
  friend: friendDeployment,
};

function resolveDeploymentId() {
  const raw = import.meta.env.VITE_DEPLOYMENT_ID;
  if (raw === undefined || raw === null || raw === "") {
    throw new Error(
      "VITE_DEPLOYMENT_ID is required — set it in .env.local or the deployment env file"
    );
  }
  if (!(raw in DEPLOYMENTS)) {
    throw new Error(
      `Unknown VITE_DEPLOYMENT_ID: "${raw}" — must be one of: ${Object.keys(DEPLOYMENTS).join(", ")}`
    );
  }
  return raw;
}

const DEPLOYMENT_ID = resolveDeploymentId();
const activeDeployment = DEPLOYMENTS[DEPLOYMENT_ID];

export const ROSTER = activeDeployment.ROSTER;

function buildAllowedFormations(keys) {
  const out = {};
  for (const key of keys) {
    if (!(key in FORMATIONS)) {
      throw new Error(
        `ALLOWED_FORMATION_KEYS references unknown formation "${key}" — ` +
        `library has: ${Object.keys(FORMATIONS).join(", ")}`
      );
    }
    out[key] = FORMATIONS[key];
  }
  return out;
}

export const ALLOWED_FORMATIONS = buildAllowedFormations(activeDeployment.ALLOWED_FORMATION_KEYS);

// ---------------------------------------------------------------------------
// Umbrella deployment object
// ---------------------------------------------------------------------------

export const DEPLOYMENT = {
  firebase: FIREBASE_CONFIG,
  gameStructure: GAME_STRUCTURE,
  teamName: TEAM_NAME,           // filled by 08-02
  roster: ROSTER,                // filled by 08-03
  formations: ALLOWED_FORMATIONS, // filled by 08-03
};

export default DEPLOYMENT;
