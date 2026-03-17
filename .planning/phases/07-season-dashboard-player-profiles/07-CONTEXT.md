# Phase 7: Season Dashboard + Player Profiles - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

The Stats tab becomes a season dashboard showing every player's running tallies (minutes, goals, assists, and all tracked stats) aggregated across completed games. Tapping a player expands their row to show a game-by-game breakdown. Finalizing a game automatically pushes stats to season totals. Season is split into spring and fall periods.

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout & sorting
- Default sort: by total stat events (most active contributors at top)
- Column headers are tappable to re-sort (tap toggles asc/desc)
- Dynamic columns: only stats that have data across the season appear (no empty columns) — same approach as Phase 6 summary table
- First columns: GP (games played), Minutes, then stat columns
- All rostered players shown, including those with 0 stats — coach wants to see who hasn't played

### Player profile drill-down
- Tap a player's row to expand it in-place (accordion-style) — no separate route
- Expanded view shows game-by-game stat rows: one row per game with opponent, date, minutes, and stats recorded
- Dynamic columns in expanded view too — only stats with data for that player
- Player identified as "#2 Alex Rodarte" format (jersey number prefix + full name)
- Each game row is tappable — navigates to /games/:id/summary for the full box score
- Collapse by tapping the row again

### Season totals trigger
- Season stats update on game finalize only — when handleEndGame completes, loop through player stats and call updateSeasonStats
- Dashboard reads from the denormalized seasonStats Firestore doc (single read, fast)
- No manual recalc button — finalize is the single source of truth

### Season definition
- Two seasons per year: Spring (Jan–Jun) and Fall (Jul–Dec)
- Season determined from game date month: months 1-6 = "spring-YYYY", months 7-12 = "fall-YYYY"
- Firestore doc IDs: "spring-2026", "fall-2026", etc.
- Current season: Spring 2026
- Dashboard shows a season selector dropdown at the top, defaulting to current season
- Past seasons available in dropdown if data exists

### Empty & edge states
- Before any games finalized: friendly message "No season stats yet — finalize a game to start tracking"
- Players with 0 stats still appear in dashboard once games exist (shows who's been left out)
- Mid-season roster additions appear immediately with 0s across the board
- Expanded profile for a player with 0 games: show message like "No games played yet"

### Claude's Discretion
- Table styling (cell padding, borders, font sizes, responsive behavior)
- Accordion expand/collapse animation
- Season selector dropdown styling
- Sort indicator icons on column headers
- How to handle the game-by-game rows on very small screens (horizontal scroll vs. abbreviated columns)
- Loading state while fetching seasonStats doc

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `updateSeasonStats` (src/firebase.js): Already built — uses dotted-path merge with increment() for atomic updates to seasonStats/{season} doc
- `abbreviateName` (src/shared/utils.js): Player name abbreviation — reuse in dashboard table
- `calcMinutes` (src/shared/utils.js): Interval intersection math for per-player minutes
- `buildSummaryRows` (src/shared/summaryUtils.js): Builds player × stat rows from a game doc — can inform per-game rows in player profile
- `STAT_LABELS`, `STAT_COLORS`, `C` (src/shared/constants.js): Display labels, color coding, brand colors
- `fontBase`, `fontDisplay` (src/shared/constants.js): Consistent typography
- `INITIAL_ROSTER` (src/shared/constants.js): Full roster with id, name, num — source for "show all players"

### Established Patterns
- Inline styles with conditional ternaries for responsive design
- HashRouter with route params (useParams)
- Fire-and-forget Firestore writes with silent error handling
- Dynamic columns (Phase 6 summary: only show stats that have data)
- Flat list sorted by a metric, not grouped by position (Phase 6 pattern)

### Integration Points
- `StatsTab.jsx`: Currently a stub ("Season stats coming soon") — replace entirely
- `App.jsx`: StatsTab route already wired at /stats — no routing changes needed
- `LiveGameScreen.jsx`: handleEndGame needs to call updateSeasonStats after finalizeGame succeeds
- `firebase.js`: Needs a `loadSeasonStats(season)` read function (updateSeasonStats write already exists)
- `firebase.js`: May need a `listSeasons()` or similar to populate the season dropdown

</code_context>

<specifics>
## Specific Ideas

- Coach uses the season dashboard to check equal playing time across the roster — seeing 0-minute players is a feature, not a bug
- Spring/Fall season split reflects real Madeira FC schedule — they play spring and fall recreational league seasons
- "Interception" stat may be removed in a future update (noted in Phase 6) — dynamic columns handle this gracefully

</specifics>

<deferred>
## Deferred Ideas

- Manual recalc/rebuild button for season stats — not needed now but could be useful if data drifts
- Player comparison view (side-by-side two players) — separate feature
- Season awards/highlights (MVP, most improved) — separate feature

</deferred>

---

*Phase: 07-season-dashboard-player-profiles*
*Context gathered: 2026-03-16*
