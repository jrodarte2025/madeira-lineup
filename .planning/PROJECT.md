# Madeira FC Lineup Planner

## What This Is

A soccer lineup planning and live game management tool for Madeira FC coaching staff. Coaches build lineups by dragging players onto a soccer field, then run live games with automatic half timers, substitution tracking, and position-aware stat logging. Post-game summaries and season dashboards give coaches a complete picture of every player's contributions.

## Core Value

Coaches can manage lineups, track live games, and review player stats — all from their phone at the field or desktop at home — with one tool that handles the full game-day workflow.

## Current Milestone: v2.0 — Live Game Tracking & Stats

**Goal:** Transform the lineup planner into a live game management tool with automatic timers, position-aware stat tracking, post-game summaries, and season-long player statistics.

**Target features:**
- Game creation (opponent, date, linked lineup)
- Live game mode with 25-minute auto-timers per half
- Per-player minute tracking (starts/stops with substitutions)
- Position-aware stat buttons (GK/DEF/MID/FWD get different stats)
- Post-game summary with shareable link + image export
- Season dashboard with running tallies
- Player profiles with individual season stats
- Bottom tab navigation (Lineup | Games | Stats)

## Requirements

### Validated

- ✓ Drag-and-drop player assignment to field positions — v1.0
- ✓ Formation selection (3-3-2, 4-3-1, etc.) — v1.0
- ✓ Player roster management (add/edit/remove) — v1.0
- ✓ First half / second half lineup support — v1.0
- ✓ Save lineups with names — v1.0
- ✓ Share lineups via URL — v1.0
- ✓ Print-friendly dual-pitch view — v1.0
- ✓ Firestore cloud sync for published lineups — v1.0
- ✓ localStorage persistence — v1.0
- ✓ Mark players inactive — v1.0
- ✓ Responsive layout (mobile, tablet, desktop) — v1.0
- ✓ Touch drag-and-drop on mobile — v1.0
- ✓ Mobile layout with controls above pitch — v1.0
- ✓ PWA home screen install — v1.0
- ✓ Position labels inside field circles — v1.0
- ✓ Duplicate name disambiguation on bench — v1.0
- ✓ Auto-sync working state to Firestore — v1.0

### Active

- [ ] Game creation with opponent name and date
- [ ] Live game screen (separate from lineup builder)
- [ ] 25-minute auto-timer per half (Start Game → auto-stop → Start 2nd Half → auto-stop)
- [ ] Per-player minute tracking (start/stop on sub in/out, display to the minute)
- [ ] Position-aware stat tracking (GK/DEF/MID/FWD groups with specific stat buttons)
- [ ] Color-coded stat buttons (orange=offensive, teal=defensive, gray=neutral)
- [ ] Stat badge counts on player field circles
- [ ] Recent events feed (last 3-5) with undo
- [ ] Post-game summary modal (players × stats table with totals)
- [ ] CSV export of game stats
- [ ] Shareable game summary (link + image)
- [ ] Season dashboard with running tallies across games
- [ ] Player profiles with individual season stats
- [ ] Bottom tab navigation (Lineup | Games | Stats)

### Out of Scope

- Real-time live score sharing to spectators — coach-only for now, sharing designed for later
- Video/photo capture during games — too complex, not core to stat tracking
- Opponent team tracking — focus is on Madeira FC players only
- Multiple team management — single team (Madeira FC) for now
- React Native / native app — PWA is sufficient

## Context

- Built as a React 19 SPA with Vite, pure inline styles (no component library)
- Main component: `src/MadeiraLineupPlanner.jsx` (~1600 lines) — may need to split for v2.0
- Firebase/Firestore for cloud sync — will add game and season collections
- Existing drag-and-drop will serve as substitution mechanism in game mode
- Position groups: GK → "GK", LB/CB/RB/LCB/RCB → "DEF", LM/CM/RM/LCM/RCM → "MID", LS/RS/LW/RW/CF/ST → "FWD"
- Stat types by group:
  - GK: Save, Distribution, Clearance, 50/50 Won
  - DEF: Tackle, Interception, Clearance, Block, 50/50 Won
  - MID: Goal, Assist, Great Pass, Shot on Target, Tackle, Interception, 50/50 Won
  - FWD: Goal, Assist, Great Pass, Shot on Target, 50/50 Won
- Color coding: Offensive (#E86420 orange), Defensive (#4CAFB6 teal), Neutral (#6b7280 gray)
- Coach-only for now; design data model so sharing can be added later
- 25-minute halves (Madeira FC plays 9v9)

## Constraints

- **Tech stack**: React 19 + Vite + Firebase — no changes to build tooling
- **Single repo**: Keep everything in this repo, but may split into multiple component files
- **No component library**: Continue with inline styles — don't introduce MUI or similar
- **Mobile-first**: All new features must be thumb-friendly (min 44px touch targets)
- **Backward compatible**: All v1.0 lineup functionality must continue working
- **Firestore**: Game data and season stats stored in Firestore collections

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full name on bench, initial on field | Field positions have limited space | ✓ Good |
| Mobile-specific layout (controls above pitch) | Desktop is good; mobile needs independent treatment | ✓ Good |
| Drag-to-bench removes, drag-from-bench swaps | Bench is a holding area | ✓ Good |
| Position labels inside circles | Eliminates vertical overlap between adjacent positions | ✓ Good |
| Auto-sync state to Firestore | Fixes inactive toggle persistence across reloads | ✓ Good |
| Separate game screen (not overlay) | Game mode has its own layout needs; keeps lineup builder clean | — Pending |
| Position-aware stat groups | Different positions need different stat buttons | — Pending |
| Bottom tab navigation | Standard mobile pattern, keeps everything one tap away | — Pending |
| Coach-only, shareable later | Reduces v2 scope; design data model for future sharing | — Pending |
| Both link + image for game summary sharing | Link for detail, image for quick group chat sharing | — Pending |

---
*Last updated: 2026-03-16 after v2.0 milestone start*
