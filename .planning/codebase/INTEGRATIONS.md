# External Integrations

**Analysis Date:** 2026-03-15

## APIs & External Services

**None detected** - This is a client-only application with no external API calls beyond Firebase.

## Data Storage

**Databases:**
- Firestore (Firebase)
  - Project: `madeira-fc-lineups`
  - Connection: Hardcoded config in `src/firebase.js`
  - Client: Firebase SDK v12.10.0 (`firebase/firestore`)
  - Document: `lineups/published` - stores published lineup snapshots with formation, lineups, inactiveIds, roster, name, savedAt timestamp

**File Storage:**
- None configured - favicon (`madeira-fc-logo.png`) served from public directory; no user file uploads

**Local Storage:**
- Browser localStorage with `madeira_` prefix for keys:
  - `madeira_roster` - player roster (persisted)
  - `madeira_lineups` - lineup assignments for both halves (persisted)
  - `madeira_formation` - selected formation (persisted)
  - `madeira_inactiveIds` - inactive player IDs (persisted)
  - `madeira_savedLineups` - locally saved lineup snapshots (persisted)

**Caching:**
- None detected beyond browser HTTP cache

## Authentication & Identity

**Auth Provider:**
- None - Application is unauthenticated; all users access shared data

**Data Access:**
- Firestore document `lineups/published` is readable and writable by any client with valid Firebase config
- No security rules enforced; relies on Firebase web config visibility

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Console logging only: `console.warn()` and `console.error()` for Firebase operations failures (see `src/firebase.js`)

## CI/CD & Deployment

**Hosting:**
- Not detected in codebase; assumed Firebase Hosting or similar static host

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- None - Firebase config is hardcoded in source

**Secrets location:**
- Firebase API key exposed in `src/firebase.js` (security concern - see CONCERNS.md)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Sharing & Integration Points

**URL Query Parameters:**
- `?lineup=[encoded_data]` - Shares lineup state as base64-encoded JSON in URL
  - Decoded in `src/MadeiraLineupPlanner.jsx` using `decodeLineup()`
  - Removes query parameter after decoding (replaces history state)

**Clipboard Integration:**
- Uses `navigator.clipboard.writeText()` to copy share URLs when Web Share API unavailable

**Web Share API:**
- Uses `navigator.share()` for native share on mobile devices (falls back to clipboard copy)

## Data Flow

1. **App Startup:**
   - Load shared lineup from URL (`?lineup=...`) → decode and populate state
   - If no URL lineup, load published lineup from Firestore `lineups/published`
   - Fallback to localStorage if Firestore load fails

2. **State Persistence:**
   - All state changes (roster, lineups, formation, inactiveIds, savedLineups) trigger localStorage save via `useEffect` hooks
   - Local saves are independent of Firestore

3. **Cloud Sync:**
   - When user saves a lineup (via Save modal), snapshot is published to Firestore `lineups/published`
   - Next app load will fetch this published lineup
   - Firestore save failure shows toast but doesn't block local save

4. **Sharing:**
   - Current lineup state encoded to URL via `buildShareUrl()` and `encodeLineup()`
   - Shared URL contains full state (formation, lineups, roster, inactiveIds, name)
   - Recipient loads shared state via URL parameter on app startup

---

*Integration audit: 2026-03-15*
