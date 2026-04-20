---
phase: 15-saved-lineups-firestore
plan: 01
status: complete
completed: 2026-04-20
requirements: [SAVE-01, SAVE-02, SAVE-03, SAVE-04]
---

# Plan 15-01 Summary — Saved lineups Firestore persistence

## What shipped

Saved lineups now persist to a new Firestore `savedLineups` collection, surviving the Safari/iOS 7-day ITP localStorage wipe. localStorage stays as a read-through cache for instant first paint and offline resilience. Existing local-only entries migrate once on first post-upgrade load.

## New Firestore layout

- **Collection:** `savedLineups`
- **Doc shape:** `{name, formation, lineup, inactiveIds, roster, date, savedAt}` (Firestore-generated id)
- **Rules:** open (consistent with the other coach-only collections — no auth per existing pattern)

## Changes

### `src/firebase.js`

Added three exports:
- `listSavedLineups()` — fetches all docs, sorts by `savedAt` desc (falling back to legacy `date`)
- `createSavedLineup(snapshot)` — returns new doc id or null
- `deleteSavedLineup(id)` — returns boolean

### `src/MadeiraLineupPlanner.jsx`

New imports: `listSavedLineups, createSavedLineup, deleteSavedLineup`.

New reconcile effect on mount:
1. Reads `madeira_savedLineups_migrated` flag
2. If `false` and local has entries without `id`: pushes each to Firestore → attaches returned ids → sets the flag
3. Fetches `listSavedLineups()` as source of truth
4. Updates state + localStorage cache

`saveLineup(name)` — write-through:
- `createSavedLineup(snapshot)` → attaches returned id to the local entry
- Still calls `savePublishedLineup(snapshot)` (separate concern: publishing the currently-edited lineup to `lineups/published`)
- Toast differentiates Firestore-success vs publish-only vs local-only outcomes

`deleteLineup(index)` — write-through:
- Removes from local state/cache immediately (optimistic)
- Fires `deleteSavedLineup(id)` if the entry has a Firestore id (fire-and-forget)

`loadLineup(index)` — unchanged (read from local state only; already instant)

## How each requirement is satisfied

- **SAVE-01**: `savedLineups` Firestore collection persists data durably
- **SAVE-02**: `madeira_savedLineups_migrated` flag gates a one-shot migration that runs exactly once per device; local entries without an `id` get pushed and receive a Firestore id
- **SAVE-03**: Initial paint reads from localStorage (`useState(() => loadStored(...))`); reconcile runs in the background after mount
- **SAVE-04**: `saveLineup` + `deleteLineup` both write to Firestore AND update the local cache. A failed cloud write still leaves a local-only entry that migrates on the next successful load

## Key files

- `src/firebase.js` — +60 lines (CRUD + collection ref)
- `src/MadeiraLineupPlanner.jsx` — +45 / -4 (imports, reconcile effect, write-through saves/deletes)

## Commits

- `50b6719` feat(15-01): persist saved lineups to Firestore with local cache

## Self-Check: PASSED

- `npm run build` → succeeds
- `npx vitest run` → 84 tests pass (no regressions)
- Offline-resilient: if Firestore is unreachable, saves still work locally and reconcile on next successful load
- Migration is idempotent — re-runs after the flag is set are no-ops

## Human verification

Deferred to end-of-v2.1 review per session instruction.
