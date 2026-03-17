---
phase: 07-season-dashboard-player-profiles
plan: 02
subsystem: ui
tags: [react, firestore, stats, dashboard, sortable-table, accordion]

# Dependency graph
requires:
  - phase: 07-season-dashboard-player-profiles plan 01
    provides: loadSeasonStats, listSeasons, getSeasonId, computeSeasonDeltas
  - phase: 05-live-game
    provides: buildSummaryRows, INITIAL_ROSTER, STAT_LABELS, C, listGames
affects:
  - 07-03-season-stats-write-pipeline

provides:
  - Full season dashboard in StatsTab.jsx with sortable table of all 13 roster players
  - Accordion per-player drill-down showing game-by-game breakdown
  - Season selector dropdown defaulting to current season
  - Dynamic stat columns (only non-zero stats shown)
  - Navigation from accordion game rows to /games/:id/summary

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lazy-load accordion game data via listGames() + in-memory cache (gamesByPlayer state)
    - Dynamic column derivation: scan Firestore player data for non-zero stats, filter through STAT_ORDER
    - String coercion on Firestore player ID lookup (player.id stored as number in roster, Firestore key is string)
    - handleSort: same column toggles asc/desc; new column defaults to desc
    - Season dropdown merges Firestore seasons with current computed season (ensures current always visible)

key-files:
  created: []
  modified:
    - src/tabs/StatsTab.jsx
    - src/shared/summaryUtils.js

key-decisions:
  - "Player column shows '#2 Alex Rodarte' format (jersey number prefix + full name)"
  - "Default sort is totalEvents descending"
  - "STAT_ORDER exported from summaryUtils.js (was previously a private const)"
  - "Accordion game rows lazy-loaded and cached per player to avoid redundant Firestore calls"
  - "All 13 INITIAL_ROSTER players always shown even with 0 stats"

patterns-established:
  - "String coercion on Firestore player ID: String(player.id) — roster IDs are numbers, Firestore keys are strings"
  - "Dynamic columns: scan seasonData.players for non-zero values, intersect with STAT_ORDER for stable ordering"

requirements-completed:
  - SEASON-01
  - SEASON-02

# Metrics
duration: ~30min
completed: 2026-03-16
---

# Phase 7 Plan 02: Season Dashboard Summary

**Full season stats dashboard in StatsTab with sortable table, dynamic stat columns, accordion per-game drill-down, and season selector dropdown**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-16T23:00:00Z
- **Completed:** 2026-03-16T23:15:15Z
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 2

## Accomplishments
- Replaced StatsTab stub with a 484-line full season dashboard component
- Sortable table shows all 13 roster players with GP, MIN, and dynamic stat columns
- Accordion per-player drill-down lazy-loads game history and navigates to /games/:id/summary
- Season selector dropdown merges Firestore seasons with current computed season
- Exported STAT_ORDER from summaryUtils.js to enable consistent column ordering

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement StatsTab season dashboard with sortable table and accordion** - `73502a7` (feat)
2. **Task 2: Verify season dashboard visually and interactively** - checkpoint approved by user (no code changes)

**Plan metadata:** (docs commit — pending)

## Files Created/Modified
- `src/tabs/StatsTab.jsx` - Full season dashboard: season selector, sortable table, accordion drill-down, empty states
- `src/shared/summaryUtils.js` - Exported STAT_ORDER constant (was private)

## Decisions Made
- Player rows display as "#2 Alex Rodarte" format (jersey number prefix)
- Default sort is totalEvents descending so top performers appear first
- STAT_ORDER exported from summaryUtils.js rather than duplicated inline — single source of truth for column order
- Accordion game rows lazy-loaded per player and cached in component state to minimize Firestore reads
- All 13 INITIAL_ROSTER players always rendered even when seasonData is null (show zeros)

## Deviations from Plan

None - plan executed exactly as written. The STAT_ORDER export was anticipated in the plan spec as a likely needed change.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Season dashboard complete and user-verified
- Ready for Phase 7 Plan 03: Season stats write pipeline (wire handleEndGame to push season stats on finalize)
- StatsTab.jsx is the primary consumer of loadSeasonStats/listSeasons from Plan 01

---
*Phase: 07-season-dashboard-player-profiles*
*Completed: 2026-03-16*
