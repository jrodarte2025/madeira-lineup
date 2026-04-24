import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Tests for the deployment resolver in src/config.js.
 *
 * config.js resolves the active deployment from VITE_DEPLOYMENT_ID at
 * import time. Each test stubs a fresh env, resets module cache, and
 * dynamically imports config to re-evaluate it with the stubbed env.
 */

function stubBaseEnv(overrides = {}) {
  const base = {
    VITE_DEPLOYMENT_ID: "madeira",
    VITE_TEAM_NAME: "Madeira",
    VITE_GAME_STRUCTURE: "halves",
    VITE_FIREBASE_API_KEY: "k",
    VITE_FIREBASE_AUTH_DOMAIN: "d",
    VITE_FIREBASE_PROJECT_ID: "p",
    VITE_FIREBASE_STORAGE_BUCKET: "b",
    VITE_FIREBASE_MESSAGING_SENDER_ID: "s",
    VITE_FIREBASE_APP_ID: "a",
    VITE_FIREBASE_MEASUREMENT_ID: "m",
    ...overrides,
  };
  for (const [k, v] of Object.entries(base)) vi.stubEnv(k, v);
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("deployment resolver — VITE_DEPLOYMENT_ID=madeira", () => {
  it("loads Madeira's 13-player roster with numeric nums", async () => {
    stubBaseEnv({ VITE_DEPLOYMENT_ID: "madeira" });

    const { ROSTER } = await import("../config.js");

    expect(ROSTER).toHaveLength(13);
    expect(ROSTER[0].name).toBe("Alex Rodarte");
    for (const p of ROSTER) {
      expect(typeof p.num).toBe("number");
    }
  });

  it("exposes Madeira's 4 allowed formations", async () => {
    stubBaseEnv({ VITE_DEPLOYMENT_ID: "madeira" });

    const { ALLOWED_FORMATIONS } = await import("../config.js");

    expect(Object.keys(ALLOWED_FORMATIONS).sort()).toEqual(
      ["2-3-3", "3-2-3", "3-3-2", "4-3-1"].sort()
    );
  });

  it("Madeira picker does NOT contain any 7v7 formation (FORM-02 anti-leakage)", async () => {
    stubBaseEnv({ VITE_DEPLOYMENT_ID: "madeira" });

    const { ALLOWED_FORMATIONS } = await import("../config.js");
    const keys = Object.keys(ALLOWED_FORMATIONS);
    for (const sevenV7 of ["2-3-1", "3-2-1", "2-2-2"]) {
      expect(keys).not.toContain(sevenV7);
    }
  });
});

describe("deployment resolver — VITE_DEPLOYMENT_ID=friend", () => {
  it("loads the friend's 11-player roster with num:null for every player", async () => {
    stubBaseEnv({ VITE_DEPLOYMENT_ID: "friend", VITE_TEAM_NAME: "Friend FC", VITE_GAME_STRUCTURE: "quarters" });

    const { ROSTER } = await import("../config.js");

    expect(ROSTER).toHaveLength(11);
    const names = ROSTER.map((p) => p.name);
    expect(names).toContain("Bodhi");
    expect(names).toContain("Cooper");
    for (const p of ROSTER) {
      expect(p.num).toBe(null);
    }
  });

  it("resolves team name and game structure from env for the friend deployment", async () => {
    stubBaseEnv({ VITE_DEPLOYMENT_ID: "friend", VITE_TEAM_NAME: "Friend FC", VITE_GAME_STRUCTURE: "quarters" });

    const { TEAM_NAME, GAME_STRUCTURE } = await import("../config.js");

    expect(TEAM_NAME).toBe("Friend FC");
    expect(GAME_STRUCTURE).toBe("quarters");
  });

  it("exposes the friend's 3 7v7 formations (Phase 9 — FORM-03)", async () => {
    stubBaseEnv({ VITE_DEPLOYMENT_ID: "friend", VITE_TEAM_NAME: "Friend FC", VITE_GAME_STRUCTURE: "quarters" });

    const { ALLOWED_FORMATIONS } = await import("../config.js");

    expect(Object.keys(ALLOWED_FORMATIONS).sort()).toEqual(
      ["2-2-2", "2-3-1", "3-2-1"].sort()
    );
    // Every 7v7 formation has exactly 7 positions
    for (const positions of Object.values(ALLOWED_FORMATIONS)) {
      expect(positions).toHaveLength(7);
    }
  });

  it("friend picker does NOT contain any 9v9 formation (FORM-03 anti-leakage)", async () => {
    stubBaseEnv({ VITE_DEPLOYMENT_ID: "friend", VITE_TEAM_NAME: "Friend FC", VITE_GAME_STRUCTURE: "quarters" });

    const { ALLOWED_FORMATIONS } = await import("../config.js");
    const keys = Object.keys(ALLOWED_FORMATIONS);
    for (const nineV9 of ["3-3-2", "3-2-3", "2-3-3", "4-3-1"]) {
      expect(keys).not.toContain(nineV9);
    }
  });
});

describe("deployment resolver — error cases", () => {
  it("throws when VITE_DEPLOYMENT_ID is unset", async () => {
    stubBaseEnv({ VITE_DEPLOYMENT_ID: undefined });

    await expect(import("../config.js")).rejects.toThrow(
      /VITE_DEPLOYMENT_ID is required/
    );
  });

  it("throws when VITE_DEPLOYMENT_ID is an empty string", async () => {
    stubBaseEnv({ VITE_DEPLOYMENT_ID: "" });

    await expect(import("../config.js")).rejects.toThrow(
      /VITE_DEPLOYMENT_ID is required/
    );
  });

  it("throws when VITE_DEPLOYMENT_ID is an unknown deployment", async () => {
    stubBaseEnv({ VITE_DEPLOYMENT_ID: "bogus" });

    await expect(import("../config.js")).rejects.toThrow(
      /Unknown VITE_DEPLOYMENT_ID: "bogus".*madeira.*friend/
    );
  });
});

describe("deployment resolver — baseline happy path", () => {
  it("with madeira config + halves + VITE_TEAM_NAME=Madeira, TEAM_NAME='Madeira', GAME_STRUCTURE='halves', ALLOWED_FORMATIONS has 4 keys", async () => {
    stubBaseEnv();

    const { TEAM_NAME, GAME_STRUCTURE, ALLOWED_FORMATIONS } = await import("../config.js");

    expect(TEAM_NAME).toBe("Madeira");
    expect(GAME_STRUCTURE).toBe("halves");
    expect(Object.keys(ALLOWED_FORMATIONS)).toHaveLength(4);
  });
});
