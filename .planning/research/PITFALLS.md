# Pitfalls Research

**Domain:** Live game tracking + stat logging added to existing React SPA (Madeira FC Lineup Planner)
**Researched:** 2026-03-16
**Confidence:** HIGH (timer, Firestore, component architecture pitfalls well-documented); MEDIUM (data integrity edge cases, UX at-field specifics)

---

## Critical Pitfalls

### Pitfall 1: `setInterval`-Based Timers Drift and Die on Mobile

**What goes wrong:**
The 25-minute half timer drifts significantly on mobile. Browsers throttle `setInterval` callbacks when the tab goes to the background, screen locks, or the device is under CPU pressure. A timer that fires every 1000ms in dev will tick inconsistently on an iPhone at the field — potentially running slow by 10–30 seconds over a 25-minute half. More severely, locking the screen mid-half effectively pauses the timer entirely.

**Why it happens:**
`setInterval` is budget-throttled in background tabs (Chrome caps background timers to ~1 call/second or worse; Firefox to a +50ms/-150ms budget). The assumption that "interval fires = time passed" breaks completely the moment the coach's phone screen turns off.

**How to avoid:**
Never use `setInterval` tick-counting to track elapsed time. Instead, store a `startTimestamp` (using `Date.now()`) when the half begins, and compute `elapsed = Date.now() - startTimestamp` on every render cycle. The timer display reads from this calculation, not from a counter. This is accurate even after screen sleep — when the page becomes visible again, the correct elapsed time appears immediately.

```js
// Bad — drifts
const [elapsed, setElapsed] = useState(0);
useEffect(() => {
  const id = setInterval(() => setElapsed(e => e + 1), 1000);
  return () => clearInterval(id);
}, []);

// Good — drift-proof
const startedAt = useRef(Date.now());
const [elapsed, setElapsed] = useState(0);
useEffect(() => {
  const id = setInterval(() => {
    setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
  }, 500); // can fire often; the calculation stays accurate
  return () => clearInterval(id);
}, []);
```

Additionally, listen to the Page Visibility API (`document.addEventListener('visibilitychange')`) to re-sync the display the instant the coach returns to the tab.

**Warning signs:**
- Timer in dev looks fine but is tested only on desktop with tab always visible
- Half-time check reveals timer shows ~22 minutes when wall clock shows 25 minutes
- "The app timer was wrong" complaints after first real game

**Phase to address:** Phase covering timer and game clock implementation (earliest game-mode phase)

---

### Pitfall 2: No Screen Wake Lock — Phone Sleeps Mid-Half

**What goes wrong:**
A coach starts the half, puts the phone in their pocket, and the screen locks. The PWA is suspended. Even with a drift-proof timestamp-based timer (Pitfall 1 addressed), the UI is frozen. More critically, if the coach wants to log a stat 3 minutes later, they return to a locked screen, unlock, and the app has been fully suspended or needs a reload — potentially losing in-progress game state not yet persisted.

**Why it happens:**
iOS Safari and Android Chrome aggressively suspend PWA rendering when the screen locks. Developers test on desktop where this doesn't happen. No one adds Screen Wake Lock because it sounds like a nice-to-have.

**How to avoid:**
Request a Screen Wake Lock when game mode is active:

```js
let wakeLock = null;
async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (e) {
    // Falls through silently — still works, just may sleep
  }
}
```

Release the lock when the game ends. The Screen Wake Lock API has broad support as of 2025 (Chrome, Edge, Samsung Internet on Android; Safari 16.4+ on iOS). It may be denied if the device is in low battery mode — handle that gracefully, not with an error modal. Note: there is a known WebKit bug with home screen web apps (PWA installed to homescreen) where Wake Lock may not function — test explicitly on an installed PWA, not just a browser tab.

**Warning signs:**
- Not testing on an installed PWA (Add to Home Screen) on iPhone
- No `navigator.wakeLock` check in game-mode initialization
- Coach mentions "I had to keep tapping the screen"

**Phase to address:** Phase covering live game screen UI — implement alongside timer initialization

---

### Pitfall 3: Single-Document Per-Stat Writes Accumulate Costs During a Game

**What goes wrong:**
Logging each stat as its own Firestore document (`games/{gameId}/events/{autoId}`) creates a write-per-tap pattern. A 25-minute half might generate 30–60 stat events. Over a 12-game season with 2 halves each, that's 720–1440 individual writes from stat events alone — before counting timer state, substitution events, and score updates. This scales linearly and can produce unexpected billing at higher usage.

**Why it happens:**
The natural Firestore mental model is "one event = one document." Developers write to a subcollection on every tap without considering the aggregate cost or the query complexity it creates later (reading all events for a player's season requires cross-game queries on subcollections).

**How to avoid:**
Use an array-of-events design embedded in the game document for within-game stat events:

```js
// game document structure
{
  gameId: "...",
  opponent: "...",
  date: "...",
  lineupId: "...",
  halves: [
    { startedAt: 1700000000000, endedAt: 1700001500000 },
    { startedAt: 1700001800000, endedAt: 1700003300000 }
  ],
  events: [
    // appended via arrayUnion — one write per stat tap
    { ts: 1700000120000, playerId: "abc", type: "goal", position: "FWD", half: 1 }
  ],
  playerMinutes: {
    "abc": { totalSeconds: 1450, substituted: false }
  }
}
```

Use `arrayUnion` to append individual events — each call is still one write, but the data lives in one document instead of a subcollection. Post-game, denormalize player season totals into a separate `playerStats` document. This avoids the need for cross-game subcollection queries when building season dashboards.

Firestore pricing: ~$0.18/100K writes (Firebase Spark plan has 20K/day free). A single coach running 12 games/season is well within free tier, but designing correctly from the start avoids a rewrite if usage grows.

**Warning signs:**
- `addDoc(collection(db, 'games', gameId, 'events'), ...)` called on every button tap
- Season dashboard code queries multiple subcollections per player per game
- Any `collectionGroup` query planned for stats aggregation

**Phase to address:** Phase covering data model design — must be locked before any stat-writing code is written

---

### Pitfall 4: Game State Loss on App Crash or Forced Reload

**What goes wrong:**
The coach is mid-game. The phone browser reloads (low memory, OS kills tab, accidental navigation). The entire live game state — current half, elapsed time, all stat events logged so far, minute tracking — is gone. The game is over from the app's perspective.

**Why it happens:**
Live game state often lives only in React component state during development. Firestore sync is added "later" as a nice-to-have, but during a live game the writes may be deferred or batched in ways that mean a crash produces a gap.

**How to avoid:**
Two-layer persistence strategy:
1. **localStorage as the primary crash buffer**: Write every state change to `localStorage` immediately and synchronously. This is fast and survives tab reloads. Key: `madeiraGame_inProgress`. On app mount, check this key — if a game is found in progress, offer to resume.
2. **Firestore as the durable record**: Sync the game document to Firestore, but this can tolerate some latency (every 10–30 seconds, or on each meaningful event). Use Firestore offline persistence (already available in the Firebase JS SDK) as a backstop when the coach is on a spotty field connection.

Recovery UX: On app load, if `localStorage` has a game in progress, show a "Resume game vs. [Opponent]?" banner before showing the normal lineup screen. Do not silently discard it.

Firestore offline persistence caveat: there is a known bug where Firestore can lose its IndexedDB connection on some devices and cannot recover without a reload. Don't rely on Firestore alone as the only crash recovery mechanism.

**Warning signs:**
- Game state only in `useState`, no localStorage mirror
- No "resume game" check on app mount
- Firestore persistence not enabled for the web app

**Phase to address:** Phase covering live game screen — implement crash recovery before the first real game test

---

### Pitfall 5: Component Bloat Makes Game Mode Unshippable

**What goes wrong:**
`MadeiraLineupPlanner.jsx` is already ~1600 lines. Adding game mode state, timer logic, stat button rendering, substitution tracking, and post-game summary to the same component produces a 3000+ line file where lineup mode and game mode share state, causing cross-mode bugs, performance issues (every stat tap re-renders the entire lineup pitch), and a component that is effectively impossible to debug.

**Why it happens:**
The incremental approach: "I'll add a `gameMode` flag and render different UI under it." This is fast to start but creates entangled state. Lineup state (`formation`, `lineups`, `bench`, `roster`) and game state (`events`, `halfStartedAt`, `activePlayerMinutes`) have no business living in the same reducer.

**How to avoid:**
Before adding any game-mode features, extract the existing component into at least three files:
- `LineupBuilder.jsx` — drag-and-drop pitch, bench, formation selector (existing v1 functionality)
- `GameTracker.jsx` — live game screen, timer, stat buttons, events feed
- `MadeiraLineupPlanner.jsx` (or `App.jsx`) — shell with tab navigation, shared state (roster, current lineup)

Use separate state domains: lineup state does not bleed into game state. A custom hook `useGameState()` isolates game-mode logic entirely. This also enables targeted `React.memo` on the pitch component so stat taps don't re-render drag-and-drop logic.

**Warning signs:**
- "I'll add a `gameMode` boolean to the existing state" as the first step
- Any lineup-related state read inside game-mode rendering logic
- Re-renders of the pitch SVG/circles on every stat button tap

**Phase to address:** Phase 1 / first phase of v2.0 work — component split is a prerequisite for all other features, not a cleanup task to do later

---

### Pitfall 6: Minute Tracking Breaks on Substitutions Made While Timer is Paused or Between Halves

**What goes wrong:**
Players subbed in at half-time (when the timer is stopped) have their minute tracking start at the wrong time. If the timer is not running when a substitution happens, the minute-start timestamp is recorded as "now" but "now" doesn't correspond to a game-time minute. After the second half starts, the calculation produces incorrect minute totals.

**Why it happens:**
Minute tracking is naturally implemented as "record `Date.now()` when a player enters" and computed as `(Date.now() - entryTime) / 60000`. This works during an active half but produces wrong results when substitutions happen during the halftime break — the player was "on the field" during halftime dead time, which inflates their minute count.

**How to avoid:**
Track minutes in game-time, not wall-clock time. Store half start/stop timestamps explicitly. Player minutes are computed as the intersection of their "on field" intervals with the "half active" intervals:

```
playerMinutes = sum of:
  min(playerExitTime, halfEndTime) - max(playerEntryTime, halfStartTime)
  for each half where the player was on the field
```

This correctly handles: subbed in during halftime (minutes start when next half starts), subbed in mid-half (only counts from that point), and played full game (counts only active half durations, not halftime break).

**Warning signs:**
- Minute tracking implemented as a simple running clock without reference to half state
- No test case for "subbed in exactly at halftime"
- Player minute totals exceed 50 (total possible for 2x25-minute halves)

**Phase to address:** Phase covering per-player minute tracking — design the intersection calculation before any tracking code is written

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep game mode state in the existing monolithic component | Faster to start building | Cross-mode bugs, 3000+ line component, performance regressions on lineup re-renders | Never — split the component first |
| Per-event Firestore subcollection writes | Simple mental model | Expensive cross-game queries for season stats, linear write cost growth | Never for this use case — use array-in-document |
| `setInterval` tick counting for timer | 5-line implementation | Timer drifts, lies after screen sleep | Never for a real game timer |
| Skip Wake Lock implementation | Saves one feature | Coaches' screens sleep mid-half, breaking the entire live game UX | Never — it's a 10-line addition |
| Store game state only in React state (no localStorage buffer) | Simpler code | Any reload mid-game loses everything | Acceptable only during initial prototyping, not for first real-game test |
| Compute season stats on the fly via Firestore queries | No denormalization needed | Slow dashboard loads, expensive reads per page view | Acceptable early; add denormalized totals before season dashboard ships |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Firestore offline persistence | Not enabling it, or assuming it works automatically | Call `enableIndexedDbPersistence(db)` (modular SDK: `initializeFirestore` with `localCache` option) explicitly; handle the "already enabled" rejection in multi-tab scenarios |
| Page Visibility API | Ignoring tab visibility changes, so timer display freezes when returning | `document.addEventListener('visibilitychange', ...)` to force a state sync on `document.visibilityState === 'visible'` |
| Screen Wake Lock API | Treating it as required (crashing if denied) | Wrap in try/catch; denied = acceptable degraded experience, not an error |
| `arrayUnion` for event appending | Using it for large arrays (Firestore document 1MB limit) | For high-frequency events, a single game's events array is safe (a 90-minute game with one event per minute = ~100 items); still audit document size before shipping |
| Firestore `onSnapshot` for live game | Opening a listener on every render cycle | Attach `onSnapshot` once in a `useEffect` with empty deps; return the unsubscribe function |
| localStorage game state | Storing full roster + full game state in one key | Keep game state key separate from lineup state key to avoid overwriting v1 functionality |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No `React.memo` on the pitch/field component | Every stat button tap re-renders the entire drag-and-drop pitch, causing janky taps on mobile | Wrap `LineupPitch` in `React.memo`; ensure stat state is not part of pitch props | First real game use on a mid-range Android phone |
| `onSnapshot` left open after leaving game screen | Firestore reads accumulate in background; battery drain | Always return unsubscribe from `useEffect`; test with tab switching | After switching between Games and Lineup tabs several times |
| Recalculating season stats on every Stats tab render | Stats dashboard noticeably slow to load; multiple Firestore reads on each view | Denormalize running totals into a `playerStats/{playerId}` document updated after each game | At 10+ games in the season |
| Full game document read on every stat tap | Firestore read charges for reads triggered by `onSnapshot` on a large events array | Prefer optimistic local state for event list; only sync to Firestore, don't re-read after each write | Negligible cost at one team; becomes noticeable if app is shared more broadly |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Open Firestore rules (anyone can write) | Malicious stat injection; data corruption | Scope write rules to authenticated coach session, or at minimum to a coach-specific document path; the app is coach-only by design |
| Storing game events with no schema validation | Corrupted event types appear in stats (typos in stat type strings) | Define a `STAT_TYPES` constant object and validate against it before writing; reject unknown types |
| Game document accessible via guessable `gameId` | Anyone with a URL can read game data | Use Firestore auto-generated IDs (not sequential integers); this is the default with `addDoc` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Stat buttons too small on mobile during a game | Coach misses taps while watching the field; logs wrong stats | Minimum 56px touch targets for all stat buttons in game mode (larger than the standard 44px minimum — fingers move fast during a game) |
| No undo for stat events | Accidentally logged goal for wrong player; no way to fix | Show last 3–5 events as an undo-able feed; `arrayRemove` on a Firestore array is safe for single-item undo |
| Game mode and lineup mode share the same screen without clear visual separation | Coach accidentally edits the lineup while a game is live, changing positions mid-game | Game mode and lineup builder must be separate screens with no in-game path back to lineup editing; tabs disable the Lineup tab while a game is in progress |
| Post-game summary modal contains too much information | Coaches skim it quickly on a phone; dense tables are ignored | Lead with the score and top-performer callouts; full stats table is secondary and scrollable |
| No feedback when a stat is logged | Coach taps a button and isn't sure it registered; double-taps | Immediate visual feedback on the button (color flash, brief scale animation) and append to the events feed within 100ms |
| Substitution UI requires too many taps | During a substitution, the coach is also watching the field; a 4-tap flow causes errors | Design substitution as: tap player on field → tap player on bench = complete. Maximum 2 taps. |

---

## "Looks Done But Isn't" Checklist

- [ ] **Timer:** Verify accuracy by locking the phone screen for 5 minutes mid-timer, unlocking, and confirming elapsed time is correct — not just testing in an open browser tab
- [ ] **Screen Wake Lock:** Test specifically on an installed PWA (Add to Home Screen) on iPhone, not just in mobile Safari — there is a known WebKit bug where installed PWAs may not honor Wake Lock
- [ ] **Crash recovery:** Force-close the app mid-game (swipe away on iOS), reopen, confirm the "Resume game?" prompt appears with the correct state
- [ ] **Minute tracking:** Sub a player in at exactly halftime (timer stopped), start second half, verify their minutes show 25 max not 50+
- [ ] **Season dashboard:** Navigate to Stats tab after 3+ games; confirm it loads without visible delay and without showing a loading spinner for more than 500ms
- [ ] **Undo:** Log a stat, immediately hit undo, verify the event disappears from the feed and from the player's badge count
- [ ] **Backward compatibility:** After adding game mode, verify that all v1 lineup functionality (drag-drop, formation change, save, share via URL, print view) still works without regression
- [ ] **Offline behavior:** Enable airplane mode mid-game, log several stats, re-enable network, confirm all events sync to Firestore without data loss

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Timer drift discovered after first real game | LOW | Switch to timestamp-based elapsed time calculation; no data model changes required |
| Screen sleep disrupting games | LOW | Add Screen Wake Lock in game-mode `useEffect`; 10-line change |
| Game state lost due to no crash recovery | MEDIUM | Add localStorage mirror; add resume-game check on mount; requires careful merge logic with existing state initialization |
| Subcollection-per-stat data model (wrong design shipped) | HIGH | Requires migration script to flatten subcollection events into the parent game document; all season dashboard queries need rewriting |
| Monolithic component with game mode entangled | HIGH | Full refactor of the 3000-line component; high regression risk; requires careful extraction with feature parity testing |
| Minute tracking calculated wrong (wall clock vs. game time) | MEDIUM | Fix calculation logic; re-compute and overwrite stored minute totals for all games played so far; manageable for a single team's season |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| `setInterval` timer drift | Phase: Game clock + timer implementation | Lock phone screen for 5 min mid-timer; elapsed time must be accurate on unlock |
| Screen sleep suspending PWA | Phase: Live game screen UI | Test on installed PWA on iPhone; screen must stay on during active game half |
| Per-stat Firestore write cost | Phase: Data model design (before any code) | Review game document schema; no stat subcollections present |
| Game state loss on crash | Phase: Live game screen — state persistence | Force-close mid-game; resume prompt appears on reopen |
| Component bloat / monolith | Phase 1 of v2.0: Component extraction prerequisite | `MadeiraLineupPlanner.jsx` is a shell; game logic lives in `GameTracker.jsx`; no cross-domain state bleed |
| Minute tracking on halftime subs | Phase: Per-player minute tracking | Sub in at halftime; verify minute total does not exceed active half durations |

---

## Sources

- [Page Visibility API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) — browser throttling behavior in background tabs
- [Screen Wake Lock API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) — browser support, HTTPS requirement, request/release lifecycle
- [Screen Wake Lock API — Can I Use](https://caniuse.com/wake-lock) — support tables as of 2025
- [WebKit Bug 254545 — Wake Lock in installed PWAs](https://bugs.webkit.org/show_bug.cgi?id=254545) — known issue with home screen web apps on iOS
- [Access data offline — Firebase Docs](https://firebase.google.com/docs/firestore/manage-data/enable-offline) — Firestore offline persistence setup
- [Firestore offline persistence bug — GitHub Issue #2755](https://github.com/firebase/firebase-js-sdk/issues/2755) — IndexedDB connection loss / crash recovery limitation
- [Understand Cloud Firestore billing — Firebase Docs](https://firebase.google.com/docs/firestore/pricing) — per-write cost structure, batching does not reduce per-op cost
- [Transactions and batched writes — Firebase Docs](https://firebase.google.com/docs/firestore/manage-data/transactions) — `arrayUnion` / `arrayRemove` patterns
- [Harnessing the Page Visibility API with React — Seth Corker](https://blog.sethcorker.com/harnessing-the-page-visibility-api-with-react/) — React integration patterns
- [Common Sense Refactoring of a Messy React Component — Alex Kondov](https://alexkondov.com/refactoring-a-messy-react-component/) — component extraction strategy
- [useState vs useReducer — Dominik Dorfmeister (TkDodo)](https://tkdodo.eu/blog/use-state-vs-use-reducer) — when to use reducers for complex game state

---
*Pitfalls research for: Live game tracking + stats added to React SPA lineup planner*
*Researched: 2026-03-16*
