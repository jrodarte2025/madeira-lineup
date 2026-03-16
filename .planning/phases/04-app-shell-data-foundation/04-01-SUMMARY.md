---
phase: 04-app-shell-data-foundation
plan: "01"
subsystem: shared-modules
tags: [refactor, extraction, shared, constants, components]
dependency_graph:
  requires: []
  provides:
    - src/shared/constants.js (C, FORMATIONS, INITIAL_ROSTER, POSITION_GROUP, STAT_TYPES, STAT_COLORS)
    - src/shared/utils.js (abbreviateName, useMediaQuery, encodeLineup, decodeLineup, buildShareUrl, shareLineup)
    - src/shared/PitchSVG.jsx
    - src/shared/FieldPosition.jsx
  affects:
    - src/MadeiraLineupPlanner.jsx (rewired to import from shared/)
tech_stack:
  added: []
  patterns:
    - Shared module pattern via src/shared/ directory
    - Named exports from constants and utils
    - Default exports from JSX components
key_files:
  created:
    - src/shared/constants.js
    - src/shared/utils.js
    - src/shared/PitchSVG.jsx
    - src/shared/FieldPosition.jsx
  modified:
    - src/MadeiraLineupPlanner.jsx
decisions:
  - STAT_TYPES grouped into offensive/defensive/neutral categories; stat names (goal, assist, shot, tackle, clearance, save, foul) chosen as Phase 5 starters — may be refined in Phase 5 implementation
  - STAT_COLORS maps each stat type to C.statOffensive (#E86420), C.statDefensive (#4CAFB6), or C.statNeutral (#6b7280)
  - POSITION_GROUP uses simple string enum (GK/DEF/MID/FWD) — no TypeScript, matches project JS-only stack
  - buildShareUrl kept as-is in utils.js per plan instruction; Plan 04-02 will update for HashRouter
metrics:
  duration: "~3 minutes"
  completed: "2026-03-16"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 4 Plan 1: Shared Module Extraction Summary

**One-liner:** Extracted PitchSVG, FieldPosition, C colors, FORMATIONS, and utility functions from monolith into four `src/shared/` modules; added POSITION_GROUP, STAT_TYPES, and STAT_COLORS for Phase 5 stat tracking.

## What Was Built

Four new files establish the `src/shared/` pattern that Phase 5 (game screen) and Phase 7 (stats views) will consume:

- **src/shared/constants.js** — C color object (with 3 new stat color properties), fontBase, fontDisplay, FORMATIONS, INITIAL_ROSTER, POSITION_GROUP, STAT_TYPES, STAT_COLORS
- **src/shared/utils.js** — abbreviateName, useMediaQuery, encodeLineup, decodeLineup, buildShareUrl, shareLineup
- **src/shared/PitchSVG.jsx** — Pure pitch SVG component, no dependencies beyond React
- **src/shared/FieldPosition.jsx** — Interactive player circle component, imports from ./constants and ./utils

`src/MadeiraLineupPlanner.jsx` was rewired to import all shared items. All original inline definitions were removed. No duplicate definitions remain.

## Verification Results

- `npx vite build` passes with zero errors
- `grep -r "const C = " src/` — exactly ONE match (shared/constants.js)
- `grep -r "function PitchSVG" src/` — exactly ONE match (shared/PitchSVG.jsx)
- `grep -r "function FieldPosition" src/` — exactly ONE match (shared/FieldPosition.jsx)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | a444480 | feat(04-01): create shared constants and utilities |
| Task 2 | c9aadd4 | feat(04-01): extract PitchSVG and FieldPosition, rewire monolith |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] src/shared/constants.js exists
- [x] src/shared/utils.js exists
- [x] src/shared/PitchSVG.jsx exists
- [x] src/shared/FieldPosition.jsx exists
- [x] Commits a444480 and c9aadd4 exist
- [x] Build passes with zero errors
- [x] No duplicate definitions
