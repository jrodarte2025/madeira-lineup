// Pure helpers for stat-event mutations. No Firestore, no React — unit-testable.

export function eventsToStatCountsByPlayer(events) {
  const counts = {};
  for (const e of events || []) {
    if (e?.type !== "stat") continue;
    if (!counts[e.playerId]) counts[e.playerId] = {};
    counts[e.playerId][e.stat] = (counts[e.playerId][e.stat] || 0) + 1;
  }
  return counts;
}

export function computeSeasonDeltaDiff(oldEvents, newEvents) {
  const oldCounts = eventsToStatCountsByPlayer(oldEvents);
  const newCounts = eventsToStatCountsByPlayer(newEvents);
  const diffs = {};
  const playerIds = new Set([
    ...Object.keys(oldCounts),
    ...Object.keys(newCounts),
  ]);
  for (const pid of playerIds) {
    const o = oldCounts[pid] || {};
    const n = newCounts[pid] || {};
    const keys = new Set([...Object.keys(o), ...Object.keys(n)]);
    for (const k of keys) {
      const d = (n[k] || 0) - (o[k] || 0);
      if (d === 0) continue;
      if (!diffs[pid]) diffs[pid] = {};
      diffs[pid][k] = d;
    }
  }
  return diffs;
}
