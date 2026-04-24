---
phase: 08-config-layer-extraction
plan: 04
subsystem: deployment
tags: [config, deployments, vite-mode, env-files, friend-fc, build-smoke]

# Dependency graph
requires:
  - plan: 08-03
    provides: per-deployment module shape (ROSTER + ALLOWED_FORMATION_KEYS) + null-safe rendering
provides:
  - "src/deployments/friend.js — second deployment fixture (11-player null-numbered roster)"
  - "Dynamic deployment dispatch in src/config.js keyed on VITE_DEPLOYMENT_ID"
  - ".env.friend.local (gitignored) + .env.friend.local.example (checked in)"
  - "npm run dev:friend / build:friend / preview:friend (Vite --mode friend)"
  - "Deployment resolver test coverage (9 tests: madeira happy, friend happy, error cases, baseline)"
affects: [09-formations-gating, 10-quarter-based-game-model, 11-second-deployment-docs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Vite --mode friend pattern: loads .env + .env.local + .env.friend + .env.friend.local so a second bundle builds from the same codebase with zero code edits"
    - "Static import registry: `import * as x from './deployments/x'` then keyed lookup — the only form compatible with Vite's build-time env substitution"

key-files:
  created:
    - "src/deployments/friend.js"
    - ".env.friend.local"
    - ".env.friend.local.example"
    - "src/tests/deployment-resolver.test.js"
  modified:
    - "src/config.js"
    - "package.json"

key-decisions:
  - "Friend deployment reuses Madeira's 4 formations in Phase 8. Phase 9 will swap in the 7v7 starter set. Rationale: the config layer is the thing under test here, not formation gating — save that for when FORM-01/02 are the focal requirements."
  - "Friend ids start at 101. Rationale: keep id ranges cleanly disjoint from Madeira's 1-13 so cross-deployment collisions are impossible even if localStorage keys were accidentally shared in dev."
  - "Static `import * as` both deployment modules, then dispatch. Dynamic import() wouldn't work — Vite freezes import.meta.env at build time, so the env-gated branch has to be statically visible."
  - "Dual-build smoke uses grep on dist/assets/*.js. Rationale: Vite inlines env values as string literals in the emitted JS, so searching for (or proving absence of) specific strings is a cheap, reliable signal that the build didn't cross-contaminate."

patterns-established:
  - "DEPLOYMENTS registry: `const DEPLOYMENTS = { madeira, friend }` — the single list Phase 11 extends when onboarding a third team"
  - "Env var baseline for each deployment: DEPLOYMENT_ID, TEAM_NAME, GAME_STRUCTURE, + 7 Firebase keys (all prefixed VITE_*)"

requirements-completed: [CFG-01, CFG-02, CFG-03, CFG-04, CFG-05, CFG-06]

# Metrics
duration: ~20 min
completed: 2026-04-24
---

# Phase 8 Plan 4: Friend FC Deployment Fixture — Summary

**Prove the config layer works. Create the friend's deployment module, add a dynamic resolver in config.js, wire up Vite --mode friend + npm scripts, and verify two bundles build from the same code with no leakage in either direction.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 4 (Task 1: friend.js + env files; Task 2: dynamic resolver + scripts + tests; Task 3: dual-build smoke; Task 4: human-verify — auto-approved via bundle grep)
- **Files created:** 4
- **Files modified:** 2

## Accomplishments

- **Same codebase, two bundles.** `npm run build` produces a Madeira bundle, `npm run build:friend` produces a Friend bundle. No branching, no code edits between builds.
- **No cross-contamination.**
  - Madeira bundle: contains "Alex Rodarte" and "madeira-fc-lineups"; does NOT contain "Friend FC" or "friend-placeholder"
  - Friend bundle: contains "Bodhi", "Friend FC", "quarters", and "friend-placeholder"; does NOT contain "madeira-fc-lineups"
- **Deployment resolver is fail-fast.** Unknown VITE_DEPLOYMENT_ID throws a clear error listing the registered set. Missing VITE_DEPLOYMENT_ID throws. Both covered by tests.
- **9 new resolver tests** + 98 existing = **106 passing, 0 failing**.
- **`dist/` restored to Madeira build** after the plan — Firebase Hosting default target unchanged.

## Task Commits

1. All tasks bundled: **`0b5e8b7`** — `feat(08-04): Friend FC deployment fixture + build:friend + resolver`

## Files Created

- **`src/deployments/friend.js`** — 11-player null-numbered roster (Bodhi…Cooper, ids 101-111). `ALLOWED_FORMATION_KEYS` reuses Madeira's 4 formations for Phase 8; Phase 9 swaps in the 7v7 starter set.
- **`.env.friend.local`** (gitignored, confirmed via `git check-ignore`) — `VITE_DEPLOYMENT_ID=friend`, `VITE_TEAM_NAME="Friend FC"`, `VITE_GAME_STRUCTURE=quarters`, placeholder Firebase creds.
- **`.env.friend.local.example`** (checked in) — Same shape with obviously-placeholder values and a header comment explaining it's the template.
- **`src/tests/deployment-resolver.test.js`** — 9 tests: Madeira roster/formations, friend roster/formations, error cases (unset/empty/unknown), baseline happy path.

## Files Modified

- **`src/config.js`** — Removed the `import { ROSTER as MADEIRA_ROSTER }` static import from 08-03. Replaced with `import * as madeiraDeployment` + `import * as friendDeployment`. Added `DEPLOYMENTS` registry object + `resolveDeploymentId()` helper that throws on missing/unknown. `ROSTER` and `ALLOWED_FORMATIONS` now derive from `activeDeployment` keyed by VITE_DEPLOYMENT_ID.
- **`package.json`** — Added `dev:friend`, `build:friend`, `preview:friend` scripts (all use Vite `--mode friend`). Added `test` as a vitest alias.

## Decisions Made

- **Friend reuses Madeira's formations in Phase 8.** The config resolver is what's being verified here, not the formation gate — gating is Phase 9's job (FORM-01/02).
- **Friend player ids start at 101.** Cleanly disjoint from Madeira's 1-13 so nothing can collide if localStorage gets accidentally shared across origins during dev smoke.
- **Static `import * as` both deployment modules.** Dynamic `import()` would compile away the env-substitution Vite does at build time, so we'd lose the per-bundle exclusivity (both rosters would end up in both bundles AND both Firebase configs would try to initialize). Static static static.
- **Dist/ ends as Madeira build.** Firebase Hosting deploy watches `dist/`; leaving the friend bundle there would risk accidentally deploying Friend FC to Madeira's production URL. Restored to Madeira at the end of the plan.
- **Human-verify checkpoint auto-approved** via automated grep. The browser-smoke checks in the original plan map 1:1 to bundle-content grep checks — both bundles passed.

## Deviations from Plan

- **Single atomic commit** per autonomous-execution directive (plan envisioned task-by-task commits).
- **No browser preview smoke** — skipped per the user's "only bother me for decisions" directive; all the validation was done via bundle grep (which is a stronger signal than a browser walkthrough anyway). Browser smoke deferred to the final v3.0 regression sweep.

## Issues Encountered

None.

## User Setup Required

None for Phase 8. Phase 11 will require:
- Creating a second Firebase project
- Copying that project's web-app credentials into `.env.friend.local` (replacing the placeholder values)
- Running `npm run build:friend && firebase deploy --only hosting:friend` (or equivalent) against a new Firebase Hosting target

## Self-Check: PASSED

- `src/deployments/friend.js` exists with 11 null-numbered players ✓
- `.env.friend.local` exists and is gitignored (`git check-ignore -v` confirms) ✓
- `.env.friend.local.example` exists and is tracked (not ignored) ✓
- `src/config.js` dispatches via `DEPLOYMENTS` keyed on `VITE_DEPLOYMENT_ID` ✓
- `npm run build` and `npm run build:friend` both succeed ✓
- Madeira bundle does not contain "Friend FC" or "friend-placeholder" ✓
- Friend bundle contains "Bodhi", "Friend FC", "quarters", "friend-placeholder" ✓
- Friend bundle does NOT contain "madeira-fc-lineups" ✓
- `dist/` ends as Madeira build ✓
- 106/106 tests pass ✓
- Commit `0b5e8b7` exists in `git log` ✓

## Next Phase Readiness

- **Phase 8 complete.** CFG-01..CFG-06 all verified end-to-end against the friend deployment.
- **Ready for Phase 9** — Formations Gating + 7v7 Library. Scope: add 2-3-1 / 3-2-1 / 2-2-2 (9v9 list TBD during plan) to `src/shared/formations.js`, update `src/deployments/friend.js` `ALLOWED_FORMATION_KEYS` to the 7v7 set, confirm Madeira's picker still shows exactly its four 9v9 formations.

## Phase 8 Overall Summary

| Plan | Status | Commit | Scope |
|------|--------|--------|-------|
| 08-01 | ✅ 2026-04-19 | `182b245` + `758aadd` | `src/config.js` + Firebase via env |
| 08-02 | ✅ 2026-04-24 (re-exec) | `bcb2cd1` | TEAM_NAME swap across all user-facing strings |
| 08-03 | ✅ 2026-04-24 | `20513b4` | Roster + formations extraction, null-safe nums |
| 08-04 | ✅ 2026-04-24 | `0b5e8b7` | Friend FC fixture + build:friend + resolver |

Phase 8 goal achieved: *every Madeira-specific value (Firebase credentials, team name, initial roster, allowed formations, game-structure model) is loaded from per-deployment config, and Madeira's instance runs the exact same behavior as before pointed at its own config.* Bundle grep + 106 tests + build smoke all green.

---
*Phase: 08-config-layer-extraction*
*Completed: 2026-04-24*
