---
phase: 09-formations-gating
plan: 01
subsystem: formations
tags: [formations, 7v7, allowlist, friend-fc]

requires:
  - plan: 08-04
    provides: DEPLOYMENTS registry + ALLOWED_FORMATION_KEYS pattern
provides:
  - "src/shared/formations.js — 7 total formations (4 9v9 + 3 7v7)"
  - "src/deployments/friend.js — 7v7 allowlist"
  - "Diverged picker UI: Madeira sees 4 9v9, friend sees 3 7v7"
affects: [10-quarter-based-game-model, 11-second-deployment-docs]

key-decisions:
  - "7v7 starter set = 2-3-1, 3-2-1, 2-2-2 — standard US-youth 7v7 formations; swappable later via ALLOWED_FORMATION_KEYS edit without code changes"
  - "Friend's 2-2-2 chosen over alternatives (2-1-3, 3-1-2) because balanced 2-2-2 is the most common 7v7 formation Jim's friend's age group runs"
  - "9v9 formations stay in the library — saved-game render sites use the full library for back-compat; only the picker UI is gated"

requirements-completed: [FORM-01, FORM-02, FORM-03]

duration: ~10 min
completed: 2026-04-24
---

# Phase 9 Plan 1: Formations Gating + 7v7 Library — Summary

**Three 7v7 formations added to the library; friend's allowlist swapped; Madeira untouched; picker UI now diverges between the two bundles.**

## Accomplishments

- **7 total formations in the library:** 4 9v9 (3-3-2, 3-2-3, 2-3-3, 4-3-1) + 3 7v7 (2-3-1, 3-2-1, 2-2-2)
- **Each 7v7 formation has exactly 7 positions** (1 GK + 6 outfield) placed at coordinates consistent with the 9v9 spacing so the field-pitch rendering looks right
- **Friend's picker UI now shows 3 options** (7v7 only); Madeira's shows 4 (9v9 only)
- **Saved-game back-compat preserved** — full FORMATIONS library still imported in render sites, so an older save can still resolve
- **Tests added:** 3 new deployment-resolver assertions — friend has exactly 3 7v7 with 7 positions each; friend has no 9v9 in picker; Madeira has no 7v7 in picker. Full suite 109/109.
- **Both builds clean** — `npm run build` and `npm run build:friend` produce bundles with no picker cross-leakage

## Files Modified

- `src/shared/formations.js` — Added 3 7v7 formations with a `// ---- 7v7 (Phase 9) ----` section header
- `src/deployments/friend.js` — `ALLOWED_FORMATION_KEYS` changed from `["3-3-2", "3-2-3", "2-3-3", "4-3-1"]` (Phase 8 placeholder) to `["2-3-1", "3-2-1", "2-2-2"]`. Comment updated
- `src/tests/deployment-resolver.test.js` — +3 tests (7v7 shape, friend/9v9 anti-leakage, Madeira/7v7 anti-leakage)

## Decisions Made

- **7v7 set = 2-3-1, 3-2-1, 2-2-2.** Standard US-youth 7v7 formations. If the friend's coach wants a different set (e.g., 2-1-3 for high press, 3-1-2 for target-striker focus), swap the array in `src/deployments/friend.js` — config-only edit, no code changes needed.
- **Madeira's formation list unchanged.** Per success criterion FORM-02 — "Madeira's instance shows exactly its existing four 9v9 formations" — not touched.
- **Full library stays imported at save/render sites.** SharedLineupView / LiveGameScreen / RewatchMode still read from `shared/formations.js` (not `config.ALLOWED_FORMATIONS`) so older shared links with a now-unavailable formation key still render.

## Issues Encountered

None.

## Next Phase Readiness

- **Ready for Phase 10** — Quarter-based game model. Big phase: 8 pre-built segment lineups (Q1/Q1.5/Q2/Q2.5/Q3/Q3.5/Q4/Q4.5), quarter-stop clock, rolling mid-quarter subs, quarter-summary totals. Must not regress Madeira's halves flow.

---
*Phase: 09-formations-gating*
*Completed: 2026-04-24*
