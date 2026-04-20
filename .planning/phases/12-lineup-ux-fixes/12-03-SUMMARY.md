---
phase: 12-lineup-ux-fixes
plan: 03
status: complete
completed: 2026-04-20
requirements: [LUX-04]
---

# Plan 12-03 Summary — Inactive-player reliability

## What shipped

LUX-04: inactive players are reliably excluded from the bench across initial load, mobile tap-to-toggle, desktop click, drag, reload, and cross-device (post-reload) Firestore sync.

See `12-03-FINDINGS.md` for the full root-cause investigation against H1–H6.

## Root causes identified

- **H4 (primary)**: `loadPublishedLineup` only set `inactiveIds` when the field was present in the Firestore doc. If missing (legacy doc or partial write), stale localStorage inactives survived — this is the most plausible cause of Jim's game-day "inactive player came back on the bench" observation.
- **H1 (secondary)**: Mobile SIT button was `minHeight: 32px` — below the 44px WCAG AA touch target. Easy to miss-tap on a sideline phone. The miss was misattributed to "sync broken."

## Changes made

### `src/MadeiraLineupPlanner.jsx`

1. **SIT button (mobile)** — bumped to 44×44 with 12px font, padding `10px 14px`, added `aria-label={`Sit out ${player.name}`}`.
2. **Load effect** — `setInactiveIds(data.inactiveIds ? [...data.inactiveIds] : [])` for both the Firestore load path and the URL-share decode path. Always clear stale localStorage if the server doesn't have the flag.

## Deferred

- **H5 realtime listener** (`onSnapshot`). LUX-04 must-have explicitly accepts reload as the sync trigger, so a subscription is not required. Can revisit if mid-game cross-device drift surfaces.

## Key files

- `src/MadeiraLineupPlanner.jsx` — +3 / -3
- `.planning/phases/12-lineup-ux-fixes/12-03-FINDINGS.md` — new

## Commits

- `a9fdd8c` feat(12-03): fix inactive-player reliability (H1 + H4)

## Self-Check: PASSED

- `npm run build` → succeeds
- Mobile SIT button meets WCAG AA 44×44 target
- Root cause documented in FINDINGS, not worked around
- Drag-to-inactive-zone flow untouched (no regression)

## Human verification

Manual walkthrough deferred — per session instruction, all verification bundled at end of Phase 12.
