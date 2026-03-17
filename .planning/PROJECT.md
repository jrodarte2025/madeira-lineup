# Madeira FC Lineup Planner

## What This Is

A soccer lineup planning and live game management tool for Madeira FC coaching staff. Coaches build lineups by dragging players onto a soccer field, run live games with automatic half timers and substitution tracking, log position-aware stats with one tap, then review post-game summaries and season dashboards showing every player's contributions across all games.

## Core Value

Coaches can manage lineups, track live games, and review player stats — all from their phone at the field or desktop at home — with one tool that handles the full game-day workflow from kickoff to season review.

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
- ✓ Bottom tab navigation (Lineup | Games | Stats) — v2.0
- ✓ Game creation with opponent name and date — v2.0
- ✓ Live game screen with linked lineup on pitch — v2.0
- ✓ 25-minute auto-timer per half with drift-proof timestamps — v2.0
- ✓ Per-player minute tracking via interval intersection — v2.0
- ✓ Position-aware stat tracking (GK/DEF/MID/FWD groups) — v2.0
- ✓ Color-coded stat buttons (orange/teal/gray) — v2.0
- ✓ Stat badge counts on player field circles — v2.0
- ✓ Recent events feed with single-tap undo — v2.0
- ✓ Post-game summary with stats table and per-player minutes — v2.0
- ✓ Shareable game summary link (public read-only mode) — v2.0
- ✓ Branded image export for group chat sharing — v2.0
- ✓ Season dashboard with sortable player totals — v2.0
- ✓ Per-player game-by-game breakdown via accordion — v2.0
- ✓ Game finalization pushes stats to season totals — v2.0
- ✓ Screen Wake Lock during active games — v2.0
- ✓ Crash recovery via localStorage mirroring — v2.0
- ✓ Firestore schema for games and season stats — v2.0

### Active

(None — next milestone requirements TBD)

### Out of Scope

- Real-time live score sharing to spectators — coach-only for now, sharing designed for later
- Video/photo capture during games — too complex, not core to stat tracking
- Opponent team tracking — focus is on Madeira FC players only
- Multiple team management — single team (Madeira FC) for now
- React Native / native app — PWA is sufficient
- CSV export of game stats — descoped during v2.0; utility function exists if needed later

## Context

- **Shipped:** v1.0 (UX Improvements) + v2.0 (Live Game Tracking & Stats)
- **Codebase:** 6,244 LOC across 109 files (React 19 + Vite + Firebase)
- **Architecture:** Tab-based SPA with HashRouter; shared components in `src/shared/`; game screens in `src/games/`; tab views in `src/tabs/`
- **Data:** Firestore collections — `games` (events embedded), `seasonStats` (denormalized player totals), `lineups`, `config`
- **Testing:** Vitest with 64+ tests across season utils, summary utils, and core utilities
- Position groups: GK → "GK", LB/CB/RB/LCB/RCB → "DEF", LM/CM/RM/LCM/RCM → "MID", LS/RS/LW/RW/CF/ST → "FWD"
- Color coding: Offensive (#E86420 orange), Defensive (#4CAFB6 teal), Neutral (#6b7280 gray)
- 25-minute halves (Madeira FC plays 9v9)

## Constraints

- **Tech stack**: React 19 + Vite + Firebase — no changes to build tooling
- **Single repo**: Everything in this repo with component-based file structure
- **No component library**: Inline styles throughout — no MUI or similar
- **Mobile-first**: All features must be thumb-friendly (min 44px touch targets)
- **Firestore**: All persistent data in Firestore collections
- **Firestore rules**: Tracked in `firestore.rules`, deployed via `firebase deploy --only firestore:rules`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full name on bench, initial on field | Field positions have limited space | ✓ Good |
| Mobile-specific layout (controls above pitch) | Desktop is good; mobile needs independent treatment | ✓ Good |
| Drag-to-bench removes, drag-from-bench swaps | Bench is a holding area | ✓ Good |
| Position labels inside circles | Eliminates vertical overlap between adjacent positions | ✓ Good |
| Auto-sync state to Firestore | Fixes inactive toggle persistence across reloads | ✓ Good |
| Separate game screen (not overlay) | Game mode has its own layout needs; keeps lineup builder clean | ✓ Good |
| Position-aware stat groups | Different positions need different stat buttons; coaches confirmed groupings | ✓ Good |
| Bottom tab navigation | Standard mobile pattern, keeps everything one tap away | ✓ Good |
| Coach-only, shareable later | Reduces v2 scope; data model supports future sharing | ✓ Good |
| Both link + image for game summary sharing | Link for detail, image for quick group chat sharing | ✓ Good |
| Descoped CSV export | User decided CSV not needed; buildCSV utility preserved | ✓ Good |
| Fire-and-forget season stat writes | Non-blocking UX; acceptable tradeoff for game finalization speed | ✓ Good |
| Client-side backfill for season stats | Handles games finalized before seasonStats rules existed | ✓ Good |
| Firestore rules in version control | Track changes, deploy via CLI | ✓ Good |

---
*Last updated: 2026-03-17 after v2.0 milestone completion*
