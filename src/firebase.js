import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  arrayUnion,
  deleteDoc,
  serverTimestamp,
  increment,
  query,
  orderBy,
} from "firebase/firestore";
import { FIREBASE_CONFIG } from "./config";

const app = initializeApp(FIREBASE_CONFIG);
// Force HTTP long-polling AND disable fetch streams. iOS Safari's
// "access control checks" error applies to the fetch-based transport as
// well, so we need both flags to guarantee the SDK uses plain XHR for
// every request. This is the stable path for restrictive browser
// environments (iOS Safari, in-app browsers, strict content blockers).
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

const PUBLISHED_DOC = doc(db, "lineups", "published");
const gamesCol = collection(db, "games");
const sharedCol = collection(db, "sharedLineups");
const savedLineupsCol = collection(db, "savedLineups");

export async function loadPublishedLineup() {
  try {
    const snap = await getDoc(PUBLISHED_DOC);
    if (snap.exists()) return snap.data();
    return null;
  } catch (err) {
    console.warn("Failed to load published lineup:", err);
    return null;
  }
}

export async function savePublishedLineup({ formation, lineup, inactiveIds, roster, name }) {
  try {
    await setDoc(PUBLISHED_DOC, {
      formation,
      lineup,
      inactiveIds,
      roster,
      name: name || "",
      savedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("Failed to publish lineup:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Shared Lineups
// ---------------------------------------------------------------------------

export async function saveSharedLineup({ formation, lineup, inactiveIds, roster, name }) {
  try {
    const ref = await addDoc(sharedCol, {
      formation, lineup, inactiveIds, roster, name: name || "",
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error("Failed to save shared lineup:", err);
    return null;
  }
}

export async function loadSharedLineup(id) {
  try {
    const snap = await getDoc(doc(db, "sharedLineups", id));
    if (snap.exists()) return snap.data();
    return null;
  } catch (err) {
    console.warn("Failed to load shared lineup:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Game CRUD
// ---------------------------------------------------------------------------

/**
 * Creates a new game document in Firestore.
 * @param {{ opponent: string, date: string, lineup: { formation: string, lineups: Array, roster: Array } }} param0
 * @returns {Promise<string|null>} New document ID on success, null on failure.
 */
export async function createGame({ opponent, date, lineup }) {
  try {
    const ref = await addDoc(gamesCol, {
      opponent,
      date,
      status: "setup",
      score: { home: 0, away: 0 },
      lineup,
      events: [],
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error("Failed to create game:", err);
    return null;
  }
}

/**
 * Loads a single game by ID.
 * @param {string} gameId
 * @returns {Promise<Object|null>} Game data with id, or null if not found/error.
 */
export async function loadGame(gameId) {
  try {
    const snap = await getDoc(doc(db, "games", gameId));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
  } catch (err) {
    console.error("Failed to load game:", err);
    return null;
  }
}

/**
 * Updates arbitrary fields on a game document.
 * @param {string} gameId
 * @param {Object} fields  Key/value pairs to merge into the game doc
 * @returns {Promise<boolean>}
 */
export async function updateGame(gameId, fields) {
  try {
    await updateDoc(doc(db, "games", gameId), fields);
    return true;
  } catch (err) {
    console.error("Failed to update game:", err);
    return false;
  }
}

/**
 * Updates only the status field of a game.
 * @param {string} gameId
 * @param {"setup"|"1st-half"|"halftime"|"2nd-half"|"completed"} status
 * @returns {Promise<boolean>}
 */
export async function updateGameStatus(gameId, status, halfStartTs = null) {
  try {
    const update = { status };
    if (halfStartTs !== null) update.halfStartTs = halfStartTs;
    await updateDoc(doc(db, "games", gameId), update);
    return true;
  } catch (err) {
    console.error("Failed to update game status:", err);
    return false;
  }
}

/**
 * Updates the score object of a game.
 * @param {string} gameId
 * @param {{ home: number, away: number }} score
 * @returns {Promise<boolean>}
 */
export async function updateGameScore(gameId, score) {
  try {
    await updateDoc(doc(db, "games", gameId), { score });
    return true;
  } catch (err) {
    console.error("Failed to update game score:", err);
    return false;
  }
}

/**
 * Atomically appends an event to the game's events array.
 * @param {string} gameId
 * @param {Object} event
 * @returns {Promise<boolean>}
 */
export async function appendGameEvent(gameId, event) {
  try {
    await updateDoc(doc(db, "games", gameId), {
      events: arrayUnion(event),
    });
    return true;
  } catch (err) {
    console.error("Failed to append game event:", err);
    return false;
  }
}

/**
 * Returns all games ordered by createdAt descending.
 * @returns {Promise<Array<Object>>} Array of game objects with id, or [] on failure.
 */
export async function listGames() {
  try {
    const q = query(gamesCol, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Failed to list games:", err);
    return [];
  }
}

/**
 * Replaces the entire events array on a game document.
 * Used for undo functionality (arrayRemove can't match objects by equality from arrayUnion).
 * @param {string} gameId
 * @param {Array<Object>} events  Full replacement events array
 * @returns {Promise<boolean>}
 */
export async function replaceGameEvents(gameId, events) {
  try {
    await updateDoc(doc(db, "games", gameId), { events });
    return true;
  } catch (err) {
    console.error("Failed to replace game events:", err);
    return false;
  }
}

/**
 * Finalizes a game: writes playerIntervals, halfIntervals, and sets status to "completed"
 * in a single atomic updateDoc call.
 * @param {string} gameId
 * @param {{ playerIntervals: Object, halfIntervals: Array }} param1
 * @returns {Promise<boolean>}
 */
export async function finalizeGame(gameId, { playerIntervals, halfIntervals }) {
  try {
    await updateDoc(doc(db, "games", gameId), {
      playerIntervals,
      halfIntervals,
      status: "completed",
    });
    return true;
  } catch (err) {
    console.error("Failed to finalize game:", err);
    return false;
  }
}

export async function deleteGame(gameId) {
  try {
    await deleteDoc(doc(db, "games", gameId));
    return true;
  } catch (err) {
    console.error("Failed to delete game:", err);
    return false;
  }
}

/**
 * Merges inactiveIds into the game document's lineup field without overwriting
 * other lineup fields (formation, lineup array, roster, name).
 * @param {string} gameId
 * @param {string[]} inactiveIds  Array of player IDs sitting out this game
 * @returns {Promise<boolean>}
 */
export async function updateGameInactives(gameId, inactiveIds) {
  try {
    const game = await loadGame(gameId);
    const existingLineup = game?.lineup || null;
    const nextLineup = existingLineup
      ? { ...existingLineup, inactiveIds }
      : { inactiveIds };
    return await updateGame(gameId, { lineup: nextLineup });
  } catch (err) {
    console.error("Failed to update game inactives:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Season Stats
// ---------------------------------------------------------------------------

/**
 * Loads the season stats document for a given season.
 * @param {string} season  Season ID, e.g. "spring-2026"
 * @returns {Promise<Object|null>} Document data if exists, null if not found or on error.
 */
export async function loadSeasonStats(season) {
  try {
    const snap = await getDoc(doc(db, "seasonStats", String(season)));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn("Failed to load season stats:", err);
    return null;
  }
}

/**
 * Returns all season IDs sorted reverse-chronologically.
 * @returns {Promise<string[]>} Array of season IDs (e.g. ["spring-2026", "fall-2025"]), or [] on error.
 */
export async function listSeasons() {
  try {
    const snap = await getDocs(collection(db, "seasonStats"));
    return snap.docs.map((d) => d.id).sort().reverse();
  } catch (err) {
    console.warn("Failed to list seasons:", err);
    return [];
  }
}

/**
 * Atomically increments season stat totals for a player using dotted-path merge.
 * @param {string} season  Season ID, e.g. "spring-2026"
 * @param {string} playerId
 * @param {{ [statKey: string]: number }} statDeltas  e.g. { goals: 1, minutes: 45, gamesPlayed: 1 }
 * @returns {Promise<boolean>}
 */
export async function updateSeasonStats(season, playerId, statDeltas) {
  try {
    const updates = {};
    for (const [key, val] of Object.entries(statDeltas)) {
      updates[`players.${playerId}.${key}`] = increment(val);
    }
    await setDoc(doc(db, "seasonStats", String(season)), updates, { merge: true });
    return true;
  } catch (err) {
    console.error("Failed to update season stats:", err);
    return false;
  }
}

/**
 * Rebuilds seasonStats from all completed games. Wipes existing data first,
 * then recomputes from scratch using computeSeasonDeltas.
 * @param {Function} getSeasonIdFn  getSeasonId function
 * @param {Function} computeDeltasFn  computeSeasonDeltas function
 * @returns {Promise<number>} Number of games processed
 */
export async function backfillSeasonStats(getSeasonIdFn, computeDeltasFn) {
  const games = await listGames();
  const completed = games.filter((g) => g.status === "completed");

  // Wipe existing seasonStats docs
  const existing = await getDocs(collection(db, "seasonStats"));
  for (const d of existing.docs) {
    await deleteDoc(doc(db, "seasonStats", d.id));
  }

  // Aggregate deltas per season
  const seasonAgg = {}; // { seasonId: { playerId: { stat: val } } }
  for (const game of completed) {
    try {
      const seasonId = getSeasonIdFn(game.date);
      if (!seasonId) continue;
      const deltas = computeDeltasFn(
        game,
        game.playerIntervals || {},
        game.halfIntervals || []
      );
      if (!seasonAgg[seasonId]) seasonAgg[seasonId] = {};
      for (const [pid, stats] of Object.entries(deltas)) {
        if (!seasonAgg[seasonId][pid]) seasonAgg[seasonId][pid] = {};
        for (const [key, val] of Object.entries(stats)) {
          seasonAgg[seasonId][pid][key] = (seasonAgg[seasonId][pid][key] || 0) + val;
        }
      }
    } catch (err) {
      console.warn("Backfill: skipping game", game.id, err);
    }
  }

  // Write aggregated docs
  for (const [seasonId, players] of Object.entries(seasonAgg)) {
    await setDoc(doc(db, "seasonStats", seasonId), { players });
  }

  return completed.length;
}

// ---------------------------------------------------------------------------
// Saved Lineups (Firestore-durable presets)
// ---------------------------------------------------------------------------

/**
 * Returns all saved lineups, sorted by savedAt desc (falling back to legacy `date`).
 * @returns {Promise<Array<Object>>} Array of saved lineup objects with id.
 */
export async function listSavedLineups() {
  try {
    const snap = await getDocs(savedLineupsCol);
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    rows.sort((a, b) => {
      const aKey = a.savedAt || a.date || "";
      const bKey = b.savedAt || b.date || "";
      return bKey.localeCompare(aKey);
    });
    return rows;
  } catch (err) {
    console.warn("Failed to list saved lineups:", err);
    return null;
  }
}

/**
 * Creates a saved lineup doc. Returns the new doc id or null on failure.
 * @param {Object} snapshot  Lineup snapshot
 * @returns {Promise<string|null>}
 */
export async function createSavedLineup(snapshot) {
  try {
    const payload = { ...snapshot, savedAt: new Date().toISOString() };
    delete payload.id;
    const ref = await addDoc(savedLineupsCol, payload);
    return ref.id;
  } catch (err) {
    console.error("Failed to create saved lineup:", err);
    return null;
  }
}

/**
 * Overwrites an existing saved lineup doc with a new snapshot. Returns true on
 * success, false on failure.
 * @param {string} id         Firestore doc id of the existing saved lineup
 * @param {Object} snapshot   Replacement lineup snapshot
 * @returns {Promise<boolean>}
 */
export async function updateSavedLineup(id, snapshot) {
  try {
    const payload = { ...snapshot, savedAt: new Date().toISOString() };
    delete payload.id;
    await setDoc(doc(db, "savedLineups", id), payload);
    return true;
  } catch (err) {
    console.error("Failed to update saved lineup:", err);
    return false;
  }
}

/**
 * Deletes a saved lineup doc.
 * @param {string} id  Firestore doc id
 * @returns {Promise<boolean>}
 */
export async function deleteSavedLineup(id) {
  try {
    await deleteDoc(doc(db, "savedLineups", id));
    return true;
  } catch (err) {
    console.error("Failed to delete saved lineup:", err);
    return false;
  }
}
