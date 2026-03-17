# Phase 6: Post-Game Summary + Exports - Research

**Researched:** 2026-03-16
**Domain:** React summary screen, CSV export, Web Share API, html-to-image, Firestore public reads
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Summary lives at a new route: `/games/:id/summary`
- When coach taps "End Game", auto-navigates to the summary route immediately
- From the Games tab, tapping a completed game navigates directly to `/games/:id/summary`
- Header shows: score (big), opponent name, date — "Madeira FC 3 – 1 Rival FC · Mar 16, 2026"
- Export buttons (CSV, Share Link, Share Image) positioned at the top, below the header, above the table
- Summary table: flat list sorted by minutes played (most to least), all rostered players included (0-minute players shown), columns are only stats actually recorded in the game, team totals row at the bottom, player names abbreviated using `abbreviateName`
- Share card: navy background (#1B2A5B) with orange accents (#E86420) and white text
- Share card content: big score, opponent name, date, then 3 MVPs (top 3 players by total stat events)
- MVP format: player name + key stat highlights (e.g., "Caroline J. — 2G 1A")
- Share card includes "Tap for full box score" note with shareable link URL
- Web Share API on mobile for share actions; clipboard copy fallback on desktop with "Link copied!" toast
- Generated using html-to-image (already approved dependency)
- Public read, no authentication required — same pattern as existing shared lineups
- Firestore security rules allow reads on game documents
- Public view: identical layout to coach's summary but without export buttons — read-only
- TabBar: hidden on `/games/:id/summary` (same regex as live game screen in AppShell)
- Image card shares via Web Share API with image as File; link bundled separately where canShare supports it

### Claude's Discretion

- Exact table styling (cell padding, borders, font sizes, responsive behavior)
- CSV column ordering and file naming convention
- Toast notification styling and duration
- How html-to-image handles the card rendering (DOM element targeting, resolution)
- Whether the summary route shows tab bar or hides it (like the live game screen)
- How "3 MVPs" handles ties or games with fewer than 3 players with stats

### Deferred Ideas (OUT OF SCOPE)

- Removing "interception" from stat types — separate task, not part of Phase 6
- Season totals update on game finalize — Phase 7 (SEASON-03)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| POST-01 | After second half auto-stops, game summary is produced showing players x stats table with totals | Summary screen loads from `loadGame()`, computes stats from events array, renders table. All data already in Firestore game doc. |
| POST-02 | Game summary includes per-player minutes played | `calcMinutes(playerIntervals[pid], halfIntervals)` already works — stored in Firestore via localStorage mirror. Need to persist intervals on game end. |
| POST-03 | CSV export button downloads game stats as a file | Browser `Blob` + `URL.createObjectURL` + anchor click pattern; no library needed. |
| POST-04 | Shareable link allows anyone to view the game summary | `/games/:id/summary` route is public; Firestore rules allow reads; URL-based sharing via Web Share API or clipboard. |
| POST-05 | Image export generates a summary card for sharing in group chats | html-to-image `toPng` / `toBlob` targets an off-screen rendered div; Web Share API with File for mobile, download fallback for desktop. |
</phase_requirements>

---

## Summary

Phase 6 builds a post-game summary screen at `/games/:id/summary` that the coach lands on immediately after ending a game. The screen computes the box score from the already-stored Firestore game document (events array + score + lineup snapshot) and renders a stats table. Three export actions — CSV, Share Link, Share Image — sit above the table.

The summary route reuses all existing infrastructure: `loadGame()` for Firestore reads, `calcMinutes()` for minutes, `abbreviateName()` for player display, and the existing routing/AppShell pattern. The biggest new surface area is html-to-image for the share card and the Web Share API for mobile sharing. Both have known iOS caveats that need to be handled explicitly.

The key data challenge is that `playerIntervals` and `halfIntervals` are currently only in localStorage during an active game. When `handleEndGame` fires, it calls `clearGameStorage()` immediately after `updateGameStatus`. The summary screen needs those intervals to compute minutes — they must be written to Firestore before the storage is cleared, or the summary screen must recover them from localStorage before clearing happens.

**Primary recommendation:** Persist `playerIntervals` and `halfIntervals` to the game Firestore doc on `handleEndGame` before clearing localStorage. The summary screen then reads them from `loadGame()` along with all other game data.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| html-to-image | 1.11.13 (latest) | DOM-to-PNG/Blob conversion for share card | Approved dep; v1.11.12+ has iOS image processing fixes |
| Web Share API | Browser native | Mobile native share sheet | Already used for lineup sharing (`shareLineup` in utils.js) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Browser Blob + anchor trick | Native | CSV download | Zero dependency; standard pattern for file download |
| navigator.clipboard | Native | Copy URL fallback on desktop | Already used in `shareLineup` pattern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| html-to-image | react-to-image (wrapper) | Extra dep overhead; html-to-image is already approved |
| Blob + anchor trick | file-saver library | Unnecessary dep; native pattern is 3 lines |
| html-to-image | html2canvas | html-to-image is lighter, more maintained in 2025 |

**Installation:**
```bash
npm install html-to-image
```

Note: html-to-image is NOT currently installed (confirmed). Must be installed before implementation.

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── games/
│   ├── LiveGameScreen.jsx          # existing — modify handleEndGame to navigate + persist intervals
│   ├── GameSummaryScreen.jsx       # NEW — main summary screen (coach view)
│   ├── GameSummaryPublic.jsx       # NEW — public read-only view (or share same component with isPublic prop)
│   └── ShareCard.jsx               # NEW — off-screen DOM node targeted by html-to-image
├── tabs/
│   └── GamesTab.jsx                # existing — modify completed game tap to go to /games/:id/summary
├── App.jsx                         # existing — add /games/:id/summary route, extend isGameScreen regex
└── firebase.js                     # existing — add updateGameIntervals() to persist intervals on end
```

### Pattern 1: Summary Data Computation

**What:** All summary data is derived from the game doc loaded via `loadGame()`. No separate Firestore queries needed.

**When to use:** Always — the game doc is the single source of truth.

```javascript
// Compute per-player stat counts from events array
function buildPlayerStats(events, roster) {
  const statsByPlayer = {};
  events.forEach((e) => {
    if (e.type !== "stat") return;
    if (!statsByPlayer[e.playerId]) statsByPlayer[e.playerId] = {};
    statsByPlayer[e.playerId][e.stat] = (statsByPlayer[e.playerId][e.stat] || 0) + 1;
  });
  return statsByPlayer;
}

// Derive which stat columns were actually recorded
function getActiveStatColumns(events) {
  const seen = new Set();
  events.forEach((e) => { if (e.type === "stat") seen.add(e.stat); });
  return Array.from(seen);
}
```

### Pattern 2: Persisting Intervals Before Summary

**What:** `handleEndGame` in LiveGameScreen must write `playerIntervals` and `halfIntervals` to Firestore before calling `clearGameStorage()`. The summary screen then reads them back via `loadGame()`.

**When to use:** This is the only reliable cross-session approach — localStorage is cleared on game end, and the summary screen may be opened from a different session (e.g., tapping a completed game from GamesTab later).

```javascript
// In firebase.js — new function
export async function finalizeGame(gameId, { playerIntervals, halfIntervals }) {
  try {
    await updateDoc(doc(db, "games", gameId), {
      playerIntervals,
      halfIntervals,
      status: "completed",
    });
    return true;
  } catch (err) {
    console.error("Failed to finalize game:", err);
    return false;
  }
}
```

```javascript
// In handleEndGame — replace separate updateGameStatus call
await finalizeGame(gameId, { playerIntervals: closedIntervals, halfIntervals: closedHalfIntervals });
clearGameStorage();
navigate(`/games/${gameId}/summary`);
```

### Pattern 3: CSV Export (No Library)

**What:** Build CSV string in JS, create Blob, trigger anchor download.

```javascript
function downloadCSV(rows, filename) {
  const csv = rows.map((r) => r.map((cell) => JSON.stringify(cell ?? "")).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Pattern 4: html-to-image Share Card

**What:** Render a visually styled `<div>` with share card content in the DOM (hidden off-screen or temporarily visible), target it with html-to-image `toPng` or `toBlob`.

**When to use:** Image export button tap.

```javascript
// Source: https://github.com/bubkoo/html-to-image
import { toPng, toBlob } from "html-to-image";

// Targeting a ref
const cardRef = useRef(null);

async function handleShareImage() {
  const node = cardRef.current;
  if (!node) return;

  const blob = await toBlob(node, {
    pixelRatio: 2,           // crisp on retina/high-DPI displays
    cacheBust: true,
  });

  // Mobile: share as File via Web Share API
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], "game-summary.png", { type: "image/png" });
    const canShare = navigator.canShare({ files: [file] });
    if (canShare) {
      await navigator.share({ files: [file], title: "Madeira FC Game Summary" });
      return;
    }
  }

  // Desktop fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "game-summary.png";
  a.click();
  URL.revokeObjectURL(url);
}
```

### Pattern 5: Share Link (Web Share API + Clipboard Fallback)

**What:** Share the `/games/:id/summary` URL. Follows exact same pattern as existing `shareLineup` in utils.js.

```javascript
async function handleShareLink(gameId) {
  const url = `${window.location.origin}${window.location.pathname}#/games/${gameId}/summary`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "Madeira FC Game Summary", url });
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  await navigator.clipboard.writeText(url);
  // Show "Link copied!" toast
}
```

### Pattern 6: AppShell Route Hiding

**What:** The existing `isGameScreen` regex in AppShell already hides the TabBar for any path matching `/games/.+`. The new `/games/:id/summary` path matches this automatically — no code change needed in AppShell's TabBar logic.

```javascript
// In App.jsx — ALREADY works for /games/:id/summary
const isGameScreen = /^\/games\/.+/.test(location.pathname);
```

Add the new route to the Routes block:
```jsx
<Route path="/games/:id/summary" element={<GameSummaryScreen />} />
```

### Anti-Patterns to Avoid

- **Reading intervals from localStorage in the summary screen:** localStorage is cleared at game end. The summary screen must read from Firestore, not localStorage.
- **Rendering the share card inside a hidden `display:none` div:** html-to-image cannot capture elements with `display:none`. Use `position:absolute; left:-9999px` or render conditionally just before capture.
- **Sharing files + URL in the same `navigator.share()` call on iOS:** iOS Safari does not reliably handle combined file + URL in one share call. Share the image file alone; the URL is embedded in the card image itself (per the design decision).
- **Not calling `navigator.canShare()` before `navigator.share()`:** File sharing requires canShare check; the method exists but file support varies by platform.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DOM-to-image | Custom canvas drawing | html-to-image `toPng`/`toBlob` | Cross-browser font embedding, CSS support, retina scaling |
| Minutes calculation | Custom timer arithmetic | `calcMinutes()` from utils.js | Already tested; handles multi-half interval intersection |
| Player name display | Custom abbreviation | `abbreviateName()` from utils.js | Already used throughout app consistently |
| Stat column labels | Custom label map | `STAT_LABELS` from constants.js | Already maps all stat keys to display strings |
| Share sheet on mobile | Custom share UI | Web Share API | Native share sheet on iOS/Android |

**Key insight:** All stat data, player data, and utility functions already exist. Phase 6 is primarily a rendering and export layer on top of existing data.

---

## Common Pitfalls

### Pitfall 1: Intervals Not Persisted to Firestore

**What goes wrong:** Summary screen loads `loadGame()`, finds no `playerIntervals` or `halfIntervals` on the doc, shows 0 minutes for all players.

**Why it happens:** `handleEndGame` currently calls `clearGameStorage()` which removes localStorage data. The intervals are never written to Firestore.

**How to avoid:** Create `finalizeGame()` in firebase.js that writes both interval objects along with `status: "completed"` in a single `updateDoc` call. Call it from `handleEndGame` before clearing storage. Navigate only after the write resolves.

**Warning signs:** Summary table shows 0 minutes for all players even though the game had substitutions.

### Pitfall 2: html-to-image Blank/Broken Output on iOS

**What goes wrong:** `toPng()` or `toBlob()` returns a blank white image or throws on iOS Safari.

**Why it happens:** iOS has strict timing on image element loading inside canvas. v1.11.12 added an iOS-specific fix ("ensure images are totally processed before using them"), but external Google Fonts referenced by CSS `@import` may still not embed correctly.

**How to avoid:** Use `pixelRatio: 2` option. Pre-call `getFontEmbedCSS(cardRef.current)` and pass result as `fontEmbedCSS` option to avoid multiple font fetches. The share card should use only inline styles (no class-based CSS from imported stylesheets) — this is already the project pattern (inline styles throughout).

**Warning signs:** Image renders correctly on desktop Chrome/Firefox but is blank or missing text on iOS Safari.

### Pitfall 3: Share Card `display:none` Not Captured

**What goes wrong:** html-to-image returns a blank image because the share card element is hidden.

**Why it happens:** html-to-image uses `foreignObject` inside SVG and cannot capture elements with `display:none` or `visibility:hidden`.

**How to avoid:** Keep the share card in the DOM with `position:absolute; left:-9999px; top:-9999px; width:360px; height:auto` so it is rendered but not visible. Or render it into the DOM only during the export process, capture, then remove.

### Pitfall 4: CSV Special Characters Breaking Parsers

**What goes wrong:** Opponent names or player names with commas or quotes corrupt the CSV.

**Why it happens:** Naive CSV string building doesn't escape quotes.

**How to avoid:** JSON.stringify each cell value — it adds surrounding quotes and escapes internal quotes to `\"`. This is the one-liner shown in the CSV pattern above.

### Pitfall 5: Navigator.canShare Not Available

**What goes wrong:** `navigator.canShare` is called but throws because it's undefined (Firefox, older browsers).

**Why it happens:** `canShare` is not as universally supported as `navigator.share`.

**How to avoid:** Guard with `navigator.share && navigator.canShare` before calling `canShare()`. If `canShare` is undefined, fall back to download.

### Pitfall 6: Summary Screen Navigation After End Game

**What goes wrong:** `navigate('/games/:id/summary')` is called before `finalizeGame()` resolves, so the summary screen loads before intervals are written.

**Why it happens:** Fire-and-forget pattern (established for stat events) is wrong here — the navigation must wait for the Firestore write.

**How to avoid:** `await finalizeGame(...)` before calling `navigate(...)`. This is one of the few places where awaiting a Firestore write is required.

---

## Code Examples

### Summary Table Row Computation

```javascript
// Source: derived from existing events data shape in LiveGameScreen + firebase.js
function buildSummaryRows(game) {
  const { events = [], lineup, playerIntervals = {}, halfIntervals = [] } = game;
  const roster = lineup?.roster || [];

  // Compute stat counts per player
  const statsByPlayer = {};
  events.forEach((e) => {
    if (e.type !== "stat") return;
    if (!statsByPlayer[e.playerId]) statsByPlayer[e.playerId] = {};
    statsByPlayer[e.playerId][e.stat] = (statsByPlayer[e.playerId][e.stat] || 0) + 1;
  });

  // Which stat columns were actually recorded?
  const activeCols = [...new Set(
    events.filter((e) => e.type === "stat").map((e) => e.stat)
  )];

  // Build row per player
  const rows = roster.map((player) => {
    const mins = calcMinutes(playerIntervals[player.id] || [], halfIntervals);
    const stats = statsByPlayer[player.id] || {};
    return { player, mins, stats };
  });

  // Sort by minutes descending
  rows.sort((a, b) => b.mins - a.mins);

  // Team totals row
  const totals = { mins: rows.reduce((s, r) => s + r.mins, 0), stats: {} };
  activeCols.forEach((col) => {
    totals.stats[col] = rows.reduce((s, r) => s + (r.stats[col] || 0), 0);
  });

  return { rows, activeCols, totals };
}
```

### MVP Computation

```javascript
// Top 3 players by total stat event count (ties: sort by player name)
function getTopMVPs(statsByPlayer, roster, count = 3) {
  return roster
    .map((player) => {
      const stats = statsByPlayer[player.id] || {};
      const total = Object.values(stats).reduce((s, n) => s + n, 0);
      return { player, stats, total };
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total || a.player.name.localeCompare(b.player.name))
    .slice(0, count);
}

// Format MVP stat highlights (e.g., "2G 1A")
function formatMVPStats(stats) {
  const ABBREV = {
    goal: "G", assist: "A", shot_on_target: "SOT",
    great_pass: "GP", save: "Sv", tackle: "T",
    clearance: "CL", block: "Blk", interception: "Int",
    fifty_fifty: "50/50", distribution: "Dist",
  };
  return Object.entries(stats)
    .filter(([, n]) => n > 0)
    .map(([key, n]) => `${n}${ABBREV[key] || key}`)
    .join(" ");
}
```

### CSV Builder

```javascript
function buildCSV(rows, activeCols, score, opponent, date) {
  const header = ["Player", "Minutes", ...activeCols.map((k) => STAT_LABELS[k] || k)];
  const dataRows = rows.map((r) => [
    r.player.name,
    r.mins,
    ...activeCols.map((col) => r.stats[col] || 0),
  ]);
  const totalsRow = ["TEAM TOTALS", "", ...activeCols.map((col) =>
    rows.reduce((s, r) => s + (r.stats[col] || 0), 0)
  )];
  const all = [header, ...dataRows, totalsRow];
  return all.map((row) => row.map((cell) => JSON.stringify(cell ?? "")).join(",")).join("\n");
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| html2canvas | html-to-image | 2020+ | More maintained, better font embedding, smaller bundle |
| navigator.share (text/url only) | navigator.share + files (Level 2) | iOS 15 / Chrome 75 | Can share image files natively on mobile |
| Manual CSV escape | JSON.stringify per cell | N/A — established pattern | Handles commas/quotes in names without extra library |

**Deprecated/outdated:**
- `html2canvas`: No longer preferred; html-to-image is the successor for React projects
- Sharing files+URL in same iOS navigator.share call: Unreliable on iOS; share image and URL separately

---

## Open Questions

1. **Interval persistence timing**
   - What we know: `handleEndGame` currently does `updateGameStatus(gameId, "completed")` then `clearGameStorage()`. Intervals live only in React state at that moment.
   - What's unclear: Whether there are race conditions between the Firestore write and React state closure values inside the callback.
   - Recommendation: The `handleEndGame` callback already closes over `playerIntervals` and `halfIntervals` state. After closing the intervals (via setState), compute the final closed versions inline and pass directly to `finalizeGame()`. Do not rely on state reads after `setPlayerIntervals` — capture from the closure before the setState calls, or pass the computed value directly.

2. **html-to-image font behavior on iOS (flagged in STATE.md)**
   - What we know: v1.11.12+ has an iOS timing fix. The project uses Google Fonts (DM Sans, Outfit) via `<link>` in index.html.
   - What's unclear: Whether those fonts embed correctly in the share card via the default font embedding path, or if `getFontEmbedCSS()` must be called manually first.
   - Recommendation: The share card should use only web-safe fallback fonts in its inline styles (system-ui, sans-serif), or call `getFontEmbedCSS(cardRef.current)` once and pass as option. Test on actual iOS Safari before finalizing. If fonts don't embed, use system fonts for the card only — the design is readable without custom fonts given the bold inline-style approach.

3. **Public Firestore read rules**
   - What we know: The `loadPublishedLineup` function reads the `lineups/published` doc without auth. The existing pattern shows Firestore rules allow reads on at least some collections.
   - What's unclear: Whether the `games` collection has rules allowing unauthenticated reads (no rules file found in repo).
   - Recommendation: Verify current Firestore rules in Firebase Console. If the `games` collection does not allow public reads, the summary screen will fail for unauthenticated viewers. May need a `rules_version = '2'` update to allow `read if resource.data.status == "completed"` or simply `allow read: if true` on games. This should be tested in Wave 0.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 |
| Config file | none — zero-config via vite.config.js |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POST-01 | `buildSummaryRows` produces correct table data from events | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 |
| POST-01 | Players with 0 minutes appear in summary rows | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 |
| POST-01 | Team totals row sums each stat column correctly | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 |
| POST-01 | Only stat columns with at least one recorded event appear | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 |
| POST-02 | Minutes column uses `calcMinutes` correctly per player | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 (reuses existing calcMinutes) |
| POST-03 | `buildCSV` output has correct header row and data rows | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 |
| POST-03 | CSV escapes player names with commas or quotes | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 |
| POST-04 | Share URL format is `#/games/:id/summary` | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 |
| POST-05 | `getTopMVPs` returns correct top 3 by total stat events | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 |
| POST-05 | `formatMVPStats` produces correct abbreviations | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 |
| POST-05 | html-to-image capture + share/download | manual | Tap "Share Image" on device | manual-only — DOM rendering |

**Manual-only justification for POST-05 image capture:** html-to-image requires real DOM rendering in a browser. JSDOM (vitest environment) does not support canvas/SVG serialization. Integration test would require Playwright — out of scope for this phase.

### Sampling Rate

- **Per task commit:** `npx vitest run src/tests/summary.test.js`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/tests/summary.test.js` — covers POST-01, POST-02, POST-03, POST-04, POST-05 pure-function tests
- [ ] `npm install html-to-image` — required before Wave 1

---

## Sources

### Primary (HIGH confidence)

- html-to-image GitHub releases page — v1.11.12/v1.11.13 changelog confirmed; iOS fix present
- html-to-image GitHub README — `toPng`, `toBlob`, `getFontEmbedCSS` API confirmed
- MDN Navigator.share() — files + url combined sharing API confirmed; `canShare()` guard required
- Existing codebase: `src/shared/utils.js`, `src/shared/constants.js`, `src/firebase.js`, `src/App.jsx` — all patterns confirmed by direct read

### Secondary (MEDIUM confidence)

- WebSearch + GitHub issue confirmation — iOS Safari does not reliably handle files + URL in same share call; separate them
- WebSearch — `pixelRatio: 2` + `cacheBust: true` options recommended for html-to-image quality

### Tertiary (LOW confidence)

- Google Fonts embedding behavior in html-to-image on iOS — not explicitly documented; inferred from known canvas/foreignObject limitations; flag as needing device testing

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — html-to-image confirmed installed (needs install), Web Share API confirmed via MDN
- Architecture: HIGH — all data shapes confirmed from existing codebase reads; interval persistence gap identified
- Pitfalls: HIGH — iOS share file+url limitation confirmed via multiple sources; display:none issue confirmed from html-to-image docs; interval persistence gap confirmed from code review
- Font embedding on iOS: LOW — needs device spike

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable APIs; html-to-image releases infrequently)
