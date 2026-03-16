---
phase: 5
slug: live-game
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (Wave 0 installs) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run src/tests/utils.test.js` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/tests/utils.test.js`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | GAME-01 | unit | `npx vitest run src/tests/firebase.test.js` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | GAME-04 | unit | `npx vitest run src/tests/timer.test.js` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | GAME-03 | manual | Start game, watch timer reach 0 | N/A | ⬜ pending |
| 05-02-03 | 02 | 1 | GAME-05 | manual | Physical device test | N/A | ⬜ pending |
| 05-02-04 | 02 | 1 | GAME-06 | manual | Start game, reload app | N/A | ⬜ pending |
| 05-03-01 | 03 | 2 | SUB-04 | unit | `npx vitest run src/tests/utils.test.js` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 2 | SUB-01 | manual | Drag player during active game | N/A | ⬜ pending |
| 05-03-03 | 03 | 2 | SUB-03 | manual | Visual inspection during game | N/A | ⬜ pending |
| 05-04-01 | 04 | 2 | STAT-02 | unit | `npx vitest run src/tests/utils.test.js` | ❌ W0 | ⬜ pending |
| 05-04-02 | 04 | 2 | STAT-06 | unit | `npx vitest run src/tests/utils.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install --save-dev vitest` — no test runner found in project
- [ ] `src/tests/utils.test.js` — stubs for `calcMinutes()` (SUB-04), `getPositionGroup()` (STAT-02), undo logic (STAT-06)
- [ ] `src/tests/firebase.test.js` — stubs for `createGame()` shape (GAME-01), `listGames()` shape
- [ ] `src/tests/timer.test.js` — stubs for timer drift-proof logic (GAME-04)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Timer auto-stops at 0:00 and flips to stoppage | GAME-03 | Requires real rAF timing | Start game, watch countdown reach 0:00, verify stoppage mode activates |
| Screen Wake Lock acquired/reacquired | GAME-05 | Requires physical device | Start game, lock phone, unlock — verify screen stays awake |
| Crash recovery resume prompt | GAME-06 | Requires full app reload | Start game, close/reload app, verify resume prompt appears |
| Drag during game logs sub event | SUB-01 | Requires touch interaction | During active game, drag player on/off field, verify sub event logged |
| Running minute display updates live | SUB-03 | Visual timing verification | During game, verify minute count on field circles increments |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
