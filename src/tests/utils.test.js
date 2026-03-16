import { describe, it, expect } from "vitest";
import { getPositionGroup, calcMinutes } from "../shared/utils";

describe("getPositionGroup", () => {
  it("maps GK label to GK group", () => {
    expect(getPositionGroup("GK")).toBe("GK");
    expect(getPositionGroup("gk")).toBe("GK");
  });

  it("maps LB, CB, RB, LCB, RCB to DEF", () => {
    expect(getPositionGroup("LB")).toBe("DEF");
    expect(getPositionGroup("CB")).toBe("DEF");
    expect(getPositionGroup("RB")).toBe("DEF");
    expect(getPositionGroup("LCB")).toBe("DEF");
    expect(getPositionGroup("RCB")).toBe("DEF");
  });

  it("maps LM, CM, RM, LCM, RCM to MID", () => {
    expect(getPositionGroup("LM")).toBe("MID");
    expect(getPositionGroup("CM")).toBe("MID");
    expect(getPositionGroup("RM")).toBe("MID");
    expect(getPositionGroup("LCM")).toBe("MID");
    expect(getPositionGroup("RCM")).toBe("MID");
  });

  it("maps LS, RS, LW, CF, RW, ST to FWD", () => {
    expect(getPositionGroup("LS")).toBe("FWD");
    expect(getPositionGroup("RS")).toBe("FWD");
    expect(getPositionGroup("LW")).toBe("FWD");
    expect(getPositionGroup("CF")).toBe("FWD");
    expect(getPositionGroup("RW")).toBe("FWD");
    expect(getPositionGroup("ST")).toBe("FWD");
  });

  it("defaults unknown labels to MID", () => {
    expect(getPositionGroup("UNKNOWN")).toBe("MID");
    expect(getPositionGroup("")).toBe("MID");
    expect(getPositionGroup(null)).toBe("MID");
    expect(getPositionGroup(undefined)).toBe("MID");
  });
});

describe("calcMinutes", () => {
  it("returns 0 for empty intervals", () => {
    expect(calcMinutes([], [])).toBe(0);
    expect(calcMinutes([], [{ startAt: 0, endAt: 600000 }])).toBe(0);
    expect(calcMinutes([{ inAt: 0, outAt: 600000 }], [])).toBe(0);
  });

  it("calculates minutes for single interval within one half", () => {
    // Player on full 10 minutes of a 25-min half
    const result = calcMinutes(
      [{ inAt: 0, outAt: 600000 }],
      [{ startAt: 0, endAt: 1500000 }]
    );
    expect(result).toBe(10);
  });

  it("uses Date.now() for open intervals", () => {
    const now = Date.now();
    // Player is currently on field; half is currently active
    // They started 2 minutes ago, so result should be >= 2
    const inAt = now - 120000; // 2 minutes ago
    const result = calcMinutes(
      [{ inAt, outAt: null }],
      [{ startAt: inAt, endAt: null }]
    );
    expect(result).toBeGreaterThanOrEqual(2);
    // Should be less than 3 (would need exact 3 minutes)
    expect(result).toBeLessThan(3);
  });

  it("accounts for halftime gap between two halves", () => {
    // Player on for full game: two halves each 25 min, 10 min halftime gap
    // Half 1: 0 to 1500000 (25 min)
    // Halftime gap: 1500000 to 2100000 (10 min)
    // Half 2: 2100000 to 3600000 (25 min)
    const fieldIntervals = [
      { inAt: 0, outAt: 1500000 },       // first half
      { inAt: 2100000, outAt: 3600000 }, // second half
    ];
    const halfIntervals = [
      { startAt: 0, endAt: 1500000 },
      { startAt: 2100000, endAt: 3600000 },
    ];
    const result = calcMinutes(fieldIntervals, halfIntervals);
    expect(result).toBe(50); // 25 + 25 = 50 minutes
  });

  it("accounts for substitution mid-half", () => {
    // Player subbed out at 10 min, subbed back in at 15 min
    // Half is 25 min total
    const fieldIntervals = [
      { inAt: 0, outAt: 600000 },          // 0–10 min = 10 min
      { inAt: 900000, outAt: 1500000 },    // 15–25 min = 10 min
    ];
    const halfIntervals = [
      { startAt: 0, endAt: 1500000 }, // full 25-min half
    ];
    const result = calcMinutes(fieldIntervals, halfIntervals);
    expect(result).toBe(20); // 10 + 10 = 20 minutes
  });

  it("floors to whole minutes", () => {
    // Player on for 7 min 42 sec = 462000ms
    const result = calcMinutes(
      [{ inAt: 0, outAt: 462000 }],
      [{ startAt: 0, endAt: 600000 }]
    );
    expect(result).toBe(7); // floor, not round
  });
});

describe("undo event filtering", () => {
  it("removes event by id from events array", () => {
    const events = [
      { id: "a", type: "goal" },
      { id: "b", type: "sub" },
      { id: "c", type: "goal" },
    ];
    const idToRemove = "b";
    const result = events.filter((e) => e.id !== idToRemove);
    expect(result).toHaveLength(2);
    expect(result.find((e) => e.id === "b")).toBeUndefined();
    expect(result[0].id).toBe("a");
    expect(result[1].id).toBe("c");
  });
});
