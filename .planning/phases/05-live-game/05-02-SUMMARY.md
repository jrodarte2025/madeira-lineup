---
phase: 05-live-game
plan: 02
subsystem: ui
tags: [react, timer, state-machine, localStorage, wake-lock, firebase, requestAnimationFrame]

# Dependency graph
requires:
  - phase: 05-01
    provides: GamesTab with game creation, /games/:id route, firebase game CRUD, constants/utils
  - phase: 04-app-shell
    provides: App.jsx HashRouter, AppShell, TabBar conditional hide on game routes
provides:
  - LiveGameScreen with drift-proof rAF timer, state machine (setup->1st-half->halftime->2nd-half->completed)
  - GameHeader fixed top bar with score editing, timer display, and phase-aware control buttons
  - Screen Wake Lock during active halves (with graceful WebKit fallback)
  - localStorage crash recovery: all game state mirrored, auto-resume on reload
  - halfIntervals and playerIntervals tracking for time-on-pitch computation
  - Real LiveGameScreen replacing App.jsx placeholder
affects: [05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Drift-proof timer via requestAnimationFrame + Date.now() diff — never setInterval"
    - "Wake Lock acquired on half start, released on halftime/completed/unmount, reacquired on visibilitychange"
    - "localStorage crash buffer with madeira_ prefix — saveStored per state mutation, restore on mount"
    - "clearGameStorage() on game completion to clean up all madeira_ keys"
    - "ScoreButton: tap = +1 (mouse/touchEnd if no long-press timeout), long-press 500ms = -1"

key-files:
  created:
    - src/games/GameHeader.jsx
    - src/games/LiveGameScreen.jsx
  modified:
    - src/App.jsx

key-decisions:
  - "FORMATIONS imported statically (not dynamic import) to avoid async-in-then() anti-pattern"
  - "Crash recovery checks madeira_activeGameId on mount — if matches gameId, skips Firestore load"
  - "displaySeconds stored as React state (not ref) so timer renders update the header on each frame"
  - "halfIntervals + playerIntervals built out now so Plans 05-03/05-04 can consume without refactor"

# Metrics
duration: 4min
completed: 2026-03-16
---

# Phase 05 Plan 02: LiveGameScreen — Timer + State Machine + Crash Recovery Summary

**Drift-proof rAF timer with 5-state game machine, score editing via tap/long-press, Screen Wake Lock, and localStorage crash recovery so the game auto-resumes on page reload**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-16T19:25:47Z
- **Completed:** 2026-03-16T19:29:28Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Built `GameHeader.jsx` (289 lines): fixed top bar with home/away score buttons, opponent label, timer display, and state-appropriate action buttons (End Half, Start 2nd Half, Full Time!)
- Built `LiveGameScreen.jsx` (652 lines): full game orchestrator with drift-proof rAF timer, state machine, pitch display, bench strip, crash recovery, wake lock
- Drift-proof timer: `requestAnimationFrame` loop computes `elapsed = Math.floor((Date.now() - startTsRef.current) / 1000)` — immune to tab suspension drift
- Timer countdown: 25:00 → 0:00 then flips to stoppage `+MM:SS`
- Score editing: tap = increment (+1), long-press 500ms = decrement (min 0), both home and away
- State machine: setup → 1st-half → halftime → 2nd-half → completed with correct interval tracking
- Wake Lock: `navigator.wakeLock.request("screen")` on half start, released on halftime/completed, reacquired on `visibilitychange`
- Crash recovery: all 10 game state keys mirrored to localStorage on every mutation; on mount checks `madeira_activeGameId`, restores all state, recalculates and restarts timer
- Resume banner "Game in progress — vs [opponent]" auto-dismisses after 2s
- App.jsx updated: removed 29-line placeholder, imported real `LiveGameScreen` from `src/games/`

## Task Commits

Each task was committed atomically:

1. **Task 1: GameHeader + drift-proof timer + state machine transitions** - `c6ee280` (feat)
2. **Task 2: Crash recovery + Screen Wake Lock + App.jsx route wiring** - `7bc8ef0` (feat)

## Files Created/Modified

- `src/games/GameHeader.jsx` — Fixed header: score tap/long-press, opponent name, timer string, End Half/Start 2nd Half/Full Time buttons
- `src/games/LiveGameScreen.jsx` — Full game orchestrator: timer, state machine, pitch + bench, crash recovery, wake lock
- `src/App.jsx` — Replaced LiveGameScreen placeholder with real import from `src/games/LiveGameScreen.jsx`

## Decisions Made

- FORMATIONS imported statically at the top of LiveGameScreen rather than dynamically. Dynamic `await import()` inside a `.then()` callback would cause a syntax error — static import is cleaner and correct.
- `displaySeconds` stored as React state (not ref) because timer display must trigger re-renders on each second. The rAF tick only calls `setDisplaySeconds` when the value actually changes to avoid extra renders.
- halfIntervals and playerIntervals built in this plan even though Plans 05-03/05-04 will consume them — avoiding a partial refactor later.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

One auto-fix applied during Task 1:

**[Rule 1 - Bug] Removed `await import()` from `.then()` callback**
- **Found during:** Task 1 build
- **Issue:** `const { FORMATIONS } = await import("../shared/constants.js")` inside a `.then()` callback is not valid — callbacks require async wrapper. Build passed but static import is the correct pattern for a module-level dependency.
- **Fix:** Added `FORMATIONS` to the existing top-level static import from `../shared/constants`
- **Files modified:** `src/games/LiveGameScreen.jsx`
- **Commit:** Included in `c6ee280`

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `LiveGameScreen` is the orchestrator stub ready for Plans 05-03 (stat recording) and 05-04 (substitutions/undo)
- `halfIntervals` and `playerIntervals` state already tracked for minutes-played computation
- `events` array state ready for Plans 05-03/05-04 to append/replace
- Wake Lock and crash recovery are complete — no changes needed in future plans

## Self-Check: PASSED

- `src/games/GameHeader.jsx`: FOUND (289 lines, min 40)
- `src/games/LiveGameScreen.jsx`: FOUND (652 lines, min 150)
- `src/App.jsx`: FOUND with `LiveGameScreen` import confirmed
- Key patterns confirmed: loadGame, updateGameStatus, updateGameScore, saveStored, loadStored, madeira_, LiveGameScreen
- Commits confirmed: c6ee280 and 7bc8ef0
- Vite build: passed with no errors

---
*Phase: 05-live-game*
*Completed: 2026-03-16*
