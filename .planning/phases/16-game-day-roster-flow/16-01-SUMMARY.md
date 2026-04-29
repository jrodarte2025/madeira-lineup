---
phase: 16-game-day-roster-flow
plan: "01"
subsystem: ui
tags: [react, firestore, roster, game-day, bench]

requires: []

provides:
  - "GameDayRosterScreen component: player list with Active/Sitting toggle, counter bar, Confirm & Start footer"
  - "updateGameInactives(gameId, inactiveIds) Firestore helper merging into game.lineup without overwriting other fields"
  - "gameDayRoster step wired into GameSetupModal (Start Game Now path) and GameDetailModal (Start Game button)"
  - "computeBench(roster, assignedIds, inactiveIds) pure helper in lineupUtils.js"
  - "LiveGameScreen bench builder updated to exclude inactiveIds via computeBench"

affects:
  - 16-02-saved-lineup-template-loader
  - 16-03
  - 16-04

tech-stack:
  added: []
  patterns:
    - "Per-game inactive selection via game.lineup.inactiveIds field (not global flag)"
    - "Step-machine pattern extended with gameDayRoster step in both modal state machines"
    - "Pure bench helper (lineupUtils.computeBench) for testability of LiveGameScreen logic"

key-files:
  created:
    - src/games/GameDayRosterScreen.jsx
    - src/games/lineupUtils.js
    - src/tests/gameDayRoster.test.js
  modified:
    - src/firebase.js
    - src/tabs/GamesTab.jsx
    - src/games/LiveGameScreen.jsx

key-decisions:
  - "computeBench extracted to lineupUtils.js (not inlined in LiveGameScreen) for clean unit testability"
  - "gameDayRoster step is inserted AFTER createGame in GameSetupModal — game doc exists before inactives are written"
  - "GameDetailModal reads initialInactiveIds from game.lineup.inactiveIds so re-opening the screen pre-populates existing selections"
  - "updateGameInactives merges via spread: { ...existingLineup, inactiveIds } — no other lineup fields disturbed"

patterns-established:
  - "Bench computation: always call computeBench(roster, assignedIds, lineup?.inactiveIds) — downstream plans (16-02) should follow this pattern"
  - "inactiveIds lives on game.lineup.inactiveIds, NOT on the root game doc"

requirements-completed: [INACT-01, INACT-02, INACT-03]

duration: 3min
completed: 2026-04-29
---

# Phase 16 Plan 01: Game-Day Roster Flow Summary

**Per-game inactive selection gated between game creation and live game via GameDayRosterScreen, with inactiveIds persisted to game.lineup and honored by the bench builder in LiveGameScreen**

## Performance

- **Duration:** ~3 min (automated)
- **Started:** 2026-04-29T17:20:10Z
- **Completed:** 2026-04-29T17:23:00Z
- **Tasks:** 2 of 3 complete (Task 3 is a human-verify checkpoint)
- **Files modified:** 6

## Accomplishments
- New `GameDayRosterScreen` component: full-screen player list with Active/Sitting Today toggle, counter bar (Active N / Sitting M), and pinned Confirm & Start footer
- New `updateGameInactives(gameId, inactiveIds)` Firestore helper that merges `inactiveIds` into `game.lineup` using spread — no other lineup fields are disturbed
- Both Start Game paths now gate through Game-Day Roster: GameSetupModal "Start Game Now" and GameDetailModal "Start Game" button both route to `gameDayRoster` step before navigating to `/games/:id`
- New `computeBench(roster, assignedIds, inactiveIds)` pure helper in `lineupUtils.js` — used by LiveGameScreen and testable independently
- LiveGameScreen bench builder updated to use `computeBench`, excluding both assigned field players and per-game inactives
- 160 tests pass (157 existing + 3 new `computeBench` tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: GameDayRosterScreen + updateGameInactives** - `742d55d` (feat)
2. **Task 2 RED: failing computeBench tests** - `7b33c73` (test)
3. **Task 2 GREEN: lineupUtils + modal wiring + bench filter** - `6350343` (feat)

## Files Created/Modified
- `src/games/GameDayRosterScreen.jsx` - Player roster list with Active/Inactive toggle; handles empty-roster error state
- `src/games/lineupUtils.js` - `computeBench(roster, assignedIds, inactiveIds)` pure helper
- `src/tests/gameDayRoster.test.js` - 3 unit tests for computeBench (inactives exclusion, undefined fallback, combined set)
- `src/firebase.js` - Added `updateGameInactives(gameId, inactiveIds)` helper
- `src/tabs/GamesTab.jsx` - Added gameDayRoster step to both GameSetupModal and GameDetailModal; imported GameDayRosterScreen and updateGameInactives
- `src/games/LiveGameScreen.jsx` - Imported computeBench, destructured inactiveIds from lineup, updated bench filter

## Decisions Made
- `computeBench` extracted to `lineupUtils.js` (not inlined in LiveGameScreen) — makes the logic unit-testable and reusable by plan 16-02
- Game is created BEFORE the Game-Day Roster screen appears (so `updateGameInactives` has a real gameId to write to)
- `updateGameInactives` uses spread to merge: `{ ...existingLineup, inactiveIds }` — safe for games with or without an existing lineup
- `initialInactiveIds` defaults to `[]` for new games from GameSetupModal; reads from `game.lineup?.inactiveIds` for existing games in GameDetailModal

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 16-02 (saved-lineup-as-template loader) can now use `computeBench` from `lineupUtils.js` and the established `inactiveIds` write path
- The `gameDayRoster` step pattern is established in both modals; plan 16-02 can extend it further if needed
- Human verification checkpoint (Task 3) must be approved before marking plan complete

## Self-Check
- [x] `src/games/GameDayRosterScreen.jsx` exists
- [x] `src/games/lineupUtils.js` exists
- [x] `src/tests/gameDayRoster.test.js` exists
- [x] `src/firebase.js` contains `updateGameInactives`
- [x] `src/tabs/GamesTab.jsx` contains `GameDayRosterScreen`
- [x] `src/games/LiveGameScreen.jsx` contains `inactiveIds` + `computeBench`
- [x] Commits 742d55d, 7b33c73, 6350343 exist

## Self-Check: PASSED

---
*Phase: 16-game-day-roster-flow*
*Completed: 2026-04-29*
