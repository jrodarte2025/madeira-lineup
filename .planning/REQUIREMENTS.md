# Requirements: Madeira FC Lineup Planner — v2.1 Madeira Game-Day Polish

**Defined:** 2026-04-20
**Core Value:** Coaches can manage lineups, track live games, and review player stats — all from their phone at the field or desktop at home — with one tool that handles the full game-day workflow from kickoff to season review.

**Milestone Goal:** Address feedback from Madeira's first real game use of the app. Fix lineup-builder gaps, add a new stat type, make stat badges consistent across halves, migrate saved lineups to durable storage, and add post-game stat editing so coaches can correct stats after rewatching film.

## v2.1 Requirements

### Lineup UX Fixes

Gaps discovered during live-game use of the lineup builder.

- [ ] **LUX-01**: Coach can drag a field player onto another field player to swap their positions (e.g., RM → LM via drag)
- [ ] **LUX-02**: Coach can tap-tap swap between two field players (tap first, tap second → positions swap)
- [ ] **LUX-03**: Tap-to-sub works in BOTH directions — tap a bench player to send to field AND tap a field player to send to bench
- [ ] **LUX-04**: Inactive ("unavailable") players are reliably excluded from the bench across all app states (initial load, Firestore sync, mobile tap-to-toggle) — investigate current tap/sync reliability and fix root cause

### Stat System Improvements

- [ ] **STAT-01**: New `+skill` stat type added to the stat library — neutral gray color, for crediting skillful plays (good dribbles, moves, etc.)
- [ ] **STAT-02**: `+skill` button available for ALL position groups (GK, DEF, MID, FWD) during live game stat entry
- [ ] **STAT-03**: `+skill` events tracked per-player, surfaced in post-game summary table, and rolled up into season stats just like existing stats
- [ ] **STAT-04**: Stat count badges on live-game field circles display whole-game running totals (not reset at halftime)

### Post-Game Stat Editing

Coach rewatches film post-game and wants to correct stats. The edit UI lives on the Game Summary Screen. Shared summary URLs and the Share Image feature reflect current state (live-updating — no frozen snapshot).

- [ ] **EDIT-01**: Game Summary Screen shows each player's stat events as an editable list with timestamps
- [ ] **EDIT-02**: Coach can ADD a new stat event (any stat type, including `+skill`) attributed to any player on any completed game
- [ ] **EDIT-03**: Coach can DELETE any existing stat event
- [ ] **EDIT-04**: Coach can REASSIGN an event to a different player
- [ ] **EDIT-05**: Edits persist to Firestore via existing `replaceGameEvents`; per-player totals and season stats recompute automatically without manual refresh
- [ ] **EDIT-06**: Shared summary URL and Share Image PNG (on re-download) reflect current edited stats — no separate snapshot-at-finalize behavior

### Saved Lineups Durability

Safari/iOS clears PWA localStorage after ~7 days (ITP). Saved lineups need durable Firestore storage with localStorage as a cache for offline use.

- [ ] **SAVE-01**: Saved lineups persist to a new Firestore collection (data survives localStorage wipes)
- [ ] **SAVE-02**: One-shot migration: on first post-upgrade load, any existing localStorage `savedLineups` entries push to Firestore
- [ ] **SAVE-03**: localStorage retained as read-through cache — app loads instantly from local, then reconciles with Firestore in the background for offline resilience
- [ ] **SAVE-04**: Save/edit/delete operations write to Firestore AND update the localStorage cache

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
| LUX-01 | Phase 12 — Lineup UX Fixes | Pending |
| LUX-02 | Phase 12 — Lineup UX Fixes | Pending |
| LUX-03 | Phase 12 — Lineup UX Fixes | Pending |
| LUX-04 | Phase 12 — Lineup UX Fixes | Pending |
| STAT-01 | Phase 13 — Stat System + Badge Fix | Pending |
| STAT-02 | Phase 13 — Stat System + Badge Fix | Pending |
| STAT-03 | Phase 13 — Stat System + Badge Fix | Pending |
| STAT-04 | Phase 13 — Stat System + Badge Fix | Pending |
| EDIT-01 | Phase 14 — Post-Game Stat Editing | Pending |
| EDIT-02 | Phase 14 — Post-Game Stat Editing | Pending |
| EDIT-03 | Phase 14 — Post-Game Stat Editing | Pending |
| EDIT-04 | Phase 14 — Post-Game Stat Editing | Pending |
| EDIT-05 | Phase 14 — Post-Game Stat Editing | Pending |
| EDIT-06 | Phase 14 — Post-Game Stat Editing | Pending |
| SAVE-01 | Phase 15 — Saved Lineups Firestore Persistence | Pending |
| SAVE-02 | Phase 15 — Saved Lineups Firestore Persistence | Pending |
| SAVE-03 | Phase 15 — Saved Lineups Firestore Persistence | Pending |
| SAVE-04 | Phase 15 — Saved Lineups Firestore Persistence | Pending |

**Coverage:**
- v2.1 requirements: 18 total
- Mapped to phases: 18 ✓
- Unmapped: 0
- Coverage: 100%

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-04-20 after roadmap creation — all 18 v2.1 requirements mapped to Phases 12-15*
