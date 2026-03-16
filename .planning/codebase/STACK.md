# Technology Stack

**Analysis Date:** 2026-03-15

## Languages

**Primary:**
- JavaScript (ES2020+) - React components, Firebase integration, utilities
- JSX - UI component definitions in `src/MadeiraLineupPlanner.jsx` and `src/main.jsx`

**Secondary:**
- None detected

## Runtime

**Environment:**
- Node.js (via npm/package-lock.json)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.2.4 - UI library for interactive lineup planner interface
  - React DOM 19.2.4 - DOM rendering
- Firebase 12.10.0 - Backend services for data persistence and cloud sync

**Build/Dev:**
- Vite 8.0.0 - Build tool and dev server (`vite.config.js`)
- @vitejs/plugin-react 6.0.0 - JSX/Fast Refresh support for Vite

**Linting/Quality:**
- ESLint 9.39.4 - Code linting (`eslint.config.js`)
- @eslint/js 9.39.4 - ESLint JavaScript config
- eslint-plugin-react-hooks 7.0.1 - React Hooks linting rules
- eslint-plugin-react-refresh 0.5.2 - React Fast Refresh validation

## Key Dependencies

**Critical:**
- firebase 12.10.0 - Provides Firestore (real-time database) and app initialization
  - Uses `getFirestore()`, `initializeApp()`, `doc()`, `getDoc()`, `setDoc()` from firebase/firestore and firebase/app

**Infrastructure:**
- @types/react 19.2.14 - TypeScript definitions for React (dev dependency)
- @types/react-dom 19.2.3 - TypeScript definitions for React DOM (dev dependency)
- globals 17.4.0 - Global variable definitions for ESLint

## Configuration

**Environment:**
- Firebase config hardcoded in `src/firebase.js` (contains API key, auth domain, project ID, storage bucket, messaging sender ID, app ID, measurement ID)
- No `.env` file detected; configuration is static

**Build:**
- `vite.config.js` - Minimal Vite config with React plugin enabled
- `eslint.config.js` - Flat ESLint config with React Hooks and Refresh plugins
- `index.html` - Entry HTML document with root div and module script reference
- Font imports via Google Fonts in inline styles: DM Sans (body), Outfit (display)

## Platform Requirements

**Development:**
- Node.js with npm
- Modern browser with ES2020+ support and localStorage API
- Vite dev server (via `npm run dev`)

**Production:**
- Static hosting compatible with Vite output (Firebase Hosting compatible)
- Browser with ES2020+ JavaScript support
- Firebase project with Firestore database configured

## Package Scripts

```bash
npm run dev       # Start Vite dev server
npm run build     # Build for production (vite build)
npm run lint      # Run ESLint linter
npm run preview   # Preview production build locally
```

---

*Stack analysis: 2026-03-15*
