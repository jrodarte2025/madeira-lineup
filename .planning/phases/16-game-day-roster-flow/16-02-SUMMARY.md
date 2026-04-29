---
phase: 16-game-day-roster-flow
plan: 02
subsystem: ui
tags: [react, firebase, lineup, gameday, roster, templates]

requires:
  - phase: 16-game-day-roster-flow plan 01
    provides: computeBench helper, lineupUtils.js, GameDayRosterScreen, game.lineup.inactiveIds

provides:
  - resolveLineupForGame(savedLineup) — strips saved inactiveIds so templates behave correctly
  - computeEmptySlotIndices(lineupArray, inactiveIds) — returns field slot indices where inactive players were assigned
  - GamesTab loads saved lineups without baked-in inactiveIds (both modal flows)
  - LiveGameScreen renders dashed-coral-bordered "FILL" circles where inactive-assigned positions are
  - Setup-state interactivity gate open (isInteractive includes gameStatus === "setup")
  - Setup-state fills (bench→field, field→field, field→bench) persist to Firestore via updateGame

affects: [16-03, 16-04]

tech-stack:
  added: []
  patterns:
    - "resolveLineupForGame: saved lineup strip pattern — caller drops inactiveIds, load-side only"
    - "computeEmptySlotIndices: pure helper for slot→inactive overlap detection"
    - "isEmptySlot prop on FieldPosition component for visual distinction of inactive-assigned slots"
    - "setup-state Firestore persistence: fire-and-forget updateGame inline in handleSubstitution / handleBenchDrop when gameStatus === 'setup'"

key-files:
  created:
    - src/tests/savedLineupTemplate.test.js
  modified:
    - src/games/lineupUtils.js
    - src/tabs/GamesTab.jsx
    - src/games/LiveGameScreen.jsx
    - src/shared/FieldPosition.jsx

key-decisions:
  - "resolveLineupForGame takes only savedLineup (no gameInactiveIds param) — simpler, caller holds game inactives separately"
  - "isEmptySlot visual treatment: dashed coral border + 'FILL' text (matches isHighlighted border but muted background) — distinct from unassigned null slots"
  - "Setup-state persistence uses fire-and-forget updateGame (not awaited) — UI responsiveness over network round-trip guarantee"
  - "isInteractive extended to include 'setup' (not a separate flag) — simplest gate change, all existing tap/drag logic works"

patterns-established:
  - "Empty slot = position assigned to inactive player. Unassigned slot = null in lineup array. Two distinct states, both tap-fillable."
  - "Setup-state fills compute nextLineupArray inline from fieldPositions snapshot (not from state updater closure) to avoid stale closure"

requirements-completed: [INACT-04]

duration: 12min
completed: 2026-04-29
---

# Phase 16 Plan 02: Saved Lineup Template Behavior Summary

**Saved lineups now behave as templates: baked-in inactiveIds stripped on load, inactive-assigned positions render as dashed-coral "FILL" circles pre-kickoff, and manual fills persist to Firestore.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-29T17:35:02Z
- **Completed:** 2026-04-29T17:47:00Z
- **Tasks:** 2 auto tasks complete (Task 3 is checkpoint:human-verify — awaiting coach verification)
- **Files modified:** 4

## Accomplishments

- `resolveLineupForGame` and `computeEmptySlotIndices` helpers added to `lineupUtils.js` with 10 unit tests
- Both GamesTab modal flows (GameSetupModal + GameDetailModal) strip saved `inactiveIds` via `resolveLineupForGame` at load time
- `LiveGameScreen` computes empty-slot set from `game.lineup.inactiveIds` during `loadGame` — inactive-assigned positions get `isEmptySlot: true`
- `FieldPosition` component gains `isEmptySlot` prop: dashed coral border + "FILL" text (8px bold uppercase, coral color) in the circle; position label still renders below
- `isInteractive` now includes `gameStatus === "setup"` so pre-kickoff bench/field taps fire `handleSubstitution` / `handleBenchTap`
- `handleSubstitution` and `handleBenchDrop` both have new `if (gameStatus === "setup")` Firestore-write branches — fire-and-forget `updateGame(gameId, { lineup: { ...game.lineup, lineup: nextLineupArray } })`

## Task Commits

1. **Task 1: resolveLineupForGame + computeEmptySlotIndices helpers + tests** - `e9af992` (feat)
2. **Task 2: Wire GamesTab strip + empty-slot render + setup-state persistence** - `a43abae` (feat)

## Files Created/Modified

- `src/games/lineupUtils.js` — added `resolveLineupForGame` and `computeEmptySlotIndices` exports
- `src/tests/savedLineupTemplate.test.js` — 10 unit tests (4 for resolveLineupForGame, 6 for computeEmptySlotIndices)
- `src/tabs/GamesTab.jsx` — imported `resolveLineupForGame`, applied to both pickLineup modal branches
- `src/games/LiveGameScreen.jsx` — imported `computeEmptySlotIndices` and `updateGame`; added empty-slot computation in loadGame; extended isInteractive; added setup-state Firestore persistence in handleSubstitution and handleBenchDrop
- `src/shared/FieldPosition.jsx` — added `isEmptySlot` prop with dashed-coral visual treatment

## Decisions Made

- `resolveLineupForGame` accepts only `savedLineup` (the `gameInactiveIds` param was dropped for simplicity — the caller already holds per-game inactives separately on the game doc).
- Visual treatment for empty slots: dashed coral border + "FILL" text (coral, 8px, bold uppercase) — same dashed-coral border as highlighted unassigned slots, but with a distinct muted background (`rgba(232,100,32,0.12)`) vs the brighter `rgba(232,100,32,0.25)` for `isHighlighted`. This distinguishes "was assigned to inactive" from "never assigned."
- `isInteractive` extended to `|| gameStatus === "setup"` (not a new flag) — all existing tap/drag handlers needed no changes.
- Setup-state persistence is fire-and-forget (`.catch(console.error)`) — coach taps remain instant; a network failure just means the fill won't survive a hard reload.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- First `npm test -- --run savedLineupTemplate` invocation returned stale-cache failures; `npx vitest run` (direct) confirmed all 10 tests pass. Not a code issue.

## Empty Slot Visual Treatment (for 16-03 reference)

The pre-kickoff walkthrough screen (16-03) will show FieldPositions with these props:
- `isEmptySlot={true}`: dashed `2px dashed ${C.orange}` border, `rgba(232,100,32,0.12)` background, "FILL" text at 8px bold uppercase in `C.orange`
- `isHighlighted={true}` (existing): dashed `2px dashed ${C.orange}` border, `rgba(232,100,32,0.25)` background, pos.label text
- Both are tap-interactive (cursor: pointer, fires `handleFieldTap`)

## Setup-State Persistence Details (for 16-03 reference)

The two handlers that now write to Firestore during setup:

**`handleSubstitution` (field-to-field swap, setup):**
- Computes `nextPositions` inline from current `fieldPositions` snapshot
- Writes `updateGame(gameId, { lineup: { ...game.lineup, lineup: nextLineupArray } })`

**`handleSubstitution` (bench-to-field, setup):**
- Clears `isEmptySlot: false` on the filled slot
- Same Firestore write pattern

**`handleBenchDrop` (field-to-bench, setup):**
- Sets `player: null` on the leaving slot
- Same Firestore write pattern

All three: fire-and-forget, `game?.lineup` fallback to `{}` if game state not yet set.

## Next Phase Readiness

- 16-03 can build on `FieldPosition.isEmptySlot` for pre-kickoff walkthrough styling
- Madeira guardrails: no changes to `src/deployments/`, `src/config.js`, or `MadeiraLineupPlanner.jsx`
- All 170 tests pass; clean build

---
*Phase: 16-game-day-roster-flow*
*Completed: 2026-04-29*
