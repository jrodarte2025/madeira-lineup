---
phase: 10-quarter-based-game-model
plan: 01
subsystem: live-game
tags: [quarters, game-structure, period-transitions, state-machine]
scope: MVP — auto-pause only, no 8-segment prebuild, no auto mid-quarter swap

requires:
  - plan: 09-01
    provides: 7v7 formations allowed for friend deployment
provides:
  - "src/shared/gameStructure.js — period state machine (constants, predicates, transitions)"
  - "GameHeader parameterized by GAME_STRUCTURE (period length, button labels, status colors)"
  - "LiveGameScreen period transitions work for both halves and quarters"
affects: [11-second-deployment-docs]

key-decisions:
  - "MVP scope: 4 periods, auto-pause at each boundary, existing tap-to-sub for mid-period changes. 8-segment prebuild and auto mid-quarter swap deferred to v3.1 (per Jim, 2026-04-24)"
  - "Kept halfIntervals as the state/Firestore field name — structurally unchanged, just more entries for quarters. Avoids an unnecessary Firestore migration for Madeira's 150+ existing completed games"
  - "Quarters uses new status values (q1, break-q1, q2, halftime, q3, break-q3, q4) — Madeira's status values untouched, so Madeira's in-flight and completed Firestore games continue to load identically"
  - "event.half now stores getPeriodNumber(status) — 1-4 for quarters, 1-2 for halves. EventEditor's 1/2-picker semantics unchanged (MVP compromise — noted below)"
  - "Home team label switches from hardcoded 'MFC' to getHomeTeamCode(TEAM_NAME) — 'MAD' for Madeira, 'FRI' for friend. Small nit but completes the deployment-gating story"

known-mvp-limitations:
  - "EventEditor post-game UI still has a 1/2 half picker. Quarters events with half=3 or half=4 bucket into the editor's h1 group (since `e.half === 2 ? h2 : h1` treats 3/4 as not-2). Not a totals issue — summaryUtils derives minutes via halfIntervals intersection, not event.half. Edit surface is approximate for quarters games"
  - "LineupPlanner publishes one starting lineup for both structures. Coach uses tap-to-sub for all mid-period changes. If the friend's coach wants per-period prebuilt lineups, that's v3.1"

requirements-completed: [QTR-02, QTR-03, QTR-04, QTR-06, MAD-01, MAD-02]
requirements-deferred: [QTR-01, QTR-05]

duration: ~45 min
completed: 2026-04-24
---

# Phase 10 Plan 1: MVP Quarter-Based Game Model — Summary

**Ship a minimum-viable quarters flow. 4 × 12-min periods. Auto-pause at each quarter boundary. Coach uses existing tap-to-sub for mid-period changes. Madeira's halves flow is byte-identical — same status values, same labels, same 30-min period length, same halfIntervals shape.**

## Accomplishments

- **New `src/shared/gameStructure.js` module** — single source of truth for period lifecycle across both structures
- **GameHeader parameterized by GAME_STRUCTURE** — one component, both structures. No hardcoded `HALF_SECONDS = 1800` anymore
- **LiveGameScreen state machine generalized** — 6 `"1st-half" || "2nd-half"` checks replaced with `isActiveStatus(gameStatus)`; handleEndHalf/handleStartSecondHalf renamed and transition via `getBreakStatusAfter` / `getNextActiveStatus`
- **halfIntervals shape preserved** — Madeira's existing Firestore games load identically; quarters just append 4 entries instead of 2
- **Tests:** 30 new gameStructure unit tests (constants, predicates, transitions, labels). Full suite 157 passing.
- **Dual-build verified:**
  - Madeira bundle contains `"1st-half"`, `"halftime"`, `"End Half"`, `"Start 2nd Half"`, `"Full Time!"` labels; period length 1800s
  - Friend bundle contains `"break-q1"`, `"break-q3"`, `"End Q1"`, `"Start Q2/Q3/Q4"`, `"Full Time!"` labels; period length 720s
- **Home-team label deployment-aware:** `MFC` hardcoded literal replaced with `getHomeTeamCode(TEAM_NAME)` → `MAD` for Madeira, `FRI` for friend

## Files Created

- `src/shared/gameStructure.js` — Period state-machine constants, predicates, transitions, labels, home-team-code helper.
- `src/tests/gameStructure.test.js` — 30 unit tests covering every mapping.
- `.planning/phases/10-quarter-based-game-model/10-01-PLAN.md` — Compact plan reflecting the MVP scope decision.

## Files Modified

- `src/games/GameHeader.jsx` — Fully rewritten to read period length from `PERIOD_LENGTH_SECONDS[GAME_STRUCTURE]`, use `isActiveStatus`/`isBreakStatus` for timer color + stoppage logic, render a single primary action button whose label comes from `getActionButtonLabel(status, GAME_STRUCTURE)`, and show `getHomeTeamCode(TEAM_NAME)` as the home score label.
- `src/games/LiveGameScreen.jsx` — Period transitions generalized: `handleStartGame` uses `INITIAL_ACTIVE_STATUS[GAME_STRUCTURE]`; `handleEndHalf → handleEndPeriod` uses `getBreakStatusAfter`; `handleStartSecondHalf → handleStartNextPeriod` uses `getNextActiveStatus` / `getNextActiveStatusFromHalftime`; new `handlePrimaryAction` dispatcher wires to GameHeader's single button. All `"1st-half" || "2nd-half"` checks (6 sites) replaced with `isActiveStatus(gameStatus)`. `isInteractive` and game-completed render gates now accept all period-related statuses. `event.half` logging uses `getPeriodNumber(gameStatus)` → 1-4 for quarters.

## Known MVP Limitations

- **EventEditor post-game 1/2 half picker stays halves-only.** Quarters events with `half=3` or `half=4` bucket into the editor's h1 group because of `e.half === 2 ? h2 : h1` logic. Not a totals issue (summaryUtils uses halfIntervals intersection, not `event.half`). Punchlist item if the friend's coach does much post-game editing.
- **LineupPlanner publishes one starting lineup.** No per-period prebuild UI. Mid-period changes use existing tap-to-sub. QTR-01 (8-segment prebuild) is deferred to v3.1 per the scope decision.
- **QTR-05 auto mid-quarter swap at 6:00** is not implemented — also deferred to v3.1. Coaches handle mid-quarter subs via tap-to-sub during live play.

## Next Phase Readiness

- **Ready for Phase 11** — Second deployment + docs. What's left:
  - Jim creates a real second Firebase project (currently friend uses placeholder creds)
  - Copy real Firebase config into `.env.friend.local`
  - Firebase Hosting target for friend URL
  - `DEPLOYMENT.md` documenting the full spin-up workflow
  - Final Madeira regression smoke before calling v3.0 done

---
*Phase: 10-quarter-based-game-model*
*Completed: 2026-04-24*
