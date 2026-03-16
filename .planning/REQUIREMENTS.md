# Requirements: Madeira FC Lineup Planner — UX Improvements

**Defined:** 2026-03-15
**Core Value:** Coaches can quickly build and adjust lineups on any device with drag-and-drop that feels natural

## v1 Requirements

### Display

- [x] **DISP-01**: Field positions show first initial + last name (e.g., "J. Smith")
- [x] **DISP-02**: Bench/roster shows full player names
- [x] **DISP-03**: Position circles on field are larger with bigger name and position text

### Drag & Drop

- [ ] **DND-01**: Dragging a field player to the bench removes them from their field position (spot goes empty)
- [ ] **DND-02**: Dragging a bench player onto an occupied field position swaps them (bench player goes to field, field player goes to bench)
- [ ] **DND-03**: Dragging a bench player onto an empty field position assigns them

### Mobile UX

- [ ] **MOB-01**: Mobile layout places bench/roster above the field
- [ ] **MOB-02**: Mobile layout places formation selector and controls below the field
- [ ] **MOB-03**: Touch targets and buttons are large enough for comfortable phone use
- [ ] **MOB-04**: Overall mobile UX is intuitive and polished (no cramped or hidden elements)

### Preservation

- [ ] **PRES-01**: Desktop layout remains unchanged from current state

## v2 Requirements

(None — this is a focused UX polish milestone)

## Out of Scope

| Feature | Reason |
|---------|--------|
| New formations | UX polish only, no feature additions |
| Backend/Firebase changes | Infrastructure is stable |
| Desktop layout redesign | Coaches are happy with current desktop UX |
| Component library (MUI, etc.) | Keep current inline style approach |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DISP-01 | Phase 1 | Complete |
| DISP-02 | Phase 1 | Complete |
| DISP-03 | Phase 1 | Complete |
| DND-01 | Phase 2 | Pending |
| DND-02 | Phase 2 | Pending |
| DND-03 | Phase 2 | Pending |
| MOB-01 | Phase 3 | Pending |
| MOB-02 | Phase 3 | Pending |
| MOB-03 | Phase 3 | Pending |
| MOB-04 | Phase 3 | Pending |
| PRES-01 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 — traceability mapped after roadmap creation*
