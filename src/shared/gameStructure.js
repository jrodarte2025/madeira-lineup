// =============================================
// GAME STRUCTURE HELPERS
// Centralizes the period lifecycle so halves (Madeira) and quarters
// (friend's team) share one state machine. Each game status value
// maps to a period number + type (active or break), and transitions
// are derived from GAME_STRUCTURE.
//
// Status values (kept distinct across structures to preserve Madeira's
// Firestore data verbatim):
//   halves:   1st-half | halftime | 2nd-half | completed
//   quarters: q1 | break-q1 | q2 | halftime | q3 | break-q3 | q4 | completed
//
// halfIntervals (stored in LiveGameScreen state + Firestore) is a list
// of {startAt, endAt} pairs — one per active period. Halves games end
// with 2 entries; quarters games end with 4. Minute calc (interval
// intersection) works identically either way.
// =============================================

export const PERIOD_COUNT = {
  halves: 2,
  quarters: 4,
};

export const PERIOD_LENGTH_SECONDS = {
  halves: 1800,   // 30 min
  quarters: 720,  // 12 min
};

export const INITIAL_ACTIVE_STATUS = {
  halves: "1st-half",
  quarters: "q1",
};

const ACTIVE_STATUSES = new Set([
  "1st-half", "2nd-half",
  "q1", "q2", "q3", "q4",
]);

const BREAK_STATUSES = new Set([
  "halftime",
  "break-q1", "break-q3",
]);

export function isActiveStatus(status) {
  return ACTIVE_STATUSES.has(status);
}

export function isBreakStatus(status) {
  return BREAK_STATUSES.has(status);
}

// Returns the 1-based period number for a status value.
// For break statuses, returns the period number that JUST ENDED
// (break-q1 → 1; halftime in quarters → 2; break-q3 → 3; halftime in halves → 1).
// Returns null for scheduled/completed/unknown.
export function getPeriodNumber(status) {
  if (status === "1st-half" || status === "q1") return 1;
  if (status === "2nd-half" || status === "q2") return 2;
  if (status === "q3") return 3;
  if (status === "q4") return 4;
  if (status === "break-q1") return 1;
  if (status === "halftime") {
    // Ambiguous on status alone — caller must know gameStructure.
    // We return 1 for halves (halftime after 1st half) and 2 for quarters.
    // Callers that need the distinction should branch on gameStructure.
    return null;
  }
  if (status === "break-q3") return 3;
  return null;
}

// Returns the break status that follows a given active status, or
// null if the game is now over (caller should invoke endGame).
export function getBreakStatusAfter(activeStatus, gameStructure) {
  if (gameStructure === "halves") {
    if (activeStatus === "1st-half") return "halftime";
    if (activeStatus === "2nd-half") return null; // end game
    return null;
  }
  if (gameStructure === "quarters") {
    if (activeStatus === "q1") return "break-q1";
    if (activeStatus === "q2") return "halftime";
    if (activeStatus === "q3") return "break-q3";
    if (activeStatus === "q4") return null; // end game
    return null;
  }
  return null;
}

// Returns the active status that follows a break status, or null
// if the break status is terminal (shouldn't happen in normal flow).
export function getNextActiveStatus(breakStatus) {
  if (breakStatus === "halftime") {
    // Ambiguous on status alone — caller must branch on gameStructure.
    return null;
  }
  if (breakStatus === "break-q1") return "q2";
  if (breakStatus === "break-q3") return "q4";
  return null;
}

// Resolver for the ambiguous "halftime" case — halves halftime → 2nd-half,
// quarters halftime → q3.
export function getNextActiveStatusFromHalftime(gameStructure) {
  if (gameStructure === "halves") return "2nd-half";
  if (gameStructure === "quarters") return "q3";
  return null;
}

// Returns the label for the primary action button based on current status.
// For active statuses:
//   - If game is NOT yet at its last active period: "End Half" / "End Q1" / etc.
//   - If game IS at its last active period: "Full Time!"
// For break statuses: "Start 2nd Half" / "Start Q2" / "Start Q3" / "Start Q4"
export function getActionButtonLabel(status, gameStructure) {
  if (isActiveStatus(status)) {
    // Last active period → "Full Time!"
    const isLast = (gameStructure === "halves" && status === "2nd-half")
                || (gameStructure === "quarters" && status === "q4");
    if (isLast) return "Full Time!";

    if (status === "1st-half") return "End Half";
    if (status === "q1") return "End Q1";
    if (status === "q2") return "End Q2";
    if (status === "q3") return "End Q3";
    return "End Period";
  }

  if (isBreakStatus(status)) {
    if (status === "halftime") {
      return gameStructure === "halves" ? "Start 2nd Half" : "Start Q3";
    }
    if (status === "break-q1") return "Start Q2";
    if (status === "break-q3") return "Start Q4";
  }

  return "";
}

// Returns the short (3-letter) team code for the home-score label in
// GameHeader. Uses the first 3 letters of TEAM_NAME, uppercased.
export function getHomeTeamCode(teamName) {
  if (!teamName) return "HOM";
  const cleaned = String(teamName).replace(/\s+/g, "");
  return cleaned.slice(0, 3).toUpperCase();
}
