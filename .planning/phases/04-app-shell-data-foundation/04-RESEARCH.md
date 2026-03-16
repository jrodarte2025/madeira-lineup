# Phase 4: App Shell + Data Foundation - Research

**Researched:** 2026-03-16
**Domain:** React Router v7 tab navigation, shared module extraction, Firestore game schema
**Confidence:** HIGH

## Summary

Phase 4 is an infrastructure and refactoring phase. The work is straightforward: wrap the existing `MadeiraLineupPlanner` in a tab shell, extract shared code into reusable modules, and extend `firebase.js` with game CRUD. None of these tasks require new problem-solving — they follow well-established patterns in the existing codebase.

The existing codebase is a single-file monolith (`MadeiraLineupPlanner.jsx`, 1,674 lines). The extraction targets are clearly identified in CONTEXT.md: `PitchSVG`, `FieldPosition`, the `C` color constants, `STAT_TYPES`, `POSITION_GROUP`, and `STAT_COLORS`. The first two exist in the monolith; the stat constants are new (v2.0 will need them in Phase 5 but the structure is being defined here).

React Router v7 uses the package name `react-router` (not `react-router-dom` — that is now deprecated and simply re-exports). The `NavLink` component's `style` callback prop with `{ isActive }` is the correct pattern for the active tab indicator. `HashRouter` is appropriate for this static Vite/Firebase Hosting deployment — no server-side URL rewriting is needed.

**Primary recommendation:** Use `HashRouter` with `NavLink` for the tab bar, extract shared files into `src/shared/`, expand `firebase.js` with `addDoc`/`updateDoc`/`arrayUnion` imports, and define the Firestore schema exactly as specified in CONTEXT.md.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tab bar design:**
- Labels only (no icons) — text tabs: "Lineup", "Games", "Stats"
- Active tab: orange text (C.orange #E86420) with 2-3px underline bar; inactive tabs in light gray
- Tab bar background: navy (C.navy #1B2A5B) — matches existing header
- Visible on both mobile and desktop — consistent navigation everywhere
- Lineup tab is the default landing tab (same as today's behavior)

**Stub tab content:**
- Games tab shows centered "coming soon" message (e.g., "Game tracking coming soon") before Phase 5
- Stats tab shows same pattern with different text (e.g., "Season stats coming soon")
- Both stubs use identical layout/style — just different messaging

**File organization:**
- Extract PitchSVG, FieldPosition, and C color constants into shared files now (not deferred to Phase 5)
- Add stat colors to the C object: statOffensive (#E86420), statDefensive (#4CAFB6), statNeutral (#6b7280)
- Extract STAT_TYPES, POSITION_GROUP, STAT_COLORS into shared constants file
- New App.jsx shell handles routing and tab bar; MadeiraLineupPlanner.jsx becomes the Lineup tab content

**Game document shape (Firestore schema):**
- Explicit score fields: `score: { home: number, away: number }` — coach-editable, not derived from events
- Five-state status lifecycle: `setup → 1st-half → halftime → 2nd-half → completed`
- Lineup snapshot embedded in game doc at creation time (formation, positions, roster) — game is self-contained
- Events array embedded in game doc (NOT subcollections)
- Game metadata: opponent name, date, status, createdAt timestamp

**Season stats document (Firestore schema):**
- One document per season (e.g., `seasonStats/2026`)
- Players map keyed by playerId with running totals (minutes, goals, assists, etc.) and gamesPlayed count
- Single read loads entire dashboard — no per-player fetches needed

### Claude's Discretion
- Folder structure (flat vs feature-based — pick what fits the codebase best)
- Whether to also split out SaveLoadModal, RosterContent, PlayerChip, or leave them in the monolith
- Exact tab bar height, padding, font size, and underline animation
- Transition behavior when switching tabs

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | App has bottom tab navigation with Lineup, Games, and Stats tabs | React Router v7 HashRouter + NavLink; tab bar as persistent UI element rendered in App.jsx |
| INFRA-02 | Shared components (PitchSVG, FieldPosition, constants) extracted into reusable files | Module extraction pattern; existing code is self-contained and dependency-free — clean extraction |
| INFRA-03 | Existing lineup builder works unchanged within the new tab structure | MadeiraLineupPlanner.jsx becomes a routed child component; `?lineup=` query param URL sharing must be preserved |
| DATA-01 | Game documents stored in Firestore games collection with events embedded | `addDoc` to `games` collection; `arrayUnion` for event appending; `updateDoc` for status/score changes |
| DATA-02 | Season stats stored in Firestore with denormalized player totals for fast reads | `setDoc` with merge on `seasonStats/{year}`; players map keyed by playerId using `increment` for running totals |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router | ^7.13.1 | Tab navigation / routing | v7 is current; replaces `react-router-dom` which is now deprecated re-export |
| firebase | ^12.10.0 | Firestore CRUD | Already installed; extend with `addDoc`, `updateDoc`, `arrayUnion`, `increment` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | Tab bar is pure CSS/inline-styles | Consistent with existing codebase approach |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HashRouter | BrowserRouter | BrowserRouter needs server-side URL rewriting; Firebase Hosting supports it but HashRouter is simpler with zero config and matches the current `?lineup=` query param sharing model |
| NavLink style callback | CSS classes | Inline styles already used throughout the codebase; NavLink `style={({ isActive }) => ...}` is the natural fit |
| `react-router` | `react-router-dom` | `react-router-dom` in v7 is a deprecated re-export shim; `react-router` is the canonical package |

**Installation:**
```bash
npm install react-router
```

**IMPORTANT:** The project STATE.md notes "react-router-dom v7" as the planned dep. In v7, the actual package is `react-router` (not `react-router-dom`). Both work — `react-router-dom` re-exports everything from `react-router` for migration compatibility — but `react-router` is canonical. Either is fine to install; import from `react-router` in either case.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── App.jsx              # Shell: HashRouter, TabBar, Routes
├── main.jsx             # Updated to render App.jsx instead of MadeiraLineupPlanner
├── firebase.js          # Expanded with game CRUD functions
├── MadeiraLineupPlanner.jsx  # Unchanged — becomes Lineup tab content
├── shared/
│   ├── constants.js     # C (colors), FORMATIONS, STAT_TYPES, POSITION_GROUP, STAT_COLORS
│   ├── PitchSVG.jsx     # Extracted from MadeiraLineupPlanner
│   ├── FieldPosition.jsx # Extracted from MadeiraLineupPlanner
│   └── utils.js         # abbreviateName, useMediaQuery, encodeLineup, decodeLineup
└── tabs/
    ├── GamesTab.jsx     # Stub: "Game tracking coming soon"
    └── StatsTab.jsx     # Stub: "Season stats coming soon"
```

**Note on discretion:** The above uses `src/shared/` and `src/tabs/` — a flat feature-based approach. Given the codebase has 3 files today and will have ~10 files after Phase 4, this is appropriately lightweight.

### Pattern 1: HashRouter Tab Shell

**What:** `App.jsx` wraps the entire app in `HashRouter`, renders a persistent `TabBar` component, and uses `Routes`/`Route` to render tab content.

**When to use:** Any time routes are driven by URL but the server doesn't need to handle them (static hosting, PWA).

```jsx
// Source: https://reactrouter.com/start/declarative/navigating
import { HashRouter, Routes, Route, NavLink, Navigate } from "react-router";

function TabBar() {
  const tabStyle = ({ isActive }) => ({
    color: isActive ? C.orange : "rgba(255,255,255,0.55)",
    borderBottom: isActive ? `2px solid ${C.orange}` : "2px solid transparent",
    // ... padding, font, etc.
  });

  return (
    <nav style={{ background: C.navy, display: "flex", /* ... */ }}>
      <NavLink to="/lineup" style={tabStyle}>Lineup</NavLink>
      <NavLink to="/games"  style={tabStyle}>Games</NavLink>
      <NavLink to="/stats"  style={tabStyle}>Stats</NavLink>
    </nav>
  );
}

export default function App() {
  return (
    <HashRouter>
      <TabBar />
      <Routes>
        <Route path="/" element={<Navigate to="/lineup" replace />} />
        <Route path="/lineup" element={<MadeiraLineupPlanner />} />
        <Route path="/games"  element={<GamesTab />} />
        <Route path="/stats"  element={<StatsTab />} />
      </Routes>
    </HashRouter>
  );
}
```

### Pattern 2: Extracting Shared Constants

**What:** Move `C`, `FORMATIONS`, plus new `STAT_TYPES`, `POSITION_GROUP`, `STAT_COLORS` into `src/shared/constants.js`. Export as named exports.

**When to use:** Any constant needed by more than one component.

```js
// src/shared/constants.js
export const C = {
  navy: "#1B2A5B",
  navyLight: "#263A6E",
  navyDark: "#111B3A",
  orange: "#E86420",
  orangeLight: "#FF8C4A",
  orangeGlow: "rgba(232, 100, 32, 0.35)",
  white: "#FFFFFF",
  whiteAlpha: "rgba(255,255,255,0.12)",
  // New stat colors:
  statOffensive: "#E86420",   // orange
  statDefensive: "#4CAFB6",   // teal
  statNeutral: "#6b7280",     // gray
};

export const POSITION_GROUP = {
  GK: "GK",
  DEF: "DEF",
  MID: "MID",
  FWD: "FWD",
};

export const STAT_TYPES = {
  // Offensive
  GOAL: "goal",
  ASSIST: "assist",
  SHOT: "shot",
  // Defensive
  TACKLE: "tackle",
  CLEARANCE: "clearance",
  SAVE: "save",
  // Neutral
  FOUL: "foul",
  // etc. — exact types deferred to Phase 5
};

export const STAT_COLORS = {
  goal: C.statOffensive,
  assist: C.statOffensive,
  shot: C.statOffensive,
  tackle: C.statDefensive,
  clearance: C.statDefensive,
  save: C.statDefensive,
  foul: C.statNeutral,
};
```

### Pattern 3: Firestore Game CRUD

**What:** Extend `firebase.js` with game collection functions using `addDoc`, `updateDoc`, `arrayUnion`, and `increment`.

**When to use:** Creating games (Phase 5 will call these), verifying schema in Firestore console (this phase).

```js
// Source: https://firebase.google.com/docs/firestore/manage-data/add-data
import {
  collection, addDoc, doc, getDoc, updateDoc, arrayUnion,
  serverTimestamp, increment
} from "firebase/firestore";

// ---- GAMES ----
const gamesCol = collection(db, "games");

export async function createGame({ opponent, date, lineup }) {
  try {
    const ref = await addDoc(gamesCol, {
      opponent,
      date,
      status: "setup",
      score: { home: 0, away: 0 },
      lineup: {
        formation: lineup.formation,
        lineups: lineup.lineups,   // half1/half2 position arrays
        roster: lineup.roster,
      },
      events: [],
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error("Failed to create game:", err);
    return null;
  }
}

export async function loadGame(gameId) {
  try {
    const snap = await getDoc(doc(db, "games", gameId));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
  } catch (err) {
    console.warn("Failed to load game:", err);
    return null;
  }
}

export async function updateGameStatus(gameId, status) {
  try {
    await updateDoc(doc(db, "games", gameId), { status });
    return true;
  } catch (err) {
    console.error("Failed to update game status:", err);
    return false;
  }
}

export async function appendGameEvent(gameId, event) {
  try {
    await updateDoc(doc(db, "games", gameId), {
      events: arrayUnion(event),
    });
    return true;
  } catch (err) {
    console.error("Failed to append event:", err);
    return false;
  }
}

// ---- SEASON STATS ----
export async function updateSeasonStats(season, playerId, statDeltas) {
  // statDeltas: { goals: 1, minutes: 45, gamesPlayed: 1 }
  const ref = doc(db, "seasonStats", String(season));
  const updates = {};
  for (const [key, val] of Object.entries(statDeltas)) {
    updates[`players.${playerId}.${key}`] = increment(val);
  }
  try {
    await setDoc(ref, updates, { merge: true });
    return true;
  } catch (err) {
    console.error("Failed to update season stats:", err);
    return false;
  }
}
```

### Pattern 4: Preserving ?lineup= Query Param

**What:** The current share URL puts lineup state in `?lineup=...`. With HashRouter, URLs become `/#/lineup?lineup=...`. The `buildShareUrl` and `decodeLineup` functions must be updated to use `window.location.hash`-relative paths or remain origin-based.

**When to use:** Whenever existing share links or URL sharing behavior is touched.

**Risk:** HashRouter puts the route in the hash (`/#/lineup`). `window.location.search` will be empty — the query param becomes part of the hash: `/#/lineup?lineup=...`. The existing `buildShareUrl` uses `window.location.origin + window.location.pathname` which will produce `https://example.com/`. Update it to include the hash path:

```js
function buildShareUrl(data) {
  // With HashRouter, the full URL is: origin/#/lineup?lineup=...
  return `${window.location.origin}/#/lineup?lineup=${encodeLineup(data)}`;
}
```

And update `decodeLineup` read site to use `new URLSearchParams(window.location.hash.split('?')[1])` instead of `window.location.search`.

**Alternative:** Use `BrowserRouter` to avoid this — `?lineup=` stays in `window.location.search` as expected. Firebase Hosting supports BrowserRouter via a `firebase.json` rewrite rule (`"rewrite": { "source": "**", "destination": "/index.html" }`). This may be simpler than updating the share URL logic.

### Anti-Patterns to Avoid
- **Importing from react-router-dom:** Import from `react-router` in v7. `react-router-dom` is a deprecated re-export shim.
- **Nested `<Router>` components:** Only one `HashRouter` or `BrowserRouter` at the top of the tree. Do not add a router inside `MadeiraLineupPlanner`.
- **Deep prop threading:** `C`, `FORMATIONS`, etc. should be imported directly from `shared/constants.js` — not passed as props.
- **Removing from monolith before confirming imports work:** Extract to shared file, update import in MadeiraLineupPlanner, confirm lineup still works BEFORE extracting the next item.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Active tab indicator state | Manual `useState` for active tab | `NavLink` `style`/`className` callback with `isActive` | Router already knows which route is active — no sync bugs |
| Appending to Firestore array | Read-modify-write (overwrite full array) | `arrayUnion` | Concurrent writes corrupt data; arrayUnion is atomic |
| Incrementing player stat counters | Read-modify-write | `increment()` from firebase/firestore | Same reason — atomic, no race conditions |

**Key insight:** The biggest footgun in this phase is the `?lineup=` query param compatibility with HashRouter. Either solve it explicitly (update `buildShareUrl`) or switch to BrowserRouter + Firebase Hosting rewrite — pick one and document the choice.

## Common Pitfalls

### Pitfall 1: react-router-dom vs react-router Package Name
**What goes wrong:** Installing `react-router-dom@7` and finding it works (it does — it re-exports), then later getting confused about which package to import from.
**Why it happens:** Historical muscle memory; v6 used `react-router-dom`.
**How to avoid:** Install `react-router` and import from `react-router` everywhere.
**Warning signs:** `package.json` lists `react-router-dom` instead of `react-router`.

### Pitfall 2: HashRouter Breaks ?lineup= Query Params
**What goes wrong:** Share URLs like `/#/lineup?lineup=abc` — `window.location.search` is empty, `decodeLineup` finds nothing, lineup doesn't load.
**Why it happens:** HashRouter puts everything after `#` in `window.location.hash`. Query params are part of the hash string, not `location.search`.
**How to avoid:** Either update `buildShareUrl`/read logic to parse from hash, OR use BrowserRouter with Firebase Hosting rewrites.
**Warning signs:** Shared lineup URLs fail silently; no error thrown.

### Pitfall 3: Duplicate C Object After Extraction
**What goes wrong:** `C` is moved to `shared/constants.js` but MadeiraLineupPlanner still defines its own local copy. Both exist, styles look fine, but future edits to one don't affect the other.
**Why it happens:** Copy-paste extraction without removing the source.
**How to avoid:** Delete the original definition from MadeiraLineupPlanner after confirming the import works.
**Warning signs:** Two definitions of `C` exist in the codebase.

### Pitfall 4: Firestore Security Rules Block New Collections
**What goes wrong:** `addDoc(gamesCol, ...)` throws a permission-denied error when the `games` collection doesn't yet exist or Firestore rules don't cover it.
**Why it happens:** Firestore rules must explicitly allow writes to new collections.
**How to avoid:** Check and update Firestore security rules before testing game document writes. During development, a broad rule is fine; tighten before production.
**Warning signs:** Console error `PERMISSION_DENIED: Missing or insufficient permissions`.

### Pitfall 5: serverTimestamp() Cannot Be Read Locally Before Write
**What goes wrong:** After `addDoc`, immediately calling `getDoc` and trying to read `createdAt` as a Date — it may return as a `Timestamp` object, not a JS `Date`.
**Why it happens:** Firestore `Timestamp` is not a JS `Date`. Access with `.toDate()` or `.toMillis()`.
**How to avoid:** Always call `.toDate()` on Firestore Timestamp fields; or convert in the load functions.
**Warning signs:** `createdAt.getTime is not a function`.

## Code Examples

Verified patterns from official sources:

### NavLink with isActive Style Callback
```jsx
// Source: https://reactrouter.com/start/declarative/navigating
<NavLink
  to="/lineup"
  style={({ isActive }) => ({
    color: isActive ? C.orange : "rgba(255,255,255,0.55)",
    borderBottom: isActive ? `3px solid ${C.orange}` : "3px solid transparent",
    padding: "10px 20px",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: "0.5px",
    transition: "color 0.15s ease, border-bottom-color 0.15s ease",
  })}
>
  Lineup
</NavLink>
```

### HashRouter Setup in main.jsx
```jsx
// Source: https://reactrouter.com/start/declarative/installation
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

```jsx
// App.jsx — HashRouter goes here, not in main.jsx
import { HashRouter, Routes, Route, Navigate } from "react-router";

export default function App() {
  return (
    <HashRouter>
      {/* TabBar here */}
      <Routes>
        <Route path="/" element={<Navigate to="/lineup" replace />} />
        <Route path="/lineup" element={<MadeiraLineupPlanner />} />
        <Route path="/games"  element={<GamesTab />} />
        <Route path="/stats"  element={<StatsTab />} />
      </Routes>
    </HashRouter>
  );
}
```

### Firestore addDoc with Embedded Array
```js
// Source: https://firebase.google.com/docs/firestore/manage-data/add-data
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const ref = await addDoc(collection(db, "games"), {
  opponent: "Springfield FC",
  date: "2026-04-05",
  status: "setup",
  score: { home: 0, away: 0 },
  lineup: { formation: "3-3-2", lineups: [[...], [...]], roster: [...] },
  events: [],
  createdAt: serverTimestamp(),
});
// ref.id is the auto-generated game ID
```

### arrayUnion for Appending Events
```js
// Source: https://firebase.google.com/docs/firestore/manage-data/add-data
import { updateDoc, arrayUnion } from "firebase/firestore";

await updateDoc(doc(db, "games", gameId), {
  events: arrayUnion({
    type: "goal",
    playerId: 7,
    half: "1st-half",
    minute: 22,
    ts: Date.now(),
  }),
});
```

### seasonStats Document with Dotted Path Merge
```js
// Source: firebase.google.com/docs/firestore/manage-data/add-data (setDoc merge)
import { setDoc, increment } from "firebase/firestore";

await setDoc(
  doc(db, "seasonStats", "2026"),
  {
    "players.7.goals":      increment(1),
    "players.7.gamesPlayed": increment(1),
    "players.7.minutes":    increment(45),
  },
  { merge: true }
);
// Reads back as: { players: { "7": { goals: N, gamesPlayed: N, minutes: N } } }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-router-dom` package | `react-router` package | v7 (2024) | Import from `react-router`; `react-router-dom` is a deprecated shim |
| `<Switch>` | `<Routes>` | v6 (2021) | Already standard; `<Routes>` is what to use |
| `createHashRouter()` + `RouterProvider` | `<HashRouter>` + `<Routes>` | Both valid in v7 declarative mode | Either works; `<HashRouter>` is simpler for this use case |

**Deprecated/outdated:**
- `react-router-dom`: still works as re-export in v7, but `react-router` is canonical
- `<Switch>`: removed in v6+, replaced by `<Routes>`

## Open Questions

1. **BrowserRouter vs HashRouter for ?lineup= compatibility**
   - What we know: HashRouter breaks `window.location.search` for the existing share URL logic
   - What's unclear: Whether Firebase Hosting already has a rewrite rule configured
   - Recommendation: Check `firebase.json` in the project root. If a catch-all rewrite exists, use BrowserRouter. If not, either add one or update the `buildShareUrl` function for HashRouter.

2. **Exact stat types for STAT_TYPES constant**
   - What we know: Categories are offensive/defensive/neutral; position groups are GK/DEF/MID/FWD
   - What's unclear: Exact stat names per position group (e.g., does GK get "save" or "catch"?)
   - Recommendation: Define placeholder stat types in Phase 4 constants; finalize in Phase 5 when the StatBar UI is built. The structure (object with string values) is what matters now.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test directory, no vitest/jest config found |
| Config file | None — see Wave 0 |
| Quick run command | `npm run test` (once configured) |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Tab bar renders Lineup, Games, Stats tabs | unit | `npx vitest run src/__tests__/App.test.jsx` | Wave 0 |
| INFRA-02 | Shared constants exportable; C, FORMATIONS accessible | unit | `npx vitest run src/__tests__/constants.test.js` | Wave 0 |
| INFRA-03 | MadeiraLineupPlanner renders inside Lineup route without regressions | smoke | `npx vitest run src/__tests__/App.test.jsx` | Wave 0 |
| DATA-01 | createGame writes expected fields to Firestore | manual | Firestore console inspection | N/A — manual only |
| DATA-02 | seasonStats doc has correct structure after updateSeasonStats | manual | Firestore console inspection | N/A — manual only |

**Note on DATA-01 and DATA-02:** Firestore write verification requires a live Firebase project or emulator. These are best validated manually via Firestore console or Firebase emulator during Plan 04-03. Automated unit tests for firebase.js can mock the SDK, but the schema validation itself is a manual console check.

### Sampling Rate
- **Per task commit:** `npx vitest run` (once configured)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Manual Firestore console verification of game doc + season stats doc structure before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/App.test.jsx` — covers INFRA-01, INFRA-03 (tab routing smoke test)
- [ ] `src/__tests__/constants.test.js` — covers INFRA-02 (export verification)
- [ ] `vite.config.js` test config — add `test: { environment: "jsdom" }` if using vitest
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom` — if none detected

## Sources

### Primary (HIGH confidence)
- https://reactrouter.com/start/declarative/navigating — NavLink isActive callback API, verified current (v7.13.1)
- https://reactrouter.com/start/declarative/installation — HashRouter vs BrowserRouter setup, v7 package name (`react-router`)
- https://firebase.google.com/docs/firestore/manage-data/add-data — addDoc, setDoc, arrayUnion, serverTimestamp
- Direct codebase inspection — `src/firebase.js`, `src/MadeiraLineupPlanner.jsx`, `package.json`

### Secondary (MEDIUM confidence)
- https://dev.to/utkvishwas/react-router-v7-a-comprehensive-guide-migration-from-v6-7d1 — v7 migration overview
- https://www.npmjs.com/package/react-router — confirmed v7.13.1 is current

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified react-router v7 package name and APIs from official docs
- Architecture: HIGH — patterns derived directly from existing codebase conventions + official docs
- Pitfalls: HIGH — HashRouter/?lineup= issue is mechanically verifiable; others are standard extraction risks

**Research date:** 2026-03-16
**Valid until:** 2026-06-16 (React Router v7 is stable; Firebase SDK v12 is stable)
