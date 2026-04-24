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
    vi.stubEnv("VITE_TEAM_NAME", "Madeira");

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
    vi.stubEnv("VITE_TEAM_NAME", "Madeira");

    const { GAME_STRUCTURE } = await import("../config.js");

    expect(GAME_STRUCTURE).toBe("halves");
  });

  it("equals 'quarters' when VITE_GAME_STRUCTURE is 'quarters'", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "quarters");
    vi.stubEnv("VITE_TEAM_NAME", "Madeira");

    const { GAME_STRUCTURE } = await import("../config.js");

    expect(GAME_STRUCTURE).toBe("quarters");
  });

  it("normalizes mixed-case values to lowercase ('Halves' → 'halves')", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "Halves");
    vi.stubEnv("VITE_TEAM_NAME", "Madeira");

    const { GAME_STRUCTURE } = await import("../config.js");

    expect(GAME_STRUCTURE).toBe("halves");
  });

  it("falls back to 'halves' when VITE_GAME_STRUCTURE is unset", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_TEAM_NAME", "Madeira");
    // Do not stub VITE_GAME_STRUCTURE — it should be undefined.

    const { GAME_STRUCTURE } = await import("../config.js");

    expect(GAME_STRUCTURE).toBe("halves");
  });

  it("falls back to 'halves' when VITE_GAME_STRUCTURE is an empty string", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "");
    vi.stubEnv("VITE_TEAM_NAME", "Madeira");

    const { GAME_STRUCTURE } = await import("../config.js");

    expect(GAME_STRUCTURE).toBe("halves");
  });

  it("throws an informative error on explicit invalid value ('thirds')", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "thirds");
    vi.stubEnv("VITE_TEAM_NAME", "Madeira");

    await expect(import("../config.js")).rejects.toThrow(
      /Invalid VITE_GAME_STRUCTURE.*halves.*quarters.*thirds/
    );
  });
});

describe("TEAM_NAME", () => {
  it("equals the string set in VITE_TEAM_NAME", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "halves");
    vi.stubEnv("VITE_TEAM_NAME", "Madeira");

    const { TEAM_NAME } = await import("../config.js");

    expect(TEAM_NAME).toBe("Madeira");
  });

  it("supports multi-word team names verbatim (e.g., 'Friend FC')", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "halves");
    vi.stubEnv("VITE_TEAM_NAME", "Friend FC");

    const { TEAM_NAME } = await import("../config.js");

    expect(TEAM_NAME).toBe("Friend FC");
  });

  it("throws when VITE_TEAM_NAME is unset", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "halves");
    // Note: Vite loads .env.local as baseline during tests, so we stub
    // explicitly to undefined to simulate a missing env var.
    vi.stubEnv("VITE_TEAM_NAME", undefined);

    await expect(import("../config.js")).rejects.toThrow(
      /VITE_TEAM_NAME is required/
    );
  });

  it("throws when VITE_TEAM_NAME is an empty string", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "halves");
    vi.stubEnv("VITE_TEAM_NAME", "");

    await expect(import("../config.js")).rejects.toThrow(
      /VITE_TEAM_NAME is required/
    );
  });
});

describe("ROSTER", () => {
  it("is a non-empty array of players with id/name/num", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "halves");
    vi.stubEnv("VITE_TEAM_NAME", "Madeira");

    const { ROSTER } = await import("../config.js");

    expect(Array.isArray(ROSTER)).toBe(true);
    expect(ROSTER.length).toBeGreaterThan(0);
    for (const p of ROSTER) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("num");
      expect(typeof p.name).toBe("string");
      expect(p.name.length).toBeGreaterThan(0);
    }
  });
});

describe("ALLOWED_FORMATIONS", () => {
  it("is a non-empty object whose keys are a subset of the full formation library", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "halves");
    vi.stubEnv("VITE_TEAM_NAME", "Madeira");

    const { ALLOWED_FORMATIONS } = await import("../config.js");
    const { FORMATIONS } = await import("../shared/formations.js");

    const keys = Object.keys(ALLOWED_FORMATIONS);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(key in FORMATIONS).toBe(true);
      expect(Array.isArray(ALLOWED_FORMATIONS[key])).toBe(true);
      expect(ALLOWED_FORMATIONS[key].length).toBeGreaterThanOrEqual(7);
    }
  });

  it("each position entry has label/x/y", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "halves");
    vi.stubEnv("VITE_TEAM_NAME", "Madeira");

    const { ALLOWED_FORMATIONS } = await import("../config.js");
    for (const positions of Object.values(ALLOWED_FORMATIONS)) {
      for (const pos of positions) {
        expect(pos).toHaveProperty("label");
        expect(pos).toHaveProperty("x");
        expect(pos).toHaveProperty("y");
      }
    }
  });
});

describe("DEPLOYMENT", () => {
  it("is the umbrella object with firebase + gameStructure + teamName + roster + formations all populated", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "halves");
    vi.stubEnv("VITE_TEAM_NAME", "Madeira");

    const { DEPLOYMENT, FIREBASE_CONFIG, GAME_STRUCTURE, TEAM_NAME, ROSTER, ALLOWED_FORMATIONS } = await import(
      "../config.js"
    );

    expect(DEPLOYMENT).toBeTypeOf("object");
    expect(DEPLOYMENT.firebase).toBe(FIREBASE_CONFIG);
    expect(DEPLOYMENT.gameStructure).toBe(GAME_STRUCTURE);
    expect(DEPLOYMENT.teamName).toBe(TEAM_NAME);
    expect(DEPLOYMENT.roster).toBe(ROSTER);
    expect(DEPLOYMENT.formations).toBe(ALLOWED_FORMATIONS);
  });

  it("is also exposed as the default export", async () => {
    stubFirebaseEnv();
    vi.stubEnv("VITE_GAME_STRUCTURE", "halves");
    vi.stubEnv("VITE_TEAM_NAME", "Madeira");

    const mod = await import("../config.js");
    expect(mod.default).toBe(mod.DEPLOYMENT);
  });
});
