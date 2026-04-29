---
phase: 16-game-day-roster-flow
plan: "04"
subsystem: ui
tags: [react, roster, sit-player, inactive, cleanup]

# Dependency graph
requires:
  - phase: 16-01
    provides: per-game inactiveIds now lives on game.lineup.inactiveIds in LiveGameScreen; template builder no longer needs inactive toggle
provides:
  - MadeiraLineupPlanner without sit-player UI (SIT button + drop zone deleted)
  - inactiveIds preserved as inert [] plumbing in saved/published lineup payloads
affects: [LiveGameScreen.jsx, GamesTab.jsx — no changes needed, schema unchanged]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/MadeiraLineupPlanner.jsx

key-decisions:
  - "inactiveIds state kept as inert [] plumbing — schema stays identical, always writes inactiveIds:[] in save/publish payloads so LiveGameScreen tolerates both old and new docs"
  - "All Firestore/savedLineup load handlers now force setInactiveIds([]) so legacy baked-in inactives are gracefully forgotten on load without crash or migration"
  - "toggleInactive function deleted entirely — no UI callsites remain after SIT button and drop zone removal"

patterns-established: []

requirements-completed: [ROSTER-01]

# Metrics
duration: 12min
completed: 2026-04-29
---

# Phase 16 Plan 04: Roster Management Sit-Player UI Removal Summary

**Deleted SIT chip button and "Drag here to sit out" inactive drop zone from the saved-lineup-template builder; inactiveIds preserved as inert `[]` plumbing for schema compatibility with legacy docs**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-29T17:34:39Z
- **Completed:** 2026-04-29T17:47:00Z
- **Tasks:** 3 of 3 complete (Task 3 human-verify approved by user)
- **Files modified:** 1

## Accomplishments
- PlayerChip SIT button removed from lines 55-59 — no inline sit-out affordance on any player row
- Inactive drop zone (`{/* INACTIVE DROP ZONE */}` block, lines 353-405) removed from RosterContent — no "Drag here to sit out" zone or Inactive player list in the sidebar
- Handler functions `handleInactiveDragOver`, `handleInactiveDragLeave`, `handleInactiveDrop` deleted (were only used by the drop zone)
- `toggleInactive` function deleted — no UI callsites remain
- `data.source === "inactive"` branch deleted from field drop handler — unreachable source eliminated
- `inactiveIds` state init changed from `loadStored("inactiveIds", [])` to `useState([])` — graceful forget of localStorage-cached legacy inactives
- `inactiveHover` state deleted — only used by the now-deleted drop zone
- All Firestore/savedLineup load handlers updated to `setInactiveIds([])` so legacy published/saved lineups with non-empty inactiveIds are silently dropped on load
- `inactiveIds: [...inactiveIds]` preserved in save/publish payloads — schema identical, always writes `[]`
- Build clean, 170/170 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Confirm Roster Management screen location + enumerate callsites** - no commit (read-only audit)
2. **Task 2: Remove SIT chip button + inactive drop zone + neutralize state** - `73e2d4c` (feat)

3. **Task 3: Human verification** - approved by user on 2026-04-29

**Plan metadata:** `[final commit hash]`

## Files Created/Modified
- `src/MadeiraLineupPlanner.jsx` — deleted SIT button, inactive drop zone, related handlers, toggleInactive function, inactive drop branch; reset inactiveIds init; updated rosterProps callsite

## Decisions Made
- Kept `inactiveIds` state and schema field — always `[]` from builder, but schema stays identical so LiveGameScreen treats it the same as always-empty (no migration needed, no breaking change)
- All load paths (URL-shared, Firestore published, loadLineup) now force `setInactiveIds([])` — legacy data is gracefully forgotten, not crashed on
- `removePlayer` still calls `setInactiveIds((prev) => prev.filter(...))` as defensive code — harmless since inactiveIds is always `[]`, kept for correctness

## Deviations from Plan

None — plan executed exactly as written. All deletions matched the plan's line-by-line inventory. The only minor adaptation was also removing the `isInactive={false}` props from PlayerChip usages (those props were deleted from the signature, so JSX references needed cleanup) — this was implicit in the plan and counts as the same deletion task.

## Issues Encountered
None — build and tests passed on first attempt after all edits were applied.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Human-verify (Task 3) approved by user — all 3 tasks complete
- Phase 16 fully complete (16-01 through 16-04 all done)
- v2.2 milestone complete — per-game inactives, saved-lineup templates, pre-kickoff walkthrough, and Roster Management cleanup all shipped

---
*Phase: 16-game-day-roster-flow*
*Completed: 2026-04-29*
