---
phase: 05-live-game
plan: "03"
subsystem: live-game
tags: [substitutions, minute-tracking, drag-and-drop, calcMinutes, tdd]
dependency_graph:
  requires: [05-02]
  provides: [calcMinutes utility, substitution events, live minute display]
  affects: [LiveGameScreen.jsx, FieldPosition.jsx, utils.js]
tech_stack:
  added: []
  patterns: [interval intersection math, displayMinute optimization to avoid 60fps re-renders, touch drag ghost via createPortal]
key_files:
  created: [src/tests/utils.test.js]
  modified: [src/shared/utils.js, src/shared/FieldPosition.jsx, src/games/LiveGameScreen.jsx]
decisions:
  - calcMinutes uses interval intersection: max(inAt, startAt) to min(outAt, endAt) with Date.now() for open intervals
  - displayMinute state updated once/minute via useEffect on displaySeconds to avoid calling calcMinutes 60x/sec
  - handleSubstitution captures outgoingPlayer from current fieldPositions state before calling setFieldPositions
  - Field-to-field swaps produce no sub event (both players stay on field, just reposition)
  - Halftime drags allowed for pre-positioning but no playerIntervals updated (handled when 2nd half starts in handleStartSecondHalf)
  - Touch drag ghost uses createPortal to document.body to avoid overflow clipping
metrics:
  duration_seconds: 284
  completed_date: "2026-03-16"
  tasks_completed: 2
  files_changed: 4
---

# Phase 5 Plan 03: Substitutions and Minute Tracking Summary

**One-liner:** Drag-and-drop substitutions during live game with interval-intersection minute tracking via calcMinutes() pure function.

## What Was Built

### calcMinutes() utility (TDD)

Added `calcMinutes(fieldIntervals, halfIntervals)` to `src/shared/utils.js`. Pure function that computes interval intersections: for each player interval, for each half interval, computes overlap = max(inAt, startAt) to min(outAt ?? now, endAt ?? now). Sums all positive overlaps and returns Math.floor(totalMs / 60000).

Handles:
- Empty interval arrays (returns 0)
- Open intervals (outAt/endAt null → uses Date.now())
- Halftime gaps (two half intervals with no player time during gap)
- Mid-half substitutions (multiple player intervals)
- Whole-minute floor

12 tests written and passing via TDD (RED → GREEN).

### FieldPosition new props

Added three new optional props to `src/shared/FieldPosition.jsx`:
- `minuteDisplay` (string|null) — renders `{minuteDisplay}m` in small text (rgba(255,255,255,0.7), 9px) below player name
- `isSelected` (bool) — brighter border glow (3px solid orange, stronger boxShadow) for stat selection in Plan 05-04
- `statCount` (number) — small orange badge top-right of circle when > 0 (shows "9+" if over 9)

All props default to null/false/0 — existing MadeiraLineupPlanner usage unaffected.

### LiveGameScreen drag-and-drop substitutions

Implemented in `src/games/LiveGameScreen.jsx`:

**Desktop HTML5 drag:** `onDragStart`/`onDragOver`/`onDrop` on field positions and bench chips. `dragSource` state tracks what's being dragged.

**Mobile touch drag:** Inline implementation (same pattern as MadeiraLineupPlanner, not a separate hook). 150ms activation timer, horizontal swipe cancels drag, vertical drag activates early. Ghost element via createPortal during active touch drag.

**Substitution logic (handleSubstitution):**
- Field-to-field: reposition only, no sub event
- Bench-to-field during active half: update field/bench state, log `{ id, type:"sub", playerIn, playerOut, half, t }` event to local state + Firestore (fire-and-forget via appendGameEvent), close outgoing player interval (outAt=now), open incoming player interval (inAt=now)
- Halftime drags: allow pre-positioning, no interval updates (handled on 2nd half start)
- Setup/completed: no drag interaction

**Field-to-bench (handleBenchDrop):** removes player from field slot, adds to bench, logs sub event with `playerIn: null`, closes interval.

**Live minute display:**
- `displayMinute` state updates once/minute via useEffect on `displaySeconds`
- `playerMinutes` useMemo calls `calcMinutes` for all players, re-runs when `displayMinute` changes
- Field circles receive `minuteDisplay` prop with string minute count
- Bench chips show accumulated minutes in small text below player name

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed duplicate setFieldPositions calls in handleSubstitution**
- **Found during:** Task 2 implementation review
- **Issue:** Draft had three setFieldPositions calls in the bench-to-field branch — first captured outgoing player inside setState (inaccessible to callers), then a no-op return, then the actual update. This was incorrect — outgoing player must be captured from current state before setState.
- **Fix:** Collapsed to single setFieldPositions call; outgoingPlayer captured directly from fieldPositions[targetFieldIdx] before any state updates.
- **Files modified:** src/games/LiveGameScreen.jsx
- **Commit:** dc311e7

**2. [Rule 1 - Bug] Removed unused isHalftime variable**
- **Found during:** Task 2 implementation review
- **Issue:** `const isHalftime = gameStatus === "halftime"` was declared but never used in handleSubstitution.
- **Fix:** Removed the unused variable.
- **Files modified:** src/games/LiveGameScreen.jsx
- **Commit:** dc311e7

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 RED | 11aba43 | test(05-03): add failing tests for calcMinutes and getPositionGroup |
| Task 1 GREEN | 92202ce | feat(05-03): add calcMinutes() utility and FieldPosition minute/stat/selection props |
| Task 2 | dc311e7 | feat(05-03): drag-and-drop substitutions + live minute display in LiveGameScreen |

## Self-Check: PASSED

All files verified present. All commits verified in git log.
