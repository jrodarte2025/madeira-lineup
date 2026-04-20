---
gsd_state_version: 1.0
milestone: v2.1
milestone_name: — Madeira Game-Day Polish
status: roadmap_complete
stopped_at: "Roadmap complete — awaiting /gsd:plan-phase 12"
last_updated: "2026-04-20"
last_activity: "2026-04-20 — v2.1 roadmap created (Phases 12-15, 18/18 requirements mapped)"
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Coaches can manage lineups, track live games, and review player stats from phone or desktop
**Current focus:** v2.1 Madeira Game-Day Polish — roadmap complete, ready to plan Phase 12

## Current Position

Phase: Phase 12 — Lineup UX Fixes (next to plan)
Plan: —
Status: Roadmap complete; next action is `/gsd:plan-phase 12`
Last activity: 2026-04-20 — v2.1 roadmap created with Phases 12-15; all 18 requirements mapped

### v2.1 Phase Order

1. **Phase 12** — Lineup UX Fixes (LUX-01..04) — next
2. **Phase 13** — Stat System + Badge Fix (STAT-01..04) — must precede 14
3. **Phase 14** — Post-Game Stat Editing (EDIT-01..06) — depends on 13
4. **Phase 15** — Saved Lineups Firestore Persistence (SAVE-01..04) — orthogonal

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

v2.1 roadmap decisions (2026-04-20):
- Phase 12 (Lineup UX) first — independent, quick wins, touches only `MadeiraLineupPlanner.jsx` drag/tap/inactive paths
- Phase 13 (Stat System) must ship BEFORE Phase 14 because EDIT-02 needs `+skill` to exist as a selectable stat type
- Phase 14 (Post-Game Editing) is the largest/riskiest — may split into sub-plans during planning (edit UI / mutation / season-stat delta)
- Phase 15 (Saved Lineups) is orthogonal; sequenced last for solo-coder cadence and Firestore-collection isolation
- v3.0 phases 8-11 remain reserved for resumption (see MILESTONES.md); v2.1 starts at Phase 12

### Feedback items from live game (source of v2.1)

Already hotfixed (live on prod):
- Portrait orientation lock + no pinch zoom
- Bench disambiguation compares across full roster (not just bench)
- Half length 30 min (was 25)

Open in v2.1 scope:
- #2 Field-to-field player swap (drag or tap) → Phase 12
- #3 Two-way tap-to-sub → Phase 12
- #5 Unavailable players reliably hidden from bench (investigate + fix) → Phase 12
- #6 +skill stat → Phase 13
- #7 Saved lineups migrate to Firestore (keep localStorage as cache) → Phase 15
- #8 Stat badges aggregate whole game → Phase 13
- #9 Post-game stat editing → Phase 14

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
Stopped at: v2.1 roadmap complete — next action `/gsd:plan-phase 12`
Resume file: None
