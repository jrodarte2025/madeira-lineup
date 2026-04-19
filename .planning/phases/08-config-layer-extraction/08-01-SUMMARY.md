---
phase: 08-config-layer-extraction
plan: 01
subsystem: infra
tags: [vite, firebase, config, env-vars, vitest, deployment]

# Dependency graph
requires:
  - phase: 07-season-dashboard
    provides: v2.0 complete — stable baseline for v3.0 refactor
provides:
  - "src/config.js — single source of truth for per-deployment config, reads build-time env vars via import.meta.env"
  - "FIREBASE_CONFIG exported object — driven entirely from VITE_FIREBASE_* env vars (no hardcoded credentials in src/)"
  - "GAME_STRUCTURE exported constant — normalized 'halves'|'quarters' with default 'halves' and invalid-value throw"
  - "DEPLOYMENT umbrella object with firebase/gameStructure populated + teamName/roster/formations reserved placeholders for 08-02 and 08-03"
  - ".env.local with Madeira credentials (gitignored) + .env.example template (checked in)"
  - ".gitignore entries preventing .env.local / .env.*.local from ever being committed"
affects: [08-02-team-name, 08-03-roster-formations, 08-04-friend-deployment, 09-formations-gating, 10-quarter-based-game-model, 11-second-deployment-docs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-deployment config resolved at Vite build time from VITE_* env vars — no runtime fetch, no dashboard call"
    - "src/config.js is the ONLY module that reads import.meta.env — every other consumer imports from ./config"
    - "DEPLOYMENT shape defines reserved undefined slots so later plans plug in without restructuring imports"
    - "vi.stubEnv + vi.resetModules pattern for testing modules that read env at import time"

key-files:
  created:
    - "src/config.js"
    - "src/tests/config.test.js"
    - ".env.local"
    - ".env.example"
  modified:
    - "src/firebase.js"
    - ".gitignore"

key-decisions:
  - "Invalid VITE_GAME_STRUCTURE values throw at import time (fail-fast) rather than silently defaulting, so a typo in .env.local is caught before Firebase init"
  - "VITE_GAME_STRUCTURE values are normalized to lowercase before validation ('Halves' -> 'halves') to tolerate editor auto-capitalization"
  - "teamName/roster/formations are reserved as undefined keys on DEPLOYMENT (not omitted) so 08-02/08-03 can fill them without any consumer restructuring imports"
  - "VITE_DEPLOYMENT_ID is documented + set in .env.local but not yet consumed — reserved for Phase 11 DEPLOYMENT.md telemetry"

patterns-established:
  - "Env var access pattern: import.meta.env.VITE_* reads ONLY happen inside src/config.js"
  - "Deployment config shape pattern: { firebase, gameStructure, teamName, roster, formations } umbrella object with reserved undefined slots"
  - "Env-driven module testing pattern: vi.stubEnv + vi.resetModules + dynamic import() to re-evaluate module body against fresh env"

requirements-completed: [CFG-01, CFG-05]

# Metrics
duration: ~15 min
completed: 2026-04-19
---

# Phase 8 Plan 1: Config Layer Extraction — Foundation Summary

**Per-deployment config module (src/config.js) extracts Firebase credentials into VITE_* env vars and introduces a GAME_STRUCTURE constant ('halves'|'quarters') with normalization, defaulting, and fail-fast validation — the umbrella shape every subsequent Phase 8 plan plugs into.**

## Performance

- **Duration:** ~15 min (Task 1 code commits) + human-verify pause
- **Started:** 2026-04-19 14:38 ET (first task commit)
- **Completed:** 2026-04-19 (human-verify approved)
- **Tasks:** 2 (1 auto TDD + 1 human-verify checkpoint)
- **Files created:** 4 (src/config.js, src/tests/config.test.js, .env.local, .env.example)
- **Files modified:** 2 (src/firebase.js, .gitignore)

## Accomplishments

- Eliminated all hardcoded Firebase credentials from `src/` (`grep -rn "AIzaSy\|madeira-fc-lineups.firebaseapp.com\|275318113105" src/` returns zero hits)
- Established the DEPLOYMENT umbrella shape used by every subsequent v3.0 plan — `{ firebase, gameStructure, teamName, roster, formations }`
- Made env-var access a single-module concern — only `src/config.js` reads `import.meta.env`
- Shipped 8 passing unit tests covering FIREBASE_CONFIG shape, GAME_STRUCTURE normalization/default/throw behavior, and DEPLOYMENT placeholder contract
- Added `.env.example` template so future deployments have a checked-in reference for the full VITE_* key list
- Hardened `.gitignore` against accidental credential leaks via `.env.local` / `.env.*.local`

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Add failing tests for config module** — `182b245` (test)
2. **Task 1 (GREEN): Extract Firebase config into per-deployment env module** — `758aadd` (feat)
3. **Task 2: Human-verify Madeira flow parity** — no commit (approval-only, no source changes)

**Plan metadata:** (committed below with this SUMMARY.md, STATE.md, ROADMAP.md, REQUIREMENTS.md)

_Note: This plan ran as TDD (test first, feat second). Task 2 is a `checkpoint:human-verify` — no source files change, so no commit was needed for the approval._

## Files Created/Modified

- `src/config.js` — Single source of truth for deployment config. Exports `FIREBASE_CONFIG`, `GAME_STRUCTURE`, `DEPLOYMENT` (named + default). Reads all values from `import.meta.env.VITE_*` at build time. Includes top-of-file env-var reference doc block for future `DEPLOYMENT.md` (Phase 11).
- `src/tests/config.test.js` — 8 vitest tests covering `FIREBASE_CONFIG` key presence, `GAME_STRUCTURE` variants (halves/quarters/mixed-case/unset/empty/invalid), and `DEPLOYMENT` shape + default export identity. Uses `vi.stubEnv` + `vi.resetModules` + dynamic `import()` pattern.
- `src/firebase.js` — Removed inline `firebaseConfig` literal (7 fields + TODO block). Added `import { FIREBASE_CONFIG } from "./config";` and passes `FIREBASE_CONFIG` to `initializeApp()`. No other logic changes.
- `.env.local` — **Gitignored.** Holds the Madeira Firebase project values verbatim from the prior hardcoded config, plus `VITE_GAME_STRUCTURE=halves` and `VITE_DEPLOYMENT_ID=madeira`.
- `.env.example` — **Checked in.** Full template with placeholder values and header comments explaining each key. Includes `halves|quarters` hint on `VITE_GAME_STRUCTURE`.
- `.gitignore` — Appended `# Per-deployment secrets` block with `.env.local` and `.env.*.local` entries.

## DEPLOYMENT shape (reference for 08-02 and 08-03)

```
DEPLOYMENT = {
  firebase:      FIREBASE_CONFIG,   // populated in 08-01 (this plan)
  gameStructure: GAME_STRUCTURE,    // populated in 08-01 (this plan)
  teamName:      undefined,          // filled by 08-02
  roster:        undefined,          // filled by 08-03
  formations:    undefined,          // filled by 08-03
}
```

Exported as both a named export (`DEPLOYMENT`) and the default export. Consumers should destructure, not reach into internals.

## Env Var Keys Introduced

Full VITE_* surface established in this plan:

| Key | Consumer | Notes |
|-----|----------|-------|
| `VITE_FIREBASE_API_KEY` | `FIREBASE_CONFIG.apiKey` | |
| `VITE_FIREBASE_AUTH_DOMAIN` | `FIREBASE_CONFIG.authDomain` | |
| `VITE_FIREBASE_PROJECT_ID` | `FIREBASE_CONFIG.projectId` | |
| `VITE_FIREBASE_STORAGE_BUCKET` | `FIREBASE_CONFIG.storageBucket` | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `FIREBASE_CONFIG.messagingSenderId` | |
| `VITE_FIREBASE_APP_ID` | `FIREBASE_CONFIG.appId` | |
| `VITE_FIREBASE_MEASUREMENT_ID` | `FIREBASE_CONFIG.measurementId` | |
| `VITE_GAME_STRUCTURE` | `GAME_STRUCTURE` | `halves` (default) or `quarters`; throws on any other value |
| `VITE_DEPLOYMENT_ID` | (reserved) | Not yet consumed; documented for Phase 11 DEPLOYMENT.md |

## Decisions Made

- **Fail-fast on invalid `VITE_GAME_STRUCTURE` instead of silent default.** Rationale: a typo like `VITE_GAME_STRUCTURE=halfs` should error at import time, not silently fall back to halves and confuse Phase 10's quarter branching. Matches the test-6 assertion in the plan spec.
- **Lowercase normalization before validation.** Rationale: an editor auto-capitalizing `Halves` in `.env.local` shouldn't crash the app.
- **Reserved undefined keys in DEPLOYMENT instead of omitting them.** Rationale: lets 08-02/08-03 fill `teamName`/`roster`/`formations` without any downstream consumer having to change import shapes. Enforced by test `DEPLOYMENT › is the umbrella object ...`.
- **`VITE_DEPLOYMENT_ID` is documented + populated but not consumed in this plan.** Rationale: matches the plan's don't-rename-keys-later rule; Phase 11 will wire it when DEPLOYMENT.md gets written.
- **`GAME_STRUCTURE` is exported-but-unused in Phase 8.** It's read through `DEPLOYMENT.gameStructure` and validated at import, but no consumer in this plan (or 08-02 / 08-03) branches on it. Phase 10 introduces the first consumer (quarter-based game flow). This is intentional and called out here so Phase 10's planner knows the config slot already exists.

## Deviations from Plan

None — plan executed exactly as written. All tasks, files, verifications, and done criteria were hit as specified. No Rule 1/2/3/4 deviations occurred.

## Issues Encountered

None. TDD cycle ran clean (RED → GREEN), build passed, no pre-existing warnings or regressions surfaced.

## User Setup Required

None — no external services configured in this plan. The existing Madeira Firebase project continues to be used; credentials just moved from source to `.env.local`.

## Human Verification Outcome

Task 2 (`checkpoint:human-verify`) approved by user after manual end-to-end Madeira flow check:

- Dev server booted with new config-driven Firebase setup
- Lineup tab renders the existing Madeira roster identically
- Firestore reads/writes hit `firestore.googleapis.com` for project `madeira-fc-lineups` (confirmed via Network tab)
- Test game create/delete round-trip succeeded end-to-end
- Negative test: renaming `.env.local` → `.env.local.bak` broke boot as expected; restoring `.env.local` recovered the app

Zero visible regressions. User typed "approved" to unblock Plan 08-02.

## Next Phase Readiness

- **Ready for 08-02** (Team name swap — CFG-02). The `DEPLOYMENT.teamName` slot is reserved; 08-02's job is populating it from `VITE_TEAM_NAME` and replacing hardcoded "Madeira FC" / "MADEIRA FC" strings across the app.
- **User pausing here before Wave 2.** Game this afternoon — clean pause boundary requested. 08-02 will kick off in the next session via `/gsd:execute-phase 08`.
- **No blockers.** Wave 2 (08-02) has zero dependency on additional research or decisions. The config module shape is locked and documented.

## Self-Check: PASSED

Verified:
- `src/config.js` exists at expected path (95 lines)
- `src/tests/config.test.js` exists at expected path (153 lines, 8 tests)
- `.env.local` exists at repo root (gitignored, 749 bytes)
- `.env.example` exists and is tracked in git (26 lines)
- `.gitignore` contains `.env.local` entry
- `src/firebase.js` imports `FIREBASE_CONFIG` from `./config` (no inline credentials)
- Commits `182b245` (test) and `758aadd` (feat) exist in `git log`
- `grep -rn "AIzaSy\|madeira-fc-lineups.firebaseapp.com\|275318113105" src/` returns zero hits

---
*Phase: 08-config-layer-extraction*
*Completed: 2026-04-19*
