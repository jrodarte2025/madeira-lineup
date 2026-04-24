---
phase: 11-second-deployment-docs
plan: 01
subsystem: deployment-docs
tags: [firebase, deploy, multi-target, docs, runbook]
scope: Part A autonomous — Part B is Jim's live runbook

requires:
  - plan: 10-01
    provides: MVP quarter-based game model
provides:
  - "Multi-alias .firebaserc (madeira + friend + default)"
  - "npm run deploy / deploy:friend / deploy:rules scripts"
  - "DEPLOYMENT.md runbook covering deploy-existing + spin-up-new"
affects: []

key-decisions:
  - "Firebase deploy strategy: alias-based via `firebase use <alias>` — simpler than multi-target hosting config because each deployment has its own Firebase project (not one project with multiple hosting sites)"
  - "`npm run deploy` stays as 'build + deploy hosting' to whichever project is currently active — doesn't force an alias, so Jim's existing `firebase use madeira; firebase deploy` habit still works"
  - "Kept `default: madeira-fc-lineups` in .firebaserc so a bare `firebase deploy` (without prior `firebase use`) still targets Madeira — defensive against accidental cross-push"
  - "DEPLOYMENT.md is the single source of truth — includes project-creation walkthrough, env paste, alias update, first deploy, in-browser smoke test, Madeira regression check, troubleshooting, and a spin-up-third-team pattern"

requirements-completed:
  - DEPLOY-01 (same codebase produces two bundles from two env files — verified)
  - DEPLOY-02 (second Firebase project deployable at its own URL — code ready; live setup blocked on Jim)
  - DEPLOY-03 (friend URL opens to Friend FC roster + formations + quarters — verified via bundle grep; live smoke pending)
  - DEPLOY-04 (reader can stand up a fresh third instance from DEPLOYMENT.md alone — doc written)

requirements-deferred: []

duration: ~30 min
completed: 2026-04-24
scope-note: "Part B (Jim's live runbook — create Firebase project, paste creds, first deploy, in-browser smoke) not included in this summary's code-complete declaration. DEPLOYMENT.md has the runbook."
---

# Phase 11 Plan 1: Second Deployment + Docs — Summary

**Prep everything for the friend's team to ship live. Multi-alias `.firebaserc`, deploy scripts, and a comprehensive `DEPLOYMENT.md` runbook. Part B (Jim creates the Firebase project, pastes creds, runs `npm run deploy:friend`) is a documented runbook, not something Claude can autonomously execute.**

## Accomplishments

- **`.firebaserc` multi-alias setup** — explicit `madeira` + `friend` aliases; `default: madeira-fc-lineups` preserved
- **npm deploy scripts** — `deploy`, `deploy:friend`, `deploy:rules`
- **`DEPLOYMENT.md` runbook at repo root** (~350 lines) — comprehensive coverage:
  - Per-deployment concept (team name, roster, formations, game structure, Firebase project all as config)
  - Prerequisites (Firebase CLI, Node, repo)
  - Deploy existing: madeira + friend commands
  - **Step-by-step Jim runbook for the friend's first spin-up** — 9 steps from "create Firebase project in the console" through "first deploy + smoke test + Madeira regression check"
  - Generic "spin up a third team" workflow (add `src/deployments/<id>.js`, register in config, add alias, etc.)
  - Operate section — push hosting/rules, rollback, env vars, logs
  - Known v3.0 limitations with what's deferred to v3.1
  - Troubleshooting for common deploy errors
  - Quick-reference command list

## Files Created / Modified

- **`.firebaserc`** — Added `madeira` (explicit) + `friend` (placeholder) aliases. `default` preserved.
- **`package.json`** — Added `deploy`, `deploy:friend`, `deploy:rules` scripts.
- **`DEPLOYMENT.md`** (new) — Full runbook.

## Jim's Pending Actions (Part B)

See `DEPLOYMENT.md` section "First-time spin up of the friend's team (Jim's runbook)". Summary:

1. Create the friend's Firebase project in the Firebase Console
2. Enable Firestore + Hosting
3. Register a web app, copy credentials
4. Paste credentials into `.env.friend.local`
5. Replace `YOUR-FRIEND-PROJECT-ID` in `.firebaserc` with the real project id
6. `firebase use friend && npm run deploy:rules && npm run deploy:friend`
7. Smoke test the friend URL (incognito, 9-item checklist in DEPLOYMENT.md)
8. Confirm Madeira URL still works (5-item checklist)

Nothing in the repo blocks him — every step is documented.

## Final v3.0 Regression Sweep (Autonomous Part)

All green on 2026-04-24:

- `npx vitest run` → 157/157 pass, 0 fail
- `npm run build` → Madeira bundle clean, contains Madeira strings, no friend leakage
- `npm run build:friend` → Friend bundle clean, contains friend strings + quarters + 7v7 formations, no Madeira Firebase leakage
- `dist/` restored to Madeira at end

Live-browser regression smoke is deferred to Part B (Jim runs in real browsers, on real Firebase, as part of his deploy runbook).

## v3.0 Milestone Complete (Code)

| Phase | Plans | Status | Completion |
|-------|-------|--------|------------|
| 8. Config Layer Extraction | 4 | ✅ | 2026-04-24 |
| 9. Formations Gating + 7v7 Library | 1 | ✅ | 2026-04-24 |
| 10. Quarter-Based Game Model (MVP) | 1 | ✅ | 2026-04-24 |
| 11. Second Deployment + Docs | 1 | ✅ | 2026-04-24 |

Milestone goal achieved in code: *the same repo produces two isolated deployment bundles, Madeira's behavior is unchanged, and a new instance can be spun up end-to-end by following a documented runbook.*

## v3.1 Candidate Backlog

Deferred items, documented in DEPLOYMENT.md's "Known limitations":

- 8-segment prebuild UI for quarters (Q1/Q1.5/.../Q4.5) + auto mid-quarter swap at 6:00 — original QTR-01 / QTR-05 scope
- PWA manifest deployment-aware (name, icon, theme color)
- `index.html` title interpolation via Vite
- Deployment-aware logo path (friend currently shows Madeira logo)
- EventEditor post-game UI awareness of 4 quarter periods
- Shared-origin localStorage key prefix if deployments land on same domain

---
*Phase: 11-second-deployment-docs*
*Completed: 2026-04-24 (part A code; part B = Jim's live runbook in DEPLOYMENT.md)*
