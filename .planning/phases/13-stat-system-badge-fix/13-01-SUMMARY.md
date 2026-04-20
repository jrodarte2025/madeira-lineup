---
phase: 13-stat-system-badge-fix
plan: 01
status: complete
completed: 2026-04-20
requirements: [STAT-01, STAT-02, STAT-03, STAT-04]
---

# Plan 13-01 Summary — +Skill stat + whole-game badge totals

## What shipped

- **STAT-01** — `skill` stat key added to `STAT_COLORS` (neutral gray `#6b7280`) and `STAT_LABELS` ("+Skill")
- **STAT-02** — `skill` appended to `POSITION_STATS` for GK, DEF, MID, FWD — appears as a stat button in every position's StatBar
- **STAT-03** — `skill` added to `STAT_ORDER` and `MVP_ABBREV` ("Sk"), so it flows through:
  - Live events feed (`EventsFeed.jsx` reads `STAT_LABELS` with fallback)
  - On-circle badge (`LiveGameScreen.statCounts` counts every `type === "stat"` event)
  - Post-game summary table (`summaryUtils.buildSummaryRows` filters by `type === "stat"`, orders columns by `STAT_ORDER`)
  - Season stats (`seasonUtils.computeSeasonDeltas` filters by `type === "stat"`, spreads `statCountsById[pid]` into the season delta doc)
  - MVP abbreviation string (`formatMVPStats` reads `MVP_ABBREV`)
- **STAT-04** — live-game field-circle stat badge now shows whole-game running totals. Dropped the `e.half === currentHalf` filter in `statCounts`; kept the `events.length` memo dep so counts update live as events are added.

## Architecture note

The central-stat-map pattern means adding a new stat type is a 4-line constants change + 2-line summaryUtils change. Every downstream surface reads these maps dynamically and iterates events filtered only by `type === "stat"`. No per-surface edits were needed for +skill to appear in the summary table, MVP cards, season dashboard, or events feed.

## Key files

- `src/shared/constants.js` — POSITION_STATS (+4 entries), STAT_COLORS (+1), STAT_LABELS (+1)
- `src/shared/summaryUtils.js` — STAT_ORDER (+1), MVP_ABBREV (+1)
- `src/games/LiveGameScreen.jsx` — statCounts memo: drop half filter

## Commits

- `34ee42e` feat(13-01): add +skill stat + fix whole-game badge totals

## Self-Check: PASSED

- `npm run build` → succeeds
- `npx vitest run` → 73 tests pass, 2 skipped, 8 todo (no regressions)
- No ESLint warnings introduced
- Pre-existing stats rendered unchanged

## Human verification

Deferred to end-of-v2.1 review per session instruction.
