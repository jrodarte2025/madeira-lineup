# Phase 6: Post-Game Summary + Exports - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

When the final whistle blows, the coach has a complete game record they can review, download, and share in one tap. Includes a stats table, CSV download, shareable link to a public read-only summary, and an image export card for group chats.

</domain>

<decisions>
## Implementation Decisions

### Summary table layout
- Flat list sorted by minutes played (most to least), not grouped by position
- All rostered players included, even those with 0 minutes (shows who sat out)
- Columns: only stats that were actually recorded in the game — if nobody got a clearance, no clearance column
- Team totals row at the bottom summing each stat column across all players
- Player names abbreviated (same abbreviateName utility used elsewhere)

### Summary screen flow
- Summary lives at a new route: `/games/:id/summary`
- When coach taps "End Game", auto-navigates to the summary route immediately
- From the Games tab, tapping a completed game navigates directly to `/games/:id/summary`
- Header shows: score (big), opponent name, date — "Madeira FC 3 – 1 Rival FC · Mar 16, 2026"
- Export buttons (CSV, Share Link, Share Image) positioned at the top, below the header, above the table
- No need to scroll past the table to find actions

### Share card design (image export)
- Navy background (#1B2A5B) with orange accents (#E86420) and white text — branded
- Content: big score, opponent name, date, then 3 MVPs (top 3 players by total stat events recorded)
- MVP format: player name + key stat highlights (e.g., "Caroline J. — 2G 1A")
- Includes "Tap for full box score" note on the card with the shareable link URL
- When shared via Web Share API, the link is bundled with the image so recipients can tap through
- Generated using html-to-image (already approved dependency)

### Shareable link access
- Public read, no authentication required — same pattern as existing shared lineups
- Firestore security rules allow reads on game documents
- Public view: identical layout to coach's summary (score header + stats table) but without export buttons — read-only
- "Share Link" button: Web Share API on mobile (native share sheet), clipboard copy fallback on desktop with "Link copied!" toast

### Claude's Discretion
- Exact table styling (cell padding, borders, font sizes, responsive behavior)
- CSV column ordering and file naming convention
- Toast notification styling and duration
- How html-to-image handles the card rendering (DOM element targeting, resolution)
- Whether the summary route shows tab bar or hides it (like the live game screen)
- How "3 MVPs" handles ties or games with fewer than 3 players with stats

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `abbreviateName` (src/shared/utils.js): Already used for player name abbreviation on field circles — reuse in summary table
- `calcMinutes` (src/shared/utils.js): Computes per-player minutes from interval intersection — reuse for summary minutes column
- `STAT_LABELS` (src/shared/constants.js): Maps stat keys to display labels — use as column headers
- `STAT_COLORS` (src/shared/constants.js): Color coding for stats — can apply in table for visual consistency
- `C` color object (src/shared/constants.js): Navy, orange, white — use for share card styling
- `loadGame` (src/firebase.js): Loads full game doc with events, score, lineup snapshot — all data needed for summary
- `fontBase`, `fontDisplay` (src/shared/constants.js): Consistent typography

### Established Patterns
- Inline styles with conditional ternaries for responsive design
- HashRouter with route params (`useParams()` for gameId)
- Fire-and-forget Firestore writes with silent error handling
- `loadPublishedLineup` pattern: public Firestore read without auth — reuse for shared game summary

### Integration Points
- `App.jsx` Routes: Add `/games/:id/summary` route
- `LiveGameScreen.jsx`: handleEndGame needs to navigate to summary route after setting status to "completed"
- `GamesTab.jsx`: Completed game card tap needs to navigate to `/games/:id/summary` instead of doing nothing
- `firebase.js`: May need a `loadGame` variant or the existing one is sufficient (game doc has everything)

</code_context>

<specifics>
## Specific Ideas

- Image card should work as a "teaser" — score + MVPs + "tap for full box score" — with the link bundling via Web Share API so recipients can tap through to the full stats
- Coach wants to see who didn't play (0 minutes) in the summary — useful for tracking equal playing time across the season
- "Interception" stat may be removed in a future update (coach questioning if it's a valid soccer stat)

</specifics>

<deferred>
## Deferred Ideas

- Removing "interception" from stat types — separate task, not part of Phase 6
- Season totals update on game finalize — Phase 7 (SEASON-03)

</deferred>

---

*Phase: 06-post-game-summary-exports*
*Context gathered: 2026-03-16*
