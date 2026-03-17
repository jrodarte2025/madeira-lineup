import { calcMinutes } from "./utils";

// =============================================
// SEASON UTILITIES — pure functions
// =============================================

/**
 * Returns the season ID for a given date string.
 * Jan–Jun  -> "spring-YYYY"
 * Jul–Dec  -> "fall-YYYY"
 * @param {string|null|undefined} dateStr  ISO date string or any Date-parseable string
 * @returns {string|null}
 */
export function getSeasonId(dateStr) {
  if (!dateStr) return null;
  // First validate that the string is parseable
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  // Parse year and month directly from the ISO string to avoid timezone offset issues.
  // new Date("2026-01-01") is UTC midnight; in a negative UTC offset timezone,
  // getFullYear()/getMonth() in local time would return Dec 31 2025 instead.
  // Extracting from the string directly is timezone-safe for date-only strings.
  const isoStr = d.toISOString(); // always UTC, e.g. "2026-01-01T00:00:00.000Z"
  const year = parseInt(isoStr.slice(0, 4), 10);
  const month = parseInt(isoStr.slice(5, 7), 10);
  const period = month <= 6 ? "spring" : "fall";
  return `${period}-${year}`;
}

/**
 * Computes per-player stat deltas from a finalized game.
 * Only includes players from game.lineup.roster who have >0 minutes OR >0 stats.
 *
 * @param {Object} game                         Firestore game document
 * @param {Object} closedPlayerIntervals        { [playerId]: [{ inAt, outAt }] }
 * @param {Array}  closedHalfIntervals          [{ startAt, endAt }]
 * @returns {{ [playerId]: { minutes: number, gamesPlayed: 1, [statKey]: number } }}
 */
export function computeSeasonDeltas(game, closedPlayerIntervals, closedHalfIntervals) {
  const roster = game?.lineup?.roster ?? [];
  const events = game?.events ?? [];

  // Count stat events per player (only type="stat" events)
  const statCountsById = {};
  for (const evt of events) {
    if (evt.type !== "stat") continue;
    const pid = evt.playerId;
    if (!statCountsById[pid]) statCountsById[pid] = {};
    const statKey = evt.stat;
    statCountsById[pid][statKey] = (statCountsById[pid][statKey] ?? 0) + 1;
  }

  const deltas = {};

  for (const player of roster) {
    const pid = player.id;

    // Compute minutes via calcMinutes
    const intervals = closedPlayerIntervals[pid] ?? [];
    const minutes = calcMinutes(intervals, closedHalfIntervals);

    // Gather any stat counts for this player
    const stats = statCountsById[pid] ?? {};
    const hasStats = Object.keys(stats).length > 0;

    // Skip players who contributed nothing (0 minutes AND 0 stats)
    if (minutes === 0 && !hasStats) continue;

    deltas[pid] = {
      minutes,
      gamesPlayed: 1,
      ...stats,
    };
  }

  return deltas;
}
