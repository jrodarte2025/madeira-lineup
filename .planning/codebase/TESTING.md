# Testing Patterns

**Analysis Date:** 2026-03-15

## Test Framework

**Runner:**
- Not detected — no test runner configured
- No jest.config.js, vitest.config.js, or similar test configuration files present

**Assertion Library:**
- Not applicable — no testing framework installed

**Run Commands:**
- No test scripts in `package.json`
- Current scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`
- No test coverage tooling configured

## Test File Organization

**Status:** No test files found

The codebase has no `.test.js`, `.spec.js`, `.test.jsx`, or `.spec.jsx` files in `src/` directory.

## Testing Approach

**Current Practice:** Manual testing and browser-based validation

The application is tested through:
1. Local development server (`npm run dev`)
2. Browser inspection and manual interaction
3. Visual verification of lineup changes, drag-and-drop, localStorage persistence, Firebase sync

**Evidence from code:**
- No test doubles or mocks present
- No dependency injection for testability
- All Firebase calls are real calls to production Firestore:
  ```javascript
  // `firebase.js` — direct imports from Firebase SDK
  import { initializeApp } from "firebase/app";
  import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
  ```

## No Mocking Infrastructure

**Mocking Framework:** Not applicable

**Patterns:**
- Firebase is not mocked; tests would require real Firebase project access or manual mocking setup
- No mock factories for roster data, lineups, or formations
- No test doubles for utility functions

**Current approach to complex logic:**
- State management is all in the main component (`MadeiraLineupPlanner.jsx`), making unit testing difficult without extraction
- Utility functions like `encodeLineup`, `decodeLineup`, `buildShareUrl`, and `shareLineup` are purely functional and could be tested if a test framework were added

## Fixtures and Factories

**Test Data:**
- `INITIAL_ROSTER` constant contains hardcoded player data (13 players with names, numbers, IDs)
- `FORMATIONS` constant contains 4 formations with position labels and coordinates

These could serve as fixtures but are currently only used in production code:
```javascript
const INITIAL_ROSTER = [
  { id: 1, name: "Alex Rodarte", num: 2 },
  { id: 2, name: "Avery Paulin", num: 6 },
  // ... 11 more players
];
```

**Location:**
- Defined in `src/MadeiraLineupPlanner.jsx` (lines 72-86)

## Coverage

**Requirements:** None enforced

**View Coverage:** Not applicable — no coverage tooling configured

## Test Types

**Unit Tests:**
- Not implemented
- Candidates for unit testing:
  - `encodeLineup()` / `decodeLineup()` — URL encoding/decoding logic
  - `buildShareUrl()` — URL construction
  - `useMediaQuery()` — responsive breakpoint hook
  - `getPlayer()` — roster lookup utility

**Integration Tests:**
- Not implemented
- Candidates for integration testing:
  - Firebase lifecycle: `loadPublishedLineup()` → display → `savePublishedLineup()` flow
  - localStorage persistence: state → save → reload → verify state restored
  - URL sharing: lineup state → encode → share link → decode → render

**E2E Tests:**
- Not used
- Manual E2E testing is performed in browser

## Testability Observations

**Easy to test (if framework added):**
- Pure utility functions: `encodeLineup`, `decodeLineup`, `buildShareUrl`
- Custom hook: `useMediaQuery` (has clear inputs and outputs)
- Constants: INITIAL_ROSTER, FORMATIONS (can be used as test fixtures)

**Difficult to test (requires refactoring):**
- Main component (`MadeiraLineupPlanner` — 1071 lines) — monolithic with tightly coupled state, effects, and render logic
- Drag-and-drop handlers — depend on React event system and DOM state
- Firebase integration — tightly coupled, requires mocking or integration test environment
- Component hierarchy — many nested components with complex prop drilling

**Recommended approach for testing (if implemented):**
1. Extract utility functions to separate modules for unit testing
2. Create test helper for Firebase mocking (or use Firestore emulator for integration tests)
3. Add Vitest or Jest for fast test execution in development
4. Use React Testing Library for component testing if needed

## Current Quality Assurance

**Defect Prevention:**
- ESLint enforces code quality rules (no unused variables unless explicitly intended)
- React StrictMode enabled in development (`main.jsx`) to surface side effects
- TypeScript not used (no static type checking)

**Code Review:**
- No automated testing gates
- Manual code review likely (via git history and commits)

**Validation:**
- Manual browser testing during development
- Visual regression testing via manual comparison
- localStorage and Firebase operations verified by user interaction

---

*Testing analysis: 2026-03-15*
