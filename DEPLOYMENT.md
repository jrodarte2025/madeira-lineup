# Deployment Guide

This app ships as **per-team deployments**: one codebase → multiple isolated instances, each with its own team name, roster, formations, game structure, and Firebase project. Madeira ships at [madeira-fc-lineups.firebaseapp.com](https://madeira-fc-lineups.firebaseapp.com); the friend's team will ship at its own Firebase URL once provisioned.

This doc is the runbook for (a) deploying an existing instance and (b) spinning up a brand-new one.

---

## What a deployment is

A deployment is a `(bundle, Firebase project)` pair. Everything per-team is config — no code branching beyond reading `VITE_DEPLOYMENT_ID` at Vite build time.

| Concept | Source |
|---|---|
| Team name | `VITE_TEAM_NAME` in the deployment's env file |
| Firebase credentials | `VITE_FIREBASE_*` in the deployment's env file |
| Roster | `src/deployments/<id>.js` `ROSTER` export |
| Allowed formations | `src/deployments/<id>.js` `ALLOWED_FORMATION_KEYS` export |
| Game structure | `VITE_GAME_STRUCTURE` (`halves` or `quarters`) |
| Firestore data | The deployment's own Firebase project — isolated from other instances |

Registered deployments (as of v3.0):

- **madeira** — Madeira FC, 9v9, halves, 13-player roster
- **friend** — Friend FC, 7v7, quarters, 11-player roster (placeholder Firebase project until Jim provisions the real one)

---

## Prerequisites

One-time setup on any machine that deploys:

1. **Firebase CLI** — `npm install -g firebase-tools` (or via Homebrew)
2. **Log in** — `firebase login` (opens browser, Google auth)
3. **Node 20+, npm** — for `npm run build:*`
4. **Repo clone + `npm install`** — standard

---

## Deploy an existing deployment

### Madeira (default)

```bash
firebase use madeira       # switches target to madeira-fc-lineups
npm run deploy             # builds + deploys hosting
```

`firebase use madeira` is optional when `default` is already madeira (which it is in this repo's `.firebaserc`) — but making it explicit is a good habit once the friend alias exists, so you never push the wrong bundle.

To push Firestore rule changes only:

```bash
firebase use madeira
npm run deploy:rules
```

### Friend FC (once the Firebase project exists)

```bash
firebase use friend        # switches target to friend's project
npm run deploy:friend      # builds friend bundle + deploys
```

**Important:** `npm run deploy:friend` only builds the friend bundle; it deploys to whichever Firebase project `firebase use` has selected. Always `firebase use friend` first, or the friend bundle gets uploaded to Madeira's hosting (bad). Reverse is equally bad.

Make it muscle memory:

```
firebase use <alias> && npm run deploy[:<alias>]
```

### Sanity check before deploy

Before any deploy, confirm which project you're aimed at:

```bash
firebase projects:list        # shows auth status across projects
firebase use                  # prints the current alias
```

---

## First-time spin up of the friend's team (Jim's runbook)

Prerequisite: the app's code + the friend deployment fixture (`src/deployments/friend.js`) is already in place. The placeholder Firebase creds in `.env.friend.local` need to be replaced with a real project. Steps:

### 1. Create the Firebase project

1. Go to https://console.firebase.google.com, click **Add project**.
2. Name it something durable — e.g., `<friend-team-name>-lineups` (snake-case is fine).
3. Disable Google Analytics unless you want it (we don't use it in this app).
4. Wait for project creation to finish.

### 2. Enable Firestore

1. In the project console, left sidebar → **Build → Firestore Database**.
2. Click **Create database**.
3. Start in **production mode** (we'll deploy our own rules). Region: pick one near your users (e.g., `us-central` or `us-east`).
4. Done — no manual rule edits. `npm run deploy:rules` will push the rules from this repo.

### 3. Enable Hosting

1. Left sidebar → **Build → Hosting**.
2. Click **Get started**. You don't need to run the install-wizard steps here because the repo is already set up — just click through to finish initialization and land on the Hosting dashboard.

### 4. Register a web app and copy credentials

1. Project Settings (gear icon, top left) → **General** tab.
2. Scroll to **Your apps** → click the `</>` (Web) icon.
3. Register app — name can match the team.
4. Firebase will show a `firebaseConfig` object. **Copy its values.**

### 5. Paste credentials into this repo

Edit `.env.friend.local` (gitignored — don't commit). Replace the Phase-8 placeholder values with the real ones from step 4:

```
VITE_DEPLOYMENT_ID=friend
VITE_TEAM_NAME=Friend FC            # or whatever the friend's team is actually called
VITE_GAME_STRUCTURE=quarters

VITE_FIREBASE_API_KEY=AIza…         # from firebaseConfig
VITE_FIREBASE_AUTH_DOMAIN=<proj>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<proj>
VITE_FIREBASE_STORAGE_BUCKET=<proj>.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=…
VITE_FIREBASE_APP_ID=1:…:web:…
VITE_FIREBASE_MEASUREMENT_ID=G-…    # leave as G-PLACEHOLDER if Analytics off
```

Also update `.firebaserc` — replace `YOUR-FRIEND-PROJECT-ID` with the real Firebase project id from step 1:

```json
{
  "projects": {
    "default": "madeira-fc-lineups",
    "madeira": "madeira-fc-lineups",
    "friend": "<friend-project-id>"
  }
}
```

### 6. Set hosting site name (optional but recommended)

By default Firebase gives you `<project-id>.firebaseapp.com`. If you want a friendlier URL like `friend-fc.web.app`:

1. Firebase Console → Hosting → **Add custom domain** (for a real custom domain like `friendfc.com`)
2. Or just use the default — `<project-id>.web.app` is perfectly fine for launch

### 7. First deploy

```bash
firebase use friend
npm run deploy:rules      # push Firestore rules first (one-time)
npm run deploy:friend     # build + push hosting bundle
```

Firebase CLI will print the hosting URL. Open it.

### 8. Smoke test the friend instance

In an **incognito window** (to avoid Madeira localStorage leakage during testing):

- [ ] Header shows "FRIEND FC" (or whatever the team name is)
- [ ] Home-score label is the 3-letter code of the team name
- [ ] Roster strip shows 11 players, name-only (blank number circles — num is null for all 11 until the coach fills them in via the roster edit UI)
- [ ] Formation picker shows **3** options: 2-3-1, 3-2-1, 2-2-2
- [ ] Drag a player to a field position — the position label shows centered in the circle (because no jersey number)
- [ ] Click Print — preview has "FRIEND FC" header; player chips render name-only
- [ ] Create a new game → roster loads the 11 friend players
- [ ] Start the game → clock shows **12:00** counting down (not 30:00)
- [ ] Click "End Q1" → clock shows **Q1** (break marker); button changes to "Start Q2"
- [ ] Click "Start Q2" → clock runs again; button shows "End Q2"
- [ ] Continue through Q2 → button becomes "Start Q3" at halftime
- [ ] ... through Q4 where the button reads "Full Time!" → tap → summary screen renders
- [ ] Summary shows per-player minutes (should sum to ≤ 48min per player total)
- [ ] Stats tab (season dashboard) shows the completed game
- [ ] DevTools → Application → Firestore → writes went to the friend's project (not Madeira's)

### 9. Final: confirm Madeira still works

Open [madeira-fc-lineups.firebaseapp.com](https://madeira-fc-lineups.firebaseapp.com) (or wherever Madeira is hosted) in a fresh window:

- [ ] Header says "MADEIRA FC"
- [ ] 13-player roster with real jersey numbers
- [ ] 4 formation options (9v9)
- [ ] Clock runs 30:00 per half
- [ ] Everything looks identical to pre-v3.0 — no visible differences

If anything looks off, see Troubleshooting below.

---

## Spin up a third team (or fourth, etc.)

The pattern is the same as the friend spin-up but you're also adding a new deployment fixture to the codebase.

### 1. Add the deployment fixture

Create `src/deployments/<new-id>.js`:

```js
export const ROSTER = [
  { id: 201, name: "Player One", num: null },
  // ...
];

export const ALLOWED_FORMATION_KEYS = ["2-3-1", "3-2-1"]; // pick subset of library
```

Player ids should be disjoint from existing deployments (madeira: 1-13, friend: 101-111 — third team could use 201-299).

### 2. Register in the config

Edit `src/config.js` — add the import + registry entry:

```js
import * as newTeamDeployment from "./deployments/<new-id>";

const DEPLOYMENTS = {
  madeira: madeiraDeployment,
  friend: friendDeployment,
  "<new-id>": newTeamDeployment,
};
```

### 3. Env file, Firebase project, scripts, deploy

Repeat the friend-spin-up steps 1–7 but for the new team. Add parallel `dev:<new-id>`, `build:<new-id>`, `deploy:<new-id>` scripts to `package.json` following the friend pattern.

### 4. Add alias to `.firebaserc`

```json
{
  "projects": {
    "default": "madeira-fc-lineups",
    "madeira": "madeira-fc-lineups",
    "friend": "...",
    "<new-id>": "<new-firebase-project-id>"
  }
}
```

### 5. Add tests

Extend `src/tests/deployment-resolver.test.js` with shape assertions for the new deployment (roster size, allowed-formation count).

### 6. First deploy

```bash
firebase use <new-id>
npm run deploy:rules
npm run deploy:<new-id>
```

---

## Operate

### Push a hosting update (new feature, bugfix)

```bash
firebase use <alias>
npm run deploy[:<alias>]
```

Do this for each active deployment when a change should roll out to all teams. (For a Madeira-only fix, only deploy to madeira. For shared code changes, deploy to every active target — one at a time.)

### Push a Firestore rule change

Edit `firestore.rules`, then:

```bash
firebase use <alias>
npm run deploy:rules
```

Same rules file ships to every project since the app's access model is the same across instances (open rules, no auth).

### Rollback

Firebase Hosting keeps the last ~10 releases. Go to Hosting console → **History** → click the release you want → **Rollback**. No code changes or rebuild needed.

For a Firestore rules rollback, edit `firestore.rules` back to the prior version and re-run `npm run deploy:rules`.

### View runtime errors / logs

Firestore operations are on the client. Use the browser DevTools Console on the live site. The only server-side piece is Firestore itself — check the Firebase Console → Firestore → Usage tab for errors (permission denied, quota exceeded, etc.).

### Environment variables

All env vars are **build-time**, not runtime. Vite inlines them into the emitted JS bundle. To change a value:

1. Edit the appropriate env file (`.env.local` for madeira; `.env.<id>.local` for others)
2. Rebuild + redeploy — `npm run deploy[:<alias>]`

There's no "update an env var without redeploying" path.

---

## Known limitations (v3.0)

Deferred items that don't block the friend from using the app but are worth knowing:

| Item | Deferred to | Notes |
|---|---|---|
| PWA manifest name hardcoded "Madeira FC Game Hub" | v3.1 | Cosmetic; affects home-screen install name |
| `index.html` title hardcoded | v3.1 | Cosmetic; affects browser tab text |
| `public/madeira-fc-logo.png` filename + referenced by non-Madeira deployments too | v3.1 | Friend deployment currently shows the Madeira logo. Ship a friend logo + deployment-specific logo path to fix |
| `madeira_*` localStorage key prefix | v3.1 | If two deployments end up on the same origin (impossible with distinct Firebase Hosting URLs), localStorage state would collide. Not a practical issue with separate `.web.app` URLs |
| 8-segment pre-built quarter lineups (Q1/Q1.5/Q2/Q2.5/...) | v3.1 | Current MVP: one starting lineup, tap-to-sub during play |
| Auto mid-quarter swap at 6:00 | v3.1 | MVP uses manual tap-to-sub |
| EventEditor post-game halves-only picker | v3.1 | Quarters events with half=3/4 bucket into the editor's h1 group. Doesn't affect stat totals (summaryUtils intersects halfIntervals) |

---

## Troubleshooting

### "Unknown VITE_DEPLOYMENT_ID" error in browser console / build fails

You likely didn't set `VITE_DEPLOYMENT_ID` in the env file, or set it to a value that isn't registered in `src/config.js` DEPLOYMENTS. Check:
1. `cat .env.<id>.local` — confirm `VITE_DEPLOYMENT_ID=<id>`
2. `grep DEPLOYMENTS src/config.js` — confirm `<id>` is a key

### "VITE_TEAM_NAME is required" on build

The env file is missing or doesn't have `VITE_TEAM_NAME=...`. See the env-file template at `.env.friend.local.example`.

### Deploy went to the wrong Firebase project

Happens when `firebase use <alias>` wasn't run before `npm run deploy`. To recover:
1. In the Firebase Hosting console, roll back to the previous release
2. `firebase use <correct-alias>` and redeploy the correct bundle

### Friend bundle contains Madeira Firebase credentials

Something cross-contaminated. Run `rm -rf dist && npm run build:friend` to rebuild cleanly. Grep the bundle to confirm — `grep "madeira-fc-lineups" dist/assets/*.js` should return 0 hits. If it doesn't:
1. Check `.env.friend.local` doesn't have any Madeira values
2. Check `.env.local` doesn't have `VITE_DEPLOYMENT_ID=friend` (it should say madeira)

### Firestore writes fail with permission-denied on a new deployment

`firestore.rules` hasn't been deployed to the new project yet. Run:

```bash
firebase use <alias>
npm run deploy:rules
```

### Need to reset a deployment's data

Firebase Console → Firestore → delete collections manually. Or from CLI:

```bash
firebase use <alias>
firebase firestore:delete --all-collections  # careful — irreversible
```

### Firebase CLI says "you are not logged in"

```bash
firebase logout
firebase login
```

---

## Quick reference

```bash
# Deploy to Madeira
firebase use madeira && npm run deploy

# Deploy to friend
firebase use friend && npm run deploy:friend

# Push rule changes (to whichever project is `firebase use`d)
npm run deploy:rules

# Dev server
npm run dev            # Madeira
npm run dev:friend     # friend (uses .env.friend.local; Firestore writes will fail against placeholder project)

# Build only (no deploy)
npm run build          # Madeira → dist/
npm run build:friend   # friend → dist/

# Preview a built bundle
npm run preview
npm run preview:friend

# Run tests
npm test
npx vitest run
```

---

*Last updated: 2026-04-24 (Phase 11, v3.0 milestone)*
