---
phase: 06-post-game-summary-exports
plan: 02
subsystem: ui
tags: [react, html-to-image, csv, web-share-api, firebase]

# Dependency graph
requires:
  - phase: 06-post-game-summary-exports/06-01
    provides: summary utility functions (buildSummaryRows, buildCSV, getTopMVPs, formatMVPStats), finalizeGame Firestore write, playerIntervals/halfIntervals data
provides:
  - GameSummaryScreen with full stats table, score header, public/coach mode toggle
  - CSV export via Blob download
  - Share link via Web Share API with clipboard fallback
  - Share image via html-to-image capturing off-screen ShareCard
  - ShareCard branded navy/orange card component with top performers
  - Public view (?public=true) shows same layout without export buttons
affects: [phase-07-season-stats, any future game review features]

# Tech tracking
tech-stack:
  added: [html-to-image v1.11.13 (toBlob)]
  patterns:
    - Off-screen DOM node positioned at left:-9999px for html-to-image capture
    - HashRouter-compatible public URL parsing via window.location.hash
    - Web Share API file sharing with desktop download fallback

key-files:
  created:
    - src/games/GameSummaryScreen.jsx
    - src/games/ShareCard.jsx
  modified: []

key-decisions:
  - "ShareCard uses system fonts only (not DM Sans / Outfit) to avoid iOS font embedding failures with html-to-image"
  - "Public mode detected from ?public=true query param parsed from window.location.hash (HashRouter)"
  - "Share URL built from window.location.origin + pathname + hash segment so it works in both dev and prod"
  - "CSV export removed from public view; minutes column hidden on public view per user verification feedback"
  - "Share card shows domain-only URL (truncated) for visual cleanliness; full URL injected into navigator.share payload"
  - "Back to Games button hidden on public summary view (only relevant for authenticated coaches)"

patterns-established:
  - "Public mode pattern: same component, isPublic prop derived from URL query param, conditionally renders export row and navigation"
  - "html-to-image pattern: off-screen absolute-positioned node with forwardRef, system fonts only, pixelRatio:2 + cacheBust:true"

requirements-completed: [POST-01, POST-02, POST-03, POST-04, POST-05]

# Metrics
duration: ~60min
completed: 2026-03-16
---

# Phase 6 Plan 02: Post-Game Summary Screen Summary

**GameSummaryScreen with stats table, CSV export, share link, and html-to-image branded card (ShareCard) — all verified working on mobile and desktop**

## Performance

- **Duration:** ~60 min
- **Started:** 2026-03-16
- **Completed:** 2026-03-16
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 2

## Accomplishments

- Full post-game summary screen with score header, player stats table sorted by minutes, and team totals row — rendered only for columns with recorded stats
- Three export actions: CSV download, share link (Web Share API + clipboard fallback), share image (html-to-image to branded card or PNG download)
- ShareCard off-screen component renders navy/orange branded card with score, top 3 performers, and "Check out the full box score" CTA
- Public view via ?public=true hides export buttons, Back to Games button, and minutes column — same layout otherwise
- Several issues identified and fixed during user verification (see Deviations)

## Task Commits

1. **Task 1: GameSummaryScreen with stats table, CSV, and share link** - `d993a86` (feat)
2. **Task 2: ShareCard component and image export via html-to-image** - `bebd652` (feat)
3. **Task 3: Verify complete post-game summary flow** - Approved (checkpoint — no commit)

**Fix commits during verification:**
- `0a37eae` fix(06-02): remove CSV export on public view, hide minutes, fix share URL
- `8bdc952` fix(05): add 15s interval tick to force player minutes recalculation
- `c908006` fix(05): auto-open intervals for on-field players missing them
- `5dff729` fix(06-02): show domain only on share card, include URL in image share
- `ee32ce8` fix(06-02): share card shows 'Check out the full box score' CTA
- `8a2f665` fix(06-02): hide Back to Games button on public summary view
- `17ba735` chore: rename app to Madeira FC Game Hub

## Files Created/Modified

- `src/games/GameSummaryScreen.jsx` - Full summary screen: score header, stats table, CSV/share link/share image export, public mode
- `src/games/ShareCard.jsx` - Off-screen branded card for html-to-image capture; navy/orange, system fonts, score + MVPs + CTA

## Decisions Made

- ShareCard uses `system-ui, -apple-system, 'Segoe UI', sans-serif` instead of Google Fonts (DM Sans/Outfit) to avoid iOS font embedding failures with html-to-image
- Public mode derived from `?public=true` query param, parsed from `window.location.hash` for HashRouter compatibility
- Share URL uses `window.location.origin + pathname + hash` so it resolves correctly in both dev and prod deployments
- Share card displays domain only for visual cleanliness; full URL is still injected into `navigator.share` payload so recipients get the actual link
- Minutes column hidden on public view and Back to Games button removed per user verification feedback — public viewers don't need coach-specific navigation

## Deviations from Plan

### Auto-fixed Issues (during human verification — reported by user)

**1. [Rule 1 - Bug] Public view was showing export buttons and CSV**
- **Found during:** Task 3 (human verification)
- **Issue:** Public view was not correctly suppressing CSV export and minutes column
- **Fix:** Applied isPublic checks to CSV button and minutes column rendering
- **Committed in:** `0a37eae`

**2. [Rule 1 - Bug] Player minutes not updating during live game**
- **Found during:** Task 3 (human verification — minutes not displaying correctly during game)
- **Issue:** Interval tick not forcing re-render of displayed minutes
- **Fix:** Added 15s interval tick to force recalculation; also fixed auto-open intervals for on-field players missing them
- **Committed in:** `8bdc952`, `c908006`

**3. [Rule 1 - Bug] Share card URL was showing full hash URL instead of domain**
- **Found during:** Task 3 (human verification)
- **Issue:** Share card was rendering the full hash URL which looked cluttered; also URL was missing from navigator.share payload
- **Fix:** Truncated card display to domain only; ensured full URL passed to navigator.share
- **Committed in:** `5dff729`

**4. [Rule 1 - Bug] Share card CTA text was incorrect**
- **Found during:** Task 3 (human verification)
- **Issue:** CTA showed "Tap for full box score" but user wanted "Check out the full box score"
- **Fix:** Updated CTA string in ShareCard
- **Committed in:** `ee32ce8`

**5. [Rule 1 - Bug] Back to Games button visible on public view**
- **Found during:** Task 3 (human verification)
- **Issue:** Back button was rendering for public viewers who have no app context
- **Fix:** Hidden Back to Games button when isPublic is true
- **Committed in:** `8a2f665`

---

**Total deviations:** 5 auto-fixed during verification (all Rule 1 - Bug)
**Impact on plan:** All fixes required for correct public/coach mode separation and proper mobile share behavior. No scope creep.

## Issues Encountered

- html-to-image iOS font embedding concern (noted as a blocker in STATE.md) resolved by using system fonts exclusively in ShareCard — no spike needed once implementation confirmed the workaround works
- Minutes display bug in live game (pre-existing from Phase 5) surfaced during verification and was fixed inline

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 6 Plan 02 complete. The full post-game summary flow is verified working end-to-end.
- Phase 7 (Season Stats) can now consume the summary data layer built in Plan 01 and the verified game flow from Plans 01-02.
- No blockers.

---
*Phase: 06-post-game-summary-exports*
*Completed: 2026-03-16*
