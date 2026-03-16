# Codebase Concerns

**Analysis Date:** 2026-03-15

## Tech Debt

**Firebase Configuration Hardcoded with TODO Comment:**
- Issue: Firebase credentials are hardcoded in `src/firebase.js` with a TODO marker indicating they should be replaced with environment variables
- Files: `src/firebase.js:5-16`
- Impact: Security risk if repository is public; credentials are exposed in version control and cannot be rotated without code changes
- Fix approach: Move `firebaseConfig` to environment variables (`.env.local` or similar); use `import.meta.env.VITE_FIREBASE_*` pattern in Vite; never commit secrets to git

**Silent Error Handling with Empty Catch Blocks:**
- Issue: Multiple locations use `catch {}` without any logging or recovery strategy, silencing failures
- Files: `src/firebase.js:28, 45` (console logs); `src/MadeiraLineupPlanner.jsx:394, 519, 731` (silent catches)
- Impact: When errors occur (JSON parse failures, drag-and-drop data issues, localStorage quota exceeded), there is no indication to the user or developer that something failed. Bugs become invisible.
- Fix approach: Log caught errors to console in development; show user-facing toasts for critical failures (e.g., "Failed to save to cloud"); differentiate between expected failures (AbortError on share cancel) and unexpected ones

**Nested State Updates in Callbacks:**
- Issue: `toggleInactive()` at line 640-653 calls `setLineups()` inside a `setInactiveIds()` state setter, creating a race condition where the lineup clearance may not execute before the inactive state updates
- Files: `src/MadeiraLineupPlanner.jsx:640-653`
- Impact: When toggling a player to inactive, the player may briefly remain on the field or state may be inconsistent; the setTimeout workaround at line 725 is a band-aid fix for this root cause
- Fix approach: Consolidate state updates into a single callback that updates both `inactiveIds` and `lineups` atomically; remove the setTimeout workaround

**Roster Player ID Generation Without Collision Protection:**
- Issue: `addPlayer()` at line 658 generates new player IDs using `Math.max(0, ...roster.map((p) => p.id)) + 1`, which assumes roster is always present and doesn't handle edge cases
- Files: `src/MadeiraLineupPlanner.jsx:656-661`
- Impact: If roster becomes empty or corrupted, ID generation could fail; IDs are not persisted with any uniqueness guarantee
- Fix approach: Use UUID library or timestamp-based IDs; validate roster exists before computing max; add type safety with validation

**Synchronous localStorage Calls Without Quota Handling:**
- Issue: `saveStored()` at line 519 calls `localStorage.setItem()` without checking QuotaExceededError, which silently fails when storage is full
- Files: `src/MadeiraLineupPlanner.jsx:514-520`
- Impact: On mobile devices or when user has limited storage, saves fail silently; user sees "saved" toast but data doesn't persist
- Fix approach: Catch QuotaExceededError specifically; alert user when storage is full; implement storage cleanup strategy

**No Validation on Saved Lineup Structure:**
- Issue: `loadLineup()` at line 686 assumes `savedLineups[index]` exists and has correct structure; `loadPublishedLineup()` returns data without schema validation
- Files: `src/MadeiraLineupPlanner.jsx:685-693`, `src/firebase.js:23-32`
- Impact: Corrupted or old saved lineups could crash the app or load partial data; Firestore data without validation can be arbitrary
- Fix approach: Add schema validation using a library (e.g., Zod); validate all loaded data before using; provide fallbacks for missing fields

**Hardcoded Initial Roster:**
- Issue: `INITIAL_ROSTER` at line 72-86 is hardcoded with team member names and numbers
- Files: `src/MadeiraLineupPlanner.jsx:72-86`
- Impact: Not reusable for other teams; requires code changes to modify roster; coupling between app logic and team data
- Fix approach: Load roster from Firestore or external config; allow roster customization in UI without code changes

---

## Performance Bottlenecks

**Large Component with 1071 Lines in Single File:**
- Problem: `MadeiraLineupPlanner.jsx` contains all UI, business logic, and helper functions in one 1071-line file with deeply nested render logic
- Files: `src/MadeiraLineupPlanner.jsx` (entire file)
- Cause: No separation of concerns; components like `PrintPitch`, `SaveLoadModal`, `RosterContent` are defined inside the main export, causing re-renders of the entire tree
- Improvement path: Extract components into separate files (`src/components/PrintPitch.jsx`, `src/components/SaveLoadModal.jsx`, etc.); memoize with `React.memo()` to prevent unnecessary re-renders; separate business logic into hooks

**Inefficient Array Operations on Every Render:**
- Problem: `availablePlayers`, `onFieldPlayers`, and `inactivePlayers` are computed on every render by filtering the entire roster (lines 588-590), even if roster hasn't changed
- Files: `src/MadeiraLineupPlanner.jsx:588-590`
- Cause: No memoization of filtered arrays
- Improvement path: Use `useMemo()` with roster as dependency; move calculations outside component or into custom hook

**Multiple Simultaneous localStorage Reads on Mount:**
- Problem: Five separate `useEffect` hooks (lines 543-547) persist state independently, and the initial load uses `loadStored()` calls that JSON.parse the same data multiple times
- Files: `src/MadeiraLineupPlanner.jsx:513-547`
- Cause: Each effect has its own dependency, causing 5+ localStorage writes on every state change
- Improvement path: Batch localStorage writes into a single effect; debounce saves to avoid excessive I/O

**Entire Field Re-rendered on Drag State Change:**
- Problem: When `dragSource` state changes, the entire pitch and all field positions re-render, including non-interactive SVG background
- Files: `src/MadeiraLineupPlanner.jsx:714, 854+` (pitch section)
- Cause: No memoization of pitch SVG or individual position components
- Improvement path: Memoize `PitchSVG` and `FieldPosition` components; reduce reliance on dragSource in parent

---

## Fragile Areas

**Drag-and-Drop State Management:**
- Files: `src/MadeiraLineupPlanner.jsx:712-733`
- Why fragile: Complex drag logic with multiple sources (roster, field, inactive); uses JSON serialization of drag data; setTimeout workaround masks race condition; drag data format not validated
- Safe modification: Never add drag sources without updating the source type check at line 721-730; add validation for drag data structure before JSON.parse
- Test coverage: No unit tests for drag-drop logic; manual testing only

**Cross-Device Synchronization with Race Conditions:**
- Files: `src/firebase.js:23-49`, `src/MadeiraLineupPlanner.jsx:556-583`
- Why fragile: App loads published lineup from Firestore on mount, but doesn't handle case where user saves lineup before Firestore load completes; no conflict resolution if multiple devices save simultaneously
- Safe modification: Add `cloudLoaded` flag before allowing saves; implement last-write-wins or vector clock conflict resolution
- Test coverage: No tests for concurrent save scenarios

**URL Sharing with base64 Encoding:**
- Files: `src/MadeiraLineupPlanner.jsx:11-26`
- Why fragile: `decodeLineup()` uses `atob()` and `JSON.parse()` without length validation; very long lineups could create URLs exceeding browser/server limits; no handling for URL-encoded characters
- Safe modification: Test with maximum roster size before sharing; add URL length validation before allowing share action
- Test coverage: No tests for URL sharing edge cases

**Toast Notification Timer Leak:**
- Files: `src/MadeiraLineupPlanner.jsx:549-553`
- Why fragile: `toastTimer.current` is set and cleared, but if component unmounts while toast is pending, the timeout still fires and tries to call `setToast()` on unmounted component
- Safe modification: Clear timeout on component unmount in useEffect cleanup
- Test coverage: No tests for async cleanup

---

## Known Bugs

**setTimeout(0) Race Condition in Drag-Drop:**
- Symptoms: When dragging an inactive player to a field position, the player may not assign correctly because `toggleInactive()` hasn't completed before `assignPlayer()` runs
- Files: `src/MadeiraLineupPlanner.jsx:723-725`
- Trigger: Drag an inactive player from the inactive zone to a field position
- Workaround: setTimeout(..., 0) defers assignPlayer until next tick (line 725), but this is masking the real issue (nested state updates)

**Print View Logo Path Issues:**
- Symptoms: Print view references `/madeira-fc-logo.png` which may not exist in all deployment environments
- Files: `src/MadeiraLineupPlanner.jsx:778, 832`
- Trigger: Try to print or view print preview
- Workaround: Ensure logo file exists in public directory and is correctly deployed

**Missing CloudLoaded State Check:**
- Symptoms: If user saves a lineup before `cloudLoaded` becomes true (before Firestore load completes), the save could overwrite data from cloud
- Files: `src/MadeiraLineupPlanner.jsx:539, 669` (cloudLoaded exists but not used in save logic)
- Trigger: Very fast save after page load, before Firestore read completes
- Workaround: None implemented; user behavior must avoid this scenario

---

## Security Considerations

**Firebase Credentials in Source Code:**
- Risk: API keys and project IDs are exposed in `src/firebase.js`
- Files: `src/firebase.js:8-16`
- Current mitigation: None (credentials are plaintext in git history)
- Recommendations:
  - Move to environment variables immediately
  - Implement Firestore security rules to restrict access by user/domain
  - Rotate API key if repository is public
  - Add `src/firebase.js` to `.gitignore` template and use `.env.local` pattern

**No Input Validation on Player Names or Numbers:**
- Risk: Player names and numbers are stored without validation; could contain special characters, extremely long strings, or invalid data
- Files: `src/MadeiraLineupPlanner.jsx:656-661`
- Current mitigation: Basic trim() only
- Recommendations:
  - Validate player name length (max 50 chars)
  - Validate jersey number is 0-99
  - Sanitize names before storing in Firestore
  - Use schema validation on all inputs

**Unvalidated Firestore Data:**
- Risk: Any data read from Firestore is assumed to be correct; a compromised Firestore could inject malicious roster data
- Files: `src/firebase.js:25-26`, `src/MadeiraLineupPlanner.jsx:574-579`
- Current mitigation: None
- Recommendations:
  - Validate all Firestore reads against a schema (use Zod or similar)
  - Implement Firestore security rules to ensure data integrity
  - Log suspicious data patterns

---

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: All business logic (assignPlayer, removeFromPosition, toggleInactive, etc.) has no automated tests
- Files: `src/MadeiraLineupPlanner.jsx:594-653`
- Risk: Refactoring or bug fixes could break lineup mechanics without detection
- Priority: High — these are core features

**No Integration Tests:**
- What's not tested: localStorage persistence, Firestore sync, drag-drop interactions
- Files: `src/firebase.js`, `src/MadeiraLineupPlanner.jsx` (lines 542-583, 717-733)
- Risk: State persistence bugs, cloud sync failures, drag-drop race conditions go undetected
- Priority: High

**No E2E Tests:**
- What's not tested: Complete user workflows (create lineup, save, share, load on another device)
- Risk: Real-world user scenarios fail but are not caught in development
- Priority: Medium

**No Print View Tests:**
- What's not tested: Print layout, formatting, logo rendering
- Files: `src/MadeiraLineupPlanner.jsx:774-817`
- Risk: Print output broken for users; only discovered when users try to print
- Priority: Medium

---

## Missing Critical Features

**No Undo/Redo:**
- Problem: Users cannot undo accidental changes to lineup; "Clear All" is destructive with no recovery
- Blocks: Prevents confident edits; users must be careful and manually recover from mistakes
- Suggested implementation: Maintain undo stack using `useReducer` instead of multiple useState calls

**No Roster Validation:**
- Problem: Roster can be in invalid states (duplicates, missing goalkeeper, wrong formation size)
- Blocks: App allows saving lineups that violate 9v9 rules (e.g., no goalkeeper assigned)
- Suggested implementation: Add validation layer that checks formation matches number of players assigned

**No Offline Mode:**
- Problem: If network is down, Firestore sync fails silently and user doesn't know if data was saved to cloud
- Blocks: Users cannot work reliably on mobile or unstable connections
- Suggested implementation: Queue unsaved changes; retry sync when connection returns; show offline indicator

**No Multi-User Collaboration:**
- Problem: When multiple devices/users work on same lineup, last save wins; no merge strategy
- Blocks: Coaches collaborating on lineup planning will overwrite each other's changes
- Suggested implementation: Implement operational transformation or CRDT for real-time sync

---

## Dependencies at Risk

**Firebase v12.10.0:**
- Risk: Firebase JS SDK versions are frequently updated; breaking changes are common between major versions
- Impact: If app breaks during Firebase upgrade, entire cloud sync and data loading fails
- Migration plan: Pin to minor version (12.10.x) in package.json; test major upgrades in staging before production; maintain separate branch for testing

**React 19.2.4:**
- Risk: React 19 is recent; ecosystem plugins may lag
- Impact: None currently, but upgrade cycles could introduce breaking changes in dev tools
- Migration plan: Monitor React releases; test carefully before upgrading

---

## Scaling Limits

**No Roster Size Limit:**
- Current capacity: Array-based roster scales to ~10,000 players before performance degrades
- Limit: With 100+ players, filtering arrays on every render becomes noticeable; field interactions slow down
- Scaling path: Virtualize roster list if size exceeds 50 players; use indexed data structure instead of arrays

**URL Share Length Limit:**
- Current capacity: base64 encoded lineup can be ~2-3KB before URL exceeds browser limits
- Limit: Large rosters + full lineups could exceed 4KB, breaking share links
- Scaling path: Store lineup share in Firestore with unique ID; share short URL instead of encoded payload

---

*Concerns audit: 2026-03-15*
