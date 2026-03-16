# Stack Research

**Domain:** Live game tracking, stat logging, timers, season statistics — React SPA
**Researched:** 2026-03-16
**Confidence:** HIGH (core decisions), MEDIUM (image export)

---

## Existing Stack (Do Not Change)

| Technology | Version | Role |
|------------|---------|------|
| React | ^19.2.4 | UI framework |
| Vite | ^8.0.0 | Build tool |
| Firebase JS SDK | ^12.10.0 | Firestore cloud sync |
| Inline styles | — | Styling (no component library) |
| localStorage | native | Persistence |
| PWA manifest | native | Home screen install |

These are locked. No build tool changes, no component library additions.

---

## New Dependencies Required

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-router-dom | ^7.13.1 | Bottom tab navigation (Lineup / Games / Stats) | Standard SPA routing; v7 is current (re-export of react-router). Handles URL-based view switching, back button, and deep links to game summaries cleanly. No alternative makes sense for a multi-view PWA without a router. |
| html-to-image | ^1.11.13 | Convert post-game summary DOM node to PNG for sharing | 2.6M weekly downloads, actively maintained, uses SVG serialization not canvas rasterization — avoids the canvas taint issues that plague html2canvas on Safari. Required for the "share as image" feature in post-game summary. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| — | — | — | — |

No additional runtime libraries are needed. All other features are achievable with what already exists or with native browser APIs described below.

---

## Zero-Dependency Implementations (Use Native APIs)

These features do NOT require npm packages. Implement directly.

### Game Timer (25-min halves)

Use `Date.now()` for the source of truth, not `setInterval` tick counts.

```javascript
// On start: record wallclock start time
const startedAt = Date.now();
const elapsed = 0; // ms accumulated before this start

// In useEffect tick (1-second setInterval):
const now = Date.now();
const totalMs = elapsed + (now - startedAt);
const displaySeconds = Math.floor(totalMs / 1000);
```

Store `startedAt` (timestamp) and `accumulated` (ms) in state — not a running counter. This survives tab background throttling and re-renders cleanly. `setInterval` at 1000ms is only for triggering re-renders; actual time comes from `Date.now()` diff.

Auto-stop: when `totalMs >= 25 * 60 * 1000`, clear the interval and mark the half complete.

**Why not a library:** `useInterval` hooks and countdown libraries add zero value here. The pattern is 15 lines.

### Per-Player Minute Tracking

Same pattern: each player on the field has a `fieldEntryTime` (timestamp). On substitution out, compute `minutesPlayed += Math.floor((Date.now() - fieldEntryTime) / 60000)`.

### CSV Export

Native `Blob` + `URL.createObjectURL` + programmatic anchor click — no library needed.

```javascript
function downloadCSV(filename, rows) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map(r => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
```

### Post-Game Sharing (Link + Image)

**Link:** Firestore document at `games/{gameId}` with `isPublic: true`. Share URL pattern: `?gameId=xxx`. Already proven by v1.0 lineup sharing — same mechanism.

**Image export:** `html-to-image` (see Core Technologies above). Capture the summary modal DOM node as PNG, then use the Web Share API:

```javascript
import { toPng } from 'html-to-image';

const dataUrl = await toPng(summaryRef.current);
const blob = await (await fetch(dataUrl)).blob();
const file = new File([blob], 'game-summary.png', { type: 'image/png' });

if (navigator.canShare?.({ files: [file] })) {
  await navigator.share({ files: [file], title: 'Game Summary' });
} else {
  // Fallback: trigger download
  const a = document.createElement('a');
  a.href = dataUrl; a.download = 'game-summary.png'; a.click();
}
```

Web Share API with files is supported on iOS Safari and Android Chrome — the two primary targets for a coaching PWA. Always check `navigator.canShare` first.

### State Management (Game Mode)

Use `useReducer` for live game state. Game state has many interdependent fields (timer running, half number, player positions, stat events, substitution log) — `useState` calls would scatter the logic. `useReducer` keeps transitions explicit and testable.

```javascript
// Reducer actions: START_HALF, PAUSE, RESUME, END_HALF, LOG_STAT,
// SUB_IN, SUB_OUT, UNDO_LAST_EVENT
```

No external state library (Zustand, Redux, etc.) — `useReducer` + `useContext` is sufficient for a coach-only single-user app.

---

## Firestore Data Model Additions

The existing `lineups/published` document pattern works for single-document reads. Game data needs a proper collection structure.

```
games/
  {gameId}/
    opponent: string
    date: string (ISO)
    linkedLineupId: string
    isPublic: boolean
    halfDurations: { first: number, second: number } // actual minutes played
    finalScore: { home: number, away: number }
    createdAt: timestamp

    events/   (subcollection)
      {eventId}/
        type: "stat" | "sub" | "half_start" | "half_end"
        playerId: string
        stat: string | null
        gameMinute: number
        timestamp: number  // Date.now()

seasons/
  {seasonId}/
    name: string
    playerStats/  (subcollection)
      {playerId}/
        minutesPlayed: number
        goals: number
        assists: number
        // ... per stat-type totals
```

Import from existing firebase.js:
- `addDoc`, `collection`, `onSnapshot`, `query`, `orderBy` — all available in Firebase JS SDK v12

---

## Installation

```bash
# New runtime dependencies
npm install react-router-dom html-to-image

# No new dev dependencies required
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| react-router-dom v7 | Manual useState view switching | Only if the app stays 2 views or fewer. At 3 tabs (Lineup / Games / Stats) plus game detail screens, manual switching becomes unmaintainable. |
| html-to-image | html2canvas | html2canvas has documented taint issues on Safari with cross-origin resources. html-to-image's SVG approach handles same-origin inline content (which this summary modal is) more reliably. Switch to html2canvas only if html-to-image produces blank output on a specific platform. |
| html-to-image | modern-screenshot | modern-screenshot is an active fork with fixes but ~10x fewer weekly downloads and less community validation. Use if html-to-image has unresolved bugs. |
| Date.now() diff pattern | react-countdown or react-timer-hook | Third-party timer hooks add bundle weight without solving the core problem (accuracy across tab sleep). The Date.now() diff pattern is what those libraries use internally anyway. |
| useReducer + Context | Zustand | Use Zustand if game state needs to be accessed from 5+ deeply nested components that can't share a context boundary cleanly. For this app's structure, it's overkill. |
| Native CSV Blob | papaparse or react-csv | papaparse is the right choice if you need CSV *parsing* (import). For export only, the Blob pattern is 10 lines and adds zero bundle weight. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Moment.js | 231 kB minified, unmaintained, explicitly deprecated by its authors | Native `Date`, `Date.now()`, `Intl.DateTimeFormat` — no library needed for displaying game minutes |
| Redux Toolkit | Full event-sourcing overkill for a single-coach single-session app | `useReducer` + `useContext` |
| MUI / Chakra / any component library | Project constraint — inline styles only, and introducing a component library mid-project creates two competing style systems | Continue with inline styles |
| html2canvas | Tainted canvas errors on iOS Safari when component tree includes any external resource (even same-origin fonts loaded from Google Fonts) | html-to-image |
| Firebase Realtime Database | Already using Firestore; mixing two Firebase database products in one project adds complexity for no benefit | Firestore for all game and season data |
| setInterval tick counting for timer display | Browser tabs throttle intervals to 1 Hz or slower when backgrounded; tick counts drift | Store `startedAt` timestamp, compute elapsed via `Date.now() - startedAt` on each tick |

---

## Stack Patterns by Variant

**If image export fails on a specific device (blank PNG):**
- The likely cause is font loading (Google Fonts CDN hits cross-origin) at capture time
- Fix: use `fontEmbedCSS` option in html-to-image, or embed critical fonts inline before capture
- This app uses system fonts / inline styles, so cross-origin font issues are unlikely

**If navigator.share is unavailable (desktop browser):**
- Fall through to download: `<a download>` click programmatically
- Always code the fallback — share is not available in Chrome on desktop without a PWA install

**If the game events subcollection grows large:**
- Use `query(eventsRef, orderBy('timestamp', 'desc'), limit(50))` for the recent events feed
- Full event list for summary is a one-time `getDocs` at game end — no pagination needed at Madeira FC scale

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| react-router-dom ^7.13.1 | React ^19.2.4 | React Router v7 requires React 18+; React 19 is fully supported |
| html-to-image ^1.11.13 | React ^19 | Framework-agnostic DOM utility; no React version dependency |
| Firebase ^12.10.0 | Vite ^8.0.0 | Existing — no change |

---

## Sources

- [html-to-image on npm trends](https://npmtrends.com/html-to-image) — 2.6M weekly downloads, version 1.11.13 confirmed current (MEDIUM confidence — npm page returned 403, npmtrends cited)
- [react-router-dom npm](https://www.npmjs.com/package/react-router-dom) — v7.13.1 current as of March 2026 (HIGH confidence)
- [React Router v7 upgrade guide](https://reactrouter.com/upgrading/v6) — confirms React 18+ requirement, v7 is non-breaking from v6 (HIGH confidence)
- [MDN: Navigator.share()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) — file sharing support, canShare() requirement, HTTPS requirement (HIGH confidence)
- [Firebase Firestore data model docs](https://firebase.google.com/docs/firestore/data-model) — subcollection structure, collection group query support (HIGH confidence)
- [Dan Abramov: Making setInterval Declarative with React Hooks](https://overreacted.io/making-setinterval-declarative-with-react-hooks/) — useRef + setInterval pattern, Date.now() recommendation for accuracy (HIGH confidence)
- [React 19 useReducer patterns](https://dev.to/a1guy/react-19-usereducer-deep-dive-from-basics-to-complex-state-patterns-3fpi) — confirms pure reducer pattern, concurrent mode safety (MEDIUM confidence — DEV Community, not official docs)
- [Web Share API Level 2 file sharing](https://web.dev/patterns/files/share-files) — Blob-to-File pattern for sharing images (HIGH confidence)

---

*Stack research for: Madeira FC Lineup Planner — v2.0 Live Game Tracking*
*Researched: 2026-03-16*
