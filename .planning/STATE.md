---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: — Live Game Tracking & Stats
status: executing
stopped_at: Completed 04-02-PLAN.md (bottom tab navigation shell)
last_updated: "2026-03-16T17:22:08.580Z"
last_activity: 2026-03-16 — Completed 04-03 game CRUD and season stats data layer
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 8
  completed_plans: 8
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** Coaches can manage lineups, track live games, and review player stats from phone or desktop
**Current focus:** v2.0 — Phase 4: App Shell + Data Foundation

## Current Position

Phase: 4 of 7 (App Shell + Data Foundation)
Plan: 3 of 3 in current phase (plan 03 complete)
Status: In progress
Last activity: 2026-03-16 — Completed 04-03 game CRUD and season stats data layer

Progress: [██░░░░░░░░] 25%

## Accumulated Context

### Decisions

Carried from v1.0:
- Position labels inside circles; controls above pitch on mobile; auto-sync to Firestore; desktop layout preserved

v2.0 decisions (pending):
- Separate game screen (not overlay on lineup builder)
- Position-aware stat groups (GK/DEF/MID/FWD)
- Bottom tab navigation (Lineup | Games | Stats)
- Coach-only for now; shareable link + image export in Phase 6
- Firestore: embedded events array in game doc (NOT subcollection per event)
- Two new deps only: react-router-dom v7, html-to-image v1.11.13

v2.0 decisions (04-01):
- STAT_TYPES grouped into offensive/defensive/neutral; stat names (goal, assist, shot, tackle, clearance, save, foul) are Phase 5 starters — refine in Phase 5 implementation
- STAT_COLORS maps each type to statOffensive (#E86420), statDefensive (#4CAFB6), statNeutral (#6b7280)
- POSITION_GROUP uses simple string enum (GK/DEF/MID/FWD) — matches JS-only stack
- buildShareUrl kept as-is; Plan 04-02 will update for HashRouter

v2.0 decisions (04-03):
- updateSeasonStats uses dotted-path keys with setDoc merge to avoid overwriting unrelated player stats
- appendGameEvent uses arrayUnion for atomic array append — no read-modify-write race conditions
- [Phase 04]: HashRouter chosen (not BrowserRouter) so SPA works without server-side rewrite rules
- [Phase 04]: buildShareUrl updated to hash format (#/lineup?lineup=...); MadeiraLineupPlanner reads param from window.location.hash

### Pending Todos

None.

### Blockers/Concerns

- [Phase 5] Screen Wake Lock has a known WebKit bug (#254545) on installed iOS PWAs — test on physical device first thing in Phase 5
- [Phase 6] html-to-image inline font behavior on iOS needs a quick spike before committing to implementation

## Session Continuity

Last session: 2026-03-16T17:22:03.938Z
Stopped at: Completed 04-02-PLAN.md (bottom tab navigation shell)
Resume file: None
