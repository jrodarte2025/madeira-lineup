// =============================================
// SUMMARY UTILITIES — pure functions for post-game summary computation
// =============================================

import { STAT_LABELS } from "./constants";
import { calcMinutes, abbreviateName } from "./utils";

// Abbreviation map for formatMVPStats
const MVP_ABBREV = {
  goal: "G",
  assist: "A",
  shot_on_target: "SOT",
  great_pass: "GP",
  save: "Sv",
  tackle: "T",
  clearance: "CL",
  block: "Blk",
  interception: "Int",
  fifty_fifty: "50/50",
  distribution: "Dist",
  // Legacy
  shot: "Sh",
  foul: "F",
};

// Preferred column ordering for display consistency
export const STAT_ORDER = [
  "goal",
  "assist",
  "shot_on_target",
  "great_pass",
  "save",
  "tackle",
  "clearance",
  "block",
  "interception",
  "fifty_fifty",
  "distribution",
  "shot",
  "foul",
];

/**
 * Builds summary rows from a game document.
 *
 * @param {Object} game - Full game doc with:
 *   - events: Array of event objects
 *   - lineup.roster: Array of player objects { id, name, num }
 *   - playerIntervals: { [playerId]: [{ inAt, outAt }] }
 *   - halfIntervals: [{ startAt, endAt }]
 *
 * @returns {{ rows: Array, activeCols: Array<string>, totals: Object }}
 *   - rows: sorted by minutes desc, each has { player, mins, stats }
 *   - activeCols: stat keys that have >= 1 event recorded
 *   - totals: { mins: number, stats: { [statKey]: number } }
 */
export function buildSummaryRows(game) {
  const { events = [], lineup = {}, playerIntervals = {}, halfIntervals = [] } = game;
  const roster = lineup.roster || [];

  // Build per-player stat counts from stat events only
  const statCountsById = {};
  const seenStats = new Set();

  for (const evt of events) {
    if (evt.type !== "stat") continue;
    if (!statCountsById[evt.playerId]) {
      statCountsById[evt.playerId] = {};
    }
    statCountsById[evt.playerId][evt.stat] =
      (statCountsById[evt.playerId][evt.stat] || 0) + 1;
    seenStats.add(evt.stat);
  }

  // Determine active columns in display order
  const activeCols = STAT_ORDER.filter((s) => seenStats.has(s));
  // Add any stats not in STAT_ORDER that still appeared
  for (const s of seenStats) {
    if (!activeCols.includes(s)) activeCols.push(s);
  }

  // Build rows for every rostered player
  const rows = roster.map((player) => {
    const intervals = playerIntervals[player.id] || [];
    const mins = calcMinutes(intervals, halfIntervals);
    const stats = statCountsById[player.id] || {};
    return { player, mins, stats };
  });

  // Sort by minutes descending (ties keep roster order — Array.sort is stable)
  rows.sort((a, b) => b.mins - a.mins);

  // Compute team totals
  const totalStats = {};
  for (const col of activeCols) {
    totalStats[col] = rows.reduce((sum, r) => sum + (r.stats[col] || 0), 0);
  }
  const totalMins = rows.reduce((sum, r) => sum + r.mins, 0);

  const totals = { mins: totalMins, stats: totalStats };

  return { rows, activeCols, totals };
}

/**
 * Builds a CSV string from summary rows.
 *
 * @param {Array} rows - From buildSummaryRows
 * @param {Array<string>} activeCols - From buildSummaryRows
 * @param {Object} game - Full game doc (unused currently, reserved for metadata)
 * @returns {string} CSV content
 */
export function buildCSV(rows, activeCols, _game) {
  const escape = (val) => {
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return JSON.stringify(str);
    }
    return str;
  };

  // Header row
  const headerCols = [
    "Player",
    "Minutes",
    ...activeCols.map((c) => STAT_LABELS[c] || c),
  ];
  const lines = [headerCols.join(",")];

  // Data rows
  for (const row of rows) {
    const name = abbreviateName(row.player.name);
    const cells = [
      escape(name),
      row.mins,
      ...activeCols.map((c) => row.stats[c] || 0),
    ];
    lines.push(cells.join(","));
  }

  // Team totals row
  const totalCells = [
    "TEAM TOTALS",
    rows.reduce((sum, r) => sum + r.mins, 0),
    ...activeCols.map((c) => rows.reduce((sum, r) => sum + (r.stats[c] || 0), 0)),
  ];
  lines.push(totalCells.join(","));

  return lines.join("\n");
}

/**
 * Returns the top `count` players by total stat event count.
 *
 * @param {Object} game - Full game doc
 * @param {number} count - Number of MVPs to return (default 3)
 * @returns {Array<{ player, stats, total }>}
 */
export function getTopMVPs(game, count = 3) {
  const { events = [], lineup = {} } = game;
  const roster = lineup.roster || [];

  // Build stat counts per player
  const statCountsById = {};
  for (const evt of events) {
    if (evt.type !== "stat") continue;
    if (!statCountsById[evt.playerId]) {
      statCountsById[evt.playerId] = {};
    }
    statCountsById[evt.playerId][evt.stat] =
      (statCountsById[evt.playerId][evt.stat] || 0) + 1;
  }

  // Build entries for players with at least 1 stat
  const entries = [];
  for (const player of roster) {
    const stats = statCountsById[player.id];
    if (!stats) continue;
    const total = Object.values(stats).reduce((sum, v) => sum + v, 0);
    if (total === 0) continue;
    entries.push({ player, stats, total });
  }

  // Sort: total desc, name asc for ties
  entries.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.player.name.localeCompare(b.player.name);
  });

  return entries.slice(0, count);
}

/**
 * Formats a stats object into an abbreviated string like "2G 1A 1SOT".
 *
 * @param {Object} stats - { [statKey]: count }
 * @returns {string}
 */
export function formatMVPStats(stats) {
  const parts = [];

  // Use STAT_ORDER for consistent ordering
  for (const key of STAT_ORDER) {
    const val = stats[key];
    if (!val || val === 0) continue;
    const abbrev = MVP_ABBREV[key];
    if (abbrev) parts.push(`${val}${abbrev}`);
  }

  // Include any keys not in STAT_ORDER
  for (const [key, val] of Object.entries(stats)) {
    if (!val || val === 0) continue;
    if (STAT_ORDER.includes(key)) continue;
    const abbrev = MVP_ABBREV[key] || key;
    parts.push(`${val}${abbrev}`);
  }

  return parts.join(" ");
}
