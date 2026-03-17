---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: — Live Game Tracking & Stats
status: executing
stopped_at: "Completed Phase 7 Plan 03: Season stats write pipeline"
last_updated: "2026-03-17T03:16:27.317Z"
last_activity: "2026-03-16 — Completed Phase 7 Plan 01: getSeasonId, computeSeasonDeltas, loadSeasonStats, listSeasons"
progress:
  total_phases: 7
  completed_phases: 6
  total_plans: 18
  completed_plans: 17
  percent: 89
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** Coaches can manage lineups, track live games, and review player stats from phone or desktop
**Current focus:** v2.0 — Phase 6: Post-Game Summary + Exports

## Current Position

Phase: 7 of 7 (Season Dashboard + Player Profiles)
Plan: 1 of 3 in current phase
Status: In progress — Plan 01 complete, Plans 02-03 remain
Last activity: 2026-03-16 — Completed Phase 7 Plan 01: getSeasonId, computeSeasonDeltas, loadSeasonStats, listSeasons

Progress: [████████░░] 89% (plans: 16/18 complete — phase 7 plan 01 done)

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

v2.0 decisions (ad-hoc, post-05):
- Lineup planner simplified to single lineup (no 1st/2nd half) — substitutions happen in-game
- Game header uses centered scoreboard: Home [clock] Away, with clock between scores
- StatBar wraps buttons instead of horizontal scroll — all MID stats visible
- Home score orange, away score white for instant visual distinction
- Game screen content scrollable so stat bar and events never clip off-screen
- [Phase 06-01]: handleEndGame computes intervals inline before async finalizeGame to avoid setState race condition
- [Phase 06-01]: finalizeGame writes playerIntervals + halfIntervals + status=completed in single updateDoc for atomic persistence
- [Phase 06-02]: ShareCard uses system fonts only (not DM Sans/Outfit) to avoid iOS html-to-image font embedding failures
- [Phase 06-02]: Public mode detected from ?public=true in window.location.hash; same component, isPublic prop, no separate route needed
- [Phase 06-02]: Share card shows domain-only URL for visual cleanliness; full URL included in navigator.share payload
- [Phase 06-02]: Minutes column and Back button hidden on public view; CSV export suppressed on public view
- [Phase 07-01]: Season ID format is {period}-{year} where period is 'spring' (Jan-Jun) or 'fall' (Jul-Dec)
- [Phase 07-01]: UTC-safe date parsing uses toISOString().slice() for year/month — avoids local timezone offset on date-only strings
- [Phase 07-01]: computeSeasonDeltas iterates game.lineup.roster to exclude non-roster stat events; skips players with 0 minutes AND 0 stats
- [Phase 07-season-dashboard-player-profiles]: Store game date and lineup as gameMeta in localStorage to support season stats computation after crash recovery
- [Phase 07-season-dashboard-player-profiles]: Season stats write is fire-and-forget after finalizeGame -- navigation does not wait for season writes

### Pending Todos

None.

### Blockers/Concerns

None — html-to-image iOS font concern resolved by using system fonts in ShareCard.

## Session Continuity

Last session: 2026-03-17T03:16:27.315Z
Stopped at: Completed Phase 7 Plan 03: Season stats write pipeline
Resume file: None
