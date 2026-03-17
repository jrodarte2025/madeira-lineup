// =============================================
// SEASON UTILITIES — stubs (will be implemented in GREEN phase)
// =============================================

/**
 * Returns the season ID for a given date string.
 * @param {string|null} dateStr
 * @returns {string|null} e.g. "spring-2026" or "fall-2026"
 */
export function getSeasonId(dateStr) {
  return null;
}

/**
 * Computes per-player stat deltas from a finalized game.
 * @param {Object} game
 * @param {Object} closedPlayerIntervals
 * @param {Array} closedHalfIntervals
 * @returns {Object} { [playerId]: { minutes, gamesPlayed, ...statCounts } }
 */
export function computeSeasonDeltas(game, closedPlayerIntervals, closedHalfIntervals) {
  return {};
}
