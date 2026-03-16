# Architecture Research

**Domain:** Live game tracking + stats overlay on top of an existing lineup planner SPA
**Researched:** 2026-03-16
**Confidence:** HIGH — based on direct inspection of the existing codebase

---

## Existing Architecture (v1.0 Baseline)

Before designing v2.0 integration, here is exactly what exists:

```
src/
├── MadeiraLineupPlanner.jsx   (~1674 lines, single component file)
│   ├── Utility functions (encodeLineup, decodeLineup, buildShareUrl, shareLineup)
│   ├── Constants (C colors, fontBase, fontDisplay, INITIAL_ROSTER, FORMATIONS)
│   ├── Sub-components (PitchSVG, FieldPosition, RosterContent, SaveLoadModal, ...)
│   ├── Custom hooks (useMediaQuery, useTouchDrag)
│   └── MadeiraLineupPlanner() — main component, all state lives here
├── firebase.js                (Firestore: single "lineups/published" doc)
└── main.jsx                   (app entry point)
```

**Current Firestore schema:**

```
lineups/
  published           { formation, lineups, inactiveIds, roster, name, savedAt }
```

**Current state in MadeiraLineupPlanner:**
- `roster` — array of { id, name, num }
- `inactiveIds` — array of player IDs
- `formation` — string key into FORMATIONS
- `activeHalf` — 1 | 2
- `lineups` — { 1: [playerId|null × 9], 2: [playerId|null × 9] }
- `selectedPlayer`, `dragSource`, modal flags, toast, sharedName, cloudLoaded
- All state auto-synced to localStorage + Firestore (debounced 1.5s)

---

## System Overview (v2.0 Target)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Tab Navigation Shell                         │
│                    (Lineup | Games | Stats tabs)                     │
├──────────────┬──────────────────────────┬───────────────────────────┤
│              │                          │                           │
│  LineupTab   │       GameTab            │      StatsTab             │
│  (existing   │  ┌─────────────────┐    │  ┌─────────────────┐     │
│  planner,    │  │ GameSetupModal  │    │  │ SeasonDashboard │     │
│  untouched)  │  ├─────────────────┤    │  ├─────────────────┤     │
│              │  │  LiveGameScreen │    │  │  PlayerProfile  │     │
│              │  │  - Timer        │    │  └─────────────────┘     │
│              │  │  - Field w/     │    │                           │
│              │  │    stat buttons │    │                           │
│              │  │  - Events feed  │    │                           │
│              │  ├─────────────────┤    │                           │
│              │  │ PostGameSummary │    │                           │
│              │  └─────────────────┘    │                           │
└──────────────┴──────────────────────────┴───────────────────────────┘
         │                    │                        │
         └────────────────────┴────────────────────────┘
                                    │
              ┌─────────────────────┴──────────────────────┐
              │              firebase.js (expanded)          │
              │  loadPublishedLineup / savePublishedLineup   │
              │  createGame / saveGameStats / getGames       │
              │  getPlayerSeasonStats                        │
              └──────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┴──────────────────────┐
              │                  Firestore                   │
              │  lineups/published          (existing)       │
              │  games/{gameId}             (new)            │
              │  games/{gameId}/events/{n}  (new subcoll.)   │
              │  seasons/{seasonId}/stats   (new)            │
              └──────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Responsibility | New / Modified |
|-----------|----------------|----------------|
| `App` (new wrapper in main.jsx) | Renders tab shell, routes between tabs, holds `activeTab` state | NEW — replaces direct render of MadeiraLineupPlanner |
| `TabBar` | Bottom navigation (Lineup / Games / Stats), 44px touch targets | NEW |
| `MadeiraLineupPlanner` | Unchanged lineup builder — all v1.0 functionality | MODIFIED: receives props for "Start Game" handoff only |
| `GameTab` | Game list screen + entry point for live game or game setup | NEW |
| `GameSetupModal` | Opponent name, date, link to saved lineup | NEW |
| `LiveGameScreen` | Full-screen game mode — timer, field with stat buttons, events feed | NEW |
| `PostGameSummary` | Read-only stats grid after game ends, export/share actions | NEW |
| `StatsTab` | Season dashboard and player profile routing | NEW |
| `SeasonDashboard` | Aggregated per-player totals, minutes, game count | NEW |
| `PlayerProfile` | Individual player's history across all games | NEW |
| `firebase.js` | Add game CRUD functions alongside existing lineup functions | MODIFIED |

---

## Recommended File Structure

```
src/
├── MadeiraLineupPlanner.jsx       (unchanged except "Start Game" button addition)
├── firebase.js                    (add game/stats functions)
├── main.jsx                       (mount App instead of MadeiraLineupPlanner directly)
├── App.jsx                        (NEW — tab shell + routing)
│
├── game/                          (NEW — all live game features)
│   ├── GameTab.jsx                game list, create button
│   ├── GameSetupModal.jsx         create game form
│   ├── LiveGameScreen.jsx         timer + stat logging UI
│   ├── PostGameSummary.jsx        post-game stats grid
│   └── useGameTimer.js            timer hook (interval, pause, half transitions)
│
├── stats/                         (NEW — season + player stats)
│   ├── StatsTab.jsx               season dashboard
│   └── PlayerProfile.jsx          per-player detail
│
└── shared/                        (NEW — shared constants and utils)
    ├── constants.js               STAT_TYPES, POSITION_GROUPS, C colors (extract from MadeiraLineupPlanner)
    └── statUtils.js               aggregate stats from game events
```

### Structure Rationale

- **`game/` folder:** All live game code is isolated. The lineup builder doesn't know about it. Clean boundary.
- **`stats/` folder:** Read-only views over Firestore game data. No write logic here — read and aggregate only.
- **`shared/constants.js`:** STAT_TYPES and POSITION_GROUPS are needed by both LiveGameScreen and StatsTab. Extract them from MadeiraLineupPlanner rather than duplicating.
- **`firebase.js` stays single file:** Avoids splitting Firestore logic; functions are simple and self-contained. Expand rather than split.
- **`App.jsx` vs wrapping MadeiraLineupPlanner:** Adding an App shell keeps MadeiraLineupPlanner self-contained. main.jsx renders `<App />` instead of `<MadeiraLineupPlanner />` directly.

---

## Firestore Collection Design

### Existing (unchanged)

```
lineups/published      { formation, lineups, inactiveIds, roster, name, savedAt }
```

### New Collections

```
games/{gameId}
  {
    id: string,                    // auto-generated
    opponent: string,              // "Mariemont FC"
    date: string,                  // ISO date "2026-03-15"
    linkedLineupName: string,      // optional — name of saved lineup used
    formation: string,             // formation at game start (snapshot)
    halfOneLineup: [playerId|null × 9],   // snapshot from lineup at kickoff
    halfTwoLineup: [playerId|null × 9],   // snapshot after halftime
    roster: [{ id, name, num }],   // roster snapshot (handles name changes)
    status: "setup"|"first_half"|"halftime"|"second_half"|"final",
    halfOneDuration: number,       // seconds elapsed in 1st half (default 1500)
    halfTwoDuration: number,       // seconds elapsed in 2nd half
    createdAt: Timestamp,
    finalizedAt: Timestamp|null,
  }

games/{gameId}/events (subcollection)
  {
    id: string,
    minute: number,                // game minute when stat logged
    half: 1 | 2,
    playerId: number,
    playerName: string,            // denormalized — survives roster edits
    positionLabel: string,         // "CM", "GK", etc. — position at time of event
    statKey: string,               // "goal", "tackle", "save", etc.
    statLabel: string,             // human label "Goal", "Tackle", "Save"
    statCategory: "offensive"|"defensive"|"neutral",
    createdAt: Timestamp,
  }

seasons/{seasonId}
  {
    id: string,                    // e.g. "2026"
    label: string,                 // "Spring 2026"
    startDate: string,
    endDate: string,
  }
```

**Why a subcollection for events instead of an embedded array?**

Firestore documents have a 1MB cap. A busy game with many stat taps could accumulate hundreds of events. Subcollections avoid the cap, allow per-event reads (for undo), and make it straightforward to query events by player across games later.

**Why snapshot the lineup and roster in the game document?**

Player names and jersey numbers can be edited after a game. Snapshotting at game creation means historical summaries always reflect who actually played, not the current roster state.

**Why denormalize playerName and statLabel in events?**

Makes event feed rendering and post-game summary display fast — no joins required. Firestore has no server-side joins anyway.

---

## Architectural Patterns

### Pattern 1: Tab Shell with Uncontrolled Tab Content

**What:** `App.jsx` renders a `TabBar` and conditionally mounts one of three tab components. Tab content manages its own state; the shell only tracks `activeTab`.

**When to use:** Simple screen-level navigation where tabs don't need to share live state across each other.

**Trade-offs:** Tab state resets when switching tabs unless lifted or persisted. For this app that is acceptable — game state lives in Firestore, not in component memory.

```jsx
// App.jsx
function App() {
  const [activeTab, setActiveTab] = useState("lineup");
  return (
    <>
      {activeTab === "lineup" && <MadeiraLineupPlanner />}
      {activeTab === "games" && <GameTab />}
      {activeTab === "stats" && <StatsTab />}
      <TabBar active={activeTab} onChange={setActiveTab} />
    </>
  );
}
```

### Pattern 2: Game State as Firestore Document, Timer as Local State

**What:** The game document in Firestore is the source of truth for game metadata (status, lineups, roster snapshot). The countdown timer lives only in component state and refs — it is not persisted to Firestore on every tick. Only the elapsed duration is written when halves end or game is finalized.

**When to use:** When real-time collaboration is not a requirement (coach-only, single device). Avoids a Firestore write every second.

**Trade-offs:** If the coach closes the browser mid-game, elapsed time since last write is lost. Mitigate by writing duration on tab visibility change (`visibilitychange` event).

```js
// useGameTimer.js sketch
function useGameTimer(initialSeconds = 1500) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const start = () => { setRunning(true); };
  const pause = () => { setRunning(false); };

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setElapsed(s => {
        if (s >= initialSeconds) { clearInterval(intervalRef.current); setRunning(false); return s; }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, initialSeconds]);

  return { elapsed, running, start, pause };
}
```

### Pattern 3: Position Group Lookup for Stat Buttons

**What:** When rendering stat buttons for a player, resolve their position label (e.g. "CM") to a group ("MID") via a lookup map, then render the stat buttons defined for that group.

**When to use:** Every tap on a player circle in LiveGameScreen.

**Trade-offs:** Position label must match the keys in FORMATIONS. This is already the case in v1.0.

```js
// shared/constants.js
export const POSITION_GROUP = {
  GK: "GK",
  LB: "DEF", CB: "DEF", RB: "DEF", LCB: "DEF", RCB: "DEF",
  LM: "MID", CM: "MID", RM: "MID", LCM: "MID", RCM: "MID",
  LS: "FWD", RS: "FWD", LW: "FWD", RW: "FWD", CF: "FWD", ST: "FWD",
};

export const STAT_TYPES = {
  GK:  [
    { key: "save",         label: "Save",         category: "defensive" },
    { key: "distribution", label: "Distribution", category: "offensive" },
    { key: "clearance",    label: "Clearance",    category: "defensive" },
    { key: "fifty_fifty",  label: "50/50 Won",    category: "neutral"   },
  ],
  DEF: [
    { key: "tackle",       label: "Tackle",       category: "defensive" },
    { key: "interception", label: "Interception", category: "defensive" },
    { key: "clearance",    label: "Clearance",    category: "defensive" },
    { key: "block",        label: "Block",        category: "defensive" },
    { key: "fifty_fifty",  label: "50/50 Won",    category: "neutral"   },
  ],
  MID: [
    { key: "goal",         label: "Goal",         category: "offensive" },
    { key: "assist",       label: "Assist",       category: "offensive" },
    { key: "great_pass",   label: "Great Pass",   category: "offensive" },
    { key: "shot_on_target",label: "Shot on Target",category: "offensive"},
    { key: "tackle",       label: "Tackle",       category: "defensive" },
    { key: "interception", label: "Interception", category: "defensive" },
    { key: "fifty_fifty",  label: "50/50 Won",    category: "neutral"   },
  ],
  FWD: [
    { key: "goal",         label: "Goal",         category: "offensive" },
    { key: "assist",       label: "Assist",       category: "offensive" },
    { key: "great_pass",   label: "Great Pass",   category: "offensive" },
    { key: "shot_on_target",label: "Shot on Target",category: "offensive"},
    { key: "fifty_fifty",  label: "50/50 Won",    category: "neutral"   },
  ],
};

export const STAT_COLORS = {
  offensive: "#E86420",
  defensive: "#4CAFB6",
  neutral:   "#6b7280",
};
```

### Pattern 4: Minute Tracking via Sub Entry/Exit Events

**What:** Track minutes played per player by recording `{ playerId, action: "on"|"off", minute }` events. At display time, compute total minutes by pairing on/off events. Players who start and never sub off are treated as playing until the half ends.

**When to use:** Substitution tracking in LiveGameScreen. Drag-to-bench = "off" event; drag-to-position = "on" event.

**Trade-offs:** Computing minutes from events is slightly more complex than storing a running counter, but survives browser refresh and supports undo (delete the event).

**Integration with existing drag-and-drop:** The existing `handlePositionDrop` and `handleRosterDrop` handlers in LiveGameScreen (which will mirror the lineup planner's drag logic) will fire minute events as a side effect when the game is live.

---

## Data Flow

### Logging a Stat

```
Coach taps player circle on live field
    ↓
Player's position label resolved → POSITION_GROUP lookup → group (e.g. "MID")
    ↓
Stat button sheet renders (STAT_TYPES["MID"])
    ↓
Coach taps stat button
    ↓
addDoc(games/{gameId}/events, { minute, half, playerId, statKey, ... })
    ↓
Local optimistic update → events array in LiveGameScreen state
    ↓
Recent events feed re-renders (last 5)
    ↓
Stat badge count on player circle re-renders
```

### Starting a Game

```
Coach taps "+ New Game" in GameTab
    ↓
GameSetupModal: enter opponent, date, select saved lineup (optional)
    ↓
createGame() in firebase.js:
  - Snapshots current roster + formation + lineups
  - Creates games/{gameId} with status: "setup"
    ↓
GameTab navigates to LiveGameScreen with gameId prop
    ↓
LiveGameScreen loads game doc, renders field from halfOneLineup snapshot
    ↓
Coach taps "Start Game" → game.status = "first_half", timer starts
```

### Post-Game Summary

```
Timer auto-stops at 1500s OR coach taps "End Half" → "End Game"
    ↓
game.status = "final", halfTwoDuration written to Firestore
    ↓
PostGameSummary renders: queries games/{gameId}/events
    ↓
statUtils.aggregateByPlayer(events) → { playerId: { goal: 2, tackle: 1, ... } }
    ↓
Table: rows = players, columns = all stat types that appeared in game
    ↓
Export: CSV download (client-side) | Share: encode summary to URL
```

### Season Dashboard

```
StatsTab mounts
    ↓
getDocs(query(games, where("status","==","final"), orderBy("date","desc")))
    ↓
For each finalized game, getDocs(games/{gameId}/events) subcollection
    ↓
statUtils.aggregateAcrossGames(allEvents) → per-player season totals
    ↓
SeasonDashboard renders sortable table
    ↓
Tap player row → PlayerProfile renders filtered view for that player
```

---

## Integration Points: New vs Modified

### What is MODIFIED in v1.0 code

| File | Change | Why |
|------|--------|-----|
| `main.jsx` | Render `<App />` instead of `<MadeiraLineupPlanner />` | Tab shell needs to wrap everything |
| `MadeiraLineupPlanner.jsx` | Add "Start Game" button in header (desktop) and mobile controls bar | Entry point to create a game from current lineup |
| `firebase.js` | Add `createGame`, `updateGameStatus`, `addStatEvent`, `getGames`, `getGameEvents`, `getFinishedGames` | Game data layer |

### What is NEW

| File | Purpose |
|------|---------|
| `App.jsx` | Tab shell, `activeTab` state, TabBar rendering |
| `game/GameTab.jsx` | List of past games, "+ New Game" button |
| `game/GameSetupModal.jsx` | Form: opponent, date, lineup link |
| `game/LiveGameScreen.jsx` | Full-screen game mode — timer, field, stat buttons, events feed |
| `game/PostGameSummary.jsx` | Read-only stats grid, CSV export, share |
| `game/useGameTimer.js` | 25-minute countdown, pause/resume, auto-stop |
| `stats/StatsTab.jsx` | Season totals dashboard |
| `stats/PlayerProfile.jsx` | Per-player game-by-game history |
| `shared/constants.js` | POSITION_GROUP, STAT_TYPES, STAT_COLORS (extracted from inline definitions) |
| `shared/statUtils.js` | `aggregateByPlayer()`, `aggregateAcrossGames()`, `computeMinutesPlayed()` |

### What is UNTOUCHED

All existing drag-and-drop logic, touch drag, formation switching, bench, save/load modal, print view, URL sharing, localStorage sync, and Firestore lineup auto-sync remain completely unchanged. The lineup builder is mounted as a tab with no awareness of games.

---

## Key Boundary: LiveGameScreen vs LineupPlanner

LiveGameScreen is **not** a modification of MadeiraLineupPlanner. It is a separate component that:

1. Renders a **read-only** version of the pitch from the game's saved lineup snapshot (no formation switching, no drag-to-bench)
2. Adds stat tap overlays on player circles
3. Adds substitution handling that fires minute events as a side effect
4. Uses the same `PitchSVG` and `FieldPosition` components (extracted or imported) for visual consistency

The lineup builder and game screen share only the visual pitch components and the `shared/constants.js` data. They do not share state.

---

## Anti-Patterns

### Anti-Pattern 1: Putting Timer State in Firestore

**What people do:** Write `currentTimerSeconds` to Firestore on every tick to survive refreshes.

**Why it's wrong:** 1 write/second = 90 Firestore writes per half. At scale this hits quotas and costs money. The timer is display state, not business data.

**Do this instead:** Keep elapsed seconds in `useRef` (not even `useState` for the interval tick — use a ref for the count, `useState` only for the display value with a 1-second update). Write only `halfOneDuration` and `halfTwoDuration` when halves finish. Optionally write on `visibilitychange` as a checkpoint.

### Anti-Pattern 2: Mutating the Live Lineup in Place During a Game

**What people do:** Allow the coach to edit the lineup builder while a game is in progress, expecting the game screen to reflect those changes.

**Why it's wrong:** The game has a fixed lineup snapshot from kickoff. Midgame roster edits (correcting a name typo, marking someone inactive) should not retroactively change what positions were recorded for events.

**Do this instead:** The game document stores a frozen snapshot (`halfOneLineup`, `halfTwoLineup`, `roster`) taken at game start. LiveGameScreen reads only from this snapshot. The lineup builder and game screen are fully independent after game creation.

### Anti-Pattern 3: Querying All Events for the Season in One Read

**What people do:** Fetch every event document across every game to build the season dashboard in one query.

**Why it's wrong:** With 10+ games of 50+ events each, this becomes hundreds of reads on every StatsTab mount.

**Do this instead:** Maintain a `seasons/{seasonId}/playerStats` document that is updated (incremented) when each game is finalized. Season dashboard reads one document; per-game detail reads one subcollection. Keep the expensive aggregation as an on-finalize write, not an on-load read.

**Note:** For v2.0 with one team and a short season, the "query everything" approach is fine as a starting point. Extract the denormalized season stats document in a later phase when game count grows.

### Anti-Pattern 4: Growing the MadeiraLineupPlanner Component Further

**What people do:** Keep adding features (timer, stat buttons, game creation) into the existing 1674-line component.

**Why it's wrong:** The component is already at the limit of comfortable maintainability. Adding live game logic (interval timers, Firestore event writes, stat button sheets) would make debugging and future changes increasingly difficult.

**Do this instead:** New screens live in new files. MadeiraLineupPlanner gets two small additions only: a "Start Game" button that passes current lineup data to game creation, and a note that it receives `onStartGame` as an optional prop.

---

## Suggested Build Order

The following order respects dependencies and delivers working value at each step:

1. **Foundation (do first):** Extract `shared/constants.js` (STAT_TYPES, POSITION_GROUP, STAT_COLORS, C colors). Create `App.jsx` + `TabBar`. Mount all three tabs as stubs. Confirm tab navigation works without breaking v1.0.

2. **Firestore game layer:** Expand `firebase.js` with game functions. No UI yet — just write and test the data model in the Firestore console.

3. **Game creation flow:** `GameTab.jsx` + `GameSetupModal.jsx` — create a game doc from current lineup, navigate to game screen stub.

4. **LiveGameScreen timer + field:** Render the pitch from the snapshot, `useGameTimer.js`, half transitions. No stats yet — just prove the game lifecycle works (setup → first_half → halftime → second_half → final).

5. **Stat logging:** Tap player circle → stat button sheet → write event to Firestore subcollection → show badge count + events feed. Add undo (delete last event).

6. **Minute tracking:** Sub in/out events during live game. `computeMinutesPlayed()` utility. Display minutes on post-game summary.

7. **PostGameSummary:** After game finalized, aggregate events and render stats grid. CSV export. Share link.

8. **Season dashboard + player profiles:** `StatsTab.jsx`, `SeasonDashboard.jsx`, `PlayerProfile.jsx`. Query finished games and aggregate.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 team, 1 season (~15 games) | Current design is fine. Query all events on StatsTab load. |
| 1 team, multiple seasons | Add season filter to queries. Already designed with `seasons/{seasonId}` in schema. |
| Multiple teams (future) | Add `teamId` field to game documents and route queries accordingly. Not in v2.0 scope. |
| Spectator sharing (future) | Add a `public: true` flag to game documents. Share URL encodes `gameId`. Read-only listener on the game doc renders a score/summary for non-coaches. Event subcollection already structured for this. |

---

## Sources

- Direct inspection of `src/MadeiraLineupPlanner.jsx` (1674 lines) — component structure, state model, drag-and-drop handlers, Firestore sync pattern
- Direct inspection of `src/firebase.js` — current Firestore schema and functions
- `.planning/PROJECT.md` — v2.0 feature requirements, stat type definitions, position group mapping, out-of-scope constraints
- Firestore documentation on subcollection design and 1MB document limit (HIGH confidence — well-established Firestore constraint)
- React interval timer patterns — `useRef` for interval ID, `useState` only for display values (HIGH confidence — standard React pattern)

---

*Architecture research for: Madeira FC Lineup Planner v2.0 — Live Game Tracking integration*
*Researched: 2026-03-16*
