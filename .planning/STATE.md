---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Live Game Tracking & Stats
status: in-progress
stopped_at: Roadmap created — ready to plan Phase 4
last_updated: "2026-03-16"
last_activity: 2026-03-16 — v2.0 roadmap created (4 phases, 30 requirements mapped)
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 13
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** Coaches can manage lineups, track live games, and review player stats from phone or desktop
**Current focus:** v2.0 — Phase 4: App Shell + Data Foundation

## Current Position

Phase: 4 of 7 (App Shell + Data Foundation)
Plan: 0 of 3 in current phase
Status: Ready to plan
Last activity: 2026-03-16 — v2.0 roadmap created

Progress: [░░░░░░░░░░] 0%

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

### Pending Todos

None.

### Blockers/Concerns

- [Phase 5] Screen Wake Lock has a known WebKit bug (#254545) on installed iOS PWAs — test on physical device first thing in Phase 5
- [Phase 6] html-to-image inline font behavior on iOS needs a quick spike before committing to implementation

## Session Continuity

Last session: 2026-03-16
Stopped at: Roadmap written for v2.0 — all 30 requirements mapped across Phases 4-7
Resume file: None
