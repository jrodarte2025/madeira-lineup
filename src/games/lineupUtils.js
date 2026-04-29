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

/**
 * Strips the saved lineup's `inactiveIds` so that saved lineups behave as
 * reusable templates. The per-game inactiveIds (set on the Game-Day Roster
 * screen, Phase 16 INACT-04) are the only source of truth — baked-in saved
 * inactives are silently dropped on load.
 *
 * @param {object|null} savedLineup   Saved lineup object from Firestore
 * @returns {object|null}             Copy of savedLineup with inactiveIds removed
 */
export function resolveLineupForGame(savedLineup) {
  if (!savedLineup) return null;
  // eslint-disable-next-line no-unused-vars
  const { inactiveIds: _drop, ...rest } = savedLineup;
  return rest;
}

/**
 * Returns the indices in `lineupArray` where the assigned player id is present
 * in `inactiveIds`. These positions should render as visually distinct empty
 * slots (dashed border + "FILL" text) on the live game screen.
 *
 * @param {(string|null)[]}  lineupArray  Per-slot player IDs (null = unassigned)
 * @param {string[]|undefined} inactiveIds  Per-game inactive player IDs
 * @returns {number[]}                    Indices of positions with inactive players
 */
export function computeEmptySlotIndices(lineupArray, inactiveIds) {
  const inactives = Array.isArray(inactiveIds) ? inactiveIds : [];
  if (inactives.length === 0 || !Array.isArray(lineupArray)) return [];
  const out = [];
  for (let i = 0; i < lineupArray.length; i++) {
    const id = lineupArray[i];
    if (id && inactives.includes(id)) out.push(i);
  }
  return out;
}
