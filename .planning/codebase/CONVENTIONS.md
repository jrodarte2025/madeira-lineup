# Coding Conventions

**Analysis Date:** 2026-03-15

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `MadeiraLineupPlanner.jsx`, `firebase.js` for utilities)
- Main entry point: `main.jsx`
- Helper modules: lowercase or camelCase (e.g., `firebase.js`)

**Functions:**
- React components: PascalCase (e.g., `PitchSVG`, `FieldPosition`, `PlayerChip`)
- Utility functions: camelCase (e.g., `encodeLineup`, `decodeLineup`, `buildShareUrl`, `shareLineup`)
- Custom hooks: camelCase with `use` prefix (e.g., `useMediaQuery`)
- Event handlers: camelCase with `handle` prefix (e.g., `handlePlayerClick`, `handleDragStart`)
- Callbacks passed as props: camelCase with `on` prefix (e.g., `onDragStart`, `onDragEnd`, `onDrop`, `onClick`)

**Variables:**
- Regular state/variables: camelCase (e.g., `matches`, `isMobile`, `selectedPlayer`, `dragSource`)
- Boolean flags: clear naming with `is`, `has`, `show`, `can` prefixes (e.g., `isDimmed`, `isSelected`, `hasPlayer`, `canInteract`, `showRemove`)
- Object shorthand constants: UPPER_SNAKE_CASE (e.g., `INITIAL_ROSTER`, `FORMATIONS`, `PUBLISHED_DOC`)
- Abbreviation constants: Single uppercase letters for design tokens (e.g., `C` for colors object)

**Types:**
- No explicit TypeScript in use; component props are documented via JSDoc-style comments in the code structure

## Code Style

**Formatting:**
- No Prettier configuration detected; code is manually formatted
- Indentation: 2 spaces (React/JSX standard)
- Semicolons: Present in most statements
- Arrow functions: Preferred for simple handlers and callbacks (e.g., `(e) => setMatches(e.matches)`)

**Linting:**
- Tool: ESLint with Flat Config (`eslint.config.js`)
- Configuration:
  - Extends: `@eslint/js` recommended rules, `eslint-plugin-react-hooks` recommended, `eslint-plugin-react-refresh` for Vite
  - EcmaVersion: 2020 (supports modern ES features)
  - JSX Support: Enabled
  - Rule override: `'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]` — ignores uppercase or underscore-prefixed unused variables

## Import Organization

**Order:**
1. React imports (useState, useCallback, useEffect, useRef)
2. Firebase/utility imports (e.g., `from "./firebase"`)
3. No third-party UI libraries; all styling is inline

**Path Aliases:**
- No path aliases configured; all imports use relative paths (e.g., `from "./firebase"`)

**Example pattern from `main.jsx`:**
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MadeiraLineupPlanner from './MadeiraLineupPlanner.jsx'
```

## Error Handling

**Patterns:**
- Silent catch blocks (no error logging in most cases):
  ```javascript
  try {
    const v = localStorage.getItem(`madeira_${key}`);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
  ```
- Graceful fallback on error (e.g., `localStorage` failures return default values)
- Firebase operations use try-catch with `console.warn()` for publish failures and `console.error()` for save failures:
  ```javascript
  } catch (err) {
    console.warn("Failed to load published lineup:", err);
    return null;
  }
  ```
- Event-specific error handling (e.g., checking for `AbortError` on navigator.share):
  ```javascript
  } catch (e) {
    if (e.name === "AbortError") return null;
  }
  ```

**Pattern: Validation with early returns:**
- Functions return null or false on invalid conditions rather than throwing:
  ```javascript
  function decodeLineup(encoded) {
    try {
      const payload = JSON.parse(atob(encoded));
      return { formation: payload.f, ... };
    } catch {
      return null;
    }
  }
  ```

## Logging

**Framework:** `console` only (no dedicated logging library)

**Patterns:**
- `console.warn()` for non-critical failures (e.g., "Failed to load published lineup")
- `console.error()` for critical failures (e.g., "Failed to publish lineup")
- No logging for successful operations or state changes
- Most error handling is silent (catch blocks with no logging)

## Comments

**When to Comment:**
- Section headers using ASCII boxes with `// ==================` pattern:
  ```javascript
  // =============================================
  // SHARE UTILS — encode/decode lineup state for URL sharing
  // =============================================
  ```
- Inline comments for logic clarity, though minimal in this codebase
- TODO comments for future work (e.g., "TODO: Replace these values with your Firebase web app config")

**No JSDoc/TSDoc:**
- Functions lack formal documentation comments
- Comments are primarily section headers and inline explanations

**Example section pattern:**
```javascript
// =============================================
// INTERACTIVE FIELD POSITION
// =============================================
function FieldPosition({ pos, player, ... }) { ... }
```

## Function Design

**Size:**
- Small, focused components (most are 20-50 lines)
- Main component `MadeiraLineupPlanner` is monolithic at ~1071 lines (state management, handlers, render logic all in one file)
- Helper functions are extraction-based (e.g., `encodeLineup`, `decodeLineup` extracted as utilities)

**Parameters:**
- Props are destructured at function signature level:
  ```javascript
  function FieldPosition({ pos, player, isHighlighted, onDragStart, onDragEnd, onDragOver, onDrop, onClick, onDoubleClick, compact }) { ... }
  ```
- State setters use React convention (setter name = `set` + camelCase state name)

**Return Values:**
- Components return JSX wrapped in fragments (`<>...</>`)
- Utility functions return early with null/false on error:
  ```javascript
  try { ... } catch { return null; }
  ```
- Event handlers return nothing or null on abort

## Module Design

**Exports:**
- One default export per file (`export default function MadeiraLineupPlanner() { ... }`)
- Named exports for utilities:
  ```javascript
  export async function loadPublishedLineup() { ... }
  export async function savePublishedLineup({ formation, lineups, inactiveIds, roster, name }) { ... }
  ```

**Barrel Files:**
- Not used; imports are direct (e.g., `import { loadPublishedLineup } from "./firebase"`)

## Code Organization Patterns

**Constants at top level:**
- Design tokens (colors) in a single `C` object:
  ```javascript
  const C = {
    navy: "#1B2A5B",
    navyLight: "#263A6E",
    orange: "#E86420",
    // ...
  };
  ```
- Font declarations as module constants:
  ```javascript
  const fontBase = "'DM Sans', system-ui, -apple-system, sans-serif";
  const fontDisplay = "'Outfit', system-ui, -apple-system, sans-serif";
  ```
- Data structures (rosters, formations) as UPPER_SNAKE_CASE constants

**Inline styles dominance:**
- No CSS files or CSS-in-JS library
- All styling is inline style objects (e.g., `style={{ display: "flex", flexDirection: "column", ... }}`)
- Conditional styles using ternary operators:
  ```javascript
  style={{
    background: isSelected ? C.orange : "rgba(255,255,255,0.05)",
    border: isSelected ? "1px solid transparent" : "1px solid rgba(255,255,255,0.07)",
  }}
  ```

**State management:**
- All state in the main component (`MadeiraLineupPlanner`)
- `useLocalStorage` pattern for persistence (custom implementation via `loadStored`/`saveStored`)
- Drag-and-drop state tracked via `dragSource`

---

*Convention analysis: 2026-03-15*
