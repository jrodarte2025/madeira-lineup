---
phase: 05-live-game
plan: 04
status: complete
completed: 2026-03-16
commits:
  - 96cca9d — compact header with inline clock, wrapping stat buttons
  - 51e88fb — enlarge stat bar buttons for easier tapping on mobile
  - 2cec91f — distinguish home vs away scores with color and team labels
---

# 05-04 Summary: Stat Recording, Events Feed, Undo

## What Was Built

- **StatBar** (`src/games/StatBar.jsx`): Position-aware stat buttons with color coding (offensive orange, defensive teal, neutral gray). Wrapping layout handles MID's 7 buttons across two rows. Player name label above buttons.
- **EventsFeed** (`src/games/EventsFeed.jsx`): Last 3 events shown in reverse chronological order with single-tap undo. Handles both stat and substitution event descriptions.
- **Player selection**: Tapping a field player during active half selects them (highlighted circle). StatBar shows position-appropriate buttons. Bench players trigger substitution flow, not stat selection.
- **Stat recording**: Events recorded with UUID, playerId, stat type, half, and timestamp. Persisted to localStorage immediately and synced to Firestore via `appendGameEvent()`.
- **Stat badges**: `statCounts` computed via useMemo for current-half badge display on field circles.
- **Undo**: Removes event from local state, syncs full array to Firestore via `replaceGameEvents()`. Goal events auto-decrement home score on undo.

## Design Improvements (ad-hoc, during session)

- Collapsed GameHeader from 2 rows (110px) to 1 row (~60px) by putting clock inline next to score
- Home score (MFC) shown in orange, away score in white with opponent label — classic scoreboard layout
- Stat buttons enlarged to 42px min-height with wrapping instead of horizontal scroll
- Action buttons (End Half, Start 2nd Half, Full Time) only appear as a second row when relevant

## Decisions

- StatBar uses `flexWrap: wrap` instead of `overflowX: scroll` — all buttons visible without scrolling
- GameHeader condensed to single row for more pitch/stat space on mobile
- Home vs away distinguished by color (orange vs white) and labels (MFC vs opponent name)
- Timer shortened to "HT" and "FT" for halftime/completed states to fit inline layout

## Concerns

- Task 3 (human verification checkpoint) not formally completed — coach should run full end-to-end test on device
