# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v2.0 — Live Game Tracking & Stats

**Shipped:** 2026-03-17
**Phases:** 7 | **Plans:** 18

### What Was Built
- Full lineup builder with drag-and-drop, touch support, and mobile-optimized UX (v1.0)
- Tab-based app shell with HashRouter, shared component extraction, Firestore schema
- Live game engine: drift-proof timer, crash recovery, Screen Wake Lock, substitution tracking
- Position-aware stat tracking with color-coded buttons, badge counts, recent events feed with undo
- Post-game summary screen with shareable links and branded image export (html-to-image)
- Season dashboard with sortable all-player totals, per-game accordion drill-down, season selector

### What Worked
- Wave-based parallel execution: phases 6+7 plans ran in parallel where dependencies allowed
- TDD approach for utility functions (seasonUtils, summaryUtils) caught timezone bugs early
- Shared component extraction in Phase 4 paid off — all later phases imported cleanly
- Integration checker caught the early-half-end button gating issue that manual testing missed

### What Was Inefficient
- Phase 5 never got a formal VERIFICATION.md, requiring the audit to do extra work confirming requirements via integration checker
- Firestore rules not being version-controlled from the start caused a silent failure on seasonStats reads/writes
- Season stats backfill had to be reworked twice (Firestore write approach → client-side computation)

### Patterns Established
- Firestore rules tracked in `firestore.rules`, deployed via `firebase deploy --only firestore:rules`
- Shared utilities in `src/shared/` with TDD test coverage
- Fire-and-forget Firestore writes for non-critical post-game operations
- Client-side backfill as fallback when Firestore pre-computed data is missing

### Key Lessons
1. Always add Firestore security rules for new collections BEFORE writing code that uses them
2. Phase verification should never be skipped — the audit caught 4 stale requirement statuses because Phase 5 had no VERIFICATION.md
3. Client-side computation is a viable fallback for pre-computed Firestore data, especially during testing

### Cost Observations
- Model mix: ~20% opus (orchestration), ~80% sonnet (execution, verification)
- Notable: Parallel agent execution in waves significantly reduced wall-clock time for multi-plan phases

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 + v2.0 | 7 | 18 | First full GSD cycle — established wave execution, TDD, integration checking |

### Cumulative Quality

| Milestone | Tests | Key Files | Zero-Dep Additions |
|-----------|-------|-----------|-------------------|
| v2.0 | 64+ | 109 | seasonUtils.js, summaryUtils.js (pure functions) |

### Top Lessons (Verified Across Milestones)

1. Firestore rules must be in version control and updated before new collection code ships
2. Every phase needs a VERIFICATION.md — skipping it creates audit overhead later
