---
phase: 7
slug: season-dashboard-player-profiles
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.1.0 |
| **Config file** | none — vite.config.js used (zero-config) |
| **Quick run command** | `npx vitest run src/tests/seasonUtils.test.js` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/tests/seasonUtils.test.js`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | SEASON-01 | unit | `npx vitest run src/tests/seasonUtils.test.js` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | SEASON-01 | unit | `npx vitest run src/tests/seasonUtils.test.js` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | SEASON-02 | unit | `npx vitest run src/tests/seasonUtils.test.js` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 1 | SEASON-03 | unit | `npx vitest run src/tests/seasonUtils.test.js` | ❌ W0 | ⬜ pending |
| 07-03-02 | 03 | 1 | SEASON-03 | unit | `npx vitest run src/tests/seasonUtils.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/tests/seasonUtils.test.js` — stubs for getSeasonId, computeSeasonDeltas, row sort logic, activeCols derivation, per-player game row extraction
- [ ] `src/shared/seasonUtils.js` — pure functions (getSeasonId, computeSeasonDeltas) that tests import

*Existing infrastructure: vitest installed, 4 test files passing. No framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Season dashboard renders all players with correct data | SEASON-01 | UI rendering requires browser | Load Stats tab after finalizing a game; verify all roster players appear with correct totals |
| Accordion expand shows game-by-game breakdown | SEASON-02 | Interactive UI behavior | Tap a player row; verify game rows appear with correct opponent, date, minutes, stats |
| Season selector dropdown works | SEASON-01 | Dropdown interaction | Change season in dropdown; verify dashboard updates |
| Game row tap navigates to summary | SEASON-02 | Navigation behavior | Tap a game row in expanded accordion; verify navigation to /games/:id/summary |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
