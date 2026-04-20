import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Tests for src/config.js — the per-deployment config module.
 *
 * config.js reads env vars at import time via `import.meta.env.VITE_*`.
 * We use `vi.stubEnv()` + `vi.resetModules()` to isolate each test's view
 * of the env so we can verify default/normalization behavior.
 */

const FIREBASE_ENV = {
  VITE_FIREBASE_API_KEY: "test-api-key",
  VITE_FIREBASE_AUTH_DOMAIN: "test-project.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "test-project",
  VITE_FIREBASE_STORAGE_BUCKET: "test-project.appspot.com",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "111111111111",
  VITE_FIREBASE_APP_ID: "1:111111111111:web:abcdef123456",
  VITE_FIREBASE_MEASUREMENT_ID: "G-TESTMEAS01",
};

function stubFirebaseEnv() {
  for (const [key, val] of Object.entries(FIREBASE_ENV)) {
    vi.stubEnv(key, val);
  }
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("FIREBASE_CONFIG", () => {
  it("exposes all 7 Firebase keys as non-empty strings when VITE_FIREBASE_* vars are set", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "halves");

    const { FIREBASE_CONFIG } = await import("../config.js");

    expect(FIREBASE_CONFIG).toBeTypeOf("object");
    expect(FIREBASE_CONFIG.apiKey).toBe("test-api-key");
    expect(FIREBASE_CONFIG.authDomain).toBe("test-project.firebaseapp.com");
    expect(FIREBASE_CONFIG.projectId).toBe("test-project");
    expect(FIREBASE_CONFIG.storageBucket).toBe("test-project.appspot.com");
    expect(FIREBASE_CONFIG.messagingSenderId).toBe("111111111111");
    expect(FIREBASE_CONFIG.appId).toBe("1:111111111111:web:abcdef123456");
    expect(FIREBASE_CONFIG.measurementId).toBe("G-TESTMEAS01");

    for (const key of [
      "apiKey",
      "authDomain",
      "projectId",
      "storageBucket",
      "messagingSenderId",
      "appId",
      "measurementId",
    ]) {
      expect(typeof FIREBASE_CONFIG[key]).toBe("string");
      expect(FIREBASE_CONFIG[key].length).toBeGreaterThan(0);
    }
  });
});

describe("GAME_STRUCTURE", () => {
  it("equals 'halves' when VITE_GAME_STRUCTURE is 'halves'", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "halves");

    const { GAME_STRUCTURE } = await import("../config.js");

    expect(GAME_STRUCTURE).toBe("halves");
  });

  it("equals 'quarters' when VITE_GAME_STRUCTURE is 'quarters'", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "quarters");

    const { GAME_STRUCTURE } = await import("../config.js");

    expect(GAME_STRUCTURE).toBe("quarters");
  });

  it("normalizes mixed-case values to lowercase ('Halves' → 'halves')", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "Halves");

    const { GAME_STRUCTURE } = await import("../config.js");

    expect(GAME_STRUCTURE).toBe("halves");
  });

  it("falls back to 'halves' when VITE_GAME_STRUCTURE is unset", async () => {
    stubFirebaseEnv();
    // Do not stub VITE_GAME_STRUCTURE — it should be undefined.

    const { GAME_STRUCTURE } = await import("../config.js");

    expect(GAME_STRUCTURE).toBe("halves");
  });

  it("falls back to 'halves' when VITE_GAME_STRUCTURE is an empty string", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "");

    const { GAME_STRUCTURE } = await import("../config.js");

    expect(GAME_STRUCTURE).toBe("halves");
  });

  it("throws an informative error on explicit invalid value ('thirds')", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "thirds");

    await expect(import("../config.js")).rejects.toThrow(
      /Invalid VITE_GAME_STRUCTURE.*halves.*quarters.*thirds/
    );
  });
});

describe("DEPLOYMENT", () => {
  it("is the umbrella object with firebase + gameStructure populated and teamName/roster/formations as reserved placeholders", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "halves");

    const { DEPLOYMENT, FIREBASE_CONFIG, GAME_STRUCTURE } = await import(
      "../config.js"
    );

    expect(DEPLOYMENT).toBeTypeOf("object");
    expect(DEPLOYMENT.firebase).toBe(FIREBASE_CONFIG);
    expect(DEPLOYMENT.gameStructure).toBe(GAME_STRUCTURE);

    // Reserved placeholder slots — filled by 08-02 (teamName) and 08-03
    // (roster, formations). Keys MUST exist so later plans don't restructure imports.
    expect("teamName" in DEPLOYMENT).toBe(true);
    expect("roster" in DEPLOYMENT).toBe(true);
    expect("formations" in DEPLOYMENT).toBe(true);
    expect(DEPLOYMENT.teamName).toBeUndefined();
    expect(DEPLOYMENT.roster).toBeUndefined();
    expect(DEPLOYMENT.formations).toBeUndefined();
  });

  it("is also exposed as the default export", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "halves");

    const mod = await import("../config.js");
    expect(mod.default).toBe(mod.DEPLOYMENT);
  });
});
