# Requirements: Madeira FC Lineup Planner

**Defined:** 2026-03-15
**Core Value:** Coaches can manage lineups, track live games, and review player stats from phone or desktop

## v1.0 Requirements (Complete)

### Display

- [x] **DISP-01**: Field positions show first initial + last name (e.g., "J. Smith")
- [x] **DISP-02**: Bench/roster shows full player names
- [x] **DISP-03**: Position circles on field are larger with bigger name and position text

### Drag & Drop

- [x] **DND-01**: Dragging a field player to the bench removes them from their field position
- [x] **DND-02**: Dragging a bench player onto an occupied field position swaps them
- [x] **DND-03**: Dragging a bench player onto an empty field position assigns them

### Mobile UX

- [x] **MOB-01**: Mobile layout places bench/roster above the field
- [x] **MOB-02**: Mobile layout places formation selector and controls below the field
- [x] **MOB-03**: Touch targets and buttons are large enough for comfortable phone use
- [x] **MOB-04**: Overall mobile UX is intuitive and polished

### Preservation

- [x] **PRES-01**: Desktop layout remains unchanged from current state

## v2.0 Requirements

Requirements for Live Game Tracking & Stats milestone. Each maps to roadmap phases.

### App Infrastructure

- [ ] **INFRA-01**: App has bottom tab navigation with Lineup, Games, and Stats tabs
- [ ] **INFRA-02**: Shared components (PitchSVG, FieldPosition, constants) extracted into reusable files
- [ ] **INFRA-03**: Existing lineup builder works unchanged within the new tab structure

### Game Lifecycle

- [ ] **GAME-01**: Coach can create a game with opponent name and date, linked to current lineup
- [ ] **GAME-02**: Game screen loads as a separate view with the linked lineup on a pitch
- [ ] **GAME-03**: Coach can start a half with a single tap; 25-minute timer counts down and auto-stops
- [ ] **GAME-04**: Timer uses timestamp-based elapsed time (not setInterval ticks) for accuracy
- [ ] **GAME-05**: Screen Wake Lock prevents phone from sleeping during active game
- [ ] **GAME-06**: Game state is mirrored to localStorage for crash recovery

### Substitution & Minutes

- [ ] **SUB-01**: Dragging a field player to bench (or vice versa) during a game logs a substitution event
- [ ] **SUB-02**: Per-player minutes tracked automatically (starts on sub-in, pauses on sub-out)
- [ ] **SUB-03**: Running minute count (to the minute) displayed on each player's field circle during game
- [ ] **SUB-04**: Minutes calculated as intersection of on-field intervals with active half intervals

### Stat Tracking

- [ ] **STAT-01**: Tapping a player on the pitch selects them and shows a StatBar with position-group buttons
- [ ] **STAT-02**: Stat buttons are position-aware (GK/DEF/MID/FWD each get different stat options)
- [ ] **STAT-03**: Stat buttons are color-coded (orange=offensive, teal=defensive, gray=neutral)
- [ ] **STAT-04**: Each button tap records a stat event with playerId, stat type, half, and timestamp
- [ ] **STAT-05**: Stat badge count shown on each player's field circle for current half
- [ ] **STAT-06**: Recent events feed (last 3-5 events) displayed near StatBar with single-tap undo

### Post-Game

- [ ] **POST-01**: After second half auto-stops, game summary is produced showing players x stats table with totals
- [ ] **POST-02**: Game summary includes per-player minutes played
- [ ] **POST-03**: CSV export button downloads game stats as a file
- [ ] **POST-04**: Shareable link allows anyone to view the game summary
- [ ] **POST-05**: Image export generates a summary card for sharing in group chats

### Season & Profiles

- [ ] **SEASON-01**: Season dashboard shows running tallies (minutes, goals, assists, etc.) across all completed games
- [ ] **SEASON-02**: Player profiles show individual season stats when a player is selected
- [ ] **SEASON-03**: Game data is pushed to season totals when a game is finalized

### Data Storage

- [ ] **DATA-01**: Game documents stored in Firestore games collection with events embedded
- [ ] **DATA-02**: Season stats stored in Firestore with denormalized player totals for fast reads
- [ ] **DATA-03**: All game state mirrored to localStorage during active games

## Future Requirements

### Sharing & Access

- **SHARE-01**: Players and parents can log in to view stats
- **SHARE-02**: Coach can control which stats are visible to players/parents
- **SHARE-03**: Real-time live score sharing to spectators during games

### Multi-Team

- **MULTI-01**: Support for managing multiple teams
- **MULTI-02**: Opponent team tracking and head-to-head stats

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time spectator score sharing | Coach-only for now; sharing designed for later |
| Video/photo capture during games | Too complex, not core to stat tracking |
| Opponent team tracking | Focus is on Madeira FC players only |
| Multiple team management | Single team (Madeira FC) for now |
| Native mobile app | PWA is sufficient |
| AI rotation suggestions | Undermines coaching authority; show minutes, let coach decide |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 4 | Pending |
| INFRA-02 | Phase 4 | Pending |
| INFRA-03 | Phase 4 | Pending |
| GAME-01 | Phase 5 | Pending |
| GAME-02 | Phase 5 | Pending |
| GAME-03 | Phase 5 | Pending |
| GAME-04 | Phase 5 | Pending |
| GAME-05 | Phase 5 | Pending |
| GAME-06 | Phase 5 | Pending |
| SUB-01 | Phase 5 | Pending |
| SUB-02 | Phase 5 | Pending |
| SUB-03 | Phase 5 | Pending |
| SUB-04 | Phase 5 | Pending |
| STAT-01 | Phase 5 | Pending |
| STAT-02 | Phase 5 | Pending |
| STAT-03 | Phase 5 | Pending |
| STAT-04 | Phase 5 | Pending |
| STAT-05 | Phase 5 | Pending |
| STAT-06 | Phase 5 | Pending |
| POST-01 | Phase 6 | Pending |
| POST-02 | Phase 6 | Pending |
| POST-03 | Phase 6 | Pending |
| POST-04 | Phase 6 | Pending |
| POST-05 | Phase 6 | Pending |
| SEASON-01 | Phase 7 | Pending |
| SEASON-02 | Phase 7 | Pending |
| SEASON-03 | Phase 7 | Pending |
| DATA-01 | Phase 4 | Pending |
| DATA-02 | Phase 4 | Pending |
| DATA-03 | Phase 5 | Pending |

**Coverage:**
- v2.0 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-16 — traceability populated after v2.0 roadmap creation*
