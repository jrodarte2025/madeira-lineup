# Roadmap: Madeira FC Lineup Planner

## Milestones

- ✅ **v1.0 — UX Improvements** - Phases 1-3 (shipped 2026-03-16)
- ✅ **v2.0 — Live Game Tracking & Stats** - Phases 4-7 (shipped 2026-03-17)
- 🚧 **v3.0 — Multi-Deployment Support** - Phases 8-11 (in progress)

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

### 🚧 v3.0 — Multi-Deployment Support (In Progress)

**Milestone Goal:** Make the app deployable as an isolated instance for a second coach (7v7, quarter-based, different team) without sharing data with Madeira and without changing Madeira's behavior. Ship a second Firebase project + hosting URL driven by per-deployment config, built from the same single repo.

**Phase Numbering:**
- Integer phases (8, 9, 10, 11): Planned v3.0 work
- Decimal phases (e.g., 10.1): Reserved for urgent insertions if needed

- [ ] **Phase 8: Config Layer Extraction** - Pull Madeira-specific values (Firebase, team name, roster, formations, game model) out of code into per-deployment config
- [ ] **Phase 9: Formations Gating + 7v7 Library** - Add 7v7 formations and gate the selectable formation set by deployment config
- [ ] **Phase 10: Quarter-Based Game Model** - Add 4×12-min quarter game flow with 8 pre-built segment lineups, rolling mid-quarter subs, and coach-triggered quarter restarts
- [ ] **Phase 11: Second Deployment + Docs** - Stand up the friend's Firebase project and ship the documented spin-up workflow

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
- [ ] 08-02-PLAN.md — Replace hardcoded "Madeira FC" / "MADEIRA FC" strings with config-driven TEAM_NAME (CFG-02)
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

## Progress

**Execution Order:**
Phases execute in numeric order: 8 → 9 → 10 → 11 (decimal insertions land between their surrounding integers if used)

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Display Polish | v1.0 | 1/1 | Complete | 2026-03-16 |
| 2. Drag-and-Drop Completion | v1.0 | 2/2 | Complete | 2026-03-16 |
| 3. Mobile UX Overhaul | v1.0 | 2/2 | Complete | 2026-03-16 |
| 4. App Shell + Data Foundation | v2.0 | 3/3 | Complete | 2026-03-16 |
| 5. Live Game | v2.0 | 5/5 | Complete | 2026-03-16 |
| 6. Post-Game Summary + Exports | v2.0 | 2/2 | Complete | 2026-03-17 |
| 7. Season Dashboard + Player Profiles | v2.0 | 3/3 | Complete | 2026-03-17 |
| 8. Config Layer Extraction | v3.0 | 1/4 | In Progress | - |
| 9. Formations Gating + 7v7 Library | v3.0 | 0/TBD | Not started | - |
| 10. Quarter-Based Game Model | v3.0 | 0/TBD | Not started | - |
| 11. Second Deployment + Docs | v3.0 | 0/TBD | Not started | - |
