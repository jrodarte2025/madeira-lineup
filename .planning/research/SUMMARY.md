# Project Research Summary

**Project:** Madeira FC Lineup Planner — v2.0 Live Game Tracking
**Domain:** Live game tracking + stat logging overlay on an existing React PWA
**Researched:** 2026-03-16
**Confidence:** HIGH (architecture and pitfalls); MEDIUM (features, image export)

## Executive Summary

This is a focused v2.0 extension of an already-working lineup builder. The goal is to add game-day management — timers, stat logging, minute tracking, and post-game summaries — without touching the v1.0 lineup builder. Research confirms the existing stack (React 19, Vite, Firebase JS SDK, inline styles) is sufficient; only two new dependencies are warranted: `react-router-dom` for tab navigation and `html-to-image` for summary image export. Every other feature — timers, CSV export, sharing — is achievable with native browser APIs and patterns already proven in v1.0.

The recommended architecture separates concerns cleanly: a new `App.jsx` shell wraps the existing `MadeiraLineupPlanner` as one tab, while new `game/` and `stats/` folders hold all live game logic in isolation. The game document snaps the lineup at kickoff so live edits to the lineup builder never corrupt historical records. The most critical data model decision — whether to use Firestore subcollections or in-document arrays for stat events — must be resolved before any code is written; the wrong choice creates a migration-level rewrite later.

The top risks are all preventable with known patterns. Timer accuracy on mobile requires storing a `startTimestamp` and computing elapsed via `Date.now()` diff rather than tick-counting. Screen sleep during a live half requires Screen Wake Lock API. Game state loss on phone reload requires a localStorage crash buffer with a resume prompt. None of these are complex — they are each 10–20 lines — but all three must be built in the first game-screen phase, not added later as "polish."

---

## Key Findings

### Recommended Stack

The existing stack is locked and sufficient. Two additions are required and justified. `react-router-dom` v7 is the standard choice for three-tab navigation in a React SPA — manual view switching becomes unmaintainable at three screens with nested routes (game detail, player profiles). `html-to-image` is preferred over `html2canvas` specifically because html2canvas has documented iOS Safari tainted canvas failures; html-to-image's SVG serialization approach avoids this on the two primary mobile targets.

**Core technologies:**
- `react-router-dom ^7.13.1` — tab navigation and game detail routes — standard SPA routing; handles URL-based deep links to game summaries
- `html-to-image ^1.11.13` — post-game summary image export — SVG-based, avoids iOS canvas taint issues that plague html2canvas
- `useReducer + useContext` — game state management — explicit state transitions; avoids state scatter across multiple `useState` calls for interdependent game fields
- `Date.now()` diff pattern — timer accuracy — immune to browser tab throttling and screen sleep; setInterval is only a render trigger, not the time source
- Native `Blob` + anchor click — CSV export — zero dependencies; the 10-line pattern adds nothing to bundle size

### Expected Features

The feature landscape is well-defined. Competitor analysis (SubTime, PitchTime, Coach Caddie) confirms what coaches consider table stakes versus differentiators, and the research identifies several features that seem valuable but should be explicitly deferred.

**Must have (v2.0 table stakes):**
- 25-min half timer with start/stop/pause and auto-stop — coaches cannot track time while managing 14 players
- Score tracking with undo — most basic game record; undo is expected after accidental taps
- Substitution logging with game-clock timestamp — core reason coaches use apps over clipboards
- Per-player minute tracking (auto-calculated from sub events) — youth league equal-time accountability
- Position-aware stat buttons (GK/DEF/MID/FWD groups) — reduces mis-logging and is not available in any competitor
- Recent events feed (last 3-5) with single-tap undo — error recovery under sideline pressure
- Post-game summary (lineup + score + minutes + stats) — end-of-game deliverable coaches share immediately
- Firestore game collection with per-event writes — durability and downstream aggregation
- CSV export — data portability, low effort, high trust signal

**Should have (v2.x competitive differentiators):**
- Image export (shareable summary card) — purpose-built for WhatsApp/group chat; no competitor offers this
- Shareable game summary link — public Firestore read + URL route
- Season dashboard with running per-player totals — aggregates across all saved games
- Player profiles with game-by-game history — individual records useful for parent conversations
- Bottom tab navigation (Lineup | Games | Stats) — navigation wrapper to surface all features

**Defer to v3+:**
- Real-time spectator/parent live view — real-time infrastructure is a different product tier
- Multi-team support — single-team constraint ships fast and is the right scope
- AI substitution suggestions — not appropriate; youth coaches need context, not algorithms
- Video/highlight capture — different product category entirely

### Architecture Approach

The architecture follows a clear additive pattern: a new `App.jsx` shell wraps `MadeiraLineupPlanner` untouched as one tab, and all new features live in `game/` and `stats/` folders with no knowledge of the lineup builder. The existing `firebase.js` expands with game CRUD functions alongside the existing lineup functions. The key boundary is that `LiveGameScreen` reads from a frozen lineup snapshot stored in the game document — it is not a modified version of the lineup builder.

**Major components:**
1. `App.jsx` — tab shell, `activeTab` state, renders TabBar and conditionally mounts one of three tab components
2. `game/LiveGameScreen.jsx` — full-screen game mode: timer, position-snapshotted field with stat tap overlays, substitution handling, events feed
3. `game/PostGameSummary.jsx` — read-only stats grid after game end, CSV export, share actions
4. `stats/StatsTab.jsx` + `stats/PlayerProfile.jsx` — season dashboard and per-player history via Firestore aggregation
5. `shared/constants.js` — STAT_TYPES, POSITION_GROUP, STAT_COLORS extracted from MadeiraLineupPlanner (shared by LiveGameScreen and StatsTab)
6. `shared/statUtils.js` — `aggregateByPlayer()`, `aggregateAcrossGames()`, `computeMinutesPlayed()` utilities

**Firestore structure:**
- `games/{gameId}` — game metadata + frozen lineup/roster snapshot + embedded events array (not subcollection)
- `seasons/{seasonId}/playerStats` — denormalized running totals updated on game finalize (avoids cross-game subcollection queries at season dashboard load)

### Critical Pitfalls

1. **setInterval timer drift on mobile** — browsers throttle intervals when the screen locks or tab backgrounds; a 25-min half can show 22 minutes when wall clock shows 25. Use `Date.now()` diff stored in a ref; `setInterval` is only a render trigger. Must be in the first game-screen phase, not added later.

2. **No Screen Wake Lock — phone sleeps mid-half** — coaches put the phone in their pocket; PWA suspends. Request `navigator.wakeLock.request('screen')` when game mode activates; release on game end. Wrap in try/catch — denied wake lock is degraded experience, not an error. Test specifically on installed PWA on iPhone (known WebKit bug with home screen apps).

3. **Wrong Firestore data model for stat events** — using a subcollection per event creates cross-game collection group queries for season stats and compounds write costs. Use `arrayUnion` to append events to the game document itself. This is the architecture's most irreversible decision — a subcollection design that ships requires a migration script to fix.

4. **Game state loss on crash/reload** — live game state in React component state only will be lost on any phone reload. Two-layer strategy: localStorage as the synchronous crash buffer (every state change), Firestore as the durable record (every meaningful event). On app mount, check for an in-progress game and show a resume banner.

5. **Component bloat: adding game mode to MadeiraLineupPlanner** — the file is already 1674 lines. Adding game state, timer, and stat buttons to it produces a 3000+ line unmaintainable file with cross-mode state bugs. Extract a new `App.jsx` shell and isolate game logic in `game/` before writing any game feature code. This is a prerequisite, not a cleanup task.

6. **Minute tracking breaks on halftime substitutions** — recording `Date.now()` when a player enters works during an active half but overcounts during halftime. Minutes must be computed as the intersection of player on-field intervals with active half intervals. Halftime subs get credit only from when the second half starts.

---

## Implications for Roadmap

Based on combined research, the feature dependency tree and pitfall prevention requirements suggest 5 phases:

### Phase 1: Foundation — App Shell + Component Extraction
**Rationale:** Component bloat is a catastrophic pitfall (HIGH recovery cost). All subsequent phases require the tab shell. This must land before any game code is written.
**Delivers:** `App.jsx` + `TabBar`, stub tabs for Lineup/Games/Stats, `shared/constants.js` extracted from MadeiraLineupPlanner, confirmed v1.0 regression-free
**Addresses:** Table stakes prerequisite — no game features work without navigation
**Avoids:** Component bloat pitfall; cross-domain state bleed between lineup and game modes

### Phase 2: Data Model + Firestore Game Layer
**Rationale:** The Firestore data model is the highest-risk irreversible decision. It must be locked before any stat-writing code exists. PITFALLS.md gives this an explicit "before any code" warning.
**Delivers:** Expanded `firebase.js` with game CRUD functions, `games/{gameId}` document with embedded events array (not subcollection), game document tested in Firestore console
**Uses:** `arrayUnion` pattern for stat events, snapshot strategy for lineup/roster
**Implements:** Firestore schema from ARCHITECTURE.md; avoids subcollection-per-stat design

### Phase 3: Game Creation + Live Game Screen (Core Loop)
**Rationale:** This is the largest phase and the heart of v2.0. It must include all three mobile pitfall mitigations (timer accuracy, screen wake lock, crash recovery) — these cannot be deferred. Per-player minute tracking depends on the timer being the authoritative clock.
**Delivers:** `GameSetupModal`, `LiveGameScreen` with drift-proof timer, Screen Wake Lock, localStorage crash buffer + resume prompt, position-aware stat buttons, stat badge counts, substitution logging with game-minute timestamps, per-player minute tracking with halftime intersection calculation, recent events feed + single-tap undo
**Uses:** `useReducer` for game state, `Date.now()` diff timer pattern, Screen Wake Lock API, Page Visibility API re-sync, `arrayUnion` writes
**Implements:** `game/GameTab.jsx`, `game/GameSetupModal.jsx`, `game/LiveGameScreen.jsx`, `game/useGameTimer.js`
**Avoids:** Timer drift (Pitfall 1), screen sleep (Pitfall 2), game state loss (Pitfall 4), halftime minute miscalculation (Pitfall 6)

### Phase 4: Post-Game Summary + Exports
**Rationale:** The live game loop must be validated end-to-end before building the summary. This phase is lower-risk but depends entirely on Phase 3 event data.
**Delivers:** `PostGameSummary.jsx` (stats grid, lineup used, score, per-player minutes), CSV export, `html-to-image` summary card for group chat sharing, shareable game link (public Firestore read + URL route)
**Uses:** `html-to-image ^1.11.13`, native Blob CSV pattern, Web Share API with `navigator.canShare` fallback
**Implements:** `game/PostGameSummary.jsx`

### Phase 5: Season Dashboard + Player Profiles
**Rationale:** Cannot be validated until multiple games exist. Requires denormalized `playerStats` document to avoid slow cross-game queries at load time. ARCHITECTURE.md explicitly notes this as a later-phase concern.
**Delivers:** `StatsTab.jsx` season dashboard (sortable per-player totals), `PlayerProfile.jsx` (game-by-game history), `statUtils.aggregateAcrossGames()` utility, denormalized running totals written on game finalize
**Uses:** Firestore `getDocs` on finalized games collection, `statUtils.js` aggregation
**Implements:** `stats/StatsTab.jsx`, `stats/PlayerProfile.jsx`, `shared/statUtils.js`, denormalized season stats write on game finalize
**Avoids:** Season stats computed on every render (performance trap from PITFALLS.md)

### Phase Ordering Rationale

- **Foundation before features:** Component extraction (Phase 1) and data model (Phase 2) are prerequisites with high recovery cost if skipped. Both research files give explicit warnings about doing this in the wrong order.
- **All mobile pitfall mitigations in Phase 3, not later:** Timer drift, screen sleep, and crash recovery are not polish. They are table stakes for a live game tool. Any real-game test without them produces coach-facing failures.
- **Post-game before season:** PostGameSummary (Phase 4) produces the data structures that Season Dashboard (Phase 5) aggregates. The dependency is hard.
- **Exports in Phase 4, not Phase 3:** Image export (`html-to-image`) and shareable links are high-value differentiators but depend on a working post-game summary. Staging them in Phase 4 keeps Phase 3 focused on the core live loop.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Live Game Screen):** Screen Wake Lock PWA behavior on iOS has a known WebKit bug; test on physical device early. The `visibilitychange` / re-sync pattern needs prototype validation before committing to the approach.
- **Phase 4 (Image Export):** `html-to-image` confidence is MEDIUM (npm page returned 403 during research; npmtrends cited). Validate version and inline font behavior on the first implementation spike.

Phases with standard patterns (skip research-phase):
- **Phase 1 (App Shell):** Straightforward React component extraction and tab shell — well-documented patterns, no research needed.
- **Phase 2 (Firestore Layer):** Schema design is fully specified in ARCHITECTURE.md; Firestore docs are HIGH confidence. No additional research needed.
- **Phase 5 (Season Dashboard):** Aggregation utilities follow standard patterns; Firestore query patterns are well-documented.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | React Router v7 and html-to-image verified via npmtrends and official docs; existing stack locked |
| Features | MEDIUM | Cross-referenced 8+ competitors via WebSearch; some source pages returned 403/404 but feature landscape is consistent across what was accessible |
| Architecture | HIGH | Based on direct codebase inspection of the 1674-line MadeiraLineupPlanner.jsx and firebase.js; no inference needed |
| Pitfalls | HIGH | Timer drift, Wake Lock, and Firestore design pitfalls are well-documented in MDN, Firebase docs, and known bug trackers |

**Overall confidence:** HIGH

### Gaps to Address

- **html-to-image on installed iOS PWA:** Confidence is MEDIUM on cross-origin font handling. The app uses inline styles (not Google Fonts CDN), which reduces risk, but should be validated with a quick spike before committing to the Phase 4 image export implementation.
- **Screen Wake Lock on installed PWA (WebKit bug #254545):** Research confirmed the bug exists but could not determine if it affects the current iOS Safari version. Test on a physical device as the first action in Phase 3.
- **Firestore free tier headroom at scale:** Estimated 720–1440 writes/season for one team is well within the 20K/day free tier. If the app is shared beyond one team, revisit the `arrayUnion` write frequency before expanding.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `src/MadeiraLineupPlanner.jsx` (1674 lines), `src/firebase.js` — existing architecture
- [react-router-dom npm](https://www.npmjs.com/package/react-router-dom) — v7.13.1 current
- [React Router v7 upgrade guide](https://reactrouter.com/upgrading/v6) — React 18+ requirement confirmed
- [MDN: Navigator.share()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) — file sharing, canShare()
- [MDN: Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) — browser support, lifecycle
- [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) — background throttling
- [Firebase Firestore data model docs](https://firebase.google.com/docs/firestore/data-model) — subcollection structure, 1MB limit
- [Access data offline — Firebase Docs](https://firebase.google.com/docs/firestore/manage-data/enable-offline) — offline persistence
- [Firestore billing — Firebase Docs](https://firebase.google.com/docs/firestore/pricing) — per-write cost

### Secondary (MEDIUM confidence)
- [npmtrends: html-to-image](https://npmtrends.com/html-to-image) — 2.6M weekly downloads, v1.11.13 current
- [WebKit Bug 254545](https://bugs.webkit.org/show_bug.cgi?id=254545) — Wake Lock in installed iOS PWAs
- [SubTime App Store](https://apps.apple.com/us/app/subtime-game-management/id1248650528) — competitor feature set and user pain points
- [PitchTime](https://pitchtime.app/) — fair play automation, PDF export
- [Coach Caddie App Store](https://apps.apple.com/us/app/coach-caddie/id6749924032) — 9v9 support
- React 19 useReducer deep dive (DEV Community) — concurrent mode safety

### Tertiary (LOW confidence)
- Various competitor surveys — some source pages returned 403/404; feature landscape cross-referenced for consistency

---
*Research completed: 2026-03-16*
*Ready for roadmap: yes*
