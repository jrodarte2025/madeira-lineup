import { describe, it, expect } from "vitest";
import {
  PERIOD_COUNT,
  PERIOD_LENGTH_SECONDS,
  INITIAL_ACTIVE_STATUS,
  isActiveStatus,
  isBreakStatus,
  getBreakStatusAfter,
  getNextActiveStatus,
  getNextActiveStatusFromHalftime,
  getActionButtonLabel,
  getHomeTeamCode,
} from "../shared/gameStructure";

describe("constants", () => {
  it("halves has 2 periods of 1800s (30min); quarters has 4 of 720s (12min)", () => {
    expect(PERIOD_COUNT.halves).toBe(2);
    expect(PERIOD_COUNT.quarters).toBe(4);
    expect(PERIOD_LENGTH_SECONDS.halves).toBe(1800);
    expect(PERIOD_LENGTH_SECONDS.quarters).toBe(720);
  });

  it("initial active status is '1st-half' for halves and 'q1' for quarters", () => {
    expect(INITIAL_ACTIVE_STATUS.halves).toBe("1st-half");
    expect(INITIAL_ACTIVE_STATUS.quarters).toBe("q1");
  });
});

describe("isActiveStatus", () => {
  it.each(["1st-half", "2nd-half", "q1", "q2", "q3", "q4"])("%s is active", (s) => {
    expect(isActiveStatus(s)).toBe(true);
  });
  it.each(["halftime", "break-q1", "break-q3", "completed", "scheduled", "", null, undefined, "bogus"])(
    "%s is NOT active",
    (s) => {
      expect(isActiveStatus(s)).toBe(false);
    }
  );
});

describe("isBreakStatus", () => {
  it.each(["halftime", "break-q1", "break-q3"])("%s is break", (s) => {
    expect(isBreakStatus(s)).toBe(true);
  });
  it.each(["1st-half", "q1", "completed", ""])("%s is NOT break", (s) => {
    expect(isBreakStatus(s)).toBe(false);
  });
});

describe("getBreakStatusAfter — halves", () => {
  it("1st-half → halftime", () => {
    expect(getBreakStatusAfter("1st-half", "halves")).toBe("halftime");
  });
  it("2nd-half → null (end game)", () => {
    expect(getBreakStatusAfter("2nd-half", "halves")).toBe(null);
  });
});

describe("getBreakStatusAfter — quarters", () => {
  it("q1 → break-q1", () => {
    expect(getBreakStatusAfter("q1", "quarters")).toBe("break-q1");
  });
  it("q2 → halftime", () => {
    expect(getBreakStatusAfter("q2", "quarters")).toBe("halftime");
  });
  it("q3 → break-q3", () => {
    expect(getBreakStatusAfter("q3", "quarters")).toBe("break-q3");
  });
  it("q4 → null (end game)", () => {
    expect(getBreakStatusAfter("q4", "quarters")).toBe(null);
  });
});

describe("getNextActiveStatus (unambiguous breaks)", () => {
  it("break-q1 → q2", () => {
    expect(getNextActiveStatus("break-q1")).toBe("q2");
  });
  it("break-q3 → q4", () => {
    expect(getNextActiveStatus("break-q3")).toBe("q4");
  });
  it("halftime is ambiguous — returns null, caller must use getNextActiveStatusFromHalftime", () => {
    expect(getNextActiveStatus("halftime")).toBe(null);
  });
});

describe("getNextActiveStatusFromHalftime", () => {
  it("halves → 2nd-half", () => {
    expect(getNextActiveStatusFromHalftime("halves")).toBe("2nd-half");
  });
  it("quarters → q3", () => {
    expect(getNextActiveStatusFromHalftime("quarters")).toBe("q3");
  });
});

describe("getActionButtonLabel — halves", () => {
  it("1st-half → 'End Half'", () => {
    expect(getActionButtonLabel("1st-half", "halves")).toBe("End Half");
  });
  it("halftime → 'Start 2nd Half'", () => {
    expect(getActionButtonLabel("halftime", "halves")).toBe("Start 2nd Half");
  });
  it("2nd-half → 'Full Time!'", () => {
    expect(getActionButtonLabel("2nd-half", "halves")).toBe("Full Time!");
  });
});

describe("getActionButtonLabel — quarters", () => {
  it("q1 → 'End Q1'", () => {
    expect(getActionButtonLabel("q1", "quarters")).toBe("End Q1");
  });
  it("break-q1 → 'Start Q2'", () => {
    expect(getActionButtonLabel("break-q1", "quarters")).toBe("Start Q2");
  });
  it("q2 → 'End Q2'", () => {
    expect(getActionButtonLabel("q2", "quarters")).toBe("End Q2");
  });
  it("halftime → 'Start Q3'", () => {
    expect(getActionButtonLabel("halftime", "quarters")).toBe("Start Q3");
  });
  it("q3 → 'End Q3'", () => {
    expect(getActionButtonLabel("q3", "quarters")).toBe("End Q3");
  });
  it("break-q3 → 'Start Q4'", () => {
    expect(getActionButtonLabel("break-q3", "quarters")).toBe("Start Q4");
  });
  it("q4 → 'Full Time!'", () => {
    expect(getActionButtonLabel("q4", "quarters")).toBe("Full Time!");
  });
});

describe("getHomeTeamCode", () => {
  it("'Madeira' → 'MAD'", () => {
    expect(getHomeTeamCode("Madeira")).toBe("MAD");
  });
  it("'Friend FC' (with space) → 'FRI'", () => {
    expect(getHomeTeamCode("Friend FC")).toBe("FRI");
  });
  it("empty → 'HOM'", () => {
    expect(getHomeTeamCode("")).toBe("HOM");
  });
});
