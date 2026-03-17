import { describe, it, expect } from "vitest";
import { buildSummaryRows, buildCSV, getTopMVPs, formatMVPStats } from "../shared/summaryUtils";

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const BASE_TIME = 1000000; // arbitrary epoch ms

const mockRoster = [
  { id: 1, name: "Alice Johnson", num: 10 },
  { id: 2, name: "Beth Smith", num: 7 },
  { id: 3, name: "Carol Davis", num: 4 },
  { id: 4, name: "Diana Prince", num: 9 },
  { id: 5, name: "Eve Williams", num: 3 },
];

// Half 1: BASE_TIME to BASE_TIME+1800000 (30 min)
// Half 2: BASE_TIME+2400000 to BASE_TIME+4200000 (30 min)
const mockHalfIntervals = [
  { startAt: BASE_TIME, endAt: BASE_TIME + 1800000 },
  { startAt: BASE_TIME + 2400000, endAt: BASE_TIME + 4200000 },
];

// Alice: full game (60 min)
// Beth: subbed off at 15 min of 1st half, back for 2nd half (45 min)
// Carol: only 2nd half (30 min)
// Diana: full game (60 min)
// Eve: never played (0 min)
const mockPlayerIntervals = {
  1: [
    { inAt: BASE_TIME, outAt: BASE_TIME + 1800000 },
    { inAt: BASE_TIME + 2400000, outAt: BASE_TIME + 4200000 },
  ],
  2: [
    { inAt: BASE_TIME, outAt: BASE_TIME + 900000 },
    { inAt: BASE_TIME + 2400000, outAt: BASE_TIME + 4200000 },
  ],
  3: [
    { inAt: BASE_TIME + 2400000, outAt: BASE_TIME + 4200000 },
  ],
  4: [
    { inAt: BASE_TIME, outAt: BASE_TIME + 1800000 },
    { inAt: BASE_TIME + 2400000, outAt: BASE_TIME + 4200000 },
  ],
  5: [],
};

const mockEvents = [
  { id: "e1", type: "stat", playerId: 1, playerName: "A. Johnson", stat: "goal", half: 1, t: BASE_TIME + 100000 },
  { id: "e2", type: "stat", playerId: 1, playerName: "A. Johnson", stat: "goal", half: 2, t: BASE_TIME + 2500000 },
  { id: "e3", type: "stat", playerId: 1, playerName: "A. Johnson", stat: "assist", half: 1, t: BASE_TIME + 200000 },
  { id: "e4", type: "stat", playerId: 4, playerName: "D. Prince", stat: "goal", half: 1, t: BASE_TIME + 300000 },
  { id: "e5", type: "stat", playerId: 4, playerName: "D. Prince", stat: "tackle", half: 2, t: BASE_TIME + 2600000 },
  { id: "e6", type: "stat", playerId: 2, playerName: "B. Smith", stat: "save", half: 1, t: BASE_TIME + 400000 },
  { id: "sub1", type: "sub", playerIn: { id: 3 }, playerOut: { id: 2 }, half: 1, t: BASE_TIME + 900000 },
];

const mockGame = {
  id: "game1",
  opponent: "Rival FC",
  date: "2026-03-16",
  score: { home: 3, away: 1 },
  lineup: { roster: mockRoster },
  playerIntervals: mockPlayerIntervals,
  halfIntervals: mockHalfIntervals,
  events: mockEvents,
};

// ---------------------------------------------------------------------------
// buildSummaryRows tests
// ---------------------------------------------------------------------------
describe("buildSummaryRows", () => {
  it("returns rows, activeCols, and totals", () => {
    const result = buildSummaryRows(mockGame);
    expect(result).toHaveProperty("rows");
    expect(result).toHaveProperty("activeCols");
    expect(result).toHaveProperty("totals");
  });

  it("includes all rostered players even with 0 minutes", () => {
    const { rows } = buildSummaryRows(mockGame);
    const playerIds = rows.map((r) => r.player.id);
    for (const p of mockRoster) {
      expect(playerIds).toContain(p.id);
    }
    expect(rows).toHaveLength(5);
  });

  it("sorts rows by minutes descending", () => {
    const { rows } = buildSummaryRows(mockGame);
    for (let i = 0; i < rows.length - 1; i++) {
      expect(rows[i].mins).toBeGreaterThanOrEqual(rows[i + 1].mins);
    }
  });

  it("computes correct minutes for each player", () => {
    const { rows } = buildSummaryRows(mockGame);
    const alice = rows.find((r) => r.player.id === 1);
    const beth = rows.find((r) => r.player.id === 2);
    const carol = rows.find((r) => r.player.id === 3);
    const eve = rows.find((r) => r.player.id === 5);

    expect(alice.mins).toBe(60);
    expect(beth.mins).toBe(45); // 15 + 30
    expect(carol.mins).toBe(30);
    expect(eve.mins).toBe(0);
  });

  it("activeCols only includes stats that appear at least once in events", () => {
    const { activeCols } = buildSummaryRows(mockGame);
    // These stats appear: goal, assist, tackle, save
    expect(activeCols).toContain("goal");
    expect(activeCols).toContain("assist");
    expect(activeCols).toContain("tackle");
    expect(activeCols).toContain("save");
    // These stats do NOT appear in mockEvents
    expect(activeCols).not.toContain("clearance");
    expect(activeCols).not.toContain("block");
    expect(activeCols).not.toContain("interception");
  });

  it("counts per-player stats correctly", () => {
    const { rows } = buildSummaryRows(mockGame);
    const alice = rows.find((r) => r.player.id === 1);
    const diana = rows.find((r) => r.player.id === 4);
    const eve = rows.find((r) => r.player.id === 5);

    expect(alice.stats.goal).toBe(2);
    expect(alice.stats.assist).toBe(1);
    expect(diana.stats.goal).toBe(1);
    expect(diana.stats.tackle).toBe(1);
    // Eve has no stats recorded
    expect(eve.stats.goal ?? 0).toBe(0);
  });

  it("totals.stats sums each active column across all players", () => {
    const { activeCols, totals } = buildSummaryRows(mockGame);
    // goals: alice(2) + diana(1) = 3
    expect(totals.stats.goal).toBe(3);
    // assists: alice(1) = 1
    expect(totals.stats.assist).toBe(1);
    // tackles: diana(1) = 1
    expect(totals.stats.tackle).toBe(1);
    // saves: beth(1) = 1
    expect(totals.stats.save).toBe(1);
    // Verify all activeCols have totals
    for (const col of activeCols) {
      expect(totals.stats).toHaveProperty(col);
    }
  });

  it("ignores non-stat events (sub events) when counting stats", () => {
    const { rows } = buildSummaryRows(mockGame);
    // sub events should not increment any stat counts
    const total = rows.reduce((sum, r) => {
      return sum + Object.values(r.stats).reduce((s, v) => s + v, 0);
    }, 0);
    // Only 6 stat events in mockEvents
    expect(total).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// buildCSV tests
// ---------------------------------------------------------------------------
describe("buildCSV", () => {
  it("returns a non-empty string", () => {
    const { rows, activeCols } = buildSummaryRows(mockGame);
    const csv = buildCSV(rows, activeCols, mockGame);
    expect(typeof csv).toBe("string");
    expect(csv.length).toBeGreaterThan(0);
  });

  it("includes a header row with Player, Minutes, and active stat columns", () => {
    const { rows, activeCols } = buildSummaryRows(mockGame);
    const csv = buildCSV(rows, activeCols, mockGame);
    const lines = csv.split("\n");
    const header = lines[0];
    expect(header).toContain("Player");
    expect(header).toContain("Minutes");
    // Active stat cols should use STAT_LABELS display names
    // e.g. "goal" -> "Goal"
    expect(header).toContain("Goal");
    expect(header).toContain("Assist");
  });

  it("includes a TEAM TOTALS row at the bottom", () => {
    const { rows, activeCols } = buildSummaryRows(mockGame);
    const csv = buildCSV(rows, activeCols, mockGame);
    expect(csv).toContain("TEAM TOTALS");
  });

  it("has correct number of data rows (one per player + header + totals)", () => {
    const { rows, activeCols } = buildSummaryRows(mockGame);
    const csv = buildCSV(rows, activeCols, mockGame);
    const lines = csv.trim().split("\n");
    // header + 5 players + TEAM TOTALS = 7
    expect(lines).toHaveLength(7);
  });

  it("escapes player names containing commas via JSON.stringify", () => {
    // Use a single-word name with a comma embedded, which abbreviateName returns unchanged
    // (abbreviateName returns name unchanged if only one part)
    const gameWithCommaName = {
      ...mockGame,
      lineup: {
        roster: [{ id: 99, name: "Smith,Jr", num: 1 }],
      },
      playerIntervals: { 99: [{ inAt: BASE_TIME, outAt: BASE_TIME + 600000 }] },
      events: [],
    };
    const { rows, activeCols } = buildSummaryRows(gameWithCommaName);
    const csv = buildCSV(rows, activeCols, gameWithCommaName);
    // Name with comma should be quoted in CSV output
    expect(csv).toContain('"');
  });

  it("escapes player names containing quotes", () => {
    const gameWithQuoteName = {
      ...mockGame,
      lineup: {
        roster: [{ id: 88, name: 'O\'Brien "The Striker"', num: 5 }],
      },
      playerIntervals: { 88: [{ inAt: BASE_TIME, outAt: BASE_TIME + 600000 }] },
      events: [],
    };
    const { rows, activeCols } = buildSummaryRows(gameWithQuoteName);
    const csv = buildCSV(rows, activeCols, gameWithQuoteName);
    // Should not throw and should contain escaped content
    expect(typeof csv).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// getTopMVPs tests
// ---------------------------------------------------------------------------
describe("getTopMVPs", () => {
  it("returns top 3 players by total stat event count", () => {
    const mvps = getTopMVPs(mockGame);
    expect(mvps).toHaveLength(3);
  });

  it("first MVP has the most total stat events", () => {
    const mvps = getTopMVPs(mockGame);
    // Alice: 3 events (2 goals + 1 assist) — most
    expect(mvps[0].player.id).toBe(1);
    expect(mvps[0].total).toBe(3);
  });

  it("filters out players with 0 total stat events", () => {
    const mvps = getTopMVPs(mockGame);
    const ids = mvps.map((m) => m.player.id);
    // Eve (id=5) has no stats — should not appear
    expect(ids).not.toContain(5);
  });

  it("handles fewer than 3 players with stats gracefully", () => {
    const sparseGame = {
      ...mockGame,
      events: [
        { id: "x1", type: "stat", playerId: 1, stat: "goal", half: 1, t: BASE_TIME },
      ],
    };
    const mvps = getTopMVPs(sparseGame);
    expect(mvps).toHaveLength(1);
  });

  it("breaks ties alphabetically by player name (ascending)", () => {
    // Give two players equal stat counts; lower name alphabetically should come first
    const tieGame = {
      ...mockGame,
      events: [
        { id: "t1", type: "stat", playerId: 1, stat: "goal", half: 1, t: BASE_TIME },
        { id: "t2", type: "stat", playerId: 4, stat: "goal", half: 1, t: BASE_TIME },
      ],
    };
    const mvps = getTopMVPs(tieGame);
    expect(mvps).toHaveLength(2);
    // Alice Johnson (1) vs Diana Prince (4) — "Alice" < "Diana" alphabetically
    expect(mvps[0].player.id).toBe(1);
    expect(mvps[1].player.id).toBe(4);
  });

  it("respects count parameter", () => {
    const mvps = getTopMVPs(mockGame, 2);
    expect(mvps).toHaveLength(2);
  });

  it("each entry has player, stats, and total properties", () => {
    const mvps = getTopMVPs(mockGame);
    for (const m of mvps) {
      expect(m).toHaveProperty("player");
      expect(m).toHaveProperty("stats");
      expect(m).toHaveProperty("total");
      expect(typeof m.total).toBe("number");
    }
  });
});

// ---------------------------------------------------------------------------
// formatMVPStats tests
// ---------------------------------------------------------------------------
describe("formatMVPStats", () => {
  it("formats goals as G", () => {
    expect(formatMVPStats({ goal: 2 })).toContain("2G");
  });

  it("formats assists as A", () => {
    expect(formatMVPStats({ assist: 1 })).toContain("1A");
  });

  it("formats shot_on_target as SOT", () => {
    expect(formatMVPStats({ shot_on_target: 3 })).toContain("3SOT");
  });

  it("formats great_pass as GP", () => {
    expect(formatMVPStats({ great_pass: 2 })).toContain("2GP");
  });

  it("formats save as Sv", () => {
    expect(formatMVPStats({ save: 4 })).toContain("4Sv");
  });

  it("formats tackle as T", () => {
    expect(formatMVPStats({ tackle: 1 })).toContain("1T");
  });

  it("formats clearance as CL", () => {
    expect(formatMVPStats({ clearance: 2 })).toContain("2CL");
  });

  it("formats block as Blk", () => {
    expect(formatMVPStats({ block: 1 })).toContain("1Blk");
  });

  it("formats interception as Int", () => {
    expect(formatMVPStats({ interception: 2 })).toContain("2Int");
  });

  it("formats fifty_fifty as 50/50", () => {
    expect(formatMVPStats({ fifty_fifty: 3 })).toContain("350/50");
  });

  it("formats distribution as Dist", () => {
    expect(formatMVPStats({ distribution: 1 })).toContain("1Dist");
  });

  it("omits stats with 0 count", () => {
    const result = formatMVPStats({ goal: 2, assist: 0, tackle: 1 });
    expect(result).toContain("2G");
    expect(result).toContain("1T");
    expect(result).not.toContain("0A");
    expect(result).not.toContain("A");
  });

  it("produces multi-stat string like '2G 1A 1SOT'", () => {
    const result = formatMVPStats({ goal: 2, assist: 1, shot_on_target: 1 });
    expect(result).toBe("2G 1A 1SOT");
  });

  it("returns empty string when no stats", () => {
    expect(formatMVPStats({})).toBe("");
    expect(formatMVPStats({ goal: 0, assist: 0 })).toBe("");
  });
});
