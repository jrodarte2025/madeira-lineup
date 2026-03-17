---
phase: 06-post-game-summary-exports
plan: 01
subsystem: summary-data-layer
tags: [summary, tdd, firebase, routing, utilities]
dependency_graph:
  requires: [05-live-game]
  provides: [summaryUtils, finalizeGame, summary-route]
  affects: [LiveGameScreen, GamesTab, App]
tech_stack:
  added: [html-to-image]
  patterns: [pure-function-data-layer, tdd-red-green, inline-interval-computation]
key_files:
  created:
    - src/shared/summaryUtils.js
    - src/tests/summary.test.js
    - src/games/GameSummaryScreen.jsx
  modified:
    - src/firebase.js
    - src/games/LiveGameScreen.jsx
    - src/tabs/GamesTab.jsx
    - src/App.jsx
    - package.json
decisions:
  - "Abbreviation map defined in summaryUtils.js rather than constants.js to keep it co-located with format logic"
  - "buildSummaryRows uses STAT_ORDER array to ensure consistent column ordering regardless of event recording order"
  - "handleEndGame computes closedHalfIntervals and closedPlayerIntervals inline (not via setState) to ensure correct values are available before async finalizeGame call"
  - "finalizeGame writes playerIntervals + halfIntervals + status=completed in a single updateDoc to avoid partial writes"
  - "GameSummaryScreen is a placeholder with navy background — Plan 02 fully replaces it"
metrics:
  duration: ~20 minutes
  completed: 2026-03-16
  tasks_completed: 2
  tests_added: 35
  files_changed: 7
---

# Phase 6 Plan 01: Summary Data Layer + Routing Foundation Summary

**One-liner:** Pure-function summary utilities (buildSummaryRows, buildCSV, getTopMVPs, formatMVPStats) with 35 TDD tests, atomic game finalization via finalizeGame(), and /games/:id/summary route wiring.

## What Was Built

### Task 1: Summary Utility Functions (TDD)
Created `src/shared/summaryUtils.js` with four pure exported functions:

- **buildSummaryRows(game)** — iterates events array for per-player stat counts, derives activeCols (stats with at least 1 event), computes minutes via calcMinutes, sorts rows by minutes desc, computes team totals
- **buildCSV(rows, activeCols, game)** — produces CSV with Player/Minutes/stat-columns header using STAT_LABELS display names, one row per player (abbreviated names), TEAM TOTALS row at bottom, comma/quote escaping via JSON.stringify
- **getTopMVPs(game, count=3)** — aggregates stat events per player, filters 0-stat players, sorts by total desc then name asc for tie-breaking
- **formatMVPStats(stats)** — maps stat keys to abbreviations (G, A, SOT, GP, Sv, T, CL, Blk, Int, 50/50, Dist) following STAT_ORDER, omits zeros

35 tests covering all behaviors pass.

### Task 2: Firebase + Navigation Fixes
- **html-to-image installed** — confirmed importable
- **finalizeGame() in firebase.js** — single updateDoc writing playerIntervals, halfIntervals, and status:"completed" atomically
- **handleEndGame fix in LiveGameScreen.jsx** — critical race condition fixed: now computes closed intervals inline (not via async setState), calls await finalizeGame() before clearGameStorage(), then navigate to /games/:id/summary
- **GamesTab updated** — completed games navigate to /games/:id/summary, active/setup games navigate to /games/:id
- **GameSummaryScreen.jsx** — placeholder with navy background, renders "Loading summary..." text
- **App.jsx** — /games/:id/summary route added before /games/:id so it matches first; isGameScreen regex already covers the new route

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test data for comma-escape test produced no comma after abbreviation**
- **Found during:** Task 1 GREEN phase
- **Issue:** Test used "Smith, Jr." as player name; abbreviateName converts it to "S. Jr." (no comma), so the CSV escape test expected a quote that was never produced
- **Fix:** Changed test mock player name to "Smith,Jr" (single token with embedded comma) which abbreviateName returns unchanged, correctly triggering the JSON.stringify escape path
- **Files modified:** src/tests/summary.test.js
- **Commit:** eaf5862

## Self-Check: PASSED

**Files exist:**
- FOUND: src/shared/summaryUtils.js
- FOUND: src/tests/summary.test.js
- FOUND: src/games/GameSummaryScreen.jsx

**Commits exist:**
- FOUND: eaf5862 — feat(06-01): summary utility functions with TDD tests
- FOUND: d3cceda — feat(06-01): finalizeGame, handleEndGame fix, routing wiring
