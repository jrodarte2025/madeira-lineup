---
phase: 07-season-dashboard-player-profiles
verified: 2026-03-16T23:49:00Z
status: human_needed
score: 12/12 must-haves verified
re_verification: true
  previous_status: gaps_found
  previous_score: 11/12
  gaps_closed:
    - "Column headers are tappable to sort ascending/descending; default sort is by total stat events descending"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "End-to-end season stats flow"
    expected: "Finalize a game, navigate to Stats tab — all finalized players appear with correct GP/minutes/stat totals"
    why_human: "Requires real Firestore write + read round-trip and visual confirmation of populated data"
  - test: "Accordion game-row navigation"
    expected: "Tapping a game row in the expanded accordion navigates to /games/:id/summary"
    why_human: "Navigation behavior requires browser interaction to verify"
  - test: "Mobile viewport usability"
    expected: "Table is usable on mobile — horizontal scroll works, tap targets are large enough"
    why_human: "Visual/tactile UX cannot be verified by static analysis"
---

# Phase 7: Season Dashboard & Player Profiles Verification Report

**Phase Goal:** Season dashboard showing all-player season totals with sortable table, per-game accordion drill-down, and game finalization writing season stats to Firestore.
**Verified:** 2026-03-16T23:49:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (previous status: gaps_found, 11/12)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `getSeasonId` returns 'spring-YYYY' for Jan-Jun dates and 'fall-YYYY' for Jul-Dec dates | VERIFIED | `src/shared/seasonUtils.js` lines 14-28; UTC-safe ISO parsing; 17 tests pass |
| 2 | `computeSeasonDeltas` produces correct per-player stat increments from a finalized game | VERIFIED | `src/shared/seasonUtils.js` lines 39-77; skips 0-contribution players; 17 tests pass |
| 3 | `loadSeasonStats` reads a single Firestore doc and returns player totals | VERIFIED | `src/firebase.js` line 234; silent catch returns null |
| 4 | `listSeasons` returns all season IDs sorted reverse-chronologically | VERIFIED | `src/firebase.js` line 248; `.sort().reverse()` applied; silent catch returns [] |
| 5 | Stats tab shows all 13 rostered players with season totals including GP, minutes, and dynamic stat columns | VERIFIED | `src/tabs/StatsTab.jsx` iterates `INITIAL_ROSTER`; String(player.id) coercion for Firestore key lookup; 527-line implementation |
| 6 | Column headers are tappable to sort ascending/descending; default sort is by total stat events descending | VERIFIED | Player `<th>` at line 379-384 now has `onClick={() => handleSort("player")}` and `sortIndicator("player")`; sort logic at lines 169-172 uses `localeCompare` for player name; all other column headers (GP, MIN, stat cols, Total) also wired |
| 7 | Only stat columns with non-zero data appear (dynamic columns) | VERIFIED | `src/tabs/StatsTab.jsx` lines 110-123: scans all player data for non-zero values, filters through `STAT_ORDER` |
| 8 | Tapping a player row expands an accordion showing game-by-game breakdown with opponent, date, minutes, and stats | VERIFIED | `src/tabs/StatsTab.jsx` handleRowTap + accordion render; lazy-loads via `listGames()` |
| 9 | Tapping a game row in the accordion navigates to /games/:id/summary | VERIFIED | `src/tabs/StatsTab.jsx`: `onClick={() => navigate('/games/${game.id}/summary')}` |
| 10 | Season selector dropdown at top defaults to current season and shows past seasons if they exist | VERIFIED | `src/tabs/StatsTab.jsx`: `defaultSeason` from `getSeasonId(new Date().toISOString())`; merges Firestore seasons with current |
| 11 | Finalizing a game pushes per-player stat deltas to the seasonStats Firestore doc | VERIFIED | `src/games/LiveGameScreen.jsx` lines 547-555: fire-and-forget loop over `computeSeasonDeltas` output calling `updateSeasonStats` |
| 12 | Empty state shows 'No season stats yet' message before any games are finalized | VERIFIED | `src/tabs/StatsTab.jsx`: renders message when `seasonData` is null |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/shared/seasonUtils.js` | Pure functions: getSeasonId, computeSeasonDeltas | VERIFIED | 77 lines; both functions exported |
| `src/tests/seasonUtils.test.js` | Unit tests for season utilities | VERIFIED | 176 lines; 17 tests across 2 describe blocks; all pass |
| `src/firebase.js` | loadSeasonStats, listSeasons read functions | VERIFIED | Both functions present with silent-catch error handling |
| `src/tabs/StatsTab.jsx` | Full season dashboard with sortable table and accordion | VERIFIED | 527 lines; complete implementation including Player column sort fix |
| `src/games/LiveGameScreen.jsx` | handleEndGame calls computeSeasonDeltas + updateSeasonStats | VERIFIED | Fire-and-forget pattern; uses closedPlayerIntervals/closedHalfIntervals |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/shared/seasonUtils.js` | `src/shared/utils.js` | `import calcMinutes` | VERIFIED | Line 1: `import { calcMinutes } from "./utils"` |
| `src/tests/seasonUtils.test.js` | `src/shared/seasonUtils.js` | `import getSeasonId, computeSeasonDeltas` | VERIFIED | Line 2: `import { getSeasonId, computeSeasonDeltas } from "../shared/seasonUtils"` |
| `src/tabs/StatsTab.jsx` | `src/firebase.js` | `import loadSeasonStats, listSeasons, listGames` | VERIFIED | Line 6: `import { loadSeasonStats, listSeasons, listGames } from "../firebase"` |
| `src/tabs/StatsTab.jsx` | `src/shared/seasonUtils.js` | `import getSeasonId` | VERIFIED | Line 4: `import { getSeasonId } from "../shared/seasonUtils"` |
| `src/tabs/StatsTab.jsx` | `src/shared/constants.js` | `import INITIAL_ROSTER, STAT_LABELS, C, fontBase` | VERIFIED | Line 3: all four imported and used throughout |
| `src/tabs/StatsTab.jsx` | `src/shared/summaryUtils.js` | `import buildSummaryRows, STAT_ORDER` | VERIFIED | Line 5: both imported; STAT_ORDER exported from summaryUtils.js |
| `src/games/LiveGameScreen.jsx` | `src/shared/seasonUtils.js` | `import getSeasonId, computeSeasonDeltas` | VERIFIED | Line 4: both imported and called in handleEndGame |
| `src/games/LiveGameScreen.jsx` | `src/firebase.js` | `import updateSeasonStats` | VERIFIED | Line 3: included in existing firebase import destructure |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SEASON-01 | 07-01, 07-02 | Season dashboard shows running tallies across all completed games | SATISFIED | StatsTab.jsx renders season totals from Firestore seasonStats; getSeasonId, loadSeasonStats, listSeasons all implemented |
| SEASON-02 | 07-02 | Player profiles show individual season stats when a player is selected | SATISFIED | Accordion in StatsTab.jsx lazy-loads per-game breakdown per player using buildSummaryRows; drill-down navigates to /games/:id/summary |
| SEASON-03 | 07-01, 07-03 | Game data is pushed to season totals when a game is finalized | SATISFIED | handleEndGame in LiveGameScreen.jsx calls computeSeasonDeltas + updateSeasonStats fire-and-forget after finalizeGame completes |

No orphaned requirements — all three phase-7 requirements (SEASON-01, SEASON-02, SEASON-03) are claimed in plans and have implementation evidence. REQUIREMENTS.md traceability table marks all three as Complete under Phase 7.

---

### Anti-Patterns Found

No anti-patterns found. No TODOs, FIXMEs, empty implementations, or placeholder returns in any phase-7 files. The previously flagged warning (Player column missing onClick) has been resolved.

---

### Human Verification Required

#### 1. End-to-End Season Stats Flow

**Test:** Finalize a game in the app. Then navigate to the Stats tab.
**Expected:** Players who participated in the game appear with correct GP count (1), correct minutes, and correct stat totals reflecting that game.
**Why human:** Requires a real Firestore write/read round-trip. Static analysis confirms the write path exists but cannot verify Firestore atomics behave correctly or that the read path returns the right shape.

#### 2. Accordion Game-Row Navigation

**Test:** Expand a player accordion in the Stats tab. Tap a game row.
**Expected:** App navigates to /games/:id/summary showing the correct game's post-game summary.
**Why human:** useNavigate routing requires browser execution to verify.

#### 3. Mobile Viewport Usability

**Test:** Open Stats tab on a mobile viewport (375px wide). Scroll the table horizontally. Tap a player row to expand.
**Expected:** Table is usable — horizontal scroll works, expanded accordion is readable, tap targets register correctly.
**Why human:** Visual layout and touch interaction cannot be verified by static analysis.

---

### Re-Verification Summary

**Gap closed:** The Player column header in StatsTab.jsx previously had no `onClick` handler and no sort case in `tableRows.sort`. This was the sole gap from the initial verification (score 11/12).

The fix is confirmed at:
- Line 379-384: `<th style={sortKey === "player" ? thActiveStyle : thBaseStyle} onClick={() => handleSort("player")}>Player{sortIndicator("player")}</th>`
- Lines 169-172: `if (sortKey === "player") { av = a.player.name; bv = b.player.name; return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av); }`

No regressions: all 64 tests pass (3 test files, 8 todos, 2 skipped files unchanged).

All 12 truths now verified. Phase goal is fully achieved in code. Three human verification items remain for runtime/visual confirmation.

---

_Verified: 2026-03-16T23:49:00Z_
_Verifier: Claude (gsd-verifier)_
