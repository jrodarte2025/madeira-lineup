# Roadmap: Madeira FC Lineup Planner — UX Improvements

## Overview

Three phases of polish that make the lineup planner feel natural on every device. Phase 1 sharpens how player names appear on the field and bench. Phase 2 completes drag-and-drop so coaches can move players in any direction without workarounds. Phase 3 rebuilds the mobile layout so phone use at practice is as good as desktop use at home — without touching the desktop experience.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Display Polish** - Sharpen player name formatting and field position sizing (completed 2026-03-16)
- [x] **Phase 2: Drag-and-Drop Completion** - Complete all drag-and-drop interactions (bench removal and bench-to-field swap) (completed 2026-03-16)
- [x] **Phase 3: Mobile UX Overhaul** - Rebuild mobile layout and touch targets; preserve desktop (completed 2026-03-16)

## Phase Details

### Phase 1: Display Polish
**Goal**: Players are immediately readable on the field and bench at a glance
**Depends on**: Nothing (first phase)
**Requirements**: DISP-01, DISP-02, DISP-03
**Success Criteria** (what must be TRUE):
  1. Field position circles show abbreviated names (e.g., "J. Smith") that fit without truncation
  2. Bench/roster area shows each player's full name
  3. Field position circles are large enough that name and position label are legible without zooming
**Plans:** 1/1 plans complete

Plans:
- [x] 01-01-PLAN.md — Add name abbreviation utility, enlarge field circles, update print formatting

### Phase 2: Drag-and-Drop Completion
**Goal**: Coaches can move players in any direction using drag-and-drop with no dead ends
**Depends on**: Phase 1
**Requirements**: DND-01, DND-02, DND-03
**Success Criteria** (what must be TRUE):
  1. Dragging a field player to the bench removes them from their position (spot becomes empty)
  2. Dragging a bench player onto an occupied field position swaps them — bench player goes to field, field player goes to bench
  3. Dragging a bench player onto an empty field position assigns them to that spot
**Plans:** 2/2 plans complete

Plans:
- [x] 02-01-PLAN.md — Drag-and-drop logic (field-to-bench removal, bench-to-field swap) and visual drag feedback
- [x] 02-02-PLAN.md — Click interaction parity (field-to-field swap, double-click remove) and full verification

### Phase 3: Mobile UX Overhaul
**Goal**: Coaches can build and adjust lineups on a phone as quickly and comfortably as on desktop
**Depends on**: Phase 2
**Requirements**: MOB-01, MOB-02, MOB-03, MOB-04, PRES-01
**Success Criteria** (what must be TRUE):
  1. On mobile, the bench/roster appears above the field and is immediately visible without scrolling or opening a drawer
  2. On mobile, the formation selector and controls appear below the field
  3. All buttons and touch targets on mobile are large enough to tap accurately with a thumb
  4. The desktop layout is pixel-for-pixel identical to before this phase — no regressions
  5. Touch drag-and-drop works on mobile (touchstart/touchmove/touchend) for all interaction types
**Plans:** 2/2 plans complete

Plans:
- [x] 03-01-PLAN.md — Touch drag-and-drop engine (custom touch events) + mobile chip strip above field
- [x] 03-02-PLAN.md — Mobile layout reorganization, roster modal, bench scrubber, PWA, Firestore auto-sync

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Display Polish | 1/1 | Complete    | 2026-03-16 |
| 2. Drag-and-Drop Completion | 2/2 | Complete    | 2026-03-16 |
| 3. Mobile UX Overhaul | 2/2 | Complete    | 2026-03-16 |
