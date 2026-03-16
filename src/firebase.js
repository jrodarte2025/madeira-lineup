import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  increment,
  query,
  orderBy,
} from "firebase/firestore";

// =============================================================
// TODO: Replace these values with your Firebase web app config.
// Firebase Console → Project Settings → Your Apps → Web app
// =============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAH8wCDYl7d751nr-mpW6_WOGJfIRtyXmI",
  authDomain: "madeira-fc-lineups.firebaseapp.com",
  projectId: "madeira-fc-lineups",
  storageBucket: "madeira-fc-lineups.firebasestorage.app",
  messagingSenderId: "275318113105",
  appId: "1:275318113105:web:10c66108571df4a1588970",
  measurementId: "G-3XPY82HK3K",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PUBLISHED_DOC = doc(db, "lineups", "published");
const gamesCol = collection(db, "games");

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

export async function savePublishedLineup({ formation, lineups, inactiveIds, roster, name }) {
  try {
    await setDoc(PUBLISHED_DOC, {
      formation,
      lineups,
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
 * Updates only the status field of a game.
 * @param {string} gameId
 * @param {"setup"|"1st-half"|"halftime"|"2nd-half"|"completed"} status
 * @returns {Promise<boolean>}
 */
export async function updateGameStatus(gameId, status) {
  try {
    await updateDoc(doc(db, "games", gameId), { status });
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

// ---------------------------------------------------------------------------
// Season Stats
// ---------------------------------------------------------------------------

/**
 * Atomically increments season stat totals for a player using dotted-path merge.
 * @param {string|number} season  Year string, e.g. "2026"
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
