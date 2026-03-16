# Feature Research

**Domain:** Live game tracking and stat logging for youth soccer coaching apps
**Researched:** 2026-03-16
**Confidence:** MEDIUM (WebSearch-verified; no Context7 applicable for domain knowledge; cross-referenced across 8+ apps)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features coaches assume exist. Missing these = app feels unfinished or untrustworthy at the sideline.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Game timer per half with start/stop | Every game-day app has this; coaches cannot track time in their head while managing 14 players | LOW | Must persist through accidental home button press / screen sleep. Background timer is the #1 user complaint in App Store reviews across all competitor apps. |
| Half-time transition (auto-stop + prompt to start 2nd half) | 25-minute halves are fixed; coaches expect the app to handle the boundary automatically | LOW | Auto-stop at 25:00 with audio/vibration alert is standard. Manual override to account for stoppage time should exist. |
| Score tracking (goals for/against) | Coaches mentally tie every goal to the app; no score = the app is useless as a record | LOW | Must be tappable in 1-2 taps. Undo on accidental tap is expected. |
| Substitution logging with timestamp | Core reason coaches use apps instead of clipboard; who came on, who came off, when | MEDIUM | Must record game clock time (e.g., "14:32") not wall clock. Position assignment on sub-in expected. |
| Per-player minute tracking | Equal playing time is a youth sports mandate; coaches are accountable to parents | MEDIUM | Auto-calculate from sub events. Display to the minute. Visual bar or percentage per player is standard (SubTime, PitchTime both do this). |
| Event undo (last action) | Coaches tap wrong player under pressure; a single tap undo is table stakes | LOW | "Undo last event" button, not full edit UI. Must be prominent and immediate. |
| Post-game summary | The game ends and coaches share results with players and parents via group chat | MEDIUM | Minimum: lineup used, score, goals/assists, minutes per player, subs made. Must be viewable after the game closes. |
| Stat persistence across sessions | Coaches need to review what happened after they leave the field | LOW | Firebase write on every event ensures data survives phone sleep, app crash, navigation away. |
| Player list tied to existing roster | Coaches won't re-enter 14 names. App must pull from the lineup already built | LOW | Already solved in v1.0 via Firestore. Game creation must link to existing lineup. |

### Differentiators (Competitive Advantage)

Features that distinguish this app from generic coaching apps. These align with the core value: one tool for the full game-day workflow.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Position-aware stat buttons (GK/DEF/MID/FWD) | No competitor surfaces position-relevant stats contextually; coaches currently scroll a flat list or guess which stats apply | MEDIUM | Already designed in PROJECT.md. GK sees Save/Distribution; FWD sees Goal/Shot. Reduces mis-logging and speeds tap flow during live play. |
| Lineup-to-game continuity | Most apps treat lineup building and game day as separate tools; this app pre-loads the lineup into the game screen | MEDIUM | Drag-and-drop from v1.0 becomes the substitution mechanism. Starting XI and bench are already set before the game starts. |
| Stat badge counts on field circles | Visual at-a-glance feedback during the game; coaches can see who has been active without scrolling a log | LOW | Single number overlay on player circle. Color-coded by stat type (offensive/defensive/neutral). No competitor does this in the lineup view. |
| Recent events feed with undo | Competitors either have no event log or require navigating away to see it; an in-game feed with undo is more coach-friendly | MEDIUM | Last 3-5 events visible inline. Tap to undo last event. Preserves game flow. |
| Image export for group chat sharing | Coaches share results instantly via WhatsApp/group text; a formatted image is far more shareable than a link | MEDIUM | Canvas-rendered summary card: score, lineup, top stats. Not a screenshot — a purpose-built shareable image. SubTime does link-only; most apps do CSV-only. |
| Season dashboard with running tallies | Most apps are game-by-game; a season view showing who has the most minutes, goals, and tackles is unique at this price point (free/personal) | HIGH | Aggregates across all saved games. Per-player season totals. Identifies patterns coaches need for training adjustments. |
| Player profiles with career stats | Gives individual players a personal record of their season; motivational and useful for parent conversations | MEDIUM | Per-player view: total minutes, stat totals by category, games played, avg minutes/game. |
| Scoreline history with linked lineups | Reviewing a game from 3 weeks ago and seeing exactly who played where at what minute is not possible in any competitor at this level | HIGH | Game history → game detail → lineup snapshot + event log. Requires Firestore game collections designed upfront. |
| CSV export | Coaches who want to analyze in Excel or share with club directors expect data portability | LOW | One-button export of game stats. Already planned in PROJECT.md. Low effort, high trust signal. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem valuable but create disproportionate complexity or UX debt for this app's context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time spectator sharing (live score push to parents) | Parents want to follow the game remotely | Requires real-time infrastructure, authentication for viewers, and a separate UX surface. Completely out of scope for a coach-only tool. App Store reviews show this is the most commonly requested feature that takes apps from simple to complex overnight. | Shareable post-game summary link handles 90% of parent communication needs without real-time infrastructure. Explicitly deferred in PROJECT.md. |
| Opponent player tracking | Coaches want to track how many shots the opponent took | Doubles the data model, doubles the UI surface, and coaches at youth level don't have an assistant logging opponent events. Every competitor that tried this has poor UX for it. | Focus on own-team stats. Opponent stats exist only as score (goals against). |
| AI substitution suggestions | "Smart" rotation based on minutes and fatigue | Youth coaches make substitution decisions based on game context (score, player condition, positional need) that no algorithm can reliably assess. Suggestion engines create second-guessing, not support. | Display current minutes per player clearly so coach makes an informed decision. Equal playing time display solves the actual problem. |
| Video/highlight capture | Parents want highlight reels | Requires device camera, storage, video processing — completely different product category. Not additive to stat tracking. | Image export of post-game summary card is the right media artifact for this tool. |
| Multi-team management | Coaches who manage JV and varsity both want one app | Adds team-switching UI, scoped Firestore reads, and roster separation complexity with no benefit for single-team use case. | Single-team design ships fast. Multi-team can be a future auth + team-selector layer if needed. |
| Auto-save every keystroke with conflict resolution | Users expect Google Docs-level sync | PWA + Firestore already handles this through event-by-event writes. Building explicit conflict resolution UI (optimistic locking, merge conflicts) is engineering overhead with no user-visible benefit for a single-coach, single-device app. | Write every event to Firestore immediately. No offline-then-sync complexity needed. |
| In-app messaging / parent communication | TeamSnap-style communication layer | Full communication platform is a different product. Coaches use WhatsApp, group texts, and email for communication. The image export + shareable link handles the post-game share need. | Post-game summary export. Let existing messaging tools do messaging. |

---

## Feature Dependencies

```
Game Creation (opponent, date, linked lineup)
    └──requires──> Existing Saved Lineup (v1.0)
                       └──already built──> Roster + Formation

Live Game Screen
    └──requires──> Game Creation
    └──requires──> Half Timer (25-min auto-timer)
    └──requires──> Player List from Linked Lineup

Per-Player Minute Tracking
    └──requires──> Live Game Screen (active timer)
    └──requires──> Substitution Events (sub in/out timestamps)

Position-Aware Stat Buttons
    └──requires──> Live Game Screen
    └──requires──> Position Group Assignment (GK/DEF/MID/FWD from lineup data)

Stat Badge Counts on Field Circles
    └──requires──> Position-Aware Stat Buttons (events must exist)
    └──requires──> Live Game Screen layout with player circles

Recent Events Feed + Undo
    └──requires──> Any event logging (stats, subs, goals)
    └──enhances──> All event logging features

Post-Game Summary
    └──requires──> Live Game Screen (completed game)
    └──requires──> Per-Player Minute Tracking (minutes displayed in summary)
    └──requires──> All stat events (for player × stat table)

CSV Export
    └──requires──> Post-Game Summary data structure

Image Export
    └──requires──> Post-Game Summary data structure
    └──requires──> Canvas or html2canvas rendering

Shareable Game Link
    └──requires──> Firestore game record (public read)
    └──requires──> Post-Game Summary view (must be renderable from URL)

Season Dashboard
    └──requires──> Multiple completed games in Firestore
    └──requires──> Post-Game Summary data structure (must be aggregatable)

Player Profiles
    └──requires──> Season Dashboard data (aggregated per player)
    └──enhances──> Season Dashboard

Bottom Tab Navigation (Lineup | Games | Stats)
    └──requires──> Live Game Screen exists (Games tab)
    └──requires──> Season Dashboard exists (Stats tab)
    └──enhances──> All features (navigation wrapper)
```

### Dependency Notes

- **Game creation requires an existing lineup:** The game screen pre-loads the lineup. This is a hard dependency — you can't enter a game without having first built a lineup in v1.0. Build the game creation flow to enforce this link.
- **Minute tracking requires substitution events:** Minutes are derived from sub timestamps, not independently tracked. If a player starts and is never subbed, their minutes = game clock at end of half. This means the timer must be the authoritative clock, not wall time.
- **Position-aware stat buttons require position group data:** When a player's position is assigned in the lineup builder (LB, CM, ST, etc.), it must map to a stat group (DEF, MID, FWD). This mapping is already defined in PROJECT.md and must be preserved through the game data model.
- **Image export is independent of shareable link:** They use the same data source (post-game summary) but are different outputs. Image export is client-side (canvas). Shareable link requires a Firestore public read + a URL route. Build image export first — it's lower complexity and higher immediate value.
- **Season dashboard requires multiple games:** This feature cannot be validated until 2+ games are saved. Plan it in a later phase and test with seeded data.

---

## MVP Definition

This is a subsequent milestone on an existing v1.0 app. "MVP" here means: the minimum new feature set that makes game-day management possible from start to finish.

### Launch With (v2.0 core)

- [ ] Game creation with opponent name, date, linked lineup — without this, no game can start
- [ ] Live game screen (separate route from lineup builder) — game mode needs its own layout
- [ ] 25-minute auto-timer per half with audio/vibration alert at half and full time — table stakes
- [ ] Start/stop/pause timer manually — referees pause for injuries; coaches need override
- [ ] Score tracking (goals for/against, tappable, undo) — most basic game record
- [ ] Substitution logging with game clock timestamp — core differentiator from a clipboard
- [ ] Per-player minute tracking (auto-calculated from sub events) — equal playing time accountability
- [ ] Position-aware stat buttons (GK/DEF/MID/FWD groups) — key differentiator, already designed
- [ ] Stat badge counts on player field circles — visual feedback during live play
- [ ] Recent events feed (last 3-5) with undo — required for error recovery under pressure
- [ ] Post-game summary modal (lineup + score + minutes + stats table) — end of game deliverable
- [ ] CSV export of game stats — data portability, low effort
- [ ] Firestore game collection with per-event writes — durability, required for all downstream features

### Add After Validation (v2.x)

- [ ] Image export (shareable summary card) — high value but requires canvas rendering; add after post-game summary is working
- [ ] Shareable game summary link — requires public Firestore read + URL routing; add after internal summary is validated
- [ ] Season dashboard with running tallies — requires multiple saved games to be meaningful; add in v2.1
- [ ] Player profiles with individual season stats — depends on season dashboard aggregation; add in v2.1
- [ ] Bottom tab navigation (Lineup | Games | Stats) — navigation wrapper; can scaffold early but fully functional only after all tabs have content

### Future Consideration (v3+)

- [ ] Real-time spectator/parent live view — explicitly out of scope for v2.0 per PROJECT.md
- [ ] Multi-team support — single-team design is the right constraint for now
- [ ] AI substitution suggestions — not appropriate for youth coaching context
- [ ] Video/highlight capture — different product category

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 25-min auto-timer per half | HIGH | LOW | P1 |
| Score tracking (goals for/against) | HIGH | LOW | P1 |
| Substitution logging with timestamp | HIGH | MEDIUM | P1 |
| Per-player minute tracking | HIGH | MEDIUM | P1 |
| Position-aware stat buttons | HIGH | MEDIUM | P1 |
| Recent events feed + undo | HIGH | MEDIUM | P1 |
| Post-game summary modal | HIGH | MEDIUM | P1 |
| Stat badge counts on field circles | MEDIUM | LOW | P1 |
| CSV export | MEDIUM | LOW | P1 |
| Firestore game collection | HIGH | MEDIUM | P1 |
| Image export (summary card) | HIGH | MEDIUM | P2 |
| Shareable game summary link | HIGH | MEDIUM | P2 |
| Bottom tab navigation | HIGH | LOW | P2 |
| Season dashboard | HIGH | HIGH | P2 |
| Player profiles | HIGH | MEDIUM | P2 |
| Game creation flow | HIGH | LOW | P1 |

**Priority key:**
- P1: Must have for v2.0 launch — game-day workflow is broken without it
- P2: High value, add in v2.x after core is validated
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | SubTime | PitchTime | Coach Caddie | Our Approach |
|---------|---------|-----------|--------------|--------------|
| Half timer | Yes, configurable | Yes | Yes | 25-min fixed (9v9 specific), manual override |
| Background timer persistence | Partial (reported issues) | Unknown | Unknown | Service Worker / Web Lock API for PWA |
| Substitution logging | Yes, with rotation | Yes, smart rotation | Yes | Manual drag-and-drop (v1.0 mechanic reused) |
| Per-player minutes | Yes, visual bars | Yes, automated | Yes | Auto-calculated from sub events |
| Equal playing time enforcement | Yes (alert-based) | Yes (AI rotation) | Yes | Display only — no enforcement, coach decides |
| Position-aware stats | No | No | Partial | Full GK/DEF/MID/FWD groups — our differentiator |
| Post-game summary | Yes, shareable link | Yes, PDF export | Yes | Modal + CSV + image export |
| Season dashboard | No | Yes | Partial | Yes (v2.1) |
| Player profiles | No | Partial | No | Yes (v2.1) |
| Linked lineup (lineup-to-game) | No | Partial | No | Yes — unique, eliminates re-entry |
| Image export (group chat ready) | No | No | No | Yes (v2.x) — unique |
| Inline event undo | No (edit after only) | Unknown | Unknown | Yes — inline undo, not post-game edit |

---

## Youth Soccer Context Notes

These notes are specific to 9v9 youth soccer and inform implementation decisions:

- **25-minute halves are fixed.** No need for configurable half duration. The timer is a countdown or count-up — count-up from 0:00 is easier to cross-reference with referee.
- **Equal playing time is a real accountability issue.** Parents track minutes. Coaches get complaints. Per-player minutes must be accurate to the minute, not approximate.
- **Roster size is typically 12-15 for 9v9.** This means 3-6 players on the bench at any time. The substitution UI must handle rapid swaps during a 2-minute water break.
- **Coaches are alone at the sideline.** No assistant stat-logger. UI must be operable with one thumb in landscape or portrait. All interactive targets minimum 44px. Stat logging must be 2 taps max (select player → tap stat button).
- **Games happen in sequence.** Coaches sometimes run two games in one day. Game creation must be fast (< 30 seconds from opening app to starting timer).
- **Halftime is ~5 minutes.** Coaches review lineup adjustments during halftime. The app must support swapping positions between halves without losing first-half stats.

---

## Sources

- [SubTime: Game Management (Google Play)](https://play.google.com/store/apps/details?id=com.gametimes&hl=en_US) — feature set and user reviews (MEDIUM confidence — content partially inaccessible)
- [SubTime App Store Reviews](https://apps.apple.com/us/app/subtime-game-management/id1248650528) — user pain points: missing edit, navigation data loss, background notifications (MEDIUM confidence)
- [PitchTime — Fair Playing Time for Youth Soccer](https://pitchtime.app/) — feature set for 9v9, automated fair play, PDF reports (MEDIUM confidence)
- [The Coaching Manual: Best Soccer Coaching Apps](https://content.thecoachingmanual.com/blog/best-soccer-coaching-apps) — market overview, coach pain points (MEDIUM confidence)
- [Anytime Soccer Training: Best Coaching Apps 2025](https://anytime-soccer.com/7-best-soccer-coaching-apps/) — competitor survey (LOW confidence — 404 on article)
- [4dot6 Digital: SoccerTime Live](https://www.4dot6digital.com/soccer-subs-app) — AI substitution feature analysis (MEDIUM confidence)
- [MatchdayIQ: Equal Playing Time Calculator](https://www.matchdayiq.com/guides/equal-playing-time) — 9v9 playing time norms (MEDIUM confidence)
- [Coach Caddie App Store](https://apps.apple.com/us/app/coach-caddie/id6749924032) — 9v9 support, playing time tracking (MEDIUM confidence)
- [Soccer Simple Stats Tracker](https://apps.apple.com/us/app/soccer-simple-stats-tracker/id6702014811) — image share for post-game (MEDIUM confidence)
- [GameTime Manager App Store Reviews](https://apps.apple.com/us/app/gametime-manager/id6736365243) — background timer issues documented (MEDIUM confidence)

---
*Feature research for: Madeira FC Live Game Tracking & Stats (v2.0)*
*Researched: 2026-03-16*
