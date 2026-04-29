import { describe, it, expect } from "vitest";
import { resolveLineupForGame, computeEmptySlotIndices } from "../games/lineupUtils.js";

// ---------------------------------------------------------------------------
// resolveLineupForGame
// ---------------------------------------------------------------------------
describe("resolveLineupForGame", () => {
  const savedLineup = {
    formation: "3-3-2",
    lineup: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"],
    roster: [
      { id: "p1", name: "Alice", num: 1 },
      { id: "p2", name: "Bob",   num: 2 },
    ],
    inactiveIds: ["p1", "p2"],
    name: "My Save",
  };

  it("strips inactiveIds and returns undefined for that field", () => {
    const result = resolveLineupForGame(savedLineup);
    expect(result.inactiveIds).toBeUndefined();
  });

  it("preserves formation, lineup, roster, and name unchanged", () => {
    const result = resolveLineupForGame(savedLineup);
    expect(result.formation).toBe("3-3-2");
    expect(result.lineup).toBe(savedLineup.lineup); // same array reference
    expect(result.roster).toBe(savedLineup.roster);
    expect(result.name).toBe("My Save");
  });

  it("does not mutate the original savedLineup object", () => {
    const input = { ...savedLineup, inactiveIds: ["p1"] };
    resolveLineupForGame(input);
    expect(input.inactiveIds).toEqual(["p1"]);
  });

  it("returns null when called with null (defensive)", () => {
    expect(resolveLineupForGame(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// computeEmptySlotIndices
// ---------------------------------------------------------------------------
describe("computeEmptySlotIndices", () => {
  it("returns indices where the assigned player is in inactiveIds", () => {
    const lineup = ["p1", "p2", "p3", "p2", null];
    const result = computeEmptySlotIndices(lineup, ["p2"]);
    expect(result).toEqual([1, 3]);
  });

  it("returns empty array when no overlap", () => {
    const lineup = ["p1", "p2", "p3"];
    const result = computeEmptySlotIndices(lineup, ["p4"]);
    expect(result).toEqual([]);
  });

  it("returns empty array when inactiveIds is empty", () => {
    const result = computeEmptySlotIndices(["p1", "p2"], []);
    expect(result).toEqual([]);
  });

  it("returns empty array when inactiveIds is undefined", () => {
    const result = computeEmptySlotIndices(["p1", "p2"], undefined);
    expect(result).toEqual([]);
  });

  it("handles null slots in lineup without false positives", () => {
    const result = computeEmptySlotIndices([null, "p1", null], ["p2"]);
    expect(result).toEqual([]);
  });

  it("handles multiple indices for the same player assigned to multiple positions", () => {
    const lineup = ["p1", "p2", "p1", "p3"];
    const result = computeEmptySlotIndices(lineup, ["p1"]);
    expect(result).toEqual([0, 2]);
  });
});
