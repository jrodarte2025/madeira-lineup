---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: — Madeira Game-Day Polish
status: defining_requirements
stopped_at: "Defining requirements for v2.1"
last_updated: "2026-04-20"
last_activity: "2026-04-20 — Milestone v2.1 started (v3.0 paused)"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Coaches can manage lineups, track live games, and review player stats from phone or desktop
**Current focus:** v2.1 Madeira Game-Day Polish — defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-20 — Milestone v2.1 started after pausing v3.0 mid-Phase-8

## Accumulated Context

### Decisions

See .planning/PROJECT.md Key Decisions table for full history.

v2.1 scope decisions locked during questioning (2026-04-20):
- Saved lineups: migrate localStorage → Firestore on first load; keep localStorage as read-through cache for offline use
- Post-game stat editing: live-updating shares (shared URL reflects current stats; PNG regenerates from current stats on re-download)
- Post-game stat editing: silent edits (no audit trail / edit history UI)
- +skill stat: neutral gray color; applies to all positions (GK/DEF/MID/FWD); backfillable on past games via the edit-stats UI (shared infra with stat editing)
- #6 +skill and #7 stat editing share UI: one post-game edit interface handles both new stats and skill backfill
- Research: skipped (polish + small features on known codebase, no new tech)

### Feedback items from live game (source of v2.1)

Already hotfixed (live on prod):
- Portrait orientation lock + no pinch zoom
- Bench disambiguation compares across full roster (not just bench)
- Half length 30 min (was 25)

Open in v2.1 scope:
- #2 Field-to-field player swap (drag or tap)
- #3 Two-way tap-to-sub
- #5 Unavailable players reliably hidden from bench (investigate + fix)
- #6 +skill stat
- #7 Saved lineups migrate to Firestore (keep localStorage as cache)
- #8 Stat badges aggregate whole game
- #9 Post-game stat editing

### v3.0 Paused State (for resumption)

- Phase 8 / Plan 08-01 is LIVE on prod (config module + Firebase from env)
- Plan 08-02 (TEAM_NAME swap) was committed then reverted on 2026-04-20
- 08-03, 08-04, Phases 9-11 not started
- All v3.0 planning artifacts preserved in .planning/ for resumption
- Entry point: `/gsd:resume-work` or `/gsd:execute-phase 8`

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-04-20
Stopped at: v2.1 requirements definition in progress
Resume file: None
