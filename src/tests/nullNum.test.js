import { describe, it, expect } from "vitest";
import { formatJerseyNum } from "../shared/utils";

/**
 * Tests for formatJerseyNum (src/shared/utils.js).
 *
 * Contract:
 *   - null/undefined/"" → null (caller should not render the number element)
 *   - 0                 → "0"  (0 is a valid jersey number)
 *   - numeric or string → String(num)
 *
 * Downstream render sites (MadeiraLineupPlanner, SharedLineupView,
 * LiveGameScreen, FieldPosition, StatsTab) all honor the null return
 * by either skipping the element or falling back to empty string.
 * DOM-level coverage is deferred to the 08-04 smoke checkpoint and
 * the final v3.0 regression sweep — no @testing-library/react in
 * this project yet.
 */

describe("formatJerseyNum", () => {
  it("returns null for null input", () => {
    expect(formatJerseyNum(null)).toBe(null);
  });

  it("returns null for undefined input", () => {
    expect(formatJerseyNum(undefined)).toBe(null);
  });

  it("returns null for empty string input", () => {
    expect(formatJerseyNum("")).toBe(null);
  });

  it("returns '0' for 0 input — 0 is a valid jersey number", () => {
    expect(formatJerseyNum(0)).toBe("0");
  });

  it("returns '42' for 42 input", () => {
    expect(formatJerseyNum(42)).toBe("42");
  });

  it("returns '7' for string '7' input", () => {
    expect(formatJerseyNum("7")).toBe("7");
  });

  it("never returns the string 'null' or 'undefined'", () => {
    for (const v of [null, undefined, ""]) {
      const out = formatJerseyNum(v);
      expect(out).not.toBe("null");
      expect(out).not.toBe("undefined");
    }
  });
});
