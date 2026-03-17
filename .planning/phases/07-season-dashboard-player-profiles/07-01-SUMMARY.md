---
phase: 07-season-dashboard-player-profiles
plan: "01"
subsystem: database
tags: [vitest, firestore, season-stats, tdd, pure-functions]

# Dependency graph
requires:
  - phase: 05-live-game
    provides: calcMinutes from utils.js, playerIntervals/halfIntervals shape
  - phase: 06-post-game-summary
    provides: finalizeGame, updateSeasonStats write function in firebase.js

provides:
  - getSeasonId pure function: maps any date string to "spring-YYYY" or "fall-YYYY"
  - computeSeasonDeltas pure function: produces per-player stat increments from a finalized game
  - loadSeasonStats Firestore reader: loads a single seasonStats doc by season ID
  - listSeasons Firestore reader: returns all season IDs sorted reverse-chronologically

affects:
  - 07-02 (StatsTab UI)
  - 07-03 (handleEndGame wiring)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD with vitest: RED (stubs fail) -> GREEN (implement) -> verify
    - UTC-safe date parsing via toISOString() for year/month extraction
    - computeSeasonDeltas filters by game.lineup.roster to exclude non-roster stat events

key-files:
  created:
    - src/shared/seasonUtils.js
    - src/tests/seasonUtils.test.js
  modified:
    - src/firebase.js

key-decisions:
  - "Use toISOString() for UTC-safe year/month parsing — avoids local timezone offset shifting date-only strings (e.g. 2026-01-01 parses as Dec 31 2025 in UTC-5)"
  - "computeSeasonDeltas excludes players with 0 minutes AND 0 stats — only roster players are processed"
  - "loadSeasonStats and listSeasons use silent catch returning null/[] consistent with existing firebase.js pattern"
  - "updateSeasonStats JSDoc updated to reflect Season ID format (e.g. spring-2026) instead of year-only"

patterns-established:
  - "UTC-safe date parsing: always use toISOString().slice() for year/month, never getFullYear()/getMonth() on date-only strings"
  - "Season ID format: {period}-{year} where period is 'spring' (Jan-Jun) or 'fall' (Jul-Dec)"

requirements-completed: [SEASON-01, SEASON-03]

# Metrics
duration: 12min
completed: 2026-03-16
---

# Phase 7 Plan 01: Season Utility Functions Summary

**Pure season utilities and Firestore reads: getSeasonId, computeSeasonDeltas, loadSeasonStats, listSeasons — TDD verified with 17 tests**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-16T23:08:00Z
- **Completed:** 2026-03-16T23:20:00Z
- **Tasks:** 1 feature (4 implementation steps across RED/GREEN/Firebase)
- **Files modified:** 3

## Accomplishments

- getSeasonId correctly maps any date string to "spring-YYYY" or "fall-YYYY", handles nulls, invalid dates, ISO timestamps
- computeSeasonDeltas produces correct per-player stat increments from a finalized game, skips zero-contribution players
- loadSeasonStats and listSeasons added to firebase.js with silent-catch error handling consistent with existing patterns
- All 64 tests pass (17 new + 47 pre-existing)

## Task Commits

Each task was committed atomically:

1. **RED phase: failing tests + stubs** - `e4439bb` (test)
2. **GREEN phase: implement season utilities** - `e6fe35d` (feat)
3. **Firebase additions: loadSeasonStats + listSeasons** - `eb17a5c` (feat)

_TDD tasks have multiple commits (test → feat)_

## Files Created/Modified

- `src/shared/seasonUtils.js` - getSeasonId and computeSeasonDeltas pure functions
- `src/tests/seasonUtils.test.js` - 17 unit tests covering all behaviors
- `src/firebase.js` - Added loadSeasonStats, listSeasons; updated updateSeasonStats JSDoc

## Decisions Made

- Use `toISOString()` for UTC-safe year/month parsing — `new Date("2026-01-01")` parses as UTC midnight which in negative UTC offset timezones returns Dec 31 2025 via `getFullYear()`. Extracting from `toISOString().slice()` avoids this.
- computeSeasonDeltas iterates `game.lineup.roster` (not events) to ensure only roster players appear in output, even if events reference phantom IDs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed UTC timezone shift in getSeasonId date parsing**
- **Found during:** GREEN phase verification (tests for Jan-Jun and Jul-Dec boundaries)
- **Issue:** `new Date("2026-01-01").getFullYear()` returned 2025 and `getMonth()` returned 11 (December) in UTC-5 timezone because date-only strings parse as UTC midnight
- **Fix:** Changed to use `d.toISOString().slice(0, 4)` and `.slice(5, 7)` for timezone-safe year/month extraction
- **Files modified:** src/shared/seasonUtils.js
- **Verification:** All 17 tests pass including boundary dates (Jan 1, Jun 30, Jul 1, Dec 25)
- **Committed in:** e6fe35d (GREEN phase commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Essential correctness fix. No scope creep.

## Issues Encountered

- Date-only ISO strings parsed as UTC midnight, causing month/year extraction errors in negative UTC offset timezones. Resolved by parsing from toISOString() rather than local date methods.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- getSeasonId, computeSeasonDeltas, loadSeasonStats, listSeasons are all ready for consumption
- Plan 07-02 (StatsTab UI) can import from seasonUtils.js and firebase.js immediately
- Plan 07-03 (handleEndGame wiring) has all utilities needed to aggregate season stats on game finalization

---
*Phase: 07-season-dashboard-player-profiles*
*Completed: 2026-03-16*
