# Requirements: Madeira FC Lineup Planner — v2.1 Madeira Game-Day Polish + v2.2 Game-Day Roster Flow

**Defined:** 2026-04-20 (v2.1) / 2026-04-29 (v2.2)
**Core Value:** Coaches can manage lineups, track live games, and review player stats — all from their phone at the field or desktop at home — with one tool that handles the full game-day workflow from kickoff to season review.

**v2.1 Milestone Goal:** Address feedback from Madeira's first real game use of the app. Fix lineup-builder gaps, add a new stat type, make stat badges consistent across halves, migrate saved lineups to durable storage, and add post-game stat editing so coaches can correct stats after rewatching film.

**v2.2 Milestone Goal:** Move "inactive" from a global roster flag to a per-game decision. The coach sets game-day inactives on a new screen between game creation and live-game start. Saved lineups become reusable templates (no baked-in inactives). The pre-kickoff "Ready to kick off" screen becomes a coach's lineup walkthrough tool with the Start Game CTA at the bottom. Roster Management UI drops the "sit player" toggle and keeps only add/delete.

## v2.1 Requirements

### Lineup UX Fixes

Gaps discovered during live-game use of the lineup builder.

- [x] **LUX-01**: Coach can drag a field player onto another field player to swap their positions (e.g., RM → LM via drag)
- [x] **LUX-02**: Coach can tap-tap swap between two field players (tap first, tap second → positions swap)
- [x] **LUX-03**: Tap-to-sub works in BOTH directions — tap a bench player to send to field AND tap a field player to send to bench
- [x] **LUX-04**: Inactive ("unavailable") players are reliably excluded from the bench across all app states (initial load, Firestore sync, mobile tap-to-toggle) — investigate current tap/sync reliability and fix root cause

### Stat System Improvements

- [x] **STAT-01**: New `+skill` stat type added to the stat library — neutral gray color, for crediting skillful plays (good dribbles, moves, etc.)
- [x] **STAT-02**: `+skill` button available for ALL position groups (GK, DEF, MID, FWD) during live game stat entry
- [x] **STAT-03**: `+skill` events tracked per-player, surfaced in post-game summary table, and rolled up into season stats just like existing stats
- [x] **STAT-04**: Stat count badges on live-game field circles display whole-game running totals (not reset at halftime)

### Post-Game Stat Editing

Coach rewatches film post-game and wants to correct stats. The edit UI lives on the Game Summary Screen. Shared summary URLs and the Share Image feature reflect current state (live-updating — no frozen snapshot).

- [x] **EDIT-01**: Game Summary Screen shows each player's stat events as an editable list with timestamps
- [x] **EDIT-02**: Coach can ADD a new stat event (any stat type, including `+skill`) attributed to any player on any completed game
- [x] **EDIT-03**: Coach can DELETE any existing stat event
- [x] **EDIT-04**: Coach can REASSIGN an event to a different player
- [x] **EDIT-05**: Edits persist to Firestore via existing `replaceGameEvents`; per-player totals and season stats recompute automatically without manual refresh
- [x] **EDIT-06**: Shared summary URL and Share Image PNG (on re-download) reflect current edited stats — no separate snapshot-at-finalize behavior

### Saved Lineups Durability

Safari/iOS clears PWA localStorage after ~7 days (ITP). Saved lineups need durable Firestore storage with localStorage as a cache for offline use.

- [x] **SAVE-01**: Saved lineups persist to a new Firestore collection (data survives localStorage wipes)
- [x] **SAVE-02**: One-shot migration: on first post-upgrade load, any existing localStorage `savedLineups` entries push to Firestore
- [x] **SAVE-03**: localStorage retained as read-through cache — app loads instantly from local, then reconciles with Firestore in the background for offline resilience
- [x] **SAVE-04**: Save/edit/delete operations write to Firestore AND update the localStorage cache

## v2.2 Requirements

### Per-Game Inactive Flow

Inactives shift from a global roster flag (set in Roster Management or in the lineup builder) to a per-game decision made on a dedicated Game-Day Roster screen between game creation and live-game start.

- [ ] **INACT-01**: A new "Game-Day Roster" screen exists where the coach selects which players are inactive (unavailable today) for THIS game; the selection persists to the game document's `inactiveIds` field
- [ ] **INACT-02**: The Game-Day Roster screen is reachable from BOTH start-game paths — GameSetupModal's "Start Game Now" choice AND GameDetailModal's "Start Game" button on an existing setup-status game; neither path skips the inactive-selection step
- [ ] **INACT-03**: Players marked inactive for a game are excluded from the bench in that game and do not appear as available substitutes in the live game's sub UI
- [ ] **INACT-04**: When a saved lineup is loaded into a game with set inactives, positions assigned to inactive players appear as empty slots requiring manual fill (visually distinct), and the saved lineup's stored `inactiveIds` array is ignored on load (saved lineups behave as templates)

### Pre-Kickoff Walkthrough Screen

The "Ready to kick off" screen today blurs the lineup; the coach uses this moment to call out the lineup to players, so the lineup needs to be readable.

- [ ] **KICK-01**: The "Ready to kick off" pre-kickoff screen displays the full lineup (field positions and bench) unblurred and readable so the coach can walk through the lineup with players before the game starts
- [ ] **KICK-02**: The "Start Game" CTA on the pre-kickoff screen is positioned at the bottom of the screen (thumb-reach), so the coach can complete the walkthrough then tap to start

### Roster Management Cleanup

With per-game inactives, the global "sit player" toggle in Roster Management becomes redundant. Roster Management is for roster composition only.

- [ ] **ROSTER-01**: The Roster Management screen no longer offers a "sit player" / "make inactive" toggle — only add player and delete player operations remain

## Deferred / Future (not v2.1)

### Edit Audit Trail
- **AUDIT-01**: Log stat-event edits (who/what/when) for review — user chose silent edits for v2.1

### Advanced Game Review
- **REVIEW-01**: Edit minute intervals (subs, player in/out times) — too complex, not in v2.1 scope

## Out of Scope (v2.1)

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Edit audit trail / history UI | User chose silent edits |
| Minute-interval editing (subs, in/out times) | Too complex; user only wants stat-event edits |
| Multi-deployment, 7v7 formations, quarter game model | Paused v3.0 scope — different milestone |
| Bulk backfill of `+skill` on past games | User will backfill via the edit-stats UI on games he cares about (no bulk migration) |
| PNG snapshot-at-finalize behavior | User wants live-updating shares |
| Offline-first stat logging | Existing online model is fine; Firestore sync already proven |

## Context for Planning

**Game-day feedback source:** Jim coached his first real game using the app. Two items were hotfixed to prod within 24 hours (portrait lock + no pinch zoom; bench disambiguation across full roster). Half length was also bumped from 25 to 30 min. This milestone covers the remaining feedback items plus the post-game stat editing feature Jim proposed this session.

**Shared UI between STAT and EDIT:** The post-game edit UI (EDIT-01 through EDIT-06) is where `+skill` gets backfilled onto past games. The UI opens on the Game Summary Screen, lets the coach pick a player and a stat, and add/delete/reassign events. Since `+skill` is just another stat type once STAT-01 ships, adding it to a past game is the same code path as adding a missed goal.

**Firestore usage already in place for reuse:**
- `replaceGameEvents(gameId, events)` — used by undo today; will be reused by EDIT-05
- `updateSeasonStats(season, playerId, statDeltas)` — season stat writes; edits call this with deltas to adjust totals
- Season stats backfill exists (client-side) if needed for recovery

**Firestore collections to be added:**
- `savedLineups` — per-user saved lineup documents (coach-only, no auth; open rules consistent with existing collections)

**Config layer already in place (v3.0 / 08-01 residue):** `src/config.js` exposes `FIREBASE_CONFIG` and `GAME_STRUCTURE`. v2.1 can ignore it entirely; it doesn't affect scope.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LUX-01 | Phase 12 — Lineup UX Fixes | Shipped (code) 2026-04-20 |
| LUX-02 | Phase 12 — Lineup UX Fixes | Shipped (code) 2026-04-20 |
| LUX-03 | Phase 12 — Lineup UX Fixes | Shipped (code) 2026-04-20 |
| LUX-04 | Phase 12 — Lineup UX Fixes | Shipped (code) 2026-04-20 |
| STAT-01 | Phase 13 — Stat System + Badge Fix | Shipped (code) 2026-04-20 |
| STAT-02 | Phase 13 — Stat System + Badge Fix | Shipped (code) 2026-04-20 |
| STAT-03 | Phase 13 — Stat System + Badge Fix | Shipped (code) 2026-04-20 |
| STAT-04 | Phase 13 — Stat System + Badge Fix | Shipped (code) 2026-04-20 |
| EDIT-01 | Phase 14 — Post-Game Stat Editing | Shipped (code) 2026-04-20 |
| EDIT-02 | Phase 14 — Post-Game Stat Editing | Shipped (code) 2026-04-20 |
| EDIT-03 | Phase 14 — Post-Game Stat Editing | Shipped (code) 2026-04-20 |
| EDIT-04 | Phase 14 — Post-Game Stat Editing | Shipped (code) 2026-04-20 |
| EDIT-05 | Phase 14 — Post-Game Stat Editing | Shipped (code) 2026-04-20 |
| EDIT-06 | Phase 14 — Post-Game Stat Editing | Shipped (code) 2026-04-20 |
| SAVE-01 | Phase 15 — Saved Lineups Firestore Persistence | Shipped (code) 2026-04-20 |
| SAVE-02 | Phase 15 — Saved Lineups Firestore Persistence | Shipped (code) 2026-04-20 |
| SAVE-03 | Phase 15 — Saved Lineups Firestore Persistence | Shipped (code) 2026-04-20 |
| SAVE-04 | Phase 15 — Saved Lineups Firestore Persistence | Shipped (code) 2026-04-20 |
| INACT-01 | Phase 16 — Game-Day Roster Flow | Planned (v2.2) |
| INACT-02 | Phase 16 — Game-Day Roster Flow | Planned (v2.2) |
| INACT-03 | Phase 16 — Game-Day Roster Flow | Planned (v2.2) |
| INACT-04 | Phase 16 — Game-Day Roster Flow | Planned (v2.2) |
| KICK-01 | Phase 16 — Game-Day Roster Flow | Planned (v2.2) |
| KICK-02 | Phase 16 — Game-Day Roster Flow | Planned (v2.2) |
| ROSTER-01 | Phase 16 — Game-Day Roster Flow | Planned (v2.2) |

**Coverage:**
- v2.1 requirements: 18 total → mapped to Phases 12-15 (100%)
- v2.2 requirements: 7 total → mapped to Phase 16 (100%)
- Combined: 25 requirements, 100% coverage

---
*Requirements defined: 2026-04-20 (v2.1) / 2026-04-29 (v2.2)*
*Last updated: 2026-04-29 — added 7 v2.2 requirements (INACT-01..04, KICK-01..02, ROSTER-01) mapped to Phase 16*
