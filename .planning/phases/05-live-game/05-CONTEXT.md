# Phase 5: Live Game - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete game-day loop: game creation, drift-proof timer with stoppage time, substitutions with per-player minute tracking, position-aware stat logging, and a recent events feed with undo. Coach can run a full game from kickoff to final whistle on their phone without losing data on reload.

</domain>

<decisions>
## Implementation Decisions

### Game creation flow
- Modal from the Games tab — coach taps "+ New Game", modal slides up with opponent name + date fields
- Date field defaults to today's date; coach can change if scheduling ahead
- Auto-links the current lineup — whatever formation + positions are set in the Lineup tab get snapshotted into the game doc
- No lineup picker; coach sets up lineup first, then creates game
- Games tab shows a simple list of past/in-progress games as cards (opponent, date, status, score) — tapping a completed game does nothing yet (Phase 6 adds summary)

### Live game screen layout
- Fixed top bar: score + timer + opponent name — always visible
- Bench strip below the top bar: horizontal scrollable chips for substitutions (same pattern as lineup tab)
- Pitch fills the middle flex area
- Events feed below the pitch: last 3-5 game events with single-tap undo
- StatBar fixed at the bottom edge: position-aware stat buttons, above the tab navigation
- Score editable by tapping the number to increment (+1); long-press to decrement

### Timer & halftime UX
- 25-minute countdown per half (25:00 → 0:00), drift-proof using Date.now() diff
- No pause button — timer runs continuously, matching how real game clocks work
- At 0:00, timer flips to counting UP as stoppage time (+0:01, +0:02...) with an "End Half" button
- Stats and subs remain fully active during stoppage time — no functionality locked out
- After 1st half ends: game enters halftime state with "HALFTIME" banner; bench and pitch interactive for subs; coach taps "Start 2nd Half" when ready
- After 2nd half ends: "Full Time!" prompt with "End Game" button → game status becomes "completed"
- Screen Wake Lock active during game to prevent phone sleeping

### Crash recovery
- All game state mirrored to localStorage during active games (`madeira_` prefix pattern)
- On app reopen with in-progress game: auto-resume with brief banner ("Game in progress — vs [opponent]"), drops coach right back into live game screen
- Timer recalculates from stored start timestamp — no time lost

### Stat recording interaction
- Tap player circle on pitch to select them (highlight) → StatBar updates to show that player's position-group stat buttons
- Tap a stat button to record the event (playerId, stat type, half, timestamp)
- Only field players can receive stats — bench players must be subbed in first
- Stat badge on each player's field circle shows total stat count for the current half (single number)

### Stat types (full position-aware set from requirements)
- GK: Save, Distribution, Clearance, 50/50 Won
- DEF: Tackle, Interception, Clearance, Block, 50/50 Won
- MID: Goal, Assist, Great Pass, Shot on Target, Tackle, Interception, 50/50 Won
- FWD: Goal, Assist, Great Pass, Shot on Target, 50/50 Won
- Color coding: offensive (#E86420 orange), defensive (#4CAFB6 teal), neutral (#6b7280 gray)
- Constants file (src/shared/constants.js) will be updated from simplified set to full requirements set

### Player minute tracking
- Whole minutes only, rounded down — "7" not "7:42"
- Minutes displayed on both field circles AND bench chips
- Field circles: running minute count updates live during active half
- Bench chips: show total game minutes accumulated (e.g., "12m" for a player who played 12 minutes then got subbed out)
- Minutes calculated as intersection of on-field intervals with active half intervals (accounts for subs, halftime, stoppage)
- Coaches use minute display to quickly assess who needs rest or who hasn't played enough

### Claude's Discretion
- Exact styling of the game header bar (padding, font sizes, spacing)
- "End Half" / "Start 2nd Half" button styling and placement
- Events feed layout and event formatting (icons, text, colors)
- StatBar button sizing and arrangement
- How stat categories map to color coding for the expanded stat set
- Game card design on the Games tab list
- localStorage key structure for crash buffer
- Transition animations between game states

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PitchSVG` (src/shared/PitchSVG.jsx): SVG field rendering — reuse directly in live game screen
- `FieldPosition` (src/shared/FieldPosition.jsx): Interactive player circles — extend with stat badge and minute display
- `C` color object (src/shared/constants.js): Includes statOffensive, statDefensive, statNeutral colors
- `FORMATIONS`, `POSITION_GROUP`, `STAT_TYPES`, `STAT_COLORS` (src/shared/constants.js): All ready for game use, STAT_TYPES needs expansion to full requirements set
- `useMediaQuery` hook: Responsive breakpoint detection — reuse for game screen layout
- Firebase CRUD: `createGame`, `loadGame`, `updateGameStatus`, `updateGameScore`, `appendGameEvent` already built

### Established Patterns
- Inline styles with conditional ternaries for responsive design
- `loadStored` / `saveStored` localStorage pattern with `madeira_` prefix
- Drag-and-drop between bench and field (existing touch + mouse handlers) — reuse for substitutions
- Silent error handling with graceful fallbacks
- HashRouter with tab navigation (App.jsx)

### Integration Points
- `App.jsx` Routes: Add `/games/:id` route for live game screen
- `GamesTab.jsx`: Currently a stub — will become the game list + "New Game" entry point
- `firebase.js`: Game CRUD functions ready; may need `listGames()` for the Games tab list
- `src/shared/constants.js`: STAT_TYPES and STAT_COLORS need expansion from 7 stats to full position-aware set
- Tab bar: Should hide during active game (full-screen game experience) or remain visible — Claude's discretion

</code_context>

<specifics>
## Specific Ideas

- Stoppage time is important — coach needs to record stats that happen after 25:00 but before the ref blows the whistle
- Minute display is for quick coaching decisions — "who's been in too long?" and "who hasn't played yet?" at a glance
- Bench chips showing minutes helps the coach see who's been sitting and needs to get in the game

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-live-game*
*Context gathered: 2026-03-16*
