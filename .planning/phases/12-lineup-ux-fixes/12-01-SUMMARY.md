---
phase: 12-lineup-ux-fixes
plan: 01
status: complete
completed: 2026-04-20
requirements: [LUX-01, LUX-02]
---

# Plan 12-01 Summary — Field-to-field swap (drag + tap)

## What shipped

LUX-01 (drag) + LUX-02 (tap-tap) field-to-field swap is now unified on the existing `swapPositions(fromIdx, toIdx)` primitive across four input paths:

- Desktop drag → `handlePositionDrop` → `swapPositions(data.source, posIndex)`
- Desktop click → `handlePositionClick` → `swapPositions(selectedPosIndex, posIndex)`
- Mobile touch drag → `useTouchDrag.handleTouchEnd` → `swapPositions(source, targetIdx)`
- Mobile tap → `onTouchEnd` tapCallback → `handlePositionClick` → `swapPositions(...)`

All four paths were already wired; the gap was visual. When a user tapped a field player to start a swap, no visible feedback confirmed the selection.

## Change made

`src/MadeiraLineupPlanner.jsx` (line ~1291): pass `isSelected={!!player && player.id === selectedPlayer}` to `FieldPosition`. `FieldPosition.jsx` already renders a 3px orange border and orange glow when `isSelected={true}` (introduced in Plan 05-04 for live-game stat selection — reused here).

## Key files

- `src/MadeiraLineupPlanner.jsx` — +1 line (prop pass-through)
- `src/shared/FieldPosition.jsx` — unchanged (existing `isSelected` styling used as-is)

## Commits

- `49cfa62` feat(12-01): show selected ring on tapped field player

## Self-Check: PASSED

- `npm run build` → succeeds
- `isSelected` visual style matches orange bench-chip selection (consistent UX)
- No regression to existing `isHighlighted` (empty-slot glow for bench→field tap)
- Drag paths unaffected

## Human verification

Manual walkthrough deferred — per session instruction, all verification bundled at end of Phase 12.
