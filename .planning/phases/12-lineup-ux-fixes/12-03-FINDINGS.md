---
phase: 12-lineup-ux-fixes
plan: 03
type: findings
date: 2026-04-20
---

# LUX-04 Root-Cause Investigation

## Hypotheses Evaluated

### H1 — Mobile 'SIT' button tap target too small (touch miss)
**Verdict:** **Confirmed.** The pre-fix mobile button had `minHeight: 32` and padding `4px 10px`, well below the 44px WCAG AA touch-target minimum. On a phone held at arm's length with sideline lighting, a miss-tap is easy — the coach thinks they hit it, the chip doesn't move, and they blame "sync" instead of revisiting the tap.
**Fix applied:** Bumped to `minHeight: 44`, `minWidth: 44`, padding `10px 14px`, font-size 12. Added `aria-label="Sit out {name}"` for assistive tech.

### H2 — Stale closure in `toggleInactive`
**Verdict:** **Ruled out.** The function uses `setInactiveIds((prev) => ...)` with a nested `setLineup((prevL) => ...)` — both functional updaters, no stale-closure risk. Read carefully: the nested `setLineup` is defensive about clearing the player from the field when they're marked inactive, and runs via the functional form so it sees the freshest state. No bug here.

### H3 — Debounced auto-sync race on reload
**Verdict:** **Ruled out.** The effect's cleanup (`return () => clearTimeout(...)`) runs before the next effect run AND on unmount. On reload the whole component unmounts, so any pending timer is cleared. No stale write can hit Firestore post-reload.

### H4 — `loadPublishedLineup` doesn't reset `inactiveIds` when Firestore doc omits the field
**Verdict:** **Confirmed as cause.** The pre-fix code was:
```js
if (data.inactiveIds) setInactiveIds([...data.inactiveIds]);
```
If a Firestore doc was written before `inactiveIds` existed in the schema (or was written without the field for any reason), the local state was NOT cleared — so whatever `inactiveIds` came from localStorage on that device survived. Result: on Device B after a reload, an "inactive" flag left over from an earlier session can re-emerge as stale state, while Firestore says otherwise. This is the most plausible root cause of Jim's reported "inactive player came back on the bench."
**Fix applied:** Always set the value, treating missing as `[]`:
```js
setInactiveIds(data.inactiveIds ? [...data.inactiveIds] : []);
```
Applied to both the Firestore load path and the URL-share decode path.

### H5 — No realtime listener (cross-device sync requires reload)
**Verdict:** **Possible cause, deferred.** True: `loadPublishedLineup` is a one-shot `getDoc` on mount, no `onSnapshot` subscription. Device B only learns about Device A's changes on reload. The LUX-04 must-have says: *"Marking a player inactive on Device A and reloading Device B shows that player in the inactive zone on Device B"* — reload is explicitly acceptable. So a realtime listener is a nice-to-have, not a must-have. Deferred; can revisit in a future polish phase if needed.

### H6 — Propagation: 'SIT' tap bubbles up and re-selects the chip
**Verdict:** **Ruled out.** The button has `onClick={(e) => { e.stopPropagation(); onToggleInactive(); }}` — stopPropagation prevents the chip's onClick from firing. Verified.

## Root Cause Summary

**Primary:** H4 — missing `inactiveIds` guard on load silently kept stale local state active across reloads.
**Secondary:** H1 — small tap target made the mobile toggle feel unreliable (user missed the button, misattributed to sync).

## Fixes Applied

- **H1 fix:** `src/MadeiraLineupPlanner.jsx` PlayerChip 'SIT' button sized to 44×44 mobile with 12px font and aria-label.
- **H4 fix:** `src/MadeiraLineupPlanner.jsx` load effect always sets `inactiveIds` (treats missing as `[]`). Applied to Firestore load AND URL-share decode.

## Deferred

- **H5 realtime listener** — acceptable per LUX-04 must-have; reload is explicitly OK. If the user reports mid-game cross-device drift in real usage, revisit.
