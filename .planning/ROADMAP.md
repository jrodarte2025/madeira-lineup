# Roadmap: Madeira FC Lineup Planner

## Milestones

- ✅ **v1.0 — UX Improvements** - Phases 1-3 (shipped 2026-03-16)
- 🚧 **v2.0 — Live Game Tracking & Stats** - Phases 4-7 (in progress)

## Phases

<details>
<summary>✅ v1.0 — UX Improvements (Phases 1-3) — SHIPPED 2026-03-16</summary>

### Phase 1: Display Polish
**Goal**: Players are immediately readable on the field and bench at a glance
**Depends on**: Nothing (first phase)
**Requirements**: DISP-01, DISP-02, DISP-03
**Success Criteria** (what must be TRUE):
  1. Field position circles show abbreviated names (e.g., "J. Smith") that fit without truncation
  2. Bench/roster area shows each player's full name
  3. Field position circles are large enough that name and position label are legible without zooming
**Plans:** 1/1 plans complete

Plans:
- [x] 01-01-PLAN.md — Add name abbreviation utility, enlarge field circles, update print formatting

### Phase 2: Drag-and-Drop Completion
**Goal**: Coaches can move players in any direction using drag-and-drop with no dead ends
**Depends on**: Phase 1
**Requirements**: DND-01, DND-02, DND-03
**Success Criteria** (what must be TRUE):
  1. Dragging a field player to the bench removes them from their position (spot becomes empty)
  2. Dragging a bench player onto an occupied field position swaps them — bench player goes to field, field player goes to bench
  3. Dragging a bench player onto an empty field position assigns them to that spot
**Plans:** 2/2 plans complete

Plans:
- [x] 02-01-PLAN.md — Drag-and-drop logic (field-to-bench removal, bench-to-field swap) and visual drag feedback
- [x] 02-02-PLAN.md — Click interaction parity (field-to-field swap, double-click remove) and full verification

### Phase 3: Mobile UX Overhaul
**Goal**: Coaches can build and adjust lineups on a phone as quickly and comfortably as on desktop
**Depends on**: Phase 2
**Requirements**: MOB-01, MOB-02, MOB-03, MOB-04, PRES-01
**Success Criteria** (what must be TRUE):
  1. On mobile, the bench/roster appears above the field and is immediately visible without scrolling or opening a drawer
  2. On mobile, the formation selector and controls appear below the field
  3. All buttons and touch targets on mobile are large enough to tap accurately with a thumb
  4. The desktop layout is pixel-for-pixel identical to before this phase — no regressions
  5. Touch drag-and-drop works on mobile (touchstart/touchmove/touchend) for all interaction types
**Plans:** 2/2 plans complete

Plans:
- [x] 03-01-PLAN.md — Touch drag-and-drop engine (custom touch events) + mobile chip strip above field
- [x] 03-02-PLAN.md — Mobile layout reorganization, roster modal, bench scrubber, PWA, Firestore auto-sync

</details>

---

### 🚧 v2.0 — Live Game Tracking & Stats (In Progress)

**Milestone Goal:** Transform the lineup planner into a live game management tool with automatic timers, position-aware stat tracking, post-game summaries, and season-long player statistics.

**Phase Numbering:**
- Integer phases (4, 5, 6, 7): v2.0 planned work
- Decimal phases (4.1, 4.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 4: App Shell + Data Foundation** - Extract shared components, add tab navigation, lock Firestore schema before any game code (completed 2026-03-16)
- [ ] **Phase 5: Live Game** - Complete game-day loop: game creation, drift-proof timer, substitutions, minute tracking, stat logging, events feed
- [x] **Phase 6: Post-Game Summary + Exports** - Stats table, CSV download, shareable link, and image export card (completed 2026-03-17)
- [ ] **Phase 7: Season Dashboard + Player Profiles** - Running tallies across all games and per-player season history

## Phase Details

### Phase 4: App Shell + Data Foundation
**Goal**: The app has tab navigation and a locked Firestore schema — both prerequisites that make all subsequent game features possible
**Depends on**: Phase 3 (v1.0 complete)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. Three tabs (Lineup, Games, Stats) are visible at the bottom of the screen and navigate between views
  2. The existing lineup builder works identically inside the Lineup tab — no v1.0 regressions
  3. Shared constants (STAT_TYPES, POSITION_GROUP, STAT_COLORS) are extracted into reusable files and importable by game and stats components
  4. A game document can be written to and read from Firestore games collection with embedded events array (verified in Firestore console)
  5. Denormalized season stats document structure exists in Firestore and accepts player total updates
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — Extract shared constants, PitchSVG, FieldPosition, and utilities into src/shared/
- [ ] 04-02-PLAN.md — App.jsx shell with HashRouter, TabBar, stub tabs, and react-router wiring
- [ ] 04-03-PLAN.md — Expand firebase.js with game CRUD and season stats functions

### Phase 5: Live Game
**Goal**: A coach can run a complete game from kickoff to final whistle — timer counts down, substitutions log player minutes, and tapping any player records a stat — all without losing data on a phone reload
**Depends on**: Phase 4
**Requirements**: GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06, SUB-01, SUB-02, SUB-03, SUB-04, STAT-01, STAT-02, STAT-03, STAT-04, STAT-05, STAT-06, DATA-03
**Success Criteria** (what must be TRUE):
  1. Coach creates a game with opponent name and date, linked to the current lineup, and the game screen opens showing that lineup on a pitch
  2. Tapping Start Game begins a 25-minute countdown; the timer auto-stops at 0:00 and prompts for second half; tapping Start 2nd Half starts another 25-minute countdown that auto-stops
  3. If the phone is locked or reloaded mid-game, the coach sees a resume prompt and the game continues from exactly where it left off
  4. Dragging a player on/off the field during a game logs a substitution; each player's field circle shows their current running minute count
  5. Tapping a player shows position-appropriate stat buttons (GK/DEF/MID/FWD each get their own set); tapping a button records the stat and increments the badge on that player's circle
  6. The last 3-5 game events are visible in a feed; any single event can be undone with one tap
**Plans**: 5 plans

Plans:
- [ ] 05-00-PLAN.md — Wave 0: Install vitest, create test file stubs for utils, firebase, and timer
- [ ] 05-01-PLAN.md — Expand constants for full stat set, add listGames() + replaceGameEvents() + getPositionGroup(), build GamesTab with game list + creation modal, wire /games/:id route
- [ ] 05-02-PLAN.md — LiveGameScreen with drift-proof timer (Date.now diff), game state machine, crash recovery, Screen Wake Lock, localStorage crash buffer + auto-resume
- [ ] 05-03-PLAN.md — Substitution handling during active game, per-player minute tracking with interval intersection, calcMinutes() utility, live minute display on field circles and bench chips
- [ ] 05-04-PLAN.md — StatBar with position-aware stat buttons, color coding, stat badge counts on field circles, recent events feed with single-tap undo via replaceGameEvents(), end-to-end verification checkpoint

### Phase 6: Post-Game Summary + Exports
**Goal**: When the final whistle blows, the coach has a complete game record they can review, download, and share in one tap
**Depends on**: Phase 5
**Requirements**: POST-01, POST-02, POST-03, POST-04, POST-05
**Success Criteria** (what must be TRUE):
  1. After the second half auto-stops, a summary appears showing every player's stat counts and minutes played in a table
  2. Tapping Export CSV downloads a file with one row per player and columns for each stat type
  3. Tapping Share Link copies a URL that anyone can open to view the read-only game summary
  4. Tapping Share Image generates and downloads (or shares via the system share sheet) a summary card suitable for group chat
**Plans:** 2/2 plans complete

Plans:
- [ ] 06-01-PLAN.md — Summary utility functions (TDD), finalizeGame firebase function, route wiring, handleEndGame interval persistence fix, html-to-image install
- [ ] 06-02-PLAN.md — GameSummaryScreen with stats table, CSV export, share link, ShareCard image export, public read-only mode

### Phase 7: Season Dashboard + Player Profiles
**Goal**: Coaches can see how every player has performed across all games of the season, with per-player drill-down
**Depends on**: Phase 6
**Requirements**: SEASON-01, SEASON-02, SEASON-03
**Success Criteria** (what must be TRUE):
  1. The Stats tab shows a dashboard with every player's season totals (minutes, goals, assists, and other tracked stats) aggregated across all completed games
  2. Tapping a player on the dashboard opens their profile showing a game-by-game breakdown of their stats and minutes
  3. Finalizing a game immediately updates the season totals — the dashboard reflects the new game without any manual step
**Plans**: TBD

Plans:
- [ ] 07-01: StatsTab season dashboard — denormalized totals from Firestore, sortable columns
- [ ] 07-02: PlayerProfile view — game-by-game history, statUtils.aggregateAcrossGames()
- [ ] 07-03: Season totals write on game finalize — SEASON-03 trigger, denormalized playerStats update

## Progress

**Execution Order:**
v1.0: 1 → 2 → 3 (complete)
v2.0: 4 → 5 → 6 → 7

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Display Polish | v1.0 | 1/1 | Complete | 2026-03-16 |
| 2. Drag-and-Drop Completion | v1.0 | 2/2 | Complete | 2026-03-16 |
| 3. Mobile UX Overhaul | v1.0 | 2/2 | Complete | 2026-03-16 |
| 4. App Shell + Data Foundation | 3/3 | Complete   | 2026-03-16 | - |
| 5. Live Game | 4/5 | In Progress|  | - |
| 6. Post-Game Summary + Exports | 2/2 | Complete   | 2026-03-17 | - |
| 7. Season Dashboard + Player Profiles | v2.0 | 0/3 | Not started | - |
