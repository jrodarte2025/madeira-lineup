import { describe, it } from "vitest";

describe("getPositionGroup", () => {
  it.todo("maps GK label to GK group");
  it.todo("maps LB, CB, RB, LCB, RCB to DEF");
  it.todo("maps LM, CM, RM, LCM, RCM to MID");
  it.todo("maps LS, RS, LW, CF, RW, ST to FWD");
  it.todo("defaults unknown labels to MID");
});

describe("calcMinutes", () => {
  it.todo("returns 0 for empty intervals");
  it.todo("calculates minutes for single interval within one half");
  it.todo("uses Date.now() for open intervals");
  it.todo("accounts for halftime gap between two halves");
  it.todo("accounts for substitution mid-half");
  it.todo("floors to whole minutes");
});

describe("undo event filtering", () => {
  it.todo("removes event by id from events array");
});
