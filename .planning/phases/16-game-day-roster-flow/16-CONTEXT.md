# Phase 16: Game-Day Roster Flow - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Source:** Conversational design session 2026-04-29 (Jim + Claude); not via /gsd:discuss-phase or PRD

<domain>
## Phase Boundary

**In scope:**
- New "Game-Day Roster" screen for setting per-game inactives between game creation and live-game start
- Saved-lineup-as-template load behavior: ignore stored `inactiveIds` on load; sat-player positions render as empty slots; sat players excluded from bench
- Pre-kickoff "Ready to kick off" screen redesign: un-blur lineup, move "Start Game" CTA to bottom
- Roster Management UI cleanup: remove "sit player" / "make inactive" toggle; keep add/delete only
- Madeira `halves` flow only (no multi-deploy code path changes)

**Out of scope:**
- Halftime lineup adjustment flow (parked — Jim wants this as a separate future phase: "a prompt for adjusting the lineup, simple window where we just make the adjustments and then save")
- Auto-suggesting substitute players when a sat player's position becomes empty (explicitly rejected — manual fill only)
- Changes to live-game timer, halftime, stat logging, summary, or season dashboard behavior
- Multi-deployment / friend / `quarters` code paths
- Migration of existing saved lineups' baked-in `inactiveIds` (those just get ignored on load — graceful forget, no rewrite)

</domain>

<decisions>
## Implementation Decisions

### Terminology (locked)
- **"Inactive" = unavailable for the game** (player is not coming today, not playing). Inactive ≠ benched.
- **State model** for any given game:
  - `Active, on field` — in the lineup's starting positions
  - `Active, on bench` — available, can be subbed in
  - `Inactive` — unavailable, not coming today

### Per-game inactive selection (locked)
- The Game-Day Roster screen MUST appear in BOTH start-game flows:
  - GameSetupModal's "Start Game Now" choice (after step 2 opponent/date entry, before route-nav to live game)
  - GameDetailModal's "Start Game" button on existing setup-status games (between tap and route-nav to live game)
- Selection persists to the existing game-document `inactiveIds` field — no schema change needed (the field already exists, we're just changing WHERE it's written from)
- Default state on entering the screen: all players active (no one inactive)
- UI pattern: roster list with toggle/drag affordance to mark players as "Sitting Today" / "Inactive"; mirror existing roster-list UX style

### Saved lineups as templates (locked)
- Saved lineups loaded into a game IGNORE their stored `inactiveIds` array. They behave as starting-11 + formation templates only.
- Existing saved lineups (created with baked-in inactives via the old PlayerChip "Sit out" flow) forget their old inactives on load — graceful UX shift, no data migration. Jim acknowledged this is fine.
- Loading flow with set per-game inactives:
  - Position assigned to an active player → fills with that player
  - Position assigned to an inactive player → renders as **empty slot, visually distinct** so the coach knows it needs to be manually filled
  - Bench excludes inactive players (they don't appear at all)
- "Sit out" PlayerChip button (`MadeiraLineupPlanner.jsx:55-59`) is REMOVED from the saved-lineup-template builder context (you no longer mark inactives during template creation)
- The PlayerChip "Sit out" button stays in the live-game lineup screen for now (Jim flagged halftime adjustment as a parked future phase; removing it now would leave coaches stuck mid-game)

### Pre-kickoff walkthrough screen (locked)
- The "Ready to kick off, Start Game" screen currently blurs the lineup. The new design un-blurs it.
- Lineup must be readable in this state: field positions and bench, with player names visible — coach reads the lineup to players before starting
- "Start Game" CTA moves to the bottom of the screen (thumb-reach position)
- This is a visual/layout change to an existing screen, not a new screen

### Roster Management cleanup (locked)
- Remove "sit player" / "make inactive" toggle from the Roster Management UI
- KEEP add player and delete player operations
- The Roster Management screen's exact location wasn't surfaced by Explore — planning needs to identify the file via targeted search

### Madeira guardrail (locked, per memory)
- Madeira is Jim's actual team — coaches use the app sideline during real games. This change is being chosen FOR Madeira (not just for the friend's deployment).
- Madeira's full game-day path must run end-to-end with the new flow without regressions in: live-game timer, halftime, stat logging, summary, season dashboard.
- Multi-deploy code paths (`src/deployments/`, `src/config.js`) MUST NOT be touched. This phase operates on Madeira `halves` codepaths only.
- No Firestore collection renames, no localStorage key renames. The `inactiveIds` field continues to exist on game docs — this phase changes where it gets WRITTEN from, not the schema.

### Plan sequencing (locked)
- 16-01 must precede 16-02 (the inactive-aware lineup loader needs the per-game `inactiveIds` write path to exist first)
- 16-03 (pre-kickoff screen) and 16-04 (Roster Management cleanup) are independent of each other and of 16-02; they can run in any wave after 16-01

### Claude's Discretion
- Exact UI of the Game-Day Roster screen (drag-zones vs. toggle list vs. checkboxes) — pick what matches existing roster-list UX
- Visual treatment of "empty slot" on the lineup screen for sat-player positions (dashed border? "Fill me" placeholder text? both?) — pick what's clearest given existing field-circle visuals
- File location for the new Game-Day Roster component (likely `src/games/` or alongside `GamesTab.jsx`) — match existing project conventions
- Exact mechanism for moving the Start Game CTA on the pre-kickoff screen (CSS reorder vs. component restructure) — whichever minimizes diff

</decisions>

<specifics>
## Specific Ideas

### Existing data model (verified via Explore agent earlier in conversation)
- `inactiveIds` is already a per-lineup array (NOT a per-player flag). It lives on:
  - Saved lineups in Firestore `savedLineups` collection (will be ignored on load going forward)
  - Published-game lineups in Firestore (set via `savePublishedLineup` at `src/firebase.js:47-56`) — this is where the new Game-Day Roster screen writes
  - URL-share encoded payloads (via `encodeLineup` at `src/shared/utils.js:87-100`)
- No schema changes needed for `inactiveIds` itself — the field exists and is used. This phase changes WHERE the value is set from.

### Existing entry points to modify
- `src/tabs/GamesTab.jsx` lines 178-403 — GameSetupModal (insert Game-Day Roster step between step 2 and route-nav)
- `src/tabs/GamesTab.jsx` lines 408-615 — GameDetailModal (insert Game-Day Roster step before route-nav)
- `src/tabs/GamesTab.jsx` line 517 — "Start Game" button location in GameDetailModal
- `src/MadeiraLineupPlanner.jsx` lines 55-59 — PlayerChip "Sit out" button (remove from saved-lineup-template builder context)
- `src/MadeiraLineupPlanner.jsx` lines 74-75, 150-168 — PrintPitch inactive-section rendering (revisit: when used in template builder, no inactives section; when used in game lineup screen, sat-player positions render empty)
- Pre-kickoff "Ready to kick off" screen — file location not yet pinpointed; planning agent should locate (likely live game route component or its initial sub-state)
- Roster Management screen — file location not yet pinpointed; planning agent should locate via targeted search ("Roster Management" UI text, or the sit-toggle there)

### Existing test footprint
- 157 tests pass per STATE.md (last verified 2026-04-24 v3.0 autonomous run)
- Madeira smoke path is described in feedback memory: build lineup → publish → live game with timer + stats → post-game summary → season dashboard. This must continue to pass.

</specifics>

<deferred>
## Deferred Ideas

- **Halftime lineup adjustment flow** — Jim wants a dedicated halftime-adjustment UX: "a prompt for adjusting the lineup, simple window where we just make the adjustments and then save." This is its own future phase, NOT v2.2.
- **Auto-suggesting substitutes** when a sat-player position vacates — Jim explicitly rejected. Manual fill only.
- **Migration / rewrite of existing saved lineups' `inactiveIds`** — not needed; load-time ignore is sufficient.

</deferred>

---

*Phase: 16-game-day-roster-flow*
*Context gathered: 2026-04-29 from conversational design session*
