/**
 * lineupUtils.js — pure helpers for bench/lineup computation.
 * Exported so they can be tested independently of React components.
 */

/**
 * Computes the bench: roster players who are neither assigned to field positions
 * nor marked inactive for this game.
 *
 * @param {Array<{id: string}>} roster        Full player roster
 * @param {string[]}            assignedIds   IDs already placed in field positions
 * @param {string[]|undefined}  inactiveIds   IDs sitting out (per-game inactive)
 * @returns {Array<{id: string}>}             Bench-eligible players
 */
export function computeBench(roster, assignedIds, inactiveIds) {
  const inactives = Array.isArray(inactiveIds) ? inactiveIds : [];
  return (roster || []).filter(
    (p) => !assignedIds.includes(p.id) && !inactives.includes(p.id)
  );
}
