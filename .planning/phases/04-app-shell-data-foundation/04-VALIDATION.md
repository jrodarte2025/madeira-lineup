---
phase: 4
slug: app-shell-data-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + jsdom |
| **Config file** | vite.config.js (add `test: { environment: "jsdom" }`) — Wave 0 installs |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | INFRA-01 | unit | `npx vitest run src/__tests__/App.test.jsx` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | INFRA-03 | smoke | `npx vitest run src/__tests__/App.test.jsx` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | INFRA-02 | unit | `npx vitest run src/__tests__/constants.test.js` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | DATA-01 | manual | Firestore console inspection | N/A | ⬜ pending |
| 04-03-02 | 03 | 2 | DATA-02 | manual | Firestore console inspection | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom` — install test framework
- [ ] `vite.config.js` — add `test: { environment: "jsdom" }` configuration
- [ ] `src/__tests__/App.test.jsx` — stubs for INFRA-01, INFRA-03 (tab rendering, lineup route)
- [ ] `src/__tests__/constants.test.js` — stubs for INFRA-02 (shared constant exports)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Game document writes to Firestore with correct schema | DATA-01 | Requires live Firebase project or emulator | 1. Call `createGame()` with test data 2. Open Firestore console 3. Verify `games` collection has doc with opponent, date, status, score, lineup, events[], createdAt fields |
| Season stats document accepts player total updates | DATA-02 | Requires live Firebase project or emulator | 1. Call `updateSeasonStats()` with test deltas 2. Open Firestore console 3. Verify `seasonStats/{year}` doc has `players.{id}` with incremented values |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
