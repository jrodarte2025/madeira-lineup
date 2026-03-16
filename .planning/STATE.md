---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: — Live Game Tracking & Stats
status: executing
stopped_at: Completed 05-03-PLAN.md
last_updated: "2026-03-16T19:38:22.050Z"
last_activity: 2026-03-16 — Completed 05-03 substitutions + minute tracking
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 13
  completed_plans: 12
  percent: 92
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** Coaches can manage lineups, track live games, and review player stats from phone or desktop
**Current focus:** v2.0 — Phase 5: Live Game Tracking & Stats

## Current Position

Phase: 5 of 7 (Live Game Tracking & Stats)
Plan: 3 of 5 in current phase (plan 03 complete)
Status: In progress
Last activity: 2026-03-16 — Completed 05-03 substitutions + minute tracking

Progress: [█████████░] 92%

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
- [Phase 05-live-game]: vitest chosen as test runner (ESM-native, zero-config with vite)
- [Phase 05-live-game]: AppShell component introduced in App.jsx so useLocation() works inside HashRouter context
- [Phase 05-live-game]: TabBar hidden and paddingBottom removed on /games/:id routes to reclaim full vertical space
- [Phase 05-live-game]: FORMATIONS imported statically to avoid async-in-then anti-pattern
- [Phase 05-live-game]: Crash recovery checks madeira_activeGameId on mount; if matches gameId, skips Firestore load and restores from localStorage
- [Phase 05-live-game]: halfIntervals + playerIntervals built in 05-02 so Plans 05-03/05-04 can consume without refactor
- [Phase 05-live-game]: calcMinutes uses interval intersection math; displayMinute state avoids 60fps recalc; handleSubstitution captures outgoingPlayer before setState

### Pending Todos

None.

### Blockers/Concerns

- [Phase 5] Screen Wake Lock has a known WebKit bug (#254545) on installed iOS PWAs — test on physical device first thing in Phase 5
- [Phase 6] html-to-image inline font behavior on iOS needs a quick spike before committing to implementation

## Session Continuity

Last session: 2026-03-16T19:38:22.048Z
Stopped at: Completed 05-03-PLAN.md
Resume file: None
