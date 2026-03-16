---
phase: 03-mobile-ux-overhaul
plan: 01
subsystem: ui
tags: [react, touch-events, mobile, drag-and-drop, responsive]

# Dependency graph
requires:
  - phase: 02-drag-drop-completion
    provides: assignPlayer, swapPositions, removeFromPosition, handlePositionClick, handlePlayerClick
provides:
  - useTouchDrag hook: custom touch drag-and-drop system (touchstart/touchmove/touchend)
  - Mobile chip strip above pitch showing unassigned players
  - Ghost element following finger during touch drag
  - Drop target highlighting (orange glow) during touch drag
  - 50px field circles on mobile (compact mode removed)
affects: [03-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useTouchDrag hook: 150ms timer distinguishes taps from drags; pendingDragRef stores touch start before activation"
    - "elementFromPoint for drop target detection: finger obscures drop target, ghost has pointerEvents:none to see through it"
    - "data-drop-id attribute pattern: drop targets identified by walking up DOM tree from elementFromPoint result"
    - "Non-passive document touchmove listener inside hook prevents page scroll during active drag"
    - "React portal for ghost element: renders into document.body so fixed positioning works correctly"

key-files:
  created: []
  modified:
    - src/MadeiraLineupPlanner.jsx

key-decisions:
  - "useTouchDrag hook placed above main component, initialized after assignPlayer/swapPositions/removeFromPosition useCallback definitions to avoid hook-order issues"
  - "150ms activation delay discriminates taps from drags — tapCallback fires if touchend precedes activation"
  - "Ghost rendered via createPortal to document.body so fixed position works regardless of stacking context"
  - "compact={false} hardcoded in FieldPosition — field circles are always 50px, removing compact mode entirely from mobile"
  - "Chip strip uses data-drop-id='chipstrip' for drop detection; field positions use data-drop-id='field-N'"

patterns-established:
  - "Touch drag system: handleTouchStart(playerId, source, e) on draggable, handleTouchMove/handleTouchEnd on same element and all drop targets"
  - "isTouchDragOver prop on FieldPosition enables same orange glow as desktop HTML5 drag hover"

requirements-completed: [MOB-01, MOB-03, PRES-01]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 03 Plan 01: Touch Drag-and-Drop + Mobile Chip Strip Summary

**Custom touch drag-and-drop system (touchstart/touchmove/touchend) with ghost-following-finger, orange drop target glow, and mobile chip strip above the pitch replacing the bottom bench bar**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-16T04:40:06Z
- **Completed:** 2026-03-16T04:43:07Z
- **Tasks:** 1 of 2 (Task 2 is human-verify checkpoint)
- **Files modified:** 1

## Accomplishments
- `useTouchDrag` hook with 150ms tap/drag discrimination, ghost state, `elementFromPoint` drop detection
- Mobile chip strip above the pitch: horizontal scrollable, min 44px chips, shows unassigned players only
- Ghost element renders via React portal into `document.body`, follows finger with navy gradient circle matching field position style
- Drop target highlighting: field positions get orange glow via `isTouchDragOver` prop; chip strip gets `rgba(232,100,32,0.15)` background + dashed orange border
- Non-passive `document.touchmove` listener inside hook prevents page scroll during active drag
- `compact={false}` always — field circles hardcoded to 50px on mobile
- Desktop HTML5 drag unchanged (all touch handlers gated by `isMobile`)

## Task Commits

1. **Task 1: Implement useTouchDrag hook and integrate with chip strip + field positions** - `e7adfde` (feat)

## Files Created/Modified
- `src/MadeiraLineupPlanner.jsx` - Added useTouchDrag hook, mobile chip strip, ghost portal, touch handlers on FieldPosition and chip strip elements

## Decisions Made
- Hook initialized after `assignPlayer`/`swapPositions`/`removeFromPosition` `useCallback` definitions — hooks must be called in order and these are needed as direct references
- Ghost uses `createPortal(element, document.body)` rather than an inline fixed div — prevents stacking context issues
- `compact` mode removed from FieldPosition entirely (hardcoded 50px sizes) — the `compact` prop was only ever used for `isMobile` anyway
- Non-passive document-level touchmove listener handles scroll prevention — React synthetic `preventDefault` alone is insufficient for passive listeners

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Touch drag-and-drop foundation complete; awaiting human verification (Task 2 checkpoint)
- Plan 02 can add the control row below the pitch and hide the bench bar on mobile once verification passes

---
*Phase: 03-mobile-ux-overhaul*
*Completed: 2026-03-16*
