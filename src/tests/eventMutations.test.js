import { describe, it, expect } from "vitest";
import {
  eventsToStatCountsByPlayer,
  computeSeasonDeltaDiff,
} from "../shared/eventMutations";

const stat = (id, playerId, statKey, half = 1) => ({
  id,
  type: "stat",
  playerId,
  playerName: `P${playerId}`,
  stat: statKey,
  half,
  t: 1_000_000 + id,
});

const sub = (id) => ({
  id,
  type: "sub",
  playerIn: null,
  playerOut: null,
  half: 1,
  t: 1_000_000 + id,
});

describe("eventsToStatCountsByPlayer", () => {
  it("returns empty object for no events", () => {
    expect(eventsToStatCountsByPlayer([])).toEqual({});
  });

  it("ignores non-stat events", () => {
    expect(eventsToStatCountsByPlayer([sub(1), sub(2)])).toEqual({});
  });

  it("counts stat events per player per key", () => {
    const events = [
      stat(1, "p1", "goal"),
      stat(2, "p1", "goal"),
      stat(3, "p1", "assist"),
      stat(4, "p2", "tackle"),
      sub(5),
    ];
    expect(eventsToStatCountsByPlayer(events)).toEqual({
      p1: { goal: 2, assist: 1 },
      p2: { tackle: 1 },
    });
  });

  it("handles skill stat the same as any other", () => {
    const events = [stat(1, "p1", "skill"), stat(2, "p1", "skill")];
    expect(eventsToStatCountsByPlayer(events)).toEqual({ p1: { skill: 2 } });
  });
});

describe("computeSeasonDeltaDiff", () => {
  it("returns empty object when events are identical", () => {
    const events = [stat(1, "p1", "goal"), stat(2, "p2", "assist")];
    expect(computeSeasonDeltaDiff(events, events)).toEqual({});
  });

  it("returns +1 when one event is added", () => {
    const oldEvents = [stat(1, "p1", "goal")];
    const newEvents = [stat(1, "p1", "goal"), stat(2, "p1", "assist")];
    expect(computeSeasonDeltaDiff(oldEvents, newEvents)).toEqual({
      p1: { assist: 1 },
    });
  });

  it("returns -1 when one event is deleted", () => {
    const oldEvents = [stat(1, "p1", "goal"), stat(2, "p1", "assist")];
    const newEvents = [stat(1, "p1", "goal")];
    expect(computeSeasonDeltaDiff(oldEvents, newEvents)).toEqual({
      p1: { assist: -1 },
    });
  });

  it("handles reassignment (same stat, different player) as -1/+1", () => {
    const oldEvents = [stat(1, "p1", "goal")];
    const newEvents = [{ ...stat(1, "p1", "goal"), playerId: "p2", playerName: "P2" }];
    expect(computeSeasonDeltaDiff(oldEvents, newEvents)).toEqual({
      p1: { goal: -1 },
      p2: { goal: 1 },
    });
  });

  it("ignores sub events entirely", () => {
    const oldEvents = [stat(1, "p1", "goal"), sub(2)];
    const newEvents = [stat(1, "p1", "goal"), sub(2), sub(3)];
    expect(computeSeasonDeltaDiff(oldEvents, newEvents)).toEqual({});
  });

  it("handles adding a skill event", () => {
    const oldEvents = [stat(1, "p1", "goal")];
    const newEvents = [stat(1, "p1", "goal"), stat(2, "p1", "skill")];
    expect(computeSeasonDeltaDiff(oldEvents, newEvents)).toEqual({
      p1: { skill: 1 },
    });
  });

  it("returns no entry for a player whose totals did not change", () => {
    const oldEvents = [
      stat(1, "p1", "goal"),
      stat(2, "p2", "assist"),
    ];
    const newEvents = [
      stat(1, "p1", "goal"),
      stat(2, "p2", "assist"),
      stat(3, "p3", "skill"),
    ];
    const diffs = computeSeasonDeltaDiff(oldEvents, newEvents);
    expect(diffs.p1).toBeUndefined();
    expect(diffs.p2).toBeUndefined();
    expect(diffs.p3).toEqual({ skill: 1 });
  });
});
