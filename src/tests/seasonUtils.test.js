import { describe, it, expect } from "vitest";
import { getSeasonId, computeSeasonDeltas } from "../shared/seasonUtils";

// =============================================
// getSeasonId tests
// =============================================
describe("getSeasonId", () => {
  it("maps January through June to spring-YYYY", () => {
    expect(getSeasonId("2026-01-01")).toBe("spring-2026");
    expect(getSeasonId("2026-03-16")).toBe("spring-2026");
    expect(getSeasonId("2026-06-30")).toBe("spring-2026");
  });

  it("maps July through December to fall-YYYY", () => {
    expect(getSeasonId("2026-07-01")).toBe("fall-2026");
    expect(getSeasonId("2026-09-15")).toBe("fall-2026");
    expect(getSeasonId("2026-12-25")).toBe("fall-2026");
  });

  it("returns null for null input", () => {
    expect(getSeasonId(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(getSeasonId(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getSeasonId("")).toBeNull();
  });

  it("returns null for garbage/invalid date strings", () => {
    expect(getSeasonId("garbage")).toBeNull();
    expect(getSeasonId("not-a-date")).toBeNull();
    expect(getSeasonId("2026-13-01")).toBeNull();
  });

  it("returns correct season for ISO timestamp", () => {
    // March 2026 — should be spring-2026
    const result = getSeasonId("2026-03-16T10:00:00.000Z");
    expect(result).toBe("spring-2026");
  });

  it("works across year boundaries", () => {
    expect(getSeasonId("2025-01-15")).toBe("spring-2025");
    expect(getSeasonId("2025-08-20")).toBe("fall-2025");
    expect(getSeasonId("2024-12-31")).toBe("fall-2024");
  });
});

// =============================================
// computeSeasonDeltas tests
// =============================================
describe("computeSeasonDeltas", () => {
  // Helper to build a minimal game object
  function makeGame({ roster, events = [] } = {}) {
    return {
      lineup: {
        roster: roster ?? [
          { id: 1, name: "Alex Rodarte", num: 2 },
          { id: 2, name: "Avery Paulin", num: 6 },
        ],
      },
      events,
    };
  }

  // Helper to build closed player intervals (player was on for the full half)
  function makeIntervals(playerIds, startAt = 0, endAt = 900000) {
    const playerIntervals = {};
    for (const id of playerIds) {
      playerIntervals[id] = [{ inAt: startAt, outAt: endAt }];
    }
    return playerIntervals;
  }

  // Half interval: 0 to 900000 (15 minutes)
  const halfIntervals = [{ startAt: 0, endAt: 900000 }];

  it("returns gamesPlayed:1 and correct minutes for a player who played", () => {
    const game = makeGame();
    const playerIntervals = makeIntervals([1, 2]);
    const deltas = computeSeasonDeltas(game, playerIntervals, halfIntervals);
    expect(deltas[1]).toBeDefined();
    expect(deltas[1].gamesPlayed).toBe(1);
    expect(deltas[1].minutes).toBe(15);
  });

  it("includes stat counts in deltas for player with stats", () => {
    const events = [
      { type: "stat", playerId: 1, stat: "goal" },
      { type: "stat", playerId: 1, stat: "goal" },
      { type: "stat", playerId: 1, stat: "assist" },
    ];
    const game = makeGame({ events });
    const playerIntervals = makeIntervals([1, 2]);
    const deltas = computeSeasonDeltas(game, playerIntervals, halfIntervals);
    expect(deltas[1].goal).toBe(2);
    expect(deltas[1].assist).toBe(1);
    expect(deltas[1].gamesPlayed).toBe(1);
    expect(deltas[1].minutes).toBe(15);
  });

  it("excludes players with 0 minutes AND 0 stats", () => {
    const game = makeGame();
    // Player 2 has no intervals — they didn't play
    const playerIntervals = makeIntervals([1]); // only player 1
    const deltas = computeSeasonDeltas(game, playerIntervals, halfIntervals);
    expect(deltas[1]).toBeDefined();
    expect(deltas[2]).toBeUndefined();
  });

  it("includes player with 0 stats but non-zero minutes", () => {
    const game = makeGame();
    const playerIntervals = makeIntervals([1, 2]);
    const deltas = computeSeasonDeltas(game, playerIntervals, halfIntervals);
    // Player 2 has no stats but was on for 15 minutes
    expect(deltas[2]).toBeDefined();
    expect(deltas[2].gamesPlayed).toBe(1);
    expect(deltas[2].minutes).toBe(15);
    // Should not have any stat keys (goal, assist, etc.)
    expect(deltas[2].goal).toBeUndefined();
  });

  it("excludes players not in roster even if they have events", () => {
    const events = [
      { type: "stat", playerId: 99, stat: "goal" }, // player 99 not in roster
    ];
    const game = makeGame({ events });
    const playerIntervals = makeIntervals([1, 2]);
    const deltas = computeSeasonDeltas(game, playerIntervals, halfIntervals);
    expect(deltas[99]).toBeUndefined();
  });

  it("returns empty object for empty roster with no events", () => {
    const game = makeGame({ roster: [], events: [] });
    const deltas = computeSeasonDeltas(game, {}, halfIntervals);
    expect(deltas).toEqual({});
  });

  it("handles empty events array — only players with minutes get deltas", () => {
    const game = makeGame({ events: [] });
    // Only player 1 has intervals
    const playerIntervals = makeIntervals([1]);
    const deltas = computeSeasonDeltas(game, playerIntervals, halfIntervals);
    expect(Object.keys(deltas)).toHaveLength(1);
    expect(deltas[1]).toBeDefined();
  });

  it("correctly counts multiple stat types for multiple players", () => {
    const events = [
      { type: "stat", playerId: 1, stat: "goal" },
      { type: "stat", playerId: 2, stat: "tackle" },
      { type: "stat", playerId: 2, stat: "tackle" },
      { type: "sub", playerId: 1 }, // non-stat event — should be ignored
    ];
    const game = makeGame({ events });
    const playerIntervals = makeIntervals([1, 2]);
    const deltas = computeSeasonDeltas(game, playerIntervals, halfIntervals);
    expect(deltas[1].goal).toBe(1);
    expect(deltas[1].tackle).toBeUndefined();
    expect(deltas[2].tackle).toBe(2);
    expect(deltas[2].goal).toBeUndefined();
  });

  it("uses string or number player IDs consistently", () => {
    const game = makeGame({
      roster: [{ id: "1", name: "Alex", num: 2 }],
      events: [{ type: "stat", playerId: "1", stat: "goal" }],
    });
    const playerIntervals = { "1": [{ inAt: 0, outAt: 900000 }] };
    const deltas = computeSeasonDeltas(game, playerIntervals, halfIntervals);
    expect(deltas["1"]).toBeDefined();
    expect(deltas["1"].goal).toBe(1);
  });
});
