# Phase 5: Live Game - Research

**Researched:** 2026-03-16
**Domain:** React game clock, Screen Wake Lock API, localStorage crash recovery, drag-and-drop substitution events, position-aware stat UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Game creation: modal from Games tab, "+ New Game" tap, opponent name + date fields, defaults to today
- No lineup picker — lineup is snapshotted from whatever is set in Lineup tab at game creation time
- Games tab shows list of past/in-progress games as cards (opponent, date, status, score)
- Fixed top bar: score + timer + opponent name
- Bench strip below top bar: horizontal scrollable chips
- Pitch fills middle flex area
- Events feed below pitch: last 3-5 game events with single-tap undo
- StatBar fixed at bottom edge above tab navigation
- Score: tap to increment (+1), long-press to decrement
- 25-minute countdown per half (25:00 → 0:00), drift-proof using Date.now() diff
- No pause button — timer runs continuously
- At 0:00, timer flips to counting UP as stoppage time with "End Half" button
- Stats and subs fully active during stoppage time
- After 1st half ends: halftime state with "HALFTIME" banner; "Start 2nd Half" button
- After 2nd half ends: "Full Time!" prompt with "End Game" button → status becomes "completed"
- Screen Wake Lock active during game
- All game state mirrored to localStorage during active games (`madeira_` prefix)
- On app reopen with in-progress game: auto-resume with brief banner, drops coach into live game screen
- Timer recalculates from stored start timestamp
- Tap player circle to select (highlight) → StatBar shows that player's position-group buttons
- Tap stat button to record event (playerId, stat type, half, timestamp)
- Only field players can receive stats — bench players must be subbed in first
- Stat badge on each player's field circle: total stat count for current half (single number)
- GK: Save, Distribution, Clearance, 50/50 Won
- DEF: Tackle, Interception, Clearance, Block, 50/50 Won
- MID: Goal, Assist, Great Pass, Shot on Target, Tackle, Interception, 50/50 Won
- FWD: Goal, Assist, Great Pass, Shot on Target, 50/50 Won
- Color coding: offensive (#E86420 orange), defensive (#4CAFB6 teal), neutral (#6b7280 gray)
- Whole minutes only, rounded down
- Minutes on field circles (running, updates live) and bench chips (total accumulated)
- Minutes = intersection of on-field intervals with active half intervals

### Claude's Discretion

- Exact styling of game header bar (padding, font sizes, spacing)
- "End Half" / "Start 2nd Half" button styling and placement
- Events feed layout and event formatting (icons, text, colors)
- StatBar button sizing and arrangement
- How stat categories map to color coding for the expanded stat set
- Game card design on the Games tab list
- localStorage key structure for crash buffer
- Transition animations between game states
- Whether tab bar hides during active game or remains visible

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GAME-01 | Coach can create a game with opponent name and date, linked to current lineup | `createGame()` in firebase.js already built; modal component pattern, lineup snapshot approach |
| GAME-02 | Game screen loads as a separate view with the linked lineup on a pitch | HashRouter `/games/:id` route; reuse PitchSVG + FieldPosition; load game doc via `loadGame()` |
| GAME-03 | Coach can start a half with a single tap; 25-minute timer counts down and auto-stops | `useRef` for `startTimestamp`; `requestAnimationFrame` loop; stoppage-time flip at 0 |
| GAME-04 | Timer uses timestamp-based elapsed time (not setInterval ticks) for accuracy | `Date.now()` diff pattern; rAF loop; never setInterval for display |
| GAME-05 | Screen Wake Lock prevents phone from sleeping during active game | Screen Wake Lock API (`navigator.wakeLock.request('screen')`); reacquire on `visibilitychange`; iOS WebKit bug workaround |
| GAME-06 | Game state is mirrored to localStorage for crash recovery | `saveStored`/`loadStored` pattern from MadeiraLineupPlanner; game-specific keys under `madeira_` prefix |
| SUB-01 | Dragging a field player to bench (or vice versa) during a game logs a substitution event | Extend existing drag-and-drop handlers to emit sub events; `appendGameEvent()` call |
| SUB-02 | Per-player minutes tracked automatically (starts on sub-in, pauses on sub-out) | Interval array per player `[{inAt, outAt}]`; store in local game state + localStorage mirror |
| SUB-03 | Running minute count (to the minute) displayed on each player's field circle during game | FieldPosition prop extension; live computation from `Date.now()` - half start time |
| SUB-04 | Minutes calculated as intersection of on-field intervals with active half intervals | Pure function `calcMinutes(intervals, halves)` — testable; floor(seconds/60) |
| STAT-01 | Tapping a player on the pitch selects them and shows position-group StatBar buttons | `selectedPlayerId` state; `onClick` on FieldPosition; StatBar reads player's position group |
| STAT-02 | Stat buttons are position-aware (GK/DEF/MID/FWD each get different stat options) | `POSITION_STATS` map in constants.js; derive position group from position label |
| STAT-03 | Stat buttons are color-coded (orange=offensive, teal=defensive, gray=neutral) | `STAT_COLORS` already in constants.js; expand for new stat names |
| STAT-04 | Each button tap records a stat event with playerId, stat type, half, and timestamp | `appendGameEvent()` call; event shape `{type:'stat', playerId, stat, half, t}` |
| STAT-05 | Stat badge count shown on each player's field circle for current half | `useMemo` over events array filtered by playerId + current half; pass as prop to FieldPosition |
| STAT-06 | Recent events feed (last 3-5 events) displayed near StatBar with single-tap undo | Slice last N from local events array; undo = filter out by event id; Firestore sync with `updateDoc` replacing events array |
| DATA-03 | All game state mirrored to localStorage during active games | `useEffect` on every state mutation; same `madeira_` prefix as lineup planner |
</phase_requirements>

---

## Summary

Phase 5 is the most complex phase in the v2.0 roadmap. It assembles four independent subsystems — game creation, a drift-proof timer, substitution tracking, and stat recording — into a single live game experience that must survive phone lock/reload without data loss.

The project already has all foundational primitives: drag-and-drop handlers, `FieldPosition`/`PitchSVG` components, firebase game CRUD functions, and the `loadStored`/`saveStored` localStorage pattern. Phase 5 is almost entirely new UI components wired to existing infrastructure rather than new infrastructure itself.

The main technical risks are: (1) Screen Wake Lock behaves differently in installed PWA mode on iOS (a known WebKit bug — already flagged in STATE.md); (2) the timer must never drift even after returning from a locked phone, which requires a `requestAnimationFrame` loop against a stored `Date.now()` start timestamp rather than `setInterval`; (3) the minute-calculation algorithm for substitutions must correctly handle halftime gaps and stoppage time, which is a non-trivial interval intersection problem.

**Primary recommendation:** Build each plan's subsystem with a clear local state shape first, then wire to Firestore and localStorage. The `calcMinutes()` function (SUB-04) should be extracted as a pure utility and tested with manual assertions before integration.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Component state, effects, refs | Already in project |
| react-router | 7.13.1 | `/games/:id` route for live game screen | Already installed, HashRouter pattern established |
| firebase/firestore | 12.10.0 | Game doc persistence, `appendGameEvent`, `updateGameStatus` | Already in project with full game CRUD |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Screen Wake Lock API | Browser native | Prevent phone sleep during game | No package needed — `navigator.wakeLock.request('screen')` |
| localStorage | Browser native | Crash buffer via `madeira_` prefixed keys | No package needed — same pattern as lineup planner |
| requestAnimationFrame | Browser native | Drift-proof timer loop | No package needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| rAF timer loop | `setInterval` | setInterval drifts over time and doesn't account for tab backgrounding — rAF against Date.now() diff is the correct pattern for game clocks |
| localStorage mirror | Firestore real-time listener | Firestore listener requires network; localStorage is synchronous and works offline/after crash |

**Installation:**
No new packages required. All needed libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── shared/
│   ├── constants.js       # Expand STAT_TYPES + STAT_COLORS for full position-aware set
│   ├── FieldPosition.jsx  # Extend: statBadge prop + minuteDisplay prop
│   ├── PitchSVG.jsx       # Reuse as-is
│   └── utils.js           # Add calcMinutes() pure function
├── tabs/
│   └── GamesTab.jsx       # Game list + GameSetupModal
└── games/                 # New directory for live game screen
    ├── LiveGameScreen.jsx  # Main game screen orchestrator
    ├── GameHeader.jsx      # Score + timer + opponent bar
    ├── BenchStrip.jsx      # Horizontal scrollable bench chips with minute display
    ├── EventsFeed.jsx      # Last 3-5 events with undo
    └── StatBar.jsx         # Position-aware stat buttons
```

### Pattern 1: Drift-Proof Game Clock

**What:** A `useRef` stores the wall-clock timestamp when a half starts. A `requestAnimationFrame` loop recomputes elapsed time as `Date.now() - startTimestamp` on every frame. The displayed time is always derived from this diff, never from accumulated ticks.

**When to use:** Any time a timer must survive phone lock, tab switch, or page reload.

**Example:**
```javascript
// Source: MDN Web Docs — requestAnimationFrame pattern
const startTsRef = useRef(null);
const rafRef = useRef(null);
const [displaySeconds, setDisplaySeconds] = useState(0);

function startHalf() {
  startTsRef.current = Date.now();
  // Persist to localStorage immediately
  saveStored("game_halfStart", startTsRef.current);
  tick();
}

function tick() {
  const elapsed = Math.floor((Date.now() - startTsRef.current) / 1000);
  setDisplaySeconds(elapsed);
  rafRef.current = requestAnimationFrame(tick);
}

// On crash recovery: restore startTsRef.current from localStorage
// and call tick() — no time lost
```

**Stoppage time:** When `elapsed >= 1500` (25 min), flip to stoppage mode. Continue accumulating `elapsed - 1500` and display as `+MM:SS`. Show "End Half" button.

### Pattern 2: localStorage Crash Buffer

**What:** Mirror all mutable game state to localStorage immediately on every mutation. On mount, check for in-progress game key and offer resume.

**When to use:** Any stateful live session where reload = data loss.

**Example:**
```javascript
// Existing pattern from MadeiraLineupPlanner.jsx — extend for game state
const loadStored = (key, fallback) => {
  try { const v = localStorage.getItem(`madeira_${key}`); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const saveStored = (key, value) => {
  try { localStorage.setItem(`madeira_${key}`, JSON.stringify(value)); } catch {}
};

// Game-specific keys (Claude's discretion on exact names):
// madeira_activeGameId       — gameId of in-progress game
// madeira_gameStatus         — "1st-half" | "halftime" | "2nd-half"
// madeira_halfStartTs        — Date.now() when current half started
// madeira_fieldPositions     — current bench/field positions
// madeira_events             — local events array (source of truth while game active)
// madeira_playerIntervals    — {[playerId]: [{inAt, outAt|null}]}
```

**Resume flow on mount:**
```javascript
useEffect(() => {
  const activeId = loadStored("activeGameId", null);
  if (activeId) {
    // Show resume banner, navigate to /games/:activeId
    navigate(`/games/${activeId}`);
  }
}, []);
```

### Pattern 3: Position-Aware Stat Constants

**What:** A `POSITION_STATS` map in constants.js maps each position group to its ordered array of stat names.

**Example:**
```javascript
// Expand STAT_TYPES in src/shared/constants.js
export const POSITION_STATS = {
  GK:  ["save", "distribution", "clearance", "fifty_fifty"],
  DEF: ["tackle", "interception", "clearance", "block", "fifty_fifty"],
  MID: ["goal", "assist", "great_pass", "shot_on_target", "tackle", "interception", "fifty_fifty"],
  FWD: ["goal", "assist", "great_pass", "shot_on_target", "fifty_fifty"],
};

// STAT_COLORS — expand for new stat names
export const STAT_COLORS = {
  // Offensive
  goal: C.statOffensive,
  assist: C.statOffensive,
  great_pass: C.statOffensive,
  shot_on_target: C.statOffensive,
  // Defensive
  save: C.statDefensive,
  tackle: C.statDefensive,
  interception: C.statDefensive,
  clearance: C.statDefensive,
  block: C.statDefensive,
  // Neutral
  fifty_fifty: C.statNeutral,
  distribution: C.statNeutral,
};
```

**Derive position group from position label:**
```javascript
// Maps position labels from FORMATIONS to POSITION_GROUP
function getPositionGroup(label) {
  if (label === "GK") return "GK";
  if (["LB","CB","RB","LCB","RCB"].includes(label)) return "DEF";
  if (["LM","CM","RM","LCM","RCM"].includes(label)) return "MID";
  if (["LS","RS","LW","CF","RW","ST"].includes(label)) return "FWD";
  return "MID"; // safe fallback
}
```

### Pattern 4: Minute Calculation (Pure Function)

**What:** Given a player's on-field intervals and the half's active intervals, compute total minutes as intersection length, floored to whole minutes.

**When to use:** SUB-04 — call whenever displaying minutes or when game ends.

**Example:**
```javascript
// src/shared/utils.js — pure function, easy to test manually
export function calcMinutes(fieldIntervals, halfIntervals) {
  let totalMs = 0;
  for (const fi of fieldIntervals) {
    const fiEnd = fi.outAt ?? Date.now();
    for (const hi of halfIntervals) {
      const hiEnd = hi.endAt ?? Date.now();
      const overlapStart = Math.max(fi.inAt, hi.startAt);
      const overlapEnd = Math.min(fiEnd, hiEnd);
      if (overlapEnd > overlapStart) totalMs += overlapEnd - overlapStart;
    }
  }
  return Math.floor(totalMs / 60000);
}

// Usage — halfIntervals stored in game state:
// [
//   { startAt: ts1, endAt: ts2 },   // 1st half
//   { startAt: ts3, endAt: null },   // 2nd half (ongoing)
// ]
```

### Pattern 5: Screen Wake Lock

**What:** Request a wake lock when game starts; release when game ends or app goes background; reacquire on `visibilitychange` (the page becomes visible again).

**When to use:** GAME-05 — active during "1st-half", "2nd-half", and stoppage time states.

**Example:**
```javascript
// Source: MDN Web Docs — Screen Wake Lock API
const wakeLockRef = useRef(null);

async function acquireWakeLock() {
  if (!("wakeLock" in navigator)) return; // graceful fallback
  try {
    wakeLockRef.current = await navigator.wakeLock.request("screen");
  } catch (err) {
    console.warn("Wake lock failed:", err); // not a crash
  }
}

function releaseWakeLock() {
  wakeLockRef.current?.release();
  wakeLockRef.current = null;
}

// Reacquire after tab comes back into focus
useEffect(() => {
  const handler = () => {
    if (document.visibilityState === "visible" && gameIsActive) {
      acquireWakeLock();
    }
  };
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}, [gameIsActive]);
```

**iOS WebKit bug:** On installed PWA (Add to Home Screen), the wake lock may silently fail or not reacquire after the screen turns on. This is a confirmed WebKit bug (#254545). The fix: always wrap in try/catch and test on physical device. The UI should not break if wake lock is unavailable — it is a convenience, not a hard requirement.

### Pattern 6: Substitution Event Logging

**What:** Extend the existing drag-and-drop handlers in LiveGameScreen. When a drag completes during an active game (status is "1st-half" or "2nd-half" or stoppage), log a sub event and update the player's interval array.

**Example:**
```javascript
// In the drop handler — after updating fieldPositions state:
if (gameIsActive && wasFieldToField === false) {
  const now = Date.now();
  const event = {
    id: crypto.randomUUID(),
    type: "sub",
    playerOut: fieldPlayer.id,
    playerIn: benchPlayer.id,
    half: currentHalf,        // 1 or 2
    t: now,
  };
  // Update local intervals
  setPlayerIntervals(prev => {
    const updated = { ...prev };
    // Close outgoing player's interval
    if (updated[playerOut]) {
      const intervals = [...updated[playerOut]];
      intervals[intervals.length - 1] = { ...intervals[intervals.length - 1], outAt: now };
      updated[playerOut] = intervals;
    }
    // Open incoming player's interval
    updated[playerIn] = [...(updated[playerIn] || []), { inAt: now, outAt: null }];
    return updated;
  });
  // Append to local events + Firestore
  addEvent(event);
}
```

### Anti-Patterns to Avoid

- **`setInterval` for timer display:** Drifts by seconds per minute on mobile. Always use `Date.now()` diff in a rAF loop.
- **Deriving minutes from interval count instead of timestamps:** "Player was on for 3 intervals, each 8 minutes" breaks as soon as stoppage time or halftime gaps are involved. Always use `calcMinutes()` against the actual half intervals.
- **Reading from Firestore during active game:** Game state mutations should hit localStorage first, Firestore asynchronously. Never await Firestore before updating UI.
- **Storing events only in Firestore:** If the write fails mid-game, the coach loses data. Local events array (mirrored to localStorage) is the source of truth; Firestore is the persistence layer.
- **Calling `appendGameEvent` for every stat tap during a rally:** Fine for this scale, but each call is a separate Firestore write. The local events array absorbs all mutations; undo removes from local; Firestore sync can be batched if needed (not needed for Phase 5).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drift-proof timer | Custom setInterval accumulator | `Date.now()` diff + rAF loop | setInterval is paused by browser when tab is backgrounded |
| Screen sleep prevention | CSS animation trick | Screen Wake Lock API | The CSS trick (invisible animation) is unreliable and wastes battery |
| Atomic Firestore event append | Read-modify-write on events array | `arrayUnion()` already in firebase.js | Prevents race conditions between rapid stat taps |
| UUID for event IDs | Custom timestamp-based ID | `crypto.randomUUID()` | Guaranteed unique, available in all modern browsers |

**Key insight:** The drag-and-drop, Firebase CRUD, and localStorage patterns are already production-tested in the lineup builder. Phase 5 extends them rather than reimplementing.

---

## Common Pitfalls

### Pitfall 1: Timer Drift from setInterval
**What goes wrong:** `setInterval(() => setSeconds(s => s + 1), 1000)` falls behind by 200-400ms per minute on mobile when the CPU is throttled, and stops entirely when the phone locks.
**Why it happens:** The browser suspends JS timers in background tabs and locked screens.
**How to avoid:** Store `halfStartTimestamp = Date.now()` when the half begins. In a rAF loop, compute `elapsed = Date.now() - halfStartTimestamp`. Display is always derived from this diff. On resume, restore `halfStartTimestamp` from localStorage — the elapsed time self-corrects.
**Warning signs:** Clock shows less time elapsed than wall clock after phone was locked.

### Pitfall 2: Lost Game State on Reload Without localStorage Sync
**What goes wrong:** Coach locks phone to sub a player, comes back, app reloads (PWA can reload on focus), game state is gone.
**Why it happens:** React state is in memory. Without localStorage sync, a reload loses everything.
**How to avoid:** `useEffect` on every mutable game state variable (fieldPositions, events, playerIntervals, gameStatus, halfStartTimestamp) with immediate `saveStored()`. On mount, check for `madeira_activeGameId` and restore.
**Warning signs:** Testing: reload the app while a game is "in progress" — the resume prompt should appear.

### Pitfall 3: Minute Display Freezing During Stoppage Time
**What goes wrong:** Coach expected minutes to keep counting up during stoppage time, but `calcMinutes()` caps at 25 because it uses half duration as the upper bound.
**Why it happens:** If `halfIntervals[current].endAt` is set to the 25:00 mark instead of staying `null`, stoppage time minutes are excluded.
**How to avoid:** During an active half (including stoppage), `halfIntervals[current].endAt` stays `null` — it is only set when "End Half" is tapped. `calcMinutes()` uses `endAt ?? Date.now()` so it captures real elapsed time including stoppage.

### Pitfall 4: Position Group Mismatch
**What goes wrong:** A CB (center back) gets MID stats because `getPositionGroup("CB")` returns `"MID"` as the fallback.
**Why it happens:** Position labels from FORMATIONS (LCB, RCB, LB, RB, CB) were not all listed in the mapping function.
**How to avoid:** Enumerate all formation position labels explicitly in `getPositionGroup()`. Review every label from the 4 formations in constants.js. Test each label against the function before shipping.
**Warning signs:** A defender's StatBar showing "Goal" and "Assist" buttons.

### Pitfall 5: Screen Wake Lock Not Reacquired After Phone Unlock
**What goes wrong:** Coach starts game, phone auto-locks, coach unlocks — screen now sleeps after 30 seconds because wake lock was released on lock.
**Why it happens:** Wake lock is automatically released by the browser when the page is hidden.
**How to avoid:** Always listen for `visibilitychange` and reacquire the lock when `document.visibilityState === 'visible'` and the game is still active.
**Warning signs:** Test: start game, lock phone, unlock — screen sleeps during game.

### Pitfall 6: Undo Removes Wrong Event
**What goes wrong:** Two stat events for the same player are recorded rapidly; undo removes the wrong one.
**Why it happens:** Events identified by timestamp can collide if tapped very fast; events without IDs can only be removed by index.
**How to avoid:** Assign `id: crypto.randomUUID()` to every event at creation time. Undo always filters by `event.id`, never by index.

### Pitfall 7: listGames() Missing from firebase.js
**What goes wrong:** GamesTab needs to display a list of all games but `firebase.js` only has `loadGame(id)` — there is no list function.
**Why it happens:** Phase 4 built single-game CRUD but the list query was deferred to Phase 5.
**How to avoid:** Plan 05-01 must add `listGames()` to `firebase.js` using `getDocs(query(gamesCol, orderBy("createdAt", "desc")))`.

---

## Code Examples

Verified patterns from existing codebase and MDN:

### loadStored / saveStored (existing pattern — use as-is)
```javascript
// Source: src/MadeiraLineupPlanner.jsx lines 544-549
const loadStored = (key, fallback) => {
  try { const v = localStorage.getItem(`madeira_${key}`); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const saveStored = (key, value) => {
  try { localStorage.setItem(`madeira_${key}`, JSON.stringify(value)); } catch {}
};
```

### appendGameEvent (existing — use as-is)
```javascript
// Source: src/firebase.js lines 144-153
export async function appendGameEvent(gameId, event) {
  try {
    await updateDoc(doc(db, "games", gameId), { events: arrayUnion(event) });
    return true;
  } catch (err) {
    console.error("Failed to append game event:", err);
    return false;
  }
}
```

### Game status enum (existing — reference from firebase.js)
```
"setup" | "1st-half" | "halftime" | "2nd-half" | "completed"
```

### Firestore listGames (new — add to firebase.js in 05-01)
```javascript
import { getDocs, query, orderBy } from "firebase/firestore";

export async function listGames() {
  try {
    const snap = await getDocs(query(gamesCol, orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Failed to list games:", err);
    return [];
  }
}
```

### Score increment interaction
```javascript
// Tap to increment, long-press to decrement
<div
  onClick={() => onScoreChange(score + 1)}
  onContextMenu={(e) => { e.preventDefault(); onScoreChange(Math.max(0, score - 1)); }}
  // For mobile long-press:
  onTouchStart={() => { pressTimer.current = setTimeout(() => onScoreChange(Math.max(0, score - 1)), 500); }}
  onTouchEnd={() => clearTimeout(pressTimer.current)}
>
  {score}
</div>
```

### FieldPosition extension for stat badge + minute display
```javascript
// Add props to FieldPosition.jsx:
// statCount: number — total stats this half (0 hides badge)
// minuteDisplay: string | null — "12m" or null
// isSelected: boolean — highlight for stat recording

{statCount > 0 && (
  <div style={{
    position: "absolute", top: -4, right: -4,
    background: C.orange, color: C.white,
    borderRadius: "50%", width: 18, height: 18,
    fontSize: 10, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    {statCount}
  </div>
)}
{minuteDisplay && (
  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>
    {minuteDisplay}
  </div>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `setInterval` ticking seconds | `Date.now()` diff in rAF loop | Standard since ~2018 | Eliminates timer drift entirely |
| Subcollection per event in Firestore | `arrayUnion` append to embedded events array | Already decided in Phase 4 | Simpler reads, atomic writes, no listener needed |
| BrowserRouter requiring server rewrites | HashRouter | Decided in Phase 4 | SPA works on any static host (Firebase Hosting) |

**Deprecated/outdated:**
- `setInterval` for game clocks: unreliable on mobile — do not use.
- Subcollection-per-event approach: already rejected in Phase 4 decisions.

---

## Open Questions

1. **Screen Wake Lock on installed iOS PWA (WebKit bug #254545)**
   - What we know: The wake lock may silently fail or drop when screen locks on iOS PWAs. This is a confirmed browser bug. The app should not crash.
   - What's unclear: Whether it will completely fail or just intermittently fail on the specific iOS version the coach uses.
   - Recommendation: Wrap all wake lock calls in try/catch. Add a small visual indicator (e.g., subtle icon in header) so the coach knows if wake lock is active. Test on a physical iPhone before declaring GAME-05 complete.

2. **Tab bar visibility during live game**
   - What we know: The CONTEXT.md marks this as Claude's discretion.
   - What's unclear: Hiding the tab bar reclaims ~56px of vertical space on a phone, which is meaningful on the pitch view.
   - Recommendation: Hide the tab bar on the `/games/:id` route by conditionally rendering `<TabBar />` only when not on a game route. Use `useLocation()` to detect. This is a clean pattern and gives the game screen full height.

3. **Events undo and Firestore sync**
   - What we know: Undo removes from local events array. Firestore uses `arrayUnion` (append-only) — there is no `arrayRemove` for a specific element with `arrayUnion` semantics.
   - What's unclear: The most efficient undo sync strategy.
   - Recommendation: For undo, use `updateDoc` to replace the entire `events` array (not `arrayUnion`). Since the local array is the source of truth during an active game, this is safe: `updateDoc(gameRef, { events: localEventsArray })`. The race condition risk is acceptable because only one device runs a given game.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed — no vitest/jest config found in project |
| Config file | None — see Wave 0 gaps |
| Quick run command | `npx vitest run --reporter=verbose` (after Wave 0 setup) |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAME-01 | `createGame()` stores opponent/date/lineup in Firestore shape | unit | `npx vitest run src/tests/firebase.test.js` | ❌ Wave 0 |
| GAME-04 | Timer drift-proof: `Date.now()` diff equals expected seconds | unit | `npx vitest run src/tests/timer.test.js` | ❌ Wave 0 |
| SUB-04 | `calcMinutes()` correctly intersects intervals across halftime | unit | `npx vitest run src/tests/utils.test.js` | ❌ Wave 0 |
| STAT-02 | `getPositionGroup()` maps all formation labels correctly | unit | `npx vitest run src/tests/utils.test.js` | ❌ Wave 0 |
| STAT-06 | Undo removes correct event by id, not by index | unit | `npx vitest run src/tests/utils.test.js` | ❌ Wave 0 |
| GAME-03 | Timer auto-stops at 0:00 and flips to stoppage mode | manual | Start game, watch timer reach 0 | Manual only |
| GAME-05 | Screen Wake Lock acquired on start, reacquired on unlock | manual | Physical device test | Manual only |
| GAME-06 | Crash recovery shows resume prompt after reload | manual | Start game, reload app | Manual only |
| SUB-01 | Drag during game logs sub event | manual | Drag player during active game | Manual only |
| SUB-03 | Running minute display updates live | manual | Visual inspection during game | Manual only |

### Sampling Rate
- **Per task commit:** `npx vitest run src/tests/utils.test.js` (pure function tests only)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + manual device checklist before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/tests/utils.test.js` — covers `calcMinutes()` (SUB-04), `getPositionGroup()` (STAT-02)
- [ ] `src/tests/firebase.test.js` — covers `createGame()` shape (GAME-01), `listGames()` (new)
- [ ] `src/tests/timer.test.js` — covers timer drift-proof logic (GAME-04)
- [ ] Framework install: `npm install --save-dev vitest` — no test runner found in project

---

## Sources

### Primary (HIGH confidence)
- MDN Web Docs — Screen Wake Lock API: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- MDN Web Docs — requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
- MDN Web Docs — crypto.randomUUID: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
- Existing codebase: `src/firebase.js`, `src/MadeiraLineupPlanner.jsx`, `src/shared/constants.js` — patterns verified directly

### Secondary (MEDIUM confidence)
- WebKit bug #254545 (Screen Wake Lock on installed iOS PWA): referenced in project STATE.md as a known concern
- Firestore arrayUnion documentation — https://firebase.google.com/docs/firestore/manage-data/add-data#update_elements_in_an_array

### Tertiary (LOW confidence)
- None — all critical claims verified from source code or official browser APIs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all libraries already in project
- Architecture: HIGH — patterns verified directly from existing codebase
- Pitfalls: HIGH — timer drift, wake lock, localStorage sync are well-documented browser behaviors
- Validation: MEDIUM — test framework not yet installed; test shapes are standard Vitest patterns

**Research date:** 2026-03-16
**Valid until:** 2026-06-16 (90 days — stable browser APIs)
