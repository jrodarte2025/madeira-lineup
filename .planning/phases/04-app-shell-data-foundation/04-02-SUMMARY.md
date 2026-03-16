---
phase: 04-app-shell-data-foundation
plan: 02
subsystem: ui
tags: [react-router, hashrouter, tab-navigation, routing]

# Dependency graph
requires:
  - phase: 04-01
    provides: shared/constants.js with C color tokens and font constants; shared/utils.js with lineup encode/decode/share utilities

provides:
  - HashRouter shell in App.jsx with three-tab bottom navigation (Lineup | Games | Stats)
  - GamesTab and StatsTab stub components for Phase 5 and Phase 7 to replace
  - Hash-based share URL format (#/lineup?lineup=...) for lineup sharing

affects: [05-live-game-ui, 07-share-export]

# Tech tracking
tech-stack:
  added: [react-router (latest)]
  patterns:
    - HashRouter used instead of BrowserRouter for SPA compatibility without server config
    - NavLink with function-style `style` prop to apply active/inactive tab styles
    - Fixed-position tab bar with paddingBottom on content wrapper to avoid content hiding behind tab bar

key-files:
  created:
    - src/App.jsx
    - src/tabs/GamesTab.jsx
    - src/tabs/StatsTab.jsx
  modified:
    - src/main.jsx
    - src/shared/utils.js
    - src/MadeiraLineupPlanner.jsx

key-decisions:
  - "HashRouter chosen (not BrowserRouter) so no server rewrite rules needed for SPA routing"
  - "Labels-only tab bar (no icons) per locked design decision"
  - "buildShareUrl updated to generate #/lineup?lineup=... format; MadeiraLineupPlanner reads lineup param from window.location.hash"

patterns-established:
  - "NavLink style as function: ({ isActive }) => ({ ...baseStyle, ...(isActive ? activeStyle : inactiveStyle) })"
  - "Stub tab pattern: centered div with muted text, DM Sans font, 60vh height"

requirements-completed: [INFRA-01, INFRA-03]

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 4 Plan 02: App Shell — Bottom Tab Navigation Summary

**HashRouter shell with three-tab bottom navigation (Lineup | Games | Stats), react-router installed, and hash-based share URL format wired end-to-end**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-16T17:15:00Z
- **Completed:** 2026-03-16T17:23:00Z
- **Tasks:** 1 of 1
- **Files modified:** 6

## Accomplishments

- Installed react-router and created App.jsx with HashRouter + three-tab fixed bottom TabBar
- Lineup tab renders the full MadeiraLineupPlanner with all v1.0 features intact; Games and Stats tabs show "coming soon" stubs
- Share URL updated to hash-based format; MadeiraLineupPlanner reads lineup param from hash so shared links still load correctly
- Build succeeds with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install react-router, create App shell with TabBar and stub tabs** - `ee90641` (feat)

## Files Created/Modified

- `src/App.jsx` - HashRouter shell with TabBar (three NavLinks) and Routes for /lineup, /games, /stats
- `src/tabs/GamesTab.jsx` - Stub component: "Game tracking coming soon" centered message
- `src/tabs/StatsTab.jsx` - Stub component: "Season stats coming soon" centered message
- `src/main.jsx` - Updated to render App instead of MadeiraLineupPlanner directly
- `src/shared/utils.js` - buildShareUrl now generates `#/lineup?lineup=...` format
- `src/MadeiraLineupPlanner.jsx` - Reads lineup URL param from window.location.hash instead of window.location.search

## Decisions Made

- HashRouter chosen (not BrowserRouter) so the SPA works without any server-side rewrite rules — hash routing handles client-only navigation natively
- NavLink `style` prop used as a function `({ isActive }) => ...` for active/inactive state styling without a CSS file
- Tab bar uses label-only design (no icons) per the locked Phase 4 decision

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Tab shell is fully wired; Phase 5 (live game UI) can replace GamesTab.jsx directly
- Phase 7 (share/export) can replace StatsTab.jsx directly
- All v1.0 lineup features confirmed working inside the Lineup tab
- Share URL format changed — any previously shared v1.0 links (without `#/lineup`) will not auto-load; this is an acceptable break since v2.0 is a new deployment

---
*Phase: 04-app-shell-data-foundation*
*Completed: 2026-03-16*
