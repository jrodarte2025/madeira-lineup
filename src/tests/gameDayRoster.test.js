import { describe, it, expect } from "vitest";
import { computeBench } from "../games/lineupUtils.js";

const roster = [
  { id: "p1", name: "Alice", num: 1 },
  { id: "p2", name: "Bob",   num: 2 },
  { id: "p3", name: "Carol", num: 3 },
  { id: "p4", name: "Dave",  num: 4 },
];

describe("computeBench", () => {
  it("excludes inactiveIds from bench", () => {
    const bench = computeBench(roster, [], ["p1", "p3"]);
    const ids = bench.map((p) => p.id);
    expect(ids).not.toContain("p1");
    expect(ids).not.toContain("p3");
    expect(ids).toContain("p2");
    expect(ids).toContain("p4");
  });

  it("falls back to legacy behavior (no exclusion) when inactiveIds is undefined", () => {
    const bench = computeBench(roster, [], undefined);
    expect(bench).toHaveLength(roster.length);
  });

  it("excludes both assignedIds and inactiveIds from bench", () => {
    // p2 is assigned to field, p1 is inactive — bench should only be p3 and p4
    const bench = computeBench(roster, ["p2"], ["p1"]);
    const ids = bench.map((p) => p.id);
    expect(ids).not.toContain("p1");
    expect(ids).not.toContain("p2");
    expect(ids).toContain("p3");
    expect(ids).toContain("p4");
  });
});
