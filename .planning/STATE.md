---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: — Multi-Deployment Support
current_plan: "16-04 checkpoint:human-verify"
status: verifying
stopped_at: Checkpoint 16-02 task 3 — awaiting human verification of saved-lineup template behavior
last_updated: "2026-04-29T17:39:58.583Z"
last_activity: 2026-04-29 — Plan 16-04 Tasks 1+2 complete; SIT button and inactive drop zone removed; build+tests pass; awaiting checkpoint approval.
progress:
  total_phases: 9
  completed_phases: 9
  total_plans: 17
  completed_plans: 17
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Coaches can manage lineups, track live games, and review player stats from phone or desktop
**Current focus:** v2.2 Game-Day Roster Flow — Phase 16 ready to plan. Per-game inactive selection + saved-lineups-as-templates + pre-kickoff walkthrough + Roster Management cleanup. v3.0 paused awaiting Jim's friend-project deploy.

## Current Position

Milestone: v2.2 — active
Phase: 16 (Game-Day Roster Flow) — in progress (3/4 plans code-complete, awaiting 16-04 human-verify)
Current Plan: 16-04 checkpoint:human-verify
Status: Plans 16-01, 16-02, 16-03 complete. 16-04 Tasks 1+2 done — SIT button + inactive drop zone removed; awaiting human-verify.
Last activity: 2026-04-29 — Plan 16-04 Tasks 1+2 complete; SIT button and inactive drop zone removed; build+tests pass; awaiting checkpoint approval.

### v3.0 Phase Order

1. ✅ **Phase 8** — Config Layer Extraction (4 plans: 08-01..08-04) — completed 2026-04-24 (08-02 re-executed after 2026-04-20 revert)
2. ✅ **Phase 9** — Formations Gating + 7v7 Library (1 plan) — completed 2026-04-24
3. ✅ **Phase 10** — Quarter-Based Game Model (1 plan, MVP scope per Jim) — completed 2026-04-24
4. ✅ **Phase 11** — Second Deployment + Docs (1 plan, part-A code complete) — completed 2026-04-24 (part B = Jim's runbook pending)

## Accumulated Context

### Decisions

See .planning/PROJECT.md Key Decisions table for full history.

v3.0 autonomous-run decisions (2026-04-24):
- Phase 8: Re-executed 08-02 (TEAM_NAME swap that was reverted on 2026-04-20). Expanded scope to include `src/games/ShareCard.jsx` (v2.1 addition not in original plan). `RewatchMode.jsx` added to 08-03 scope for same reason.
- Phase 9: 7v7 starter set = 2-3-1, 3-2-1, 2-2-2 (standard US-youth 7v7 formations). Swappable later via ALLOWED_FORMATION_KEYS edit in `src/deployments/friend.js` — no code change.
- Phase 10: **MVP scope chosen (option B)**. 4 × 12-min quarters with auto-pause at boundaries. 8-segment prebuild and auto mid-quarter swap deferred to v3.1 if the friend's coach wants them. Keeps Madeira halves byte-identical and cuts code risk.
- Phase 11: Part A = repo config + DEPLOYMENT.md runbook. Part B = Jim's live runbook (create Firebase project, paste creds, first deploy, smoke). Blocked on Jim.
- Auto-approved every human-verify checkpoint via build+grep+tests per Jim's "only bother me for decisions" directive.
- [Phase 16 plan 01]: computeBench extracted to lineupUtils.js for clean unit testability; gameDayRoster step inserted after createGame in both modal flows; inactiveIds lives on game.lineup.inactiveIds
- [Phase 16-game-day-roster-flow]: 16-03: Deleted blur overlay entirely (not opacity-reduced) — coach needs full name readability; fixed-bottom CTA uses zIndex 90 so swap banner always wins
- [Phase 16-game-day-roster-flow]: resolveLineupForGame strips saved inactiveIds at load time (template pattern); isEmptySlot prop on FieldPosition for inactive-assigned slots; setup-state fills persist to Firestore fire-and-forget

### Pending Jim-only Actions (to truly ship v3.0)

1. Create the friend's Firebase project in the console
2. Enable Firestore + Hosting
3. Copy real Firebase credentials into `.env.friend.local`
4. Replace `YOUR-FRIEND-PROJECT-ID` in `.firebaserc` with the real project id
5. `firebase use friend && npm run deploy:rules && npm run deploy:friend`
6. Smoke test per DEPLOYMENT.md (Steps 8-9)
7. Confirm Madeira still works (same doc)

Runbook: `DEPLOYMENT.md` at repo root.

### Pending Todos

None beyond the Jim-actions above.

### Blockers/Concerns

None — just Jim's live steps.

### v3.1 Candidate Work (deferred — possible next milestone)

- 8-segment prebuild UI for quarters (Q1/Q1.5/Q2/Q2.5/Q3/Q3.5/Q4/Q4.5)
- Auto mid-quarter swap at 6:00 from full → .5 lineup
- PWA manifest deployment-aware (name, icon)
- `index.html` title interpolation
- Deployment-aware logo path (friend currently shows Madeira logo)
- EventEditor post-game UI that knows about 4 quarter-periods (not just 1/2 halves)
- Optional: shared-origin localStorage key prefix migration if deployments ever end up on the same domain

## Session Continuity

Last session: 2026-04-29T17:39:55.053Z
Stopped at: Checkpoint 16-02 task 3 — awaiting human verification of saved-lineup template behavior
Resume file: None
