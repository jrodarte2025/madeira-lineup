---
phase: 04-app-shell-data-foundation
plan: 03
subsystem: database
tags: [firebase, firestore, game-crud, season-stats, arrayUnion, increment]

# Dependency graph
requires:
  - phase: 04-app-shell-data-foundation
    provides: firebase.js with loadPublishedLineup/savePublishedLineup and Firestore setup
provides:
  - createGame: writes game document to games/ collection with full schema
  - loadGame: retrieves game document by ID
  - updateGameStatus: patches status field (setup/1st-half/halftime/2nd-half/completed)
  - updateGameScore: patches score { home, away }
  - appendGameEvent: atomic array append via arrayUnion
  - updateSeasonStats: atomic dotted-path increment via setDoc merge
affects:
  - 05-live-game-screen
  - 07-season-dashboard

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Silent error pattern: try/catch + console.error + return null/false on all Firestore functions"
    - "Atomic array append via arrayUnion (no read-modify-write)"
    - "Atomic counter increment via increment() with dotted-path setDoc merge for nested player stats"

key-files:
  created: []
  modified:
    - src/firebase.js

key-decisions:
  - "Embedded events array in game document (NOT subcollection) - consistent with CONTEXT.md decision"
  - "updateSeasonStats uses dotted-path keys (players.{playerId}.{stat}) with setDoc merge to avoid overwriting unrelated player stats"

patterns-established:
  - "Silent error pattern: all Firestore functions return null/false on error, never throw"
  - "Game document shape: opponent, date, status, score {home,away}, lineup snapshot, events [], createdAt serverTimestamp"
  - "Season stats shape: seasonStats/{year} with players.{playerId}.{stat} dotted paths"

requirements-completed:
  - DATA-01
  - DATA-02

# Metrics
duration: 5min
completed: 2026-03-16
---

# Phase 4 Plan 03: Game CRUD and Season Stats Data Layer Summary

**Six new Firestore functions in firebase.js covering game lifecycle (create/load/status/score/events) and atomic season stat increments via dotted-path merge**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-16T17:00:00Z
- **Completed:** 2026-03-16T17:05:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added 6 new exported functions to firebase.js (createGame, loadGame, updateGameStatus, updateGameScore, appendGameEvent, updateSeasonStats)
- Defined Firestore game document schema: status 5-state enum, embedded events array, lineup snapshot, serverTimestamp
- Defined seasonStats document schema: dotted-path players.{id}.{stat} with atomic increment and merge
- Preserved existing loadPublishedLineup and savePublishedLineup unchanged
- Build passes (vite), all 8 exports verified via dynamic import

## Task Commits

Each task was committed atomically:

1. **Task 1: Add game CRUD functions to firebase.js** - `8fffe9b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/firebase.js` - Extended with 6 new game/stats functions plus expanded Firestore imports and gamesCol reference

## Decisions Made

- Used `setDoc` with `{ merge: true }` for updateSeasonStats so dotted-path increment writes don't overwrite unrelated player fields
- appendGameEvent uses arrayUnion for atomic array append — consistent with CONTEXT.md decision to avoid read-modify-write race conditions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Firestore security rules are a deployment concern handled separately (as noted in plan).

## Next Phase Readiness

- Data layer is complete and ready for Phase 5 (live game screen) to call createGame, updateGameStatus, updateGameScore, appendGameEvent
- Phase 7 (season dashboard) can call updateSeasonStats and loadGame
- No blockers

---
*Phase: 04-app-shell-data-foundation*
*Completed: 2026-03-16*
