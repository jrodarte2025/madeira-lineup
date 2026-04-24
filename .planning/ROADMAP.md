# Roadmap: Madeira FC Lineup Planner

## Milestones

- ✅ **v1.0 — UX Improvements** - Phases 1-3 (shipped 2026-03-16)
- ✅ **v2.0 — Live Game Tracking & Stats** - Phases 4-7 (shipped 2026-03-17)
- 🚧 **v3.0 — Multi-Deployment Support** - Phases 8-11 (code complete 2026-04-24 — awaiting Jim's live Firebase-project creation + deploy)
- ✅ **v2.1 — Madeira Game-Day Polish** - Phases 12-15 (code complete 2026-04-20)

## Phases

<details>
<summary>✅ v1.0 — UX Improvements (Phases 1-3) — SHIPPED 2026-03-16</summary>

- [x] Phase 1: Display Polish (1/1 plans) — completed 2026-03-16
- [x] Phase 2: Drag-and-Drop Completion (2/2 plans) — completed 2026-03-16
- [x] Phase 3: Mobile UX Overhaul (2/2 plans) — completed 2026-03-16

Full details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v2.0 — Live Game Tracking & Stats (Phases 4-7) — SHIPPED 2026-03-17</summary>

- [x] Phase 4: App Shell + Data Foundation (3/3 plans) — completed 2026-03-16
- [x] Phase 5: Live Game (5/5 plans) — completed 2026-03-16
- [x] Phase 6: Post-Game Summary + Exports (2/2 plans) — completed 2026-03-17
- [x] Phase 7: Season Dashboard + Player Profiles (3/3 plans) — completed 2026-03-17

Full details: [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)

</details>

### 🚧 v3.0 — Multi-Deployment Support (Code complete 2026-04-24)

**Status:** All 4 phases code-complete in a single autonomous run on 2026-04-24. Awaiting Jim's live Firebase-project creation for the friend's team + first deploy. Runbook: `DEPLOYMENT.md` at repo root.

**Milestone Goal:** Make the app deployable as an isolated instance for a second coach (7v7, quarter-based, different team) without sharing data with Madeira and without changing Madeira's behavior. Ship a second Firebase project + hosting URL driven by per-deployment config, built from the same single repo.

**Phase Numbering:**
- Integer phases (8, 9, 10, 11): Planned v3.0 work
- Decimal phases (e.g., 10.1): Reserved for urgent insertions if needed

- [x] **Phase 8: Config Layer Extraction** - Complete (08-01 → 08-04) — 2026-04-24
- [x] **Phase 9: Formations Gating + 7v7 Library** - Complete — 2026-04-24
- [x] **Phase 10: Quarter-Based Game Model** - Complete (MVP scope per decision) — 2026-04-24
- [x] **Phase 11: Second Deployment + Docs** - Code complete — 2026-04-24 (live deploy pending Jim)

### 🚧 v2.1 — Madeira Game-Day Polish (In Progress)

**Milestone Goal:** Fix and extend Madeira's live-game experience based on feedback from the first real game use. Every change scoped to the Madeira instance — no multi-deploy work. Firestore rules remain open (no auth).

**Phase Numbering:**
- Integer phases (12, 13, 14, 15): Planned v2.1 work (v3.0 reserves 8-11 for future resumption)
- Decimal phases (e.g., 13.1): Reserved for urgent insertions if needed

- [x] **Phase 12: Lineup UX Fixes** - Field-to-field swaps (drag + tap), two-way tap-to-sub, reliable inactive filtering — completed 2026-04-20
- [x] **Phase 13: Stat System + Badge Fix** - `+skill` stat (neutral, all positions) end-to-end; stat badges show whole-game totals across halftime — completed 2026-04-20
- [x] **Phase 14: Post-Game Stat Editing** - Add/delete/reassign events on completed games; live-updating shares; season stats recompute — completed 2026-04-20
- [x] **Phase 15: Saved Lineups Firestore Persistence** - Durable Firestore collection with localStorage read-through cache + one-shot migration — completed 2026-04-20

## Phase Details

### Phase 8: Config Layer Extraction
**Goal**: Every Madeira-specific value (Firebase credentials, team name, initial roster, allowed formations, game-structure model) is loaded from per-deployment config instead of hardcoded, and Madeira's instance runs the exact same behavior as before pointed at its own config.
**Depends on**: Phase 7 (v2.0 complete)
**Requirements**: CFG-01, CFG-02, CFG-03, CFG-04, CFG-05, CFG-06
**Success Criteria** (what must be TRUE):
  1. Madeira's instance loads Firebase config, team name "Madeira", its 13-player roster, its four 9v9 formations (3-3-2, 3-2-3, 2-3-3, 4-3-1), and the `halves` game model entirely from `.env` + deployment config — no Madeira strings or values remain hardcoded in `src/`.
  2. A Madeira coach completes a full existing-flow pass (build 1st- and 2nd-half lineup, publish, open live game, run timer, record stats, view summary, view season dashboard) with zero UI or behavior differences from pre-v3.0.
  3. A smoke-level build using a second config file (e.g. `.env.friend`) with team name "Friend FC", the 11-player null-numbered roster (Bodhi, Kurry, Henry, Will, Broderick, Nurdil, Lucas, Crew, Max, Mason, Cooper), a placeholder Firebase config, and `quarters` game model produces a working bundle that renders the roster, branding, and formation list from config — no Firebase project required yet.
  4. Any bench chip, field circle, or share card renders a player whose `num` is `null` as name-only with no broken chip, empty digit slot, or layout break.
**Plans**: 4 plans (Waves 1-4, sequential due to file overlap on MadeiraLineupPlanner.jsx / SharedLineupView.jsx)

Plans:
- [x] 08-01-PLAN.md — Create per-deployment config module (src/config.js) + Vite env plumbing + Firebase config from env vars (CFG-01, CFG-05) — completed 2026-04-19
- [ ] 08-02-PLAN.md — Replace hardcoded "Madeira FC" / "MADEIRA FC" strings with config-driven TEAM_NAME (CFG-02) — *committed then reverted 2026-04-20; to redo on resume*
- [ ] 08-03-PLAN.md — Extract roster + formations to per-deployment modules (src/deployments/*.js) + null-safe jersey number rendering (CFG-03, CFG-04, CFG-06)
- [ ] 08-04-PLAN.md — Friend FC deployment fixture + `build:friend` script + smoke-verify both bundles (re-verifies CFG-01..06)

### Phase 9: Formations Gating + 7v7 Library
**Goal**: The formation library contains both 9v9 and 7v7 formations, and each instance's UI only exposes formations its config allows.
**Depends on**: Phase 8
**Requirements**: FORM-01, FORM-02, FORM-03
**Success Criteria** (what must be TRUE):
  1. The formation library includes a 7v7 starter set (2-3-1, 3-2-1, 2-2-2 — final list confirmed during planning) alongside the existing 9v9 set, each with position layouts suitable for their player count.
  2. Madeira's instance shows exactly its existing four 9v9 formations in the formation picker — no 7v7 options visible or selectable anywhere in the UI.
  3. The friend's instance (with 7v7 allowlist in config) shows only 7v7 formations in the picker — no 9v9 options visible.
  4. A Madeira coach building a lineup and switching formations mid-build sees no change in available formations, layouts, or behavior compared to pre-v3.0.
**Plans**: TBD

Plans:
- [ ] 09-01: TBD (scoped during `/gsd:plan-phase 9`)

### Phase 10: Quarter-Based Game Model
**Goal**: Deployments configured with `quarters` run a complete 48-minute quarter-based game flow end-to-end — from pre-building 8 segment lineups, through live timer with quarter stops and mid-quarter rolling subs, to a post-game summary and season stats — while Madeira's `halves` flow continues to run unchanged.
**Depends on**: Phase 9
**Requirements**: QTR-01, QTR-02, QTR-03, QTR-04, QTR-05, QTR-06, MAD-01, MAD-02
**Success Criteria** (what must be TRUE):
  1. On a `quarters`-configured instance, a coach pre-builds 8 segment lineups (Q1, Q1.5, Q2, Q2.5, Q3, Q3.5, Q4, Q4.5) before kickoff, publishes the game, and each segment's on-field 7 players is explicitly captured and persisted.
  2. A full 48-minute simulated game run (advance the clock through all 4 quarters with segment swaps at each 6:00 mid-quarter mark) produces a post-game summary whose per-player minutes total correctly sum to at most 48 minutes per player and match what the interval-intersection calculation predicts from segment timestamps.
  3. During live game, the clock stops at the end of each quarter (end-of-Q1, halftime after Q2, end-of-Q3, end-of-Q4) and only resumes on an explicit coach restart; the mid-quarter swap from the full lineup to its `.5` lineup (at 6:00) happens without stopping the clock.
  4. After finalizing a `quarters` game, the season dashboard shows its stats alongside any `halves` games (same shape, same totals) with no data-shape errors or render breakage on either game type.
  5. A Madeira coach (on the `halves` instance) runs a full 1st-half + 2nd-half lineup build, live 2×25-min game with halftime, stat logging, summary, and season stats flow with zero visible changes to UI, timer, summary, or season dashboard behavior — and no quarter-mode UI, 7v7 formations, or deployment-config options appear anywhere in that instance.
**Plans**: TBD

Plans:
- [ ] 10-01: TBD (scoped during `/gsd:plan-phase 10` — likely split across lineup prebuild, live timer + rolling subs, and summary/season stats)

### Phase 11: Second Deployment + Docs
**Goal**: The friend's instance is live at its own URL, backed by its own Firebase project and isolated Firestore data, and a new instance can be spun up end-to-end by following a single documented workflow.
**Depends on**: Phase 10
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04
**Success Criteria** (what must be TRUE):
  1. The same repo produces two distinct deployment bundles from two env files (e.g., `.env` for Madeira, `.env.friend` for the friend) — no forking, no branching, no code changes required to switch targets.
  2. A second Firebase project is deployed at its own hosting URL, uses its own Firestore, and a write from the friend's instance does not appear in Madeira's Firestore (and vice versa).
  3. The friend's live URL opens to his team name, the 11-player roster (numbers initially blank, fillable via the existing roster UI), the 7v7 formation picker, and the quarter-based game flow.
  4. A reader following `DEPLOYMENT.md` alone (Firebase project creation, env setup, build, deploy commands) can stand up a fresh third instance with a new team name, roster, and game model without needing to consult source code.
**Plans**: TBD

Plans:
- [ ] 11-01: TBD (scoped during `/gsd:plan-phase 11`)

### Phase 12: Lineup UX Fixes
**Goal**: The lineup-builder's drag, tap, and inactive-filtering gaps surfaced in the first real game use are all closed — field-to-field swaps work via both drag and tap, tap-to-sub works in both directions between bench and field, and inactive players never leak back onto the bench regardless of how the toggle was changed.
**Depends on**: Phase 7 (v2.0 complete) — no v3.0 dependency; operates only on Madeira codepaths
**Requirements**: LUX-01, LUX-02, LUX-03, LUX-04
**Success Criteria** (what must be TRUE):
  1. A coach drags a field player (e.g., RM) onto another field player (e.g., LM) and the two swap positions — both players end up on the field, neither goes to the bench, and the swap persists after reload.
  2. A coach taps a field player, then taps a second field player, and the two swap positions (equivalent to the drag path, but touch-first for mobile use on the sideline).
  3. Tap-to-sub works in both directions: tapping a bench player moves them onto the field (replacing a field player per existing rules) AND tapping a field player moves them to the bench, making the vacated position assignable again.
  4. Toggling a player to inactive from any entry point (desktop click, mobile tap, Firestore sync from another device) immediately removes them from the bench and keeps them off across reload, Firestore sync, and tab switches — the root cause of the sync/tap reliability issue is identified and fixed, not worked around.
**Plans**: 3 plans (Waves 1-3, sequential due to shared file `src/MadeiraLineupPlanner.jsx`; each ends in a human-verify checkpoint)

Plans:
- [x] 12-01-PLAN.md — Field-to-field swap (drag + tap) across desktop and mobile, plus visible selected-state ring on occupied positions (LUX-01, LUX-02) — completed 2026-04-20
- [x] 12-02-PLAN.md — Two-way tap-to-sub: bench-tap-to-sub-off for field-selected player, preserving existing bench-to-field tap (LUX-03) — completed 2026-04-20
- [x] 12-03-PLAN.md — Investigate + fix inactive reliability root cause; enlarge mobile SIT target, add realtime sync if diagnosis requires (LUX-04) — completed 2026-04-20

### Phase 13: Stat System + Badge Fix
**Goal**: The stat library supports a new `+skill` stat end-to-end (live game buttons → stat badges → post-game summary → season dashboard) across all position groups, and stat badges on field circles during live games display whole-game running totals that survive halftime.
**Depends on**: Phase 7 (v2.0 complete). Must ship BEFORE Phase 14 because EDIT-02 (add stat event) depends on `+skill` existing as a selectable stat type.
**Requirements**: STAT-01, STAT-02, STAT-03, STAT-04
**Success Criteria** (what must be TRUE):
  1. During a live game, every position group's stat sheet (GK, DEF, MID, FWD) exposes a `+skill` button styled in neutral gray (#6b7280), visually distinguishable from the orange offensive and teal defensive buttons.
  2. A `+skill` event logged on a player during live play shows up in the recent-events feed, contributes to that player's on-circle stat badge count, appears in the post-game summary stats table, and rolls up into season stats on the season dashboard — full stack, one logged event, four visible surfaces.
  3. In a simulated game run where a player earns stats in the 1st half, halftime starts, and additional stats are earned in the 2nd half, that player's on-field stat badge shows the combined 1H+2H count for the entire 2nd half (not reset to zero at kickoff of the 2nd half).
  4. The recent-events feed and single-tap undo work unchanged for `+skill` events just like all other stat types.
**Plans**: TBD

Plans:
- [x] 13-01-PLAN.md — Add `skill` to POSITION_STATS/STAT_COLORS/STAT_LABELS + STAT_ORDER/MVP_ABBREV; fix `statCounts` half filter (STAT-01..04) — completed 2026-04-20

### Phase 14: Post-Game Stat Editing
**Goal**: A coach can open a completed game, add/delete/reassign any stat event (including `+skill` backfills) with changes persisting to Firestore, recomputing per-player totals and season stats without manual refresh, and reflected live in shared summary URLs and Share Image re-downloads — all without an audit trail (silent edits).
**Depends on**: Phase 13 (needs `+skill` as a selectable stat type for EDIT-02 backfill path)
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06
**Success Criteria** (what must be TRUE):
  1. Opening a completed game's summary screen shows each player's stat events as an editable list with timestamps, grouped or filterable per player, with controls to add, delete, and reassign events visible on the same screen.
  2. Full end-to-end walk: open a completed game → tap "Add event" → pick a player and stat type (including a `+skill` backfill or a missed goal) → save → the summary table, per-player totals, and season dashboard all reflect the new event within the same session, no manual refresh needed.
  3. Full end-to-end walk: open a completed game → delete an existing event → the summary table, per-player totals, and season dashboard all decrement correctly; reassigning an event to a different player moves the credit from player A to player B in both the game summary and season totals with one consistent recompute.
  4. After any edit (add / delete / reassign), opening the shared summary URL in a fresh browser tab shows the current edited stats (no snapshot-at-finalize), and re-downloading the Share Image PNG from the coach's device produces an image rendered from the current edited stats.
  5. Edits are silent — no audit log, no "edited" badge, no edit history UI appears anywhere (matches the user's explicit decision).
**Plans**: TBD

Plans:
- [x] 14-01-PLAN.md — EventEditor UI + eventMutations helpers + GameSummaryScreen wiring (EDIT-01..06) — completed 2026-04-20

### Phase 15: Saved Lineups Firestore Persistence
**Goal**: Saved lineups survive the Safari/iOS 7-day ITP localStorage wipe by persisting to Firestore, with localStorage kept as a read-through cache for instant loads and offline resilience. Existing saved lineups migrate in a single one-shot operation on first post-upgrade load.
**Depends on**: None — orthogonal to Phases 12-14; can ship in any order (sequenced last here for a solo-coder's cadence and to isolate Firestore collection work)
**Requirements**: SAVE-01, SAVE-02, SAVE-03, SAVE-04
**Success Criteria** (what must be TRUE):
  1. On first post-upgrade load, any existing localStorage `madeira_savedLineups` entries are detected, pushed to the new Firestore `savedLineups` collection, and a migration flag is set so the migration runs exactly once per device.
  2. After migration, a coach on the same device can save, edit, and delete lineups and each operation writes to Firestore AND updates the localStorage cache, keeping both in sync.
  3. Wipe simulation: clearing localStorage for the app domain and reloading shows all previously saved lineups re-appear in the Saved Lineups list — they were read from Firestore and rehydrated into localStorage.
  4. Offline / cache-first load: a cold page load shows the locally cached lineups instantly (no network wait), then the app reconciles in the background with Firestore and updates the list if any remote-only lineups are found.
**Plans**: TBD

Plans:
- [x] 15-01-PLAN.md — Firestore savedLineups CRUD + read-through cache + one-shot migration (SAVE-01..04) — completed 2026-04-20

## Progress

**Execution Order:**
- v2.1 active path: Phase 12 → 13 → 14 → 15 (13 must precede 14 because EDIT-02 depends on `+skill` existing; 15 is orthogonal and runs last for solo-dev cadence)
- v3.0 paused: Phases 8-11 resume after v2.1 stable; 8 picks up at 08-02
- Decimal insertions land between their surrounding integers if used

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Display Polish | v1.0 | 1/1 | Complete | 2026-03-16 |
| 2. Drag-and-Drop Completion | v1.0 | 2/2 | Complete | 2026-03-16 |
| 3. Mobile UX Overhaul | v1.0 | 2/2 | Complete | 2026-03-16 |
| 4. App Shell + Data Foundation | v2.0 | 3/3 | Complete | 2026-03-16 |
| 5. Live Game | v2.0 | 5/5 | Complete | 2026-03-16 |
| 6. Post-Game Summary + Exports | v2.0 | 2/2 | Complete | 2026-03-17 |
| 7. Season Dashboard + Player Profiles | v2.0 | 3/3 | Complete | 2026-03-17 |
| 8. Config Layer Extraction | v3.0 | 1/4 | Paused (08-01 complete, 08-02 reverted, 08-03/04 not started) | - |
| 9. Formations Gating + 7v7 Library | v3.0 | 0/TBD | Paused | - |
| 10. Quarter-Based Game Model | v3.0 | 0/TBD | Paused | - |
| 11. Second Deployment + Docs | v3.0 | 0/TBD | Paused | - |
| 12. Lineup UX Fixes | v2.1 | 0/3 | Planned (ready to execute) | - |
| 13. Stat System + Badge Fix | v2.1 | 0/TBD | Not started | - |
| 14. Post-Game Stat Editing | v2.1 | 0/TBD | Not started | - |
| 15. Saved Lineups Firestore Persistence | v2.1 | 0/TBD | Not started | - |
