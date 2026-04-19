# Requirements: Madeira FC Lineup Planner — v3.0 Multi-Deployment Support

**Defined:** 2026-04-19
**Core Value:** Coaches can manage lineups, track live games, and review player stats — all from their phone at the field or desktop at home — with one tool that handles the full game-day workflow from kickoff to season review.

**Milestone Goal:** Make the app deployable as an isolated instance for a second coach (7v7, different team) without sharing data with Madeira, and without changing the Madeira instance's behavior.

## v3.0 Requirements

### Configuration Layer

Extract Madeira-specific values out of code into per-deployment config so a second `.env` + second Firebase project produces a clean, isolated instance.

- [ ] **CFG-01**: Firebase connection config (apiKey, authDomain, projectId, etc.) loaded from environment variables, not hardcoded in `src/firebase.js`
- [ ] **CFG-02**: Team name loaded from per-deployment config — replaces hardcoded "Madeira" strings in branding, headers, and share cards
- [ ] **CFG-03**: Initial roster loaded from per-deployment config (not hardcoded in `constants.js`)
- [ ] **CFG-04**: Allowed formation set loaded from per-deployment config, so 7v7 formations do not appear in Madeira's instance
- [ ] **CFG-05**: Game-structure model (`halves` vs `quarters`) loaded from per-deployment config
- [ ] **CFG-06**: Field circles, bench entries, and share cards render gracefully when a player's jersey number is missing (`null`) — name-only display, no broken chips or empty digits

### Formations

- [ ] **FORM-01**: 7v7 formations added to the formation library (starting set: 2-3-1, 3-2-1, 2-2-2 — finalize during planning)
- [ ] **FORM-02**: Only formations allowed by the instance's config are selectable in that instance's UI
- [ ] **FORM-03**: Madeira instance continues to show only its existing 9v9 formations (3-3-2, 3-2-3, 2-3-3, 4-3-1)

### Quarter-Based Game Model (friend's instance only)

- [ ] **QTR-01**: Coach can pre-build 8 segment lineups before kickoff: Q1, Q1.5, Q2, Q2.5, Q3, Q3.5, Q4, Q4.5
- [ ] **QTR-02**: Live game timer shows 12-min quarters with current segment indicator; total regulation = 48 min
- [ ] **QTR-03**: Clock stops at the end of each quarter (after Q1, halftime after Q2, after Q3, after Q4) and requires the coach to restart for the next quarter
- [ ] **QTR-04**: Mid-quarter sub-lineup transition at the 6:00 mark (swap to Q1.5, Q2.5, Q3.5, Q4.5) is rolling — clock keeps running through the swap
- [ ] **QTR-05**: Post-game summary reports per-player minutes correctly for 48-min quarter-based games
- [ ] **QTR-06**: Season stats ingest quarter-based game data without breaking existing halve-based game data

### Madeira Instance Preservation

- [ ] **MAD-01**: Madeira instance (existing Firebase project) continues to run 2 × 25-min halves, 9v9, with unchanged pre-v3.0 behavior
- [ ] **MAD-02**: No UI surface in Madeira's instance exposes quarter mode, 7v7 formations, or multi-deployment config options

### Second Deployment

- [ ] **DEPLOY-01**: Second Firebase project stood up with its own Firestore, hosting URL, and fully isolated data
- [ ] **DEPLOY-02**: Same codebase builds deployment-specific bundles via environment config (single repo, no fork)
- [ ] **DEPLOY-03**: Friend's instance live at its own URL with his team name, 11-player roster (see context), 7v7 formations, and quarter-based game model
- [ ] **DEPLOY-04**: `DEPLOYMENT.md` documents the full spin-up-a-new-instance workflow (Firebase project creation, env setup, build, deploy)

## v4.0+ Requirements (Deferred)

### Multi-Tenancy

- **TEN-01**: One Firebase project hosts multiple teams with data isolation via team-scoped collection paths
- **TEN-02**: Self-serve signup flow for new coaches
- **TEN-03**: Admin UI for spinning up and managing team instances

### Authentication

- **AUTH-01**: Firebase Auth integration (email/password or Google)
- **AUTH-02**: Firestore rules lock collections to authenticated coach for their team
- **AUTH-03**: Session persistence and sign-in/sign-out flows

### Branding & Theming

- **THEME-01**: Per-instance color palette configurable (primary, secondary)
- **THEME-02**: Per-instance logo upload and display in headers / share cards
- **THEME-03**: Per-instance share card design variants

### Game Structure Flexibility

- **STRUCT-01**: Per-game configurable half/quarter length (for tournament overtime, variable formats)
- **STRUCT-02**: Per-segment stat rollup and attribution (not just timestamp-based)

## Out of Scope (v3.0)

| Feature | Reason |
|---------|--------|
| True multi-tenant SaaS | "Just this friend" scope; defer until demand emerges (tracked as v4.0+ TEN-*) |
| Real authentication | Open Firestore rules preserved on both instances; auth is a separate milestone (tracked as AUTH-*) |
| Per-instance theming (colors, logo) | Team name swap only; navy/orange palette stays on both instances (tracked as THEME-*) |
| Admin UI for spinning up instances | Manual deployment process is fine for this scale |
| Per-game configurable half/quarter length | Deployment-level config is sufficient for current known users |
| Stat-attribution-by-segment for quarters | Events already carry timestamps; per-segment rollups deferred unless needed |
| Real-time live score sharing to spectators | Coach-only today, unchanged in v3.0 |
| Cross-instance sharing or comparison | Data is fully isolated per Firebase project by design |

## Context for Planning

**Friend's roster (for CFG-03 friend deployment config):**
Bodhi, Kurry, Henry, Will, Broderick, Nurdil, Lucas, Crew, Max, Mason, Cooper — 11 players total, all seeded with `num: null` (CFG-06 handles null-safe rendering; coach fills numbers via existing roster UI after first login).

**Madeira's current roster** (CFG-03 Madeira deployment config) remains the 13-player list already in `constants.js`.

**Game-structure models:**
- Madeira (`halves`): 2 × 25-min halves, 1 halftime break, 1st-half + 2nd-half lineups (existing behavior — no changes)
- Friend's (`quarters`): 4 × 12-min quarters = 48-min game, 8 segment lineups (Q1, Q1.5, Q2, Q2.5, Q3, Q3.5, Q4, Q4.5), rolling sub at each 6:00 mid-quarter mark, clock stops at end of each quarter with coach-triggered restart

**Firestore data isolation:** separate Firebase projects → automatically isolated collections. No cross-instance reads or writes. Shared-lineup short links are naturally scoped per instance.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CFG-01 | Phase 8 | Pending |
| CFG-02 | Phase 8 | Pending |
| CFG-03 | Phase 8 | Pending |
| CFG-04 | Phase 8 | Pending |
| CFG-05 | Phase 8 | Pending |
| CFG-06 | Phase 8 | Pending |
| FORM-01 | Phase 9 | Pending |
| FORM-02 | Phase 9 | Pending |
| FORM-03 | Phase 9 | Pending |
| QTR-01 | Phase 10 | Pending |
| QTR-02 | Phase 10 | Pending |
| QTR-03 | Phase 10 | Pending |
| QTR-04 | Phase 10 | Pending |
| QTR-05 | Phase 10 | Pending |
| QTR-06 | Phase 10 | Pending |
| MAD-01 | Phase 10 | Pending |
| MAD-02 | Phase 10 | Pending |
| DEPLOY-01 | Phase 11 | Pending |
| DEPLOY-02 | Phase 11 | Pending |
| DEPLOY-03 | Phase 11 | Pending |
| DEPLOY-04 | Phase 11 | Pending |

**Coverage:**
- v3.0 requirements: 21 total
- Mapped to phases: 21 ✓
- Unmapped: 0

**Phase-to-requirement rollup:**
- Phase 8 (Config Layer Extraction): CFG-01, CFG-02, CFG-03, CFG-04, CFG-05, CFG-06 — 6 requirements
- Phase 9 (Formations Gating + 7v7 Library): FORM-01, FORM-02, FORM-03 — 3 requirements
- Phase 10 (Quarter-Based Game Model): QTR-01, QTR-02, QTR-03, QTR-04, QTR-05, QTR-06, MAD-01, MAD-02 — 8 requirements
- Phase 11 (Second Deployment + Docs): DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04 — 4 requirements

---
*Requirements defined: 2026-04-19*
*Last updated: 2026-04-19 after roadmap creation — all 21 v3.0 requirements mapped to Phases 8-11*
