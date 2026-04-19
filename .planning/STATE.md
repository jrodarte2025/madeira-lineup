---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: — Multi-Deployment Support
status: defining_requirements
stopped_at: "Defining requirements for v3.0"
last_updated: "2026-04-19"
last_activity: "2026-04-19 — Milestone v3.0 started"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Coaches can manage lineups, track live games, and review player stats from phone or desktop
**Current focus:** v3.0 Multi-Deployment Support — defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-19 — Milestone v3.0 started

## Accumulated Context

### Decisions

See .planning/PROJECT.md Key Decisions table for full history.

v3.0 scope decisions locked during questioning (2026-04-19):
- Scale: "just this friend" — build minimum config-driven second deployment, no multi-tenancy
- Auth: open Firestore rules on both instances (same as today)
- Branding: team name swap only, keep navy/orange palette
- Game structure (friend's instance): 4 × 12-min quarters, 8 pre-built segment lineups (Q1, Q1.5, Q2, Q2.5, Q3, Q3.5, Q4, Q4.5), rolling subs, clock stops only at halftime
- Game structure (Madeira instance): unchanged — 2 × 25-min halves, 9v9
- Formations: add 7v7 formations gated to friend's instance; Madeira sees only 9v9 formations
- Research: skipped — refactor + known structural variant, no new tech

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-04-19
Stopped at: v3.0 requirements definition in progress
Resume file: None
