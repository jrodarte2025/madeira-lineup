---
phase: 6
slug: post-game-summary-exports
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 |
| **Config file** | none — zero-config via vite.config.js |
| **Quick run command** | `npx vitest run src/tests/summary.test.js` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/tests/summary.test.js`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | POST-01 | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 | ⬜ pending |
| 06-01-02 | 01 | 1 | POST-01 | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 | ⬜ pending |
| 06-01-03 | 01 | 1 | POST-01 | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 | ⬜ pending |
| 06-01-04 | 01 | 1 | POST-01 | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 | ⬜ pending |
| 06-01-05 | 01 | 1 | POST-02 | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 | ⬜ pending |
| 06-02-01 | 02 | 1 | POST-03 | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 | ⬜ pending |
| 06-02-02 | 02 | 1 | POST-03 | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 | ⬜ pending |
| 06-02-03 | 02 | 1 | POST-04 | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 | ⬜ pending |
| 06-03-01 | 03 | 2 | POST-05 | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 | ⬜ pending |
| 06-03-02 | 03 | 2 | POST-05 | unit | `npx vitest run src/tests/summary.test.js` | Wave 0 | ⬜ pending |
| 06-03-03 | 03 | 2 | POST-05 | manual | Tap "Share Image" on device | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/tests/summary.test.js` — stubs for POST-01, POST-02, POST-03, POST-04, POST-05
- [ ] `npm install html-to-image` — required before Wave 1 image export

*Existing vitest infrastructure covers test runner needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| html-to-image capture + share/download | POST-05 | html-to-image requires real DOM rendering; JSDOM does not support canvas/SVG serialization | Tap "Share Image" on device, verify image downloads or share sheet opens with correct card |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
