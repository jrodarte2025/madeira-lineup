---
phase: 16-game-day-roster-flow
plan: "03"
subsystem: ui
tags: [react, live-game, pre-kickoff, layout, safe-area, mobile]

# Dependency graph
requires:
  - phase: 16-game-day-roster-flow/16-01
    provides: Game-Day Roster screen and inactiveIds on game.lineup; bench computeBench utility
provides:
  - Pre-kickoff screen with blur removed — lineup fully readable during lineup walkthrough
  - Fixed-bottom Start Game CTA with safe-area padding for one-thumb reach
  - Small in-flow "Ready to kick off · vs {opponent}" confirmation header above pitch
affects:
  - 16-game-day-roster-flow/16-02 (empty-slot visuals now visible since blur is removed)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fixed-bottom toolbar pattern: position fixed + bottom 0 + env(safe-area-inset-bottom, 0px) padding + zIndex 90 (below swap banner at 100)"
    - "Content spacer pattern: conditional height div added when fixed-bottom element is visible to prevent content clipping"

key-files:
  created: []
  modified:
    - src/games/LiveGameScreen.jsx

key-decisions:
  - "Removed blur overlay entirely rather than reducing opacity — coach needs full name readability, not a partially-visible overlay"
  - "In-flow header replaces centered overlay text so the pitch container stays clean (position:relative, no absolute children in setup state)"
  - "Fixed-bottom CTA uses zIndex 90 so swap-pending banner (zIndex 100) always wins on top — setup state and active state CTAs never coexist"

patterns-established:
  - "Bottom CTA pattern: use fixed-bottom div with env(safe-area-inset-bottom) + matching height spacer in scroll content. See lines 1164-1212 in LiveGameScreen.jsx."

requirements-completed: [KICK-01, KICK-02]

# Metrics
duration: 2min
completed: 2026-04-29
---

# Phase 16 Plan 03: Pre-Kickoff Layout Redesign Summary

**Blur overlay removed from pre-kickoff screen; Start Game button moved to fixed bottom for one-thumb reach on phone**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-29T17:34:30Z
- **Completed:** 2026-04-29T17:36:30Z
- **Tasks:** 2 of 3 complete (Task 3 is a human-verify checkpoint — paused awaiting approval)
- **Files modified:** 1

## Accomplishments
- Deleted the centered `backdropFilter: blur(2px)` overlay that covered all field positions + bench in setup state
- Coach can now read the full lineup (positions + player names/numbers) to the team before kickoff
- Start Game CTA pinned to the bottom of the viewport with `env(safe-area-inset-bottom)` padding — reachable with one thumb
- Small in-flow "Ready to kick off · vs {opponent}" header sits above the pitch as a contextual label, not an overlay
- `handleStartGame` handler unchanged — pure layout move; all live-game, halftime, stats, and summary logic untouched
- Build passes clean; test regressions are pre-existing (plan 16-02 functions not yet exported — unrelated to this plan)

## Task Commits

1. **Task 1: Confirm pre-kickoff screen location** - (read-only, no commit)
2. **Task 2: Un-blur lineup and move CTA to bottom** - `e9af992` (feat)

**Plan metadata:** (pending final docs commit after human-verify)

## Files Created/Modified
- `src/games/LiveGameScreen.jsx` — Removed centered blur overlay (lines 1099-1153 original), added in-flow header, added fixed-bottom Start Game CTA with safe-area padding, added height-80 spacer

## Decisions Made
- Used the existing swap-pending banner pattern (`position: fixed, bottom: 0, zIndex: 100`) as the model for the new Start Game CTA, with `zIndex: 90` so the swap banner always wins
- Height-80 spacer added in setup state (mirrors the `height: 110` spacer for stat bar) to prevent bench/events feed from being hidden by the fixed CTA
- Deleted the overlay entirely (no opacity fade-out animation) — simplest approach, no animation needed for a layout-only change

## Deviations from Plan

None — plan executed exactly as written. Line numbers matched the plan's interface spec precisely (16-02 had not yet landed in this working tree).

## Issues Encountered
- Test suite shows 10 pre-existing failures in `savedLineupTemplate.test.js` (functions `resolveLineupForGame` and `computeEmptySlotIndices` not yet exported from `lineupUtils.js` — those are plan 16-02's deliverables). Confirmed pre-existing by stash-testing against HEAD. No regressions introduced.

## Bottom CTA Layout Pattern (for future toolbars)

```jsx
{/* Fixed-bottom CTA */}
{condition && (
  <div style={{
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "12px 16px calc(12px + env(safe-area-inset-bottom, 0px))",
    background: C.navyDark,
    borderTop: "1px solid rgba(255,255,255,0.1)",
    zIndex: 90,              // below swap banner (100), above content
    boxShadow: "0 -4px 16px rgba(0,0,0,0.3)",
  }}>
    <button onClick={handler} style={{ width: "100%", ... }}>Label</button>
  </div>
)}

{/* Content spacer — add before </div> closing the scroll container */}
{condition && <div style={{ height: 80 }} />}
```

## User Setup Required
None.

## Next Phase Readiness
- KICK-01 (un-blurred lineup) and KICK-02 (bottom CTA) are implemented and built
- Awaiting human-verify checkpoint approval (Task 3)
- After approval: STATE.md / ROADMAP.md updates and final docs commit
- Plan 16-02 (empty-slot visuals for inactive players in field positions) works naturally with this plan — the un-blurred pitch will show 16-02's dashed-coral empty slots clearly once 16-02 is committed

---
*Phase: 16-game-day-roster-flow*
*Completed: 2026-04-29*
