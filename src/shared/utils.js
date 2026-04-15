import { useState, useEffect } from "react";

// =============================================
// POSITION GROUP RESOLVER
// Maps formation position labels to position group (GK/DEF/MID/FWD)
// =============================================
export function getPositionGroup(label) {
  if (!label) return "MID";
  const upper = label.toUpperCase();
  if (upper === "GK") return "GK";
  if (["LB", "CB", "RB", "LCB", "RCB"].includes(upper)) return "DEF";
  if (["LM", "CM", "RM", "LCM", "RCM"].includes(upper)) return "MID";
  if (["LS", "RS", "LW", "CF", "RW", "ST"].includes(upper)) return "FWD";
  return "MID";
}

// =============================================
// MINUTE CALCULATOR — pure function for interval intersection
// =============================================
// fieldIntervals: [{ inAt: timestamp, outAt: timestamp|null }]
// halfIntervals:  [{ startAt: timestamp, endAt: timestamp|null }]
// Returns total whole minutes the player was on field during active halves
export function calcMinutes(fieldIntervals, halfIntervals) {
  if (!fieldIntervals.length || !halfIntervals.length) return 0;
  const now = Date.now();
  let totalMs = 0;

  for (const fi of fieldIntervals) {
    const fiStart = fi.inAt;
    const fiEnd = fi.outAt ?? now;
    for (const hi of halfIntervals) {
      const hiStart = hi.startAt;
      const hiEnd = hi.endAt ?? now;
      const overlapStart = Math.max(fiStart, hiStart);
      const overlapEnd = Math.min(fiEnd, hiEnd);
      if (overlapEnd > overlapStart) {
        totalMs += overlapEnd - overlapStart;
      }
    }
  }

  return Math.floor(totalMs / 60000);
}

// =============================================
// NAME ABBREVIATION UTILITY
// =============================================
export function abbreviateName(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  if (parts[0].includes(".")) return name.trim();
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

// =============================================
// RESPONSIVE HOOK
// =============================================
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

// =============================================
// LINEUP ENCODE / DECODE — for URL sharing
// =============================================
export function encodeLineup({ formation, lineup, inactiveIds, roster, name }) {
  const payload = { f: formation, l: lineup, i: inactiveIds, r: roster, n: name || "" };
  return btoa(JSON.stringify(payload));
}

export function decodeLineup(encoded) {
  try {
    const payload = JSON.parse(atob(encoded));
    // Fallback for old share URLs: if lineup is an object (keyed by half), read half 1
    let lineup = payload.l;
    if (lineup && !Array.isArray(lineup)) lineup = lineup["1"] || Array(9).fill(null);
    return { formation: payload.f, lineup, inactiveIds: payload.i, roster: payload.r, name: payload.n || "" };
  } catch { return null; }
}

// =============================================
// SHARE URL — kept as-is; Plan 04-02 will update for HashRouter
// =============================================
export function buildShareUrl(data) {
  const base = window.location.origin + window.location.pathname;
  return `${base}#/shared?lineup=${encodeLineup(data)}`;
}

export async function shareLineup(data) {
  const url = buildShareUrl(data);
  const title = data.name ? `Madeira FC — ${data.name}` : "Madeira FC Lineup";

  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (e) {
      if (e.name === "AbortError") return null;
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}
