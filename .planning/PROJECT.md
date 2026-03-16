# Madeira FC Lineup Planner — UX Improvements

## What This Is

A soccer lineup planning tool for Madeira FC coaching staff. Coaches use it on both phones and desktops to build lineups by dragging players from a roster onto a soccer field, selecting formations, saving/sharing lineups, and printing them. This milestone focuses on UX polish — better player names, larger field positions, smarter drag-and-drop, and a mobile experience that works as well as desktop.

## Core Value

Coaches can quickly build and adjust lineups on any device — phone at practice or desktop at home — with drag-and-drop that feels natural.

## Requirements

### Validated

- ✓ Drag-and-drop player assignment to field positions — existing
- ✓ Formation selection (3-3-2, 4-3-1, etc.) — existing
- ✓ Player roster management (add/edit/remove) — existing
- ✓ First half / second half lineup support — existing
- ✓ Save lineups with names — existing
- ✓ Share lineups via URL — existing
- ✓ Print-friendly dual-pitch view — existing
- ✓ Firestore cloud sync for published lineups — existing
- ✓ localStorage persistence — existing
- ✓ Mark players inactive — existing
- ✓ Responsive layout (mobile, tablet, desktop) — existing

### Active

- [ ] Display first initial + last name on field positions (e.g., "J. Smith"), full name on bench
- [ ] Larger position circles on field with bigger name and position text
- [ ] Mobile layout: bench/roster above the field, formation selector and controls below
- [ ] Drag-to-bench: dragging a field player to the bench removes them from the field
- [ ] Drag-to-swap: dragging a bench player onto a field player swaps them
- [ ] Mobile UX overhaul: larger touch targets, better button sizing, improved overall usability
- [ ] Desktop layout unchanged — current desktop UX is good

### Out of Scope

- Redesigning the desktop layout — coaches are happy with it as-is
- Adding new features (new formation types, stats, etc.) — this is a UX polish milestone
- Backend changes — Firebase/Firestore setup stays the same

## Context

- Built as a React 19 SPA with Vite, no component library (pure inline styles)
- Single main component: `src/MadeiraLineupPlanner.jsx` (~1100+ lines)
- Current mobile layout puts roster in a bottom drawer — hard to reach and buttons too small
- Desktop layout with sidebar is working well and should not change
- Used equally on phones (at practice/games) and desktop (planning at home)
- Coaches need to drag players quickly — touch targets and visual clarity are critical
- Current drag-and-drop supports roster→field and position→position swaps, but not field→bench removal

## Constraints

- **Tech stack**: React 19 + Vite + Firebase — no changes to build tooling or backend
- **Single component**: All UI lives in `MadeiraLineupPlanner.jsx` — keep it that way for simplicity
- **Desktop preservation**: Desktop layout must remain unchanged; mobile gets a separate responsive treatment
- **No component library**: Currently uses inline styles and custom CSS — don't introduce MUI or similar

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full name on bench, initial on field | Field positions have limited space; bench has room for full names | — Pending |
| Mobile-specific layout (bench top, controls bottom) | Desktop is already good; mobile needs independent rethinking | — Pending |
| Drag-to-bench removes player (no swap) | Bench is a "holding area" — dropping there always frees the field spot | — Pending |
| Drag-from-bench swaps with field player | Coming from bench onto occupied position swaps them | — Pending |

---
*Last updated: 2026-03-15 after initialization*
