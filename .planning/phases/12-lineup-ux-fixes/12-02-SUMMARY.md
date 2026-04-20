---
phase: 12-lineup-ux-fixes
plan: 02
status: complete
completed: 2026-04-20
requirements: [LUX-03]
---

# Plan 12-02 Summary — Two-way tap-to-sub

## What shipped

LUX-03: tap-to-sub is now symmetric. Tapping a field player then tapping the bench background subs that player off. Existing bench→field tap flow preserved.

## Change made

`src/MadeiraLineupPlanner.jsx`:

1. **New handler** — `handleBenchTap(e)`: checks `e.target === e.currentTarget` (so tapping a bench chip still selects that chip, no false sub-off); if a field player is selected, call `removeFromPosition(selectedPosIndex)` and clear selection.
2. **Desktop bench bar** (line ~1312): added `onClick={handleBenchTap}` and dynamic cursor (`pointer` when a field player is selected, `default` otherwise).
3. **Mobile chipstrip** (line ~1129): added `onClick={handleBenchTap}`. Touch handlers unchanged (onClick fires reliably on non-drag taps after touchEnd).
4. **Helper text** updated to context-aware:
   - No selection → "Click or drag players"
   - Field player selected → "Tap a position to swap, or tap bench to sub out"
   - Bench player selected → "Tap a position to assign"

## Key files

- `src/MadeiraLineupPlanner.jsx` — +17 / -1

## Commits

- `0e75c07` feat(12-02): tap bench to sub off selected field player

## Self-Check: PASSED

- `npm run build` → succeeds
- Guard `e.target !== e.currentTarget` prevents chip-tap from bubbling into a sub-off
- Drag-based sub-off (handleRosterDrop) untouched
- Double-tap / double-click remove behaviors untouched
- Helper text updates with selection context

## Human verification

Manual walkthrough deferred — per session instruction, all verification bundled at end of Phase 12.
