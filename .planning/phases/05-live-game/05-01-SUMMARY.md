---
phase: 05-live-game
plan: 01
subsystem: ui
tags: [react, firebase, firestore, routing, react-router]

# Dependency graph
requires:
  - phase: 04-app-shell
    provides: App.jsx HashRouter, firebase.js game CRUD, constants.js initial stat definitions
  - phase: 05-00
    provides: vitest test infrastructure setup
provides:
  - POSITION_STATS map keyed by GK/DEF/MID/FWD with position-aware stat arrays
  - STAT_LABELS map for display-friendly stat names (snake_case to readable)
  - Expanded STAT_COLORS covering all Phase 5 stat types
  - getPositionGroup(label) utility mapping formation labels to position group
  - listGames() firebase function returning games sorted by createdAt desc
  - replaceGameEvents() firebase function for full events array replacement
  - GamesTab with game list cards, FAB button, and GameSetupModal
  - GameSetupModal that creates a game in Firestore and navigates to /games/:id
  - /games/:id route in App.jsx with LiveGameScreen placeholder
  - TabBar hidden on /games/:id routes for full vertical space
affects: [05-02, 05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FAB button positioned above tab bar (bottom: 72px) to avoid overlap"
    - "16px minimum font-size on inputs to prevent iOS zoom"
    - "AppShell component wraps Routes + TabBar so useLocation() works inside HashRouter"
    - "colorScheme: dark on date inputs for iOS dark-mode compatibility"

key-files:
  created:
    - src/tabs/GamesTab.jsx
  modified:
    - src/shared/constants.js
    - src/shared/utils.js
    - src/firebase.js
    - src/App.jsx

key-decisions:
  - "AppShell component introduced in App.jsx so useLocation() can be used inside HashRouter context"
  - "TabBar hidden and paddingBottom: 56 removed on /games/:id routes to reclaim full vertical space for live game screen"
  - "GameSetupModal and GameCard co-located in GamesTab.jsx (not separate files) for simplicity"
  - "listGames() uses silent error handling (returns []) matching existing firebase.js patterns"

patterns-established:
  - "Pattern 1: Modal components co-located in parent tab file when they are tightly coupled and not reused elsewhere"
  - "Pattern 2: useLocation() based route detection for conditional UI (TabBar visibility)"

requirements-completed: [GAME-01, GAME-02]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 05 Plan 01: Game Entry Flow + Expanded Constants Summary

**Position-aware stat constants (POSITION_STATS, STAT_LABELS), listGames/replaceGameEvents firebase functions, GamesTab with game creation modal, and /games/:id route with hidden TabBar**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T19:19:05Z
- **Completed:** 2026-03-16T19:22:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Expanded constants.js with POSITION_STATS (4 position groups), STAT_LABELS (11 stat labels), and extended STAT_COLORS
- Added getPositionGroup() to utils.js mapping all 17 formation labels to GK/DEF/MID/FWD
- Added listGames() and replaceGameEvents() to firebase.js with consistent silent error handling
- Built full GamesTab: game list cards showing opponent, date, status badge, and score; empty-state message; loading state
- GameSetupModal: opponent + date fields, snapshots published lineup on create, navigates to /games/:id on success
- App.jsx refactored with AppShell component to enable useLocation(); TabBar conditionally hidden on game routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand constants + add listGames() + replaceGameEvents() + getPositionGroup()** - `252c650` (feat)
2. **Task 2: GamesTab with game list, GameSetupModal, and /games/:id route** - `3b5096e` (feat)

## Files Created/Modified
- `src/shared/constants.js` - Added POSITION_STATS, STAT_LABELS, expanded STAT_COLORS; legacy STAT_TYPES kept
- `src/shared/utils.js` - Added getPositionGroup(label) mapping all formation position labels
- `src/firebase.js` - Added listGames(), replaceGameEvents(); imported getDocs, query, orderBy
- `src/tabs/GamesTab.jsx` - Full implementation: GameCard, GameSetupModal, GamesTab with FAB
- `src/App.jsx` - Added AppShell, LiveGameScreen placeholder, /games/:id route, conditional TabBar

## Decisions Made
- Introduced AppShell component inside HashRouter so useLocation() has access to router context. Without this, useLocation() called in App() (which renders HashRouter) would throw outside-router-context error.
- GameSetupModal loads the published lineup at creation time (snapshot), matching the existing createGame() contract.
- FAB positioned at bottom: 72px (tab bar height 56px + 16px gap) to avoid overlap on all screen sizes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All constants, firebase helpers, and routes ready for Plan 05-02 (LiveGameScreen implementation)
- POSITION_STATS and STAT_LABELS ready for Plans 05-03 (stat recording) and 05-04 (undo)
- LiveGameScreen placeholder at /games/:id will be replaced by Plan 05-02
- replaceGameEvents() ready for Plan 05-04 undo functionality

## Self-Check: PASSED
- All 5 files confirmed present on disk
- POSITION_STATS (2 occurrences: export + usage), STAT_LABELS, getPositionGroup, listGames, replaceGameEvents, games/:id all confirmed in files
- GamesTab.jsx: 404 lines (well above 80 line minimum)
- Both commits confirmed: 252c650 and 3b5096e
- Vite build passed with no errors

---
*Phase: 05-live-game*
*Completed: 2026-03-16*
