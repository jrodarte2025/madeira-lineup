# Milestones: Madeira FC Lineup Planner

## v3.0 Multi-Deployment Support — PAUSED 2026-04-20

**Status:** Paused mid-Phase 8 to prioritize Madeira polish (v2.1).

**Shipped before pause:**
- Phase 8 / Plan 08-01 (CFG-01, CFG-05): `src/config.js` module + Firebase credentials from `.env.local` via `VITE_FIREBASE_*`. Madeira instance running on this config in production.

**Reverted / not shipped:**
- Plan 08-02 (CFG-02, TEAM_NAME swap) — committed, then reverted on 2026-04-20. Commits `ca6be32` and `b4f8d68` exist in history; revert commits `f21e6e6` and `b2f838f` undid them.

**Not started:** 08-03, 08-04, Phase 9 (7v7 formations), Phase 10 (quarter game model), Phase 11 (second deployment + docs).

**Preserved for resumption:**
- `.planning/REQUIREMENTS.md` — v3.0 requirements (CFG, FORM, QTR, MAD, DEPLOY) still listed
- `.planning/ROADMAP.md` — Phases 8-11 scaffolding intact
- `.planning/phases/08-config-layer-extraction/` — all four PLAN.md files + 08-01-SUMMARY.md

**Resume when:** Madeira v2.1 stable AND Jim is ready to onboard his friend's team. Expect ~1 hour re-planning cost (context freshness, formation decisions, friend's roster may have changed).

**Resume entry point:** `/gsd:resume-work` or `/gsd:execute-phase 8` (will pick up at 08-02).

---

## v2.0 Live Game Tracking & Stats (Shipped: 2026-03-17)

**Phases completed:** 7 phases, 18 plans, 2 tasks

**Key accomplishments:**
- (none recorded)

---

## Completed

### v1.0 — UX Improvements (completed 2026-03-16)

**Goal:** Polish the lineup planner UX — better player names, larger field positions, smarter drag-and-drop, and a mobile experience that works as well as desktop.

**Phases:** 3 (Display Polish, Drag-and-Drop Completion, Mobile UX Overhaul)
**Last phase number:** 3

**Key deliverables:**
- Abbreviated names on field, full names on bench
- Complete drag-and-drop (field-to-bench, bench-to-field swap)
- Touch drag-and-drop on mobile
- Reorganized mobile layout (controls above pitch, roster modal, bench scrubber)
- PWA manifest + home screen icons
- Position labels inside circles
- Firestore auto-sync for working state

---
*Last updated: 2026-03-16*
