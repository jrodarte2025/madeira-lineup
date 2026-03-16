# Architecture

**Analysis Date:** 2026-03-15

## Pattern Overview

**Overall:** Monolithic React single-page application (SPA) with client-side state management and Firebase cloud persistence.

**Key Characteristics:**
- Single-component architecture with inline UI logic
- Client-side state management via React hooks and localStorage
- Firebase Firestore for optional cloud sync of published lineups
- Real-time data encoding/decoding for shareable URLs
- Responsive design with mobile, tablet, and desktop layouts
- Print-optimized dual-view (screen vs. print stylesheets)

## Layers

**Presentation Layer:**
- Purpose: Render UI for lineup planning, player roster management, and formation selection
- Location: `src/MadeiraLineupPlanner.jsx`
- Contains: React components (main app, field position, player chip, pitch SVG, modals, sidebar)
- Depends on: React hooks, localStorage, Firebase functions
- Used by: Browser/client, accessed via `src/main.jsx` entry point

**State Management Layer:**
- Purpose: Maintain and synchronize application state across views
- Location: `src/MadeiraLineupPlanner.jsx` (component-level state via useState/useCallback)
- Contains: roster, lineup arrays, inactive player tracking, modal/modal states, UI toggles
- Pattern: React hooks (useState, useCallback, useEffect, useRef)
- Depends on: localStorage for persistence, Firebase for cloud saves
- Used by: Presentation components that read and update state

**Persistence Layer:**
- Purpose: Enable data durability across sessions and devices
- Location: `src/firebase.js` (cloud), localStorage (client)
- Contains: Firebase initialization, Firestore document operations, localStorage helpers
- Depends on: Firebase SDK, browser localStorage API
- Used by: State management for initial load, save/publish operations

**Utility Layer:**
- Purpose: Provide shared logic for encoding, decoding, and sharing lineups
- Location: `src/MadeiraLineupPlanner.jsx` (encodeLineup, decodeLineup, buildShareUrl, shareLineup functions)
- Contains: URL-safe Base64 encoding/decoding, clipboard/web share API integration
- Depends on: browser APIs (navigator.clipboard, navigator.share, location, history)
- Used by: Share button handlers, URL parameter parsing on app load

## Data Flow

**Initial Load (App Mount):**

1. App mounts and renders empty state with INITIAL_ROSTER
2. localStorage is queried for keys: `madeira_roster`, `madeira_inactiveIds`, `madeira_formation`, `madeira_lineups`, `madeira_savedLineups`
3. URL search params checked for `?lineup=<encoded>` parameter
4. If URL param found: decodeLineup() parses Base64 and populates state
5. If no URL param: loadPublishedLineup() fetches from Firestore `lineups/published` document
6. State is set and component renders

**Player Assignment Flow:**

1. User drags player from roster (roster badge in bench bar or sidebar)
2. handleDragStart() captures playerId and source ("roster" or position index)
3. User drops on field position
4. handlePositionDrop() dispatches assignment:
   - If source === "roster": assignPlayer() sets lineup[activeHalf][posIndex] = playerId
   - If source === "inactive": toggleInactive() removes from inactive, then assignPlayer()
   - If source === number: swapPositions() swaps two positions
5. New state automatically persists to localStorage via useEffect watchers
6. Component re-renders with updated lineup

**Lineup Save/Publish Flow:**

1. User clicks "Save" button → modal opens
2. User enters lineup name and submits
3. saveLineup() creates snapshot object with formation, lineups, inactiveIds, roster, date
4. Snapshot added to localStorage via savedLineups state
5. savePublishedLineup() called → writes to Firestore `lineups/published` doc
6. Toast notifies user: "Lineup saved & published!" or "Saved locally (cloud sync failed)"

**Share Flow:**

1. User clicks "Share" on saved lineup or "Share" button for current lineup
2. shareLineup() creates shareable URL: `{baseUrl}?lineup={encodeLineup(data)}`
3. If navigator.share available: native share dialog opens
4. If unavailable: URL copied to clipboard
5. Toast confirms action
6. Recipient opens URL → app decodes lineup parameter and populates state automatically

**Print Flow:**

1. User clicks "Print" button
2. Browser print dialog opens
3. CSS media query `@media print` hides `.screen-view`, shows `.print-view`
4. Print view renders two parallel pitches (1st/2nd halves) with ink-friendly styling
5. Browser outputs to PDF or printer

## Key Abstractions

**Formation Template:**
- Purpose: Define player positions on pitch for given formation (e.g., 3-3-2, 4-3-1)
- Examples: `src/MadeiraLineupPlanner.jsx` lines 88-109 (FORMATIONS object)
- Pattern: Object with formation key → array of position objects with label, x, y coordinates
- Usage: Positions used to render field circles and coordinate player placement

**Player Object:**
- Purpose: Represent a roster player
- Structure: `{ id: number, name: string, num: number }`
- Used in: INITIAL_ROSTER, roster state, lineup arrays (IDs), inactive tracking

**Lineup State:**
- Purpose: Map player assignments to positions for each half
- Structure: `{ 1: [playerId|null, ...], 2: [playerId|null, ...] }`
- Array indices map directly to positions in FORMATIONS[formation]

**Saved Lineup Snapshot:**
- Purpose: Persist complete state at a moment in time
- Structure: `{ name, formation, lineups, inactiveIds, roster, date }`
- Used for: Load/delete functionality, publishing to Firestore, share URLs

**Share Data Payload:**
- Purpose: Encode complete lineup state into URL-safe string
- Pattern: Object → JSON → Base64 (encodeLineup/decodeLineup)
- Keys: f (formation), l (lineups), i (inactiveIds), r (roster), n (name)
- Allows stateless sharing: recipient URL contains all data needed to reconstruct state

## Entry Points

**Browser Entry:**
- Location: `src/main.jsx`
- Triggers: Page load
- Responsibilities: Bootstrap React app, render MadeiraLineupPlanner to DOM root

**App Component:**
- Location: `src/MadeiraLineupPlanner.jsx`, default export function MadeiraLineupPlanner()
- Triggers: Mounted by main.jsx
- Responsibilities: Initialize all state, render header/pitch/roster/modals, handle user interactions

**Firebase Module:**
- Location: `src/firebase.js`
- Triggers: Imported by MadeiraLineupPlanner.jsx, called on save and app mount
- Responsibilities: loadPublishedLineup(), savePublishedLineup() for Firestore sync

## Error Handling

**Strategy:** Graceful degradation with fallback to localStorage.

**Patterns:**
- Firebase errors logged to console but do not block app: "Failed to load published lineup" or "Failed to publish lineup"
- localStorage access wrapped in try-catch; falls back to in-memory state if unavailable
- URL parameter decoding wrapped in try-catch; invalid lineup URLs silently ignored and app loads from Firestore
- All network operations (Firebase) are non-blocking; app operates normally even if cloud sync fails

## Cross-Cutting Concerns

**Logging:**
- Errors logged to browser console via console.warn() (Firebase load failures) and console.error() (Firebase publish failures)
- No persistent logging layer; errors visible only in browser console

**Validation:**
- Formation selection: restricted to keys in FORMATIONS object
- Player number: parsed as integer, defaults to 0 if invalid
- Lineup name: trimmed and checked for non-empty before save
- All drag/drop data wrapped in JSON.parse try-catch to prevent crashes

**State Persistence:**
- localStorage keys prefixed with `madeira_` to avoid collisions
- All stateful data persisted: roster, inactiveIds, formation, lineups, savedLineups
- Persistence via useEffect watchers on each piece of state (lines 543-547)
- Firestore used only for published lineups (one document: `lineups/published`)

**Responsive Design:**
- Two media queries: `useMediaQuery("(max-width: 767px)")` for mobile, `"(min-width: 768px) and (max-width: 1024px)"` for tablet
- Mobile: roster in bottom drawer, full-width formation buttons, hidden desktop labels
- Tablet: sidebar width reduced (190px vs 230px), pitch max-width increased
- Desktop: sidebar always visible, bench bar, all controls visible

---

*Architecture analysis: 2026-03-15*
