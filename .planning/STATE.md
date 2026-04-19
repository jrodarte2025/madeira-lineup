---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: — Multi-Deployment Support
status: ready_to_plan
stopped_at: "Roadmap created — Phase 8 ready to plan"
last_updated: "2026-04-19"
last_activity: "2026-04-19 — v3.0 roadmap created (Phases 8-11, 21/21 requirements mapped)"
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Coaches can manage lineups, track live games, and review player stats from phone or desktop
**Current focus:** v3.0 Multi-Deployment Support — Phase 8 (Config Layer Extraction) ready to plan

## Current Position

Phase: 8 of 11 (Config Layer Extraction) — pending
Plan: — (not yet planned)
Status: Ready to plan
Last activity: 2026-04-19 — v3.0 roadmap created, 21/21 requirements mapped across Phases 8-11

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (v3.0)
- Average duration: — (pending first plan)
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 8. Config Layer Extraction | 0 | — | — |
| 9. Formations Gating + 7v7 Library | 0 | — | — |
| 10. Quarter-Based Game Model | 0 | — | — |
| 11. Second Deployment + Docs | 0 | — | — |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

v3.0 scope decisions locked during questioning (2026-04-19):
- Scale: "just this friend" — build minimum config-driven second deployment, no multi-tenancy
- Auth: open Firestore rules on both instances (same as today)
- Branding: team name swap only, keep navy/orange palette
- Game structure (friend's instance): 4 × 12-min quarters, 8 pre-built segment lineups (Q1, Q1.5, Q2, Q2.5, Q3, Q3.5, Q4, Q4.5). Rolling subs mid-quarter (clock keeps running at 6:00 sub swap). Clock STOPS at end of each quarter (Q1, halftime, Q3, Q4) and requires coach to restart.
- Friend's initial roster (11 players): Bodhi, Kurry, Henry, Will, Broderick, Nurdil, Lucas, Crew, Max, Mason, Cooper — all with `num: null`, coach fills numbers via existing roster UI.
- Game structure (Madeira instance): unchanged — 2 × 25-min halves, 9v9
- Formations: add 7v7 formations gated to friend's instance; Madeira sees only 9v9 formations
- Research: skipped — refactor + known structural variant, no new tech

v3.0 roadmap decisions (2026-04-19):
- 4-phase structure aligns with coarse granularity: Config → Formations → Quarter model → Deployment
- MAD-01 / MAD-02 co-located with Phase 10 (highest regression risk during game-flow code changes)
- Phase 10 may split into sub-plans during `/gsd:plan-phase 10` (lineup prebuild vs live timer + rolling subs vs summary/season stats)

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-04-19
Stopped at: v3.0 roadmap created, Phase 8 ready to plan
Resume file: None — next step is `/gsd:plan-phase 8`
