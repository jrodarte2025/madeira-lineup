---
phase: 14-post-game-stat-editing
plan: 01
status: complete
completed: 2026-04-20
requirements: [EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06]
---

# Plan 14-01 Summary — Post-game stat editing

## What shipped

Coach can now open any completed game's Summary screen, toggle "Edit Stats", and add / delete / reassign stat events. Each edit writes to Firestore via `replaceGameEvents`, applies a season-stat delta via `updateSeasonStats`, and updates local state so the summary table refreshes instantly.

## New files

- **`src/shared/eventMutations.js`** — pure helpers:
  - `eventsToStatCountsByPlayer(events)` → `{[playerId]: {[stat]: count}}`
  - `computeSeasonDeltaDiff(oldEvents, newEvents)` → per-player per-stat delta, skipping unchanged players

- **`src/games/EventEditor.jsx`** — coach-only edit UI:
  - Groups stat events by half (1st / 2nd)
  - Each row: stat pill, player select (all rostered players), delete button (×)
  - Add-event form: player dropdown, stat dropdown (grouped Offensive / Defensive / Neutral — includes `+Skill`), half toggle, Save/Cancel
  - Disables all controls while a save is in flight

- **`src/tests/eventMutations.test.js`** — 11 unit tests

## Modified files

- **`src/games/GameSummaryScreen.jsx`**:
  - New `editing`, `saving` state + "Edit Stats" / "Done Editing" toggle button
  - `handleEventsChange(newEvents)`: writes to Firestore, applies season-stat deltas, updates local state
  - Renders `<EventEditor>` in coach mode when editing

## How each requirement is satisfied

- **EDIT-01**: Every stat event shown as an editable row in EventEditor, grouped by half
- **EDIT-02**: "+ Add Event" form covers any stat type (including `+skill`) for any rostered player on any completed game
- **EDIT-03**: Delete (×) per row with confirmation; fires `onEventsChange(events.filter(...))`
- **EDIT-04**: Reassign select per row; fires `onEventsChange(events.map(...))` cloning the event with new `playerId` + `playerName`
- **EDIT-05**: `handleEventsChange` → `replaceGameEvents` → `computeSeasonDeltaDiff` → `updateSeasonStats` (Firestore `increment` accepts negatives). Summary table re-derives from `game.events` via existing `buildSummaryRows`. No manual refresh.
- **EDIT-06**: Shared summary URL loads from Firestore on every open, so edits are visible immediately. Share Image renders from current `game` state at capture time. No snapshot-at-finalize behavior anywhere — already the architecture.

## Key files

- `src/shared/eventMutations.js` — new (32 lines)
- `src/games/EventEditor.jsx` — new (~330 lines)
- `src/games/GameSummaryScreen.jsx` — +32 / -2 (toggle + handler + editor mount)
- `src/tests/eventMutations.test.js` — new (~110 lines, 11 tests)

## Commits

- `8bee31d` feat(14-01): post-game stat editing with season-stat delta

## Self-Check: PASSED

- `npm run build` → succeeds (bundle grew 636 kB gzip, +~6 kB vs pre)
- `npx vitest run` → 84 tests pass (+11 new), 2 skipped, 8 todo
- No audit log / edit history UI added (silent edits per user decision)
- Score NOT recomputed on goal add/delete (score is frozen at finalize; backfilling a stat should not retroactively change the scoreline — kept simple, no user decision needed here)

## Deferred / acknowledged

- **Minute-interval editing** — explicitly out of v2.1 scope (REQUIREMENTS.md)
- **Audit trail** — explicitly out (silent edits per user decision)
- **Score recompute on goal events** — not required; frozen at finalize keeps UX predictable

## Human verification

Deferred to end-of-v2.1 review per session instruction.
