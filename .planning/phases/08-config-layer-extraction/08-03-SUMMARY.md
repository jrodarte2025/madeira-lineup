---
phase: 08-config-layer-extraction
plan: 03
subsystem: config-extraction
tags: [config, deployments, formations, roster, null-safety, vitest]

# Dependency graph
requires:
  - plan: 08-02
    provides: TEAM_NAME + config module pattern
provides:
  - "src/deployments/madeira.js — Madeira's ROSTER (13 players) and ALLOWED_FORMATION_KEYS"
  - "src/shared/formations.js — FORMATIONS library moved out of constants.js"
  - "src/config.js exports ROSTER + ALLOWED_FORMATIONS (subset)"
  - "DEPLOYMENT umbrella fully populated (no reserved-undefined slots left)"
  - "formatJerseyNum helper in src/shared/utils.js"
  - "Every num render site null-safe (13+ sites across 6 files)"
affects: [08-04-friend-deployment, 09-formations-gating, 10-quarter-based-game-model, 11-second-deployment-docs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-deployment module pattern: src/deployments/{deploymentId}.js exports ROSTER + ALLOWED_FORMATION_KEYS; src/config.js resolves them for the currently-active deployment"
    - "Split formation lookup: picker UI reads ALLOWED_FORMATIONS (gated), saved-lineup renderers read FORMATIONS (full library for back-compat on older saves)"
    - "Null-safe num rendering via formatJerseyNum helper — single source of truth for the null/undefined/empty predicate"

key-files:
  created:
    - "src/deployments/madeira.js"
    - "src/shared/formations.js"
    - "src/tests/nullNum.test.js"
  modified:
    - "src/config.js"
    - "src/shared/constants.js"
    - "src/shared/utils.js"
    - "src/shared/FieldPosition.jsx"
    - "src/MadeiraLineupPlanner.jsx"
    - "src/games/SharedLineupView.jsx"
    - "src/games/LiveGameScreen.jsx"
    - "src/games/RewatchMode.jsx"
    - "src/tabs/StatsTab.jsx"
    - "src/tests/config.test.js"

key-decisions:
  - "Split formations-allowlist lookups across 2 imports: ALLOWED_FORMATIONS (from config) for the picker UI, FORMATIONS (from shared/formations) for saved-game render sites. Rationale: old share links persisted a formation key that was allowed at save time — render must still resolve it even if the current deployment's allowlist dropped it."
  - "Null-num field circle renders the position label larger inside the circle instead of an empty space above the name — keeps the circle visually complete without breaking layout."
  - "formatJerseyNum accepts 0 and returns '0' — 0 is a valid jersey number, must not be conflated with missing."
  - "RewatchMode.jsx was added to scope — not in original plan but introduced during v2.1 Phase 14. Contains its own BenchChip and FORMATIONS import, both needed updates."

patterns-established:
  - "Per-deployment data layer: src/deployments/*.js holds ROSTER + ALLOWED_FORMATION_KEYS; config.js picks by VITE_DEPLOYMENT_ID (dynamic pick lands in 08-04)"
  - "Gated-library pattern: config.js subsets the library via ALLOWED_FORMATION_KEYS; attempts to reference an unknown formation throw at import time (fail-fast)"

requirements-completed: [CFG-03, CFG-04, CFG-06]

# Metrics
duration: ~30 min
completed: 2026-04-24
---

# Phase 8 Plan 3: Roster + Formations + Null-Safe Nums — Summary

**Relocate Madeira's roster and formation library out of shared/constants.js, plumb them through config.js as per-deployment exports, and make every jersey-number render site null-safe so the friend's num:null roster (landing in 08-04) renders gracefully.**

## Performance

- **Duration:** ~30 min (plumbing + 13 render-site edits + tests + build fixup)
- **Tasks:** 4 (Task 1: plumbing + formations module + deployments module; Task 2: consumer import redirects; Task 3: null-safe num helper + render sites; Task 4: human-verify — auto-approved via build+tests+grep)
- **Files created:** 3 (src/deployments/madeira.js, src/shared/formations.js, src/tests/nullNum.test.js)
- **Files modified:** 10

## Accomplishments

- `INITIAL_ROSTER` and `FORMATIONS` removed from `src/shared/constants.js` — grep confirms zero consumer imports either name from constants
- `src/deployments/madeira.js` holds the 13-player Madeira roster + `["3-3-2", "3-2-3", "2-3-3", "4-3-1"]` allowlist
- `src/shared/formations.js` holds the full 4-formation library with a top-of-file comment explaining the split (allowlist vs library)
- `src/config.js` now fully populates `DEPLOYMENT.roster` and `DEPLOYMENT.formations` — no reserved-undefined slots remain
- `formatJerseyNum` helper added to `src/shared/utils.js` with 7-test contract coverage
- 14 null-num render sites wrapped: 8 in MadeiraLineupPlanner (PlayerChip, PrintPitch field/bench/inactive, inactive pill, chip-strip bench, roster strip, ghost drag), 3 in SharedLineupView (field/bench/inactive), 1 each in LiveGameScreen BenchChip, RewatchMode BenchChip, FieldPosition main circle, StatsTab table label
- Full vitest suite: 98 passing, 0 failing (up from 88 after 10 new config + nullNum tests)
- `npm run build` clean

## Task Commits

1. All tasks bundled: **`20513b4`** — `feat(08-03): extract roster + formations to per-deployment modules`

## Files Created

- **`src/deployments/madeira.js`** — `ROSTER` (13 players, numeric nums preserved) + `ALLOWED_FORMATION_KEYS` (4-formation array).
- **`src/shared/formations.js`** — `FORMATIONS` library moved verbatim from constants.js. Top-of-file comment explains deployment-allowlist gating.
- **`src/tests/nullNum.test.js`** — 7 tests for `formatJerseyNum`: null/undefined/"" return null; 0 returns "0"; numeric / string stringify; never returns literal "null"/"undefined".

## Files Modified

- **`src/config.js`** — Adds `import { ROSTER as MADEIRA_ROSTER, ALLOWED_FORMATION_KEYS } from "./deployments/madeira"` + `import { FORMATIONS } from "./shared/formations"`. Exports `ROSTER` + `ALLOWED_FORMATIONS` (built via `buildAllowedFormations` — throws if any allowlist key isn't in the library). `DEPLOYMENT` object now has `roster`/`formations` filled. TODO(08-04) comment notes the static import needs to become dynamic dispatch.
- **`src/shared/constants.js`** — Removed `INITIAL_ROSTER` and `FORMATIONS` exports. Replaced with a pointer comment explaining where each moved.
- **`src/shared/utils.js`** — Added `formatJerseyNum` helper above `abbreviateName`. Contract: null for null/undefined/empty, "0" for 0, stringified otherwise.
- **`src/shared/FieldPosition.jsx`** — Imports `formatJerseyNum`. Field circle uses `formatJerseyNum(player.num) != null` conditional: renders num+label stacked when num present, position label centered larger when null.
- **`src/MadeiraLineupPlanner.jsx`** — 8 render-site wraps + import redirects (ROSTER/ALLOWED_FORMATIONS from config, formatJerseyNum from utils). FORMATIONS consumers in the component now all read ALLOWED_FORMATIONS (picker dropdown + position lookup for the current formation).
- **`src/games/SharedLineupView.jsx`** — Import split: FORMATIONS from shared/formations (full library for back-compat on older saved lineups), TEAM_NAME from config. 3 render-site wraps (field/bench/inactive).
- **`src/games/LiveGameScreen.jsx`** — Same split. BenchChip num render wrapped.
- **`src/games/RewatchMode.jsx`** — Added to scope (not in original plan). Same split. BenchChip num render wrapped.
- **`src/tabs/StatsTab.jsx`** — ROSTER imported from config (replaces INITIAL_ROSTER from constants). `playerLabel` now gates the `#` prefix when num is null: `player.num != null ? "#N Name" : "Name"`.
- **`src/tests/config.test.js`** — 10 new tests (ROSTER shape, ALLOWED_FORMATIONS shape + subset-of-library, DEPLOYMENT.roster+formations populated).

## Decisions Made

- **Two separate formation imports, on purpose.** The picker UI in MadeiraLineupPlanner reads `ALLOWED_FORMATIONS` from config — this is what gates which options Madeira sees (Phase 9 will add 7v7 formations to the library and prove the gate works by allowlisting only 9v9 for Madeira). Saved-lineup render sites (SharedLineupView, LiveGameScreen, RewatchMode) read the full `FORMATIONS` library from shared/formations — because a saved game's formation key may have been allowlisted at save time but dropped from the current deployment's allowlist, and the render has to still work. This split is documented at the top of shared/formations.js.
- **Null-num field circle shows position label centered larger.** The plan suggested either "empty circle" or "initials fallback". I picked "larger position label" (fontSize 11 vs 16-for-num / 7-for-sub-label) because a blank circle looks broken and initials create their own ambiguity when two players share a first letter.
- **0 is a valid jersey number.** `formatJerseyNum(0)` returns `"0"`, not null — the helper uses explicit nullish checks, not truthy coercion, so a coach entering 0 won't see their player's number disappear.
- **RewatchMode added to scope.** Introduced during v2.1 Phase 14 (post-game stat editing via rewatch). Contains its own BenchChip and its own FORMATIONS import, both of which needed the same treatment as LiveGameScreen. Not pausing on this — same work, same rationale.
- **Human-verify checkpoint auto-approved.** Per user directive. Automated gates: build succeeds, 98/98 tests pass, grep confirms no INITIAL_ROSTER or FORMATIONS-from-constants imports remain, grep confirms no unguarded `{player.num}` / `{p.num}` JSX expressions remain. UI parity verification deferred to final v3.0 regression sweep.

## Deviations from Plan

- **RewatchMode.jsx added** — discovered at build time (MISSING_EXPORT error) because it imported FORMATIONS from constants.js after I removed the export. Fixed and retested; same pattern as the other game files.
- **No @testing-library/react setup** — plan offered it as optional; I took the "narrow to pure unit tests" option since DOM-level regression coverage is better captured by the 08-04 browser smoke + final sweep.
- **Single atomic commit** per user's autonomous-execution directive — didn't split into TDD RED/GREEN cycles.

## Issues Encountered

- Initial build failed with `[MISSING_EXPORT] "FORMATIONS" is not exported by "src/shared/constants.js"` from `src/games/RewatchMode.jsx:2`. The file wasn't in the plan's import-site inventory because it didn't exist when the plan was written. Root cause: v2.1 Phase 14 added RewatchMode during the v3.0 pause. Fixed by redirecting the import and wrapping the BenchChip num render site — same treatment as LiveGameScreen.

## User Setup Required

None.

## Self-Check: PASSED

- `src/deployments/madeira.js` exists with 13 players ✓
- `src/shared/formations.js` exists with 4 formations ✓
- `src/shared/constants.js` no longer exports INITIAL_ROSTER or FORMATIONS ✓
- `grep -rn "INITIAL_ROSTER" src/` returns only a code-comment hit ✓
- `grep -rn "from.*shared/constants" src/ | grep -E "FORMATIONS|INITIAL_ROSTER"` returns 0 hits ✓
- `grep -rn "{player.num}\|{p.num}" src/ | grep -v tests` returns 0 unguarded hits ✓
- `npm run build` succeeds ✓
- 98/98 tests pass ✓
- Commit `20513b4` exists in `git log` ✓

## Next Phase Readiness

- **Ready for 08-04** — Friend FC deployment fixture + build:friend script + Vite mode. Dynamic deployment dispatch (by VITE_DEPLOYMENT_ID) will replace the static madeira import in src/config.js.
- **Handshake for 08-04:** expected deployment-module shape is exactly `{ ROSTER: [...], ALLOWED_FORMATION_KEYS: [...] }` — src/deployments/friend.js should export the same two names.

---
*Phase: 08-config-layer-extraction*
*Completed: 2026-04-24*
