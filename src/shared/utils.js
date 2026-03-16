import { useState, useEffect } from "react";

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
export function encodeLineup({ formation, lineups, inactiveIds, roster, name }) {
  const payload = { f: formation, l: lineups, i: inactiveIds, r: roster, n: name || "" };
  return btoa(JSON.stringify(payload));
}

export function decodeLineup(encoded) {
  try {
    const payload = JSON.parse(atob(encoded));
    return { formation: payload.f, lineups: payload.l, inactiveIds: payload.i, roster: payload.r, name: payload.n || "" };
  } catch { return null; }
}

// =============================================
// SHARE URL — kept as-is; Plan 04-02 will update for HashRouter
// =============================================
export function buildShareUrl(data) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?lineup=${encodeLineup(data)}`;
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
