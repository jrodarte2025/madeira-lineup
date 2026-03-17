# Phase 7: Season Dashboard + Player Profiles - Research

**Researched:** 2026-03-16
**Domain:** React data aggregation, Firestore reads, sortable tables, accordion UI
**Confidence:** HIGH

## Summary

Phase 7 is a pure UI + Firestore wiring phase. No new dependencies are needed. The `updateSeasonStats` Firestore write function already exists in `firebase.js`. The main work is: (1) adding a `loadSeasonStats` read function, (2) wiring `handleEndGame` in `LiveGameScreen.jsx` to call `updateSeasonStats` after `finalizeGame` succeeds, and (3) replacing the `StatsTab.jsx` stub with the full season dashboard component.

The season dashboard design is an inline-expanded accordion table — a well-understood React pattern using a single `expandedPlayerId` state string. Firestore's `seasonStats` collection stores denormalized player totals keyed by season ID (e.g., `"spring-2026"`), making the read a single `getDoc` with no aggregation query needed. Season IDs are deterministic from a game's date field, enabling the season selector dropdown without a separate index query.

The existing codebase provides nearly everything needed: `INITIAL_ROSTER` for the full player list, `STAT_LABELS`/`STAT_COLORS`/`STAT_ORDER` for display, `abbreviateName` for name formatting, `buildSummaryRows`/`loadGame` for the per-game drill-down rows, and the `tableStyle`/`thStyle`/`tdStyle` inline style patterns established in `GameSummaryScreen.jsx`. This is the final phase of v2.0 and should feel like a natural continuation of existing patterns.

**Primary recommendation:** Three focused work units — (1) firebase.js additions, (2) handleEndGame wiring, (3) StatsTab full replacement.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dashboard layout & sorting**
- Default sort: by total stat events (most active contributors at top)
- Column headers are tappable to re-sort (tap toggles asc/desc)
- Dynamic columns: only stats that have data across the season appear (no empty columns) — same approach as Phase 6 summary table
- First columns: GP (games played), Minutes, then stat columns
- All rostered players shown, including those with 0 stats — coach wants to see who hasn't played

**Player profile drill-down**
- Tap a player's row to expand it in-place (accordion-style) — no separate route
- Expanded view shows game-by-game stat rows: one row per game with opponent, date, minutes, and stats recorded
- Dynamic columns in expanded view too — only stats with data for that player
- Player identified as "#2 Alex Rodarte" format (jersey number prefix + full name)
- Each game row is tappable — navigates to /games/:id/summary for the full box score
- Collapse by tapping the row again

**Season totals trigger**
- Season stats update on game finalize only — when handleEndGame completes, loop through player stats and call updateSeasonStats
- Dashboard reads from the denormalized seasonStats Firestore doc (single read, fast)
- No manual recalc button — finalize is the single source of truth

**Season definition**
- Two seasons per year: Spring (Jan–Jun) and Fall (Jul–Dec)
- Season determined from game date month: months 1-6 = "spring-YYYY", months 7-12 = "fall-YYYY"
- Firestore doc IDs: "spring-2026", "fall-2026", etc.
- Current season: Spring 2026
- Dashboard shows a season selector dropdown at the top, defaulting to current season
- Past seasons available in dropdown if data exists

**Empty & edge states**
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

### Deferred Ideas (OUT OF SCOPE)
- Manual recalc/rebuild button for season stats — not needed now but could be useful if data drifts
- Player comparison view (side-by-side two players) — separate feature
- Season awards/highlights (MVP, most improved) — separate feature
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEASON-01 | Season dashboard shows running tallies (minutes, goals, assists, etc.) across all completed games | StatsTab.jsx replacement reads from `seasonStats/{season}` Firestore doc; aggregated player totals rendered as sortable table using INITIAL_ROSTER + STAT_LABELS |
| SEASON-02 | Player profiles show individual season stats when a player is selected | Accordion expand on row tap; per-player game rows built from `listGames()` filtered to completed + correct season, or embedded in seasonStats doc |
| SEASON-03 | Game data is pushed to season totals when a game is finalized | `handleEndGame` in LiveGameScreen.jsx calls `updateSeasonStats` (already exists) after `finalizeGame` succeeds; computes season key from game.date |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | ^19.2.4 | Component rendering, state | Already in project |
| firebase/firestore | ^12.10.0 | Firestore reads (getDoc, getDocs, query) | Already in project — `updateSeasonStats` write already uses setDoc+merge+increment |
| react-router | ^7.13.1 | `useNavigate` for game-row tap navigation | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^4.1.0 | Unit testing pure functions | Test `getSeasonId`, `computeSeasonDeltas` pure functions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single `getDoc` for seasonStats | `onSnapshot` listener | Real-time would re-render on any finalize; overkill for a dashboard the coach navigates to after a game — single read is correct |
| INITIAL_ROSTER as source for all-players display | Firestore roster doc | INITIAL_ROSTER is the established pattern; no roster doc exists |
| Per-game row data from `listGames()` | Embedding game refs in seasonStats doc | listGames already exists and returns full game data; no schema change needed |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended File Additions/Changes
```
src/
├── firebase.js              # ADD: loadSeasonStats(season), listSeasons()
├── shared/
│   └── seasonUtils.js       # NEW: getSeasonId(dateStr), computeSeasonDeltas(game)
├── tabs/
│   └── StatsTab.jsx         # REPLACE: full season dashboard implementation
└── games/
    └── LiveGameScreen.jsx   # MODIFY: handleEndGame calls updateSeasonStats
```

### Pattern 1: Season ID Derivation (Pure Function)
**What:** Deterministic string key from a game date string
**When to use:** In handleEndGame (to call updateSeasonStats) and in StatsTab (to default the selector)

```javascript
// src/shared/seasonUtils.js
export function getSeasonId(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  const period = month <= 6 ? "spring" : "fall";
  return `${period}-${year}`;
}

// e.g. "2026-03-16" -> "spring-2026"
// e.g. "2026-09-05" -> "fall-2026"
```

### Pattern 2: Season Deltas Computation (Pure Function)
**What:** Compute per-player stat deltas from a finalized game, ready to pass to updateSeasonStats
**When to use:** Called inside handleEndGame after finalizeGame succeeds

```javascript
// src/shared/seasonUtils.js
// game: full game doc with events, playerIntervals, halfIntervals, lineup.roster
// closedPlayerIntervals: computed inline in handleEndGame before setState
// closedHalfIntervals: same
export function computeSeasonDeltas(game, closedPlayerIntervals, closedHalfIntervals) {
  const { events = [], lineup = {} } = game;
  const roster = lineup.roster || [];

  // Count stat events per player
  const statCountsById = {};
  for (const evt of events) {
    if (evt.type !== "stat") continue;
    if (!statCountsById[evt.playerId]) statCountsById[evt.playerId] = {};
    statCountsById[evt.playerId][evt.stat] =
      (statCountsById[evt.playerId][evt.stat] || 0) + 1;
  }

  // Build delta map: { playerId: { minutes, gamesPlayed, ...statCounts } }
  const deltas = {};
  for (const player of roster) {
    const intervals = closedPlayerIntervals[player.id] || [];
    const mins = calcMinutes(intervals, closedHalfIntervals);
    const stats = statCountsById[player.id] || {};

    // Only write a delta if the player had minutes or stats
    if (mins === 0 && Object.keys(stats).length === 0) continue;

    deltas[player.id] = {
      minutes: mins,
      gamesPlayed: 1,
      ...stats,
    };
  }
  return deltas;
}
```

### Pattern 3: loadSeasonStats (Firestore Read)
**What:** Single getDoc for the denormalized season stats document
**When to use:** StatsTab mount, and on season selector change

```javascript
// src/firebase.js
export async function loadSeasonStats(season) {
  try {
    const snap = await getDoc(doc(db, "seasonStats", String(season)));
    if (snap.exists()) return snap.data(); // { players: { [id]: { minutes, gamesPlayed, ...stats } } }
    return null;
  } catch (err) {
    console.warn("Failed to load season stats:", err);
    return null;
  }
}
```

### Pattern 4: listSeasons (Season Selector Dropdown)
**What:** Fetch all docs from seasonStats collection to populate the dropdown
**When to use:** StatsTab mount (parallel to loadSeasonStats for current season)

```javascript
// src/firebase.js
const seasonStatsCol = collection(db, "seasonStats");

export async function listSeasons() {
  try {
    const snap = await getDocs(seasonStatsCol);
    return snap.docs.map((d) => d.id).sort().reverse(); // ["spring-2026", "fall-2025", ...]
  } catch (err) {
    console.warn("Failed to list seasons:", err);
    return [];
  }
}
```

### Pattern 5: StatsTab — Sortable Dashboard Table
**What:** Full season dashboard with sortable columns and accordion expand
**Key state:**
- `seasonData` — raw Firestore doc (`{ players: { ... } }`)
- `seasons` — list of season IDs for dropdown
- `currentSeason` — active season string (default: current via `getSeasonId(new Date().toISOString())`)
- `sortKey` — `"totalEvents"` | `"minutes"` | `"gamesPlayed"` | stat key
- `sortAsc` — boolean
- `expandedPlayerId` — string | null
- `gamesByPlayer` — `{ [playerId]: gameDoc[] }` loaded lazily on first expand

**Table structure:**
- Header row: Player | GP | Min | [dynamic stat cols] — each header tap toggles sort
- Data rows: one per INITIAL_ROSTER player — tap toggles accordion
- Expanded sub-rows: game-by-game breakdown for that player — tap navigates to /games/:id/summary

### Pattern 6: handleEndGame Wiring
**What:** After finalizeGame, loop roster and call updateSeasonStats for each player with stats
**Critical:** Use `closedPlayerIntervals` and `closedHalfIntervals` (already computed inline before setState)

```javascript
// In LiveGameScreen.jsx handleEndGame, AFTER the finalizeGame call:
const seasonId = getSeasonId(game.date);
if (seasonId) {
  const deltas = computeSeasonDeltas(game, closedPlayerIntervals, closedHalfIntervals);
  for (const [playerId, statDeltas] of Object.entries(deltas)) {
    updateSeasonStats(seasonId, playerId, statDeltas); // fire-and-forget
  }
}
```

### Pattern 7: Lazy Game Loading for Accordion
**What:** Only load completed games when coach taps a player row for the first time
**Why:** Avoids loading all game docs on tab mount; most coaches won't drill every player

```javascript
// On first expand of a playerId:
const games = await listGames(); // already returns all games desc
const seasonGames = games.filter(g =>
  g.status === "completed" && getSeasonId(g.date) === currentSeason
);
// Then build per-player rows from seasonGames using buildSummaryRows
setGamesByPlayer({ ...gamesByPlayer, [playerId]: seasonGames });
```

Note: `listGames` returns all games. For a typical recreational season (10-20 games), this is fine — no pagination needed.

### Anti-Patterns to Avoid
- **Don't re-read seasonStats on every re-render:** Load once on mount and on season change. The dashboard is read-only — no live listener needed.
- **Don't compute season deltas from `playerIntervals` state:** Use `closedPlayerIntervals` computed inline — same pattern established in Phase 6-01.
- **Don't show empty stat columns:** Derive `activeCols` by scanning all players in `seasonData.players` for non-zero values — same dynamic column pattern as Phase 6.
- **Don't add a separate route for player profiles:** Accordion in-place is the locked decision.
- **Don't skip players with 0 everything:** `INITIAL_ROSTER` provides the full player list; missing players from Firestore show as zeros.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Player name display | Custom name format logic | `abbreviateName` from utils.js | Already established, tested |
| Minutes per game | Custom interval math | `calcMinutes` from utils.js | Tested, handles all edge cases |
| Per-game stat rows | Custom aggregation | `buildSummaryRows` from summaryUtils.js | Already built and tested for Phase 6 |
| Stat column ordering | Custom sort | `STAT_ORDER` from summaryUtils.js | Already defined, ensures consistent ordering |
| Stat display labels | Custom label map | `STAT_LABELS` from constants.js | Single source of truth |
| Season ID logic | Inline date math | `getSeasonId` pure function (NEW, but extracted) | Testable, reused in two places (write + read) |

**Key insight:** Nearly all data transformation logic for this phase is already written. The work is wiring — connecting existing pieces, not building new algorithms.

---

## Common Pitfalls

### Pitfall 1: updateSeasonStats Called with Wrong Season Key
**What goes wrong:** Stats written to wrong season doc (e.g., writing to `"2026"` instead of `"spring-2026"`)
**Why it happens:** The existing `updateSeasonStats` signature takes a `season` param typed as `string|number`. The old function comment says "Year string, e.g. '2026'" — but the locked decision is `"spring-2026"` / `"fall-2026"` format.
**How to avoid:** The `getSeasonId` utility must produce the correct format. Write a unit test for it. Pass the result directly to `updateSeasonStats`.
**Warning signs:** Season selector dropdown shows no data; Firestore has a `"2026"` doc instead of `"spring-2026"`.

### Pitfall 2: Firestore seasonStats Players Object Has String Keys, INITIAL_ROSTER Has Number IDs
**What goes wrong:** `seasonData.players["1"]` vs `INITIAL_ROSTER[0].id = 1` — type mismatch causes lookups to return undefined
**Why it happens:** Firestore object keys are always strings. INITIAL_ROSTER uses integer IDs. When `updateSeasonStats` writes `players.${playerId}.minutes`, the playerId becomes a string key in Firestore.
**How to avoid:** Always coerce when reading: `seasonData.players?.[String(player.id)]`
**Warning signs:** All players show 0 minutes even after a game is finalized.

### Pitfall 3: Accordion Expand Triggers Game Load Every Time
**What goes wrong:** Each tap on a player row re-fetches all games from Firestore
**Why it happens:** If `gamesByPlayer` check is missing, game load runs every expand
**How to avoid:** Check `if (!gamesByPlayer[playerId])` before calling `listGames`
**Warning signs:** Noticeable loading delay each time you tap a row

### Pitfall 4: computeSeasonDeltas Called with Un-closed Intervals
**What goes wrong:** Player minutes computed as 0 or wrong because `outAt: null` on last interval
**Why it happens:** If using `playerIntervals` React state instead of `closedPlayerIntervals` computed inline
**How to avoid:** Pass `closedPlayerIntervals` and `closedHalfIntervals` to `computeSeasonDeltas` — these are the same values already passed to `finalizeGame` in `handleEndGame`
**Warning signs:** All players show 0 minutes in season stats

### Pitfall 5: Season Selector Shows No Past Seasons
**What goes wrong:** Dropdown only shows current season even if past season docs exist
**Why it happens:** `listSeasons()` not called, or result not merged with current season
**How to avoid:** Always include current season in dropdown even if not yet in Firestore (it may have 0 docs). Merge: `[currentSeason, ...fetchedSeasons.filter(s => s !== currentSeason)]`
**Warning signs:** No dropdown at all, or dropdown missing seasons with data

### Pitfall 6: Sort State Not Controlled Per Column (Toggle Logic)
**What goes wrong:** Tapping a column header that's already selected should toggle asc/desc; tapping a new column should default to desc
**Why it happens:** Simple toggle without checking if it's the active column
**How to avoid:**
```javascript
function handleSort(key) {
  if (sortKey === key) {
    setSortAsc(prev => !prev);
  } else {
    setSortKey(key);
    setSortAsc(false); // new column: highest first (desc)
  }
}
```

---

## Code Examples

### Season ID Utility (Pure)
```javascript
// src/shared/seasonUtils.js
export function getSeasonId(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const period = (d.getMonth() + 1) <= 6 ? "spring" : "fall";
  return `${period}-${year}`;
}
```

### Season Dashboard — Active Columns Derivation
```javascript
// Only show stat columns that have at least one non-zero value across all players
const allPlayers = Object.values(seasonData?.players || {});
const seenStats = new Set();
for (const p of allPlayers) {
  for (const [key, val] of Object.entries(p)) {
    if (!["minutes", "gamesPlayed"].includes(key) && val > 0) {
      seenStats.add(key);
    }
  }
}
const activeCols = STAT_ORDER.filter(s => seenStats.has(s));
// Add any unseen stats not in STAT_ORDER
for (const s of seenStats) {
  if (!activeCols.includes(s)) activeCols.push(s);
}
```

### Season Dashboard — Row Sorting
```javascript
// Build rows from INITIAL_ROSTER (ensures all players appear even with 0 data)
const rows = INITIAL_ROSTER.map(player => {
  const stats = seasonData?.players?.[String(player.id)] || {};
  const totalEvents = activeCols.reduce((sum, col) => sum + (stats[col] || 0), 0);
  return { player, stats, totalEvents };
});

// Sort
rows.sort((a, b) => {
  let av, bv;
  if (sortKey === "totalEvents") { av = a.totalEvents; bv = b.totalEvents; }
  else if (sortKey === "minutes") { av = a.stats.minutes || 0; bv = b.stats.minutes || 0; }
  else if (sortKey === "gamesPlayed") { av = a.stats.gamesPlayed || 0; bv = b.stats.gamesPlayed || 0; }
  else { av = a.stats[sortKey] || 0; bv = b.stats[sortKey] || 0; }
  return sortAsc ? av - bv : bv - av;
});
```

### Player Row Accordion Tap Handler
```javascript
async function handleRowTap(playerId) {
  if (expandedPlayerId === playerId) {
    setExpandedPlayerId(null);
    return;
  }
  setExpandedPlayerId(playerId);

  // Lazy load games for this player if not already loaded
  if (!gamesByPlayer[playerId]) {
    const allGames = await listGames();
    const seasonGames = allGames.filter(g =>
      g.status === "completed" && getSeasonId(g.date) === currentSeason
    );
    setGamesByPlayer(prev => ({ ...prev, [playerId]: seasonGames }));
  }
}
```

### handleEndGame Addition (LiveGameScreen.jsx)
```javascript
// After: await finalizeGame(gameId, { playerIntervals: closedPlayerIntervals, halfIntervals: closedHalfIntervals });
// Add: (fire-and-forget, no await needed)
const seasonId = getSeasonId(game.date);
if (seasonId) {
  const deltas = computeSeasonDeltas(
    { ...game, events },
    closedPlayerIntervals,
    closedHalfIntervals
  );
  for (const [pid, statDeltas] of Object.entries(deltas)) {
    updateSeasonStats(seasonId, pid, statDeltas);
  }
}
```

Note: `game` in LiveGameScreen is the loaded Firestore doc; `events` is the React state array. Use `events` (React state) not `game.events` since events are appended incrementally to state.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| StatsTab stub | Full dashboard | Phase 7 | Activates the Stats tab |
| updateSeasonStats write exists but not called | Called from handleEndGame | Phase 7 | Completes the data pipeline |
| No season read function | loadSeasonStats added to firebase.js | Phase 7 | Enables dashboard rendering |

**Deprecated/outdated:**
- The `updateSeasonStats` JSDoc comment says "Year string, e.g. '2026'" — this is now out of date. The correct format is `"spring-2026"` / `"fall-2026"`. The function itself doesn't care (it just uses the string as a doc ID), but the comment should be updated.

---

## Open Questions

1. **Where do per-game rows in the accordion come from?**
   - What we know: `listGames()` returns all completed games with full game docs including events, playerIntervals, halfIntervals
   - What's unclear: Whether to call `buildSummaryRows` on each game doc to extract per-player minutes and stats for the drill-down, or to read from the seasonStats doc which only has totals
   - Recommendation: Use `listGames()` filtered to the current season, then extract per-player minutes/stats from each game doc using `buildSummaryRows`. This reuses existing tested code and avoids adding per-game data to the seasonStats schema.

2. **game.date availability in handleEndGame**
   - What we know: `game` state is loaded from Firestore on LiveGameScreen mount and contains a `date` field
   - What's unclear: Whether `game` state is still fully populated at the point `handleEndGame` runs (it's a callback referencing outer state)
   - Recommendation: Access `game.date` directly — `game` is loaded once on mount and never cleared before navigation. The `handleEndGame` closure captures it via the outer component scope.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.1.0 |
| Config file | none — vite.config.js used (zero-config) |
| Quick run command | `npx vitest run src/tests/seasonUtils.test.js` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEASON-01 | Season dashboard renders all INITIAL_ROSTER players | unit (pure) | `npx vitest run src/tests/seasonUtils.test.js` | ❌ Wave 0 |
| SEASON-01 | activeCols derived correctly from season data | unit (pure) | `npx vitest run src/tests/seasonUtils.test.js` | ❌ Wave 0 |
| SEASON-01 | Sort by totalEvents descending (default) | unit (pure) | `npx vitest run src/tests/seasonUtils.test.js` | ❌ Wave 0 |
| SEASON-02 | Accordion per-game rows show correct minutes and stats | unit (pure) | `npx vitest run src/tests/seasonUtils.test.js` | ❌ Wave 0 |
| SEASON-03 | computeSeasonDeltas produces correct increments | unit (pure) | `npx vitest run src/tests/seasonUtils.test.js` | ❌ Wave 0 |
| SEASON-03 | getSeasonId returns correct spring/fall keys | unit (pure) | `npx vitest run src/tests/seasonUtils.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/tests/seasonUtils.test.js`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/tests/seasonUtils.test.js` — covers getSeasonId (SEASON-03), computeSeasonDeltas (SEASON-03), row sort logic (SEASON-01), activeCols derivation (SEASON-01), per-player game row extraction (SEASON-02)
- [ ] `src/shared/seasonUtils.js` — pure functions extracted here are what the tests will import

*(Existing test infrastructure: vitest installed, 4 test files passing. No framework install needed.)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read — `src/firebase.js`, `src/shared/constants.js`, `src/shared/utils.js`, `src/shared/summaryUtils.js`, `src/games/LiveGameScreen.jsx`, `src/games/GameSummaryScreen.jsx`, `src/App.jsx`, `src/tabs/StatsTab.jsx`
- Direct codebase read — `src/tests/summary.test.js`, `src/tests/firebase.test.js` (vitest patterns)
- `.planning/phases/07-season-dashboard-player-profiles/07-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)
- Firestore `setDoc` + `increment` + dotted-path merge pattern — verified from existing `updateSeasonStats` implementation (already shipping in codebase)

### Tertiary (LOW confidence)
- None — all claims verified directly from codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; all libraries already in use
- Architecture: HIGH — all patterns derived from existing codebase + locked decisions in CONTEXT.md
- Pitfalls: HIGH — identified from actual code inspection (string vs number key issue is a real Firestore gotcha visible in the codebase)

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable stack — no external dependencies to go stale)
