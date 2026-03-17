---
phase: 07-season-dashboard-player-profiles
plan: 03
subsystem: database
tags: [react, firebase, firestore, season-stats, game-finalization]

# Dependency graph
requires:
  - phase: 07-01
    provides: getSeasonId, computeSeasonDeltas, updateSeasonStats utility functions
provides:
  - handleEndGame pushes per-player season stat deltas to Firestore on game finalize
  - Season stats pipeline from game finalization to seasonStats Firestore collection
  - gameMeta (date + lineup) persisted in localStorage for crash recovery
affects:
  - Stats tab season dashboard (reads from seasonStats collection populated here)
  - Player profiles (season totals populated by this write path)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fire-and-forget Firestore writes: season stat updates do not block game navigation"
    - "gameMeta stored in localStorage alongside game state for crash recovery of date+lineup"
    - "Spread { ...game, events } to combine stable game metadata with live React events state"

key-files:
  created: []
  modified:
    - src/games/LiveGameScreen.jsx

key-decisions:
  - "Store game date and lineup as gameMeta in localStorage to support season stats computation after crash recovery"
  - "Use game React state (not re-fetching from Firestore) to avoid latency before navigate"
  - "Season stats write is fire-and-forget after finalizeGame awaits — navigation does not wait for season writes"

patterns-established:
  - "gameMeta pattern: store { date, lineup } from Firestore load; restore from localStorage on crash recovery"

requirements-completed: [SEASON-03]

# Metrics
duration: 10min
completed: 2026-03-16
---

# Phase 7 Plan 03: Season Stats Write Pipeline Summary

**handleEndGame now pushes per-player stat deltas to Firestore seasonStats collection on game finalization using fire-and-forget updateSeasonStats calls**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-17T03:05:00Z
- **Completed:** 2026-03-17T03:15:27Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Wired `handleEndGame` to call `getSeasonId`, `computeSeasonDeltas`, and `updateSeasonStats` after `finalizeGame` completes
- Added `game` state to store `{ date, lineup }` from Firestore, enabling season ID derivation and roster lookup
- Saved `gameMeta` to localStorage for crash recovery path so season stats work even after app reload mid-game
- Fire-and-forget pattern: season stat writes do not block navigation to summary screen

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire handleEndGame to push season stats on game finalize** - `173f40d` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `src/games/LiveGameScreen.jsx` - Added game state, gameMeta localStorage persistence, season stats write in handleEndGame

## Decisions Made
- Added `game` state variable (storing `{ date, lineup }`) rather than re-loading from Firestore at finalization time, to avoid latency before navigating to summary
- Persisted `gameMeta` to localStorage (alongside existing game state keys) so crash recovery path can also compute season stats correctly
- `updateSeasonStats` calls are fire-and-forget — no `await` — consistent with `appendGameEvent` pattern in the same component

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added gameMeta localStorage persistence for crash recovery**
- **Found during:** Task 1 (wiring handleEndGame)
- **Issue:** Plan specified `{ ...game, events }` pattern but LiveGameScreen had no `game` state; crash recovery path would silently skip season stats writes without date/lineup
- **Fix:** Added `game` state initialized from Firestore load; stored as `gameMeta` in localStorage; restored in crash recovery branch
- **Files modified:** src/games/LiveGameScreen.jsx
- **Verification:** 64 tests pass; game state correctly loaded from Firestore and saved to localStorage
- **Committed in:** 173f40d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (missing critical — crash recovery support)
**Impact on plan:** Necessary for correctness — without this, season stats would silently not write on crash-recovered games.

## Issues Encountered
None beyond the crash recovery gap documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Season stats write pipeline is complete (SEASON-03 done)
- Plans 07-01 (season utilities), 07-02 (Stats tab UI), and 07-03 (write pipeline) together complete Phase 7
- App is ready for end-to-end testing: finalize a game, check Stats tab to see season totals populate

---
*Phase: 07-season-dashboard-player-profiles*
*Completed: 2026-03-16*
