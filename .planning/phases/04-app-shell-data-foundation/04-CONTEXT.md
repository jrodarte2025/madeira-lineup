# Phase 4: App Shell + Data Foundation - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract shared components from the monolith, add bottom tab navigation (Lineup | Games | Stats), and define the Firestore schema for games and season stats. This phase creates the structural prerequisites that all subsequent game features depend on. No game logic, no timers, no stat tracking — just the shell and schema.

</domain>

<decisions>
## Implementation Decisions

### Tab bar design
- Labels only (no icons) — text tabs: "Lineup", "Games", "Stats"
- Active tab: orange text (C.orange #E86420) with 2-3px underline bar; inactive tabs in light gray
- Tab bar background: navy (C.navy #1B2A5B) — matches existing header
- Visible on both mobile and desktop — consistent navigation everywhere
- Lineup tab is the default landing tab (same as today's behavior)

### Stub tab content
- Games tab shows centered "coming soon" message (e.g., "Game tracking coming soon") before Phase 5
- Stats tab shows same pattern with different text (e.g., "Season stats coming soon")
- Both stubs use identical layout/style — just different messaging

### File organization
- Extract PitchSVG, FieldPosition, and C color constants into shared files now (not deferred to Phase 5)
- Add stat colors to the C object: statOffensive (#E86420), statDefensive (#4CAFB6), statNeutral (#6b7280)
- Extract STAT_TYPES, POSITION_GROUP, STAT_COLORS into shared constants file
- New App.jsx shell handles routing and tab bar; MadeiraLineupPlanner.jsx becomes the Lineup tab content

### Claude's Discretion
- Folder structure (flat vs feature-based — pick what fits the codebase best)
- Whether to also split out SaveLoadModal, RosterContent, PlayerChip, or leave them in the monolith
- Exact tab bar height, padding, font size, and underline animation
- Transition behavior when switching tabs

### Game document shape (Firestore schema)
- Explicit score fields: `score: { home: number, away: number }` — coach-editable, not derived from events
- Five-state status lifecycle: `setup → 1st-half → halftime → 2nd-half → completed`
- Lineup snapshot embedded in game doc at creation time (formation, positions, roster) — game is self-contained
- Events array embedded in game doc (decided in prior session — NOT subcollections)
- Game metadata: opponent name, date, status, createdAt timestamp

### Season stats document (Firestore schema)
- One document per season (e.g., `seasonStats/2026`)
- Players map keyed by playerId with running totals (minutes, goals, assists, etc.) and gamesPlayed count
- Single read loads entire dashboard — no per-player fetches needed

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PitchSVG` component (~line 88): SVG field rendering — extract to shared file for reuse in game screen
- `FieldPosition` component (~line 142): Interactive player circles — extract for reuse in game screen with stat badges
- `C` color object: All existing colors (navy, orange, orangeGlow, etc.) — expand with stat-specific colors
- `FORMATIONS` constant: Formation definitions — already shared between halves, will be shared with game screen
- `useMediaQuery` hook (~line 72): Responsive breakpoint detection — reuse across all tabs
- `loadPublishedLineup` / `savePublishedLineup` in firebase.js: Pattern for Firestore CRUD — extend with game functions

### Established Patterns
- Inline styles with conditional ternaries for responsive design (`isMobile ? x : y`)
- `loadStored` / `saveStored` localStorage pattern with `madeira_` prefix
- Single default export per file, named exports for utilities
- Event handlers: `handle{Action}{Target}` naming convention
- Silent error handling with graceful fallbacks

### Integration Points
- `main.jsx`: Currently renders MadeiraLineupPlanner directly — will render App.jsx shell instead
- `firebase.js`: Expand with game CRUD functions (createGame, loadGame, updateGame, etc.)
- URL query param `?lineup=` handling: Must still work within the Lineup tab context
- localStorage keys with `madeira_` prefix: Continue this pattern for any new persisted state

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-app-shell-data-foundation*
*Context gathered: 2026-03-16*
