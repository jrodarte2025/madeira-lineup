import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { C, fontBase, fontDisplay, STAT_LABELS, INITIAL_ROSTER } from "../shared/constants";
import { getSeasonId } from "../shared/seasonUtils";
import { buildSummaryRows, STAT_ORDER } from "../shared/summaryUtils";
import { loadSeasonStats, listSeasons, listGames } from "../firebase";

// =============================================
// STATS TAB — Season Dashboard
// =============================================

/** Format season ID to display label: "spring-2026" -> "Spring 2026" */
function formatSeasonLabel(seasonId) {
  if (!seasonId) return seasonId;
  const parts = seasonId.split("-");
  if (parts.length !== 2) return seasonId;
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + " " + parts[1];
}

/** Format date string to short format: "2026-03-16" -> "Mar 16" */
function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function StatsTab() {
  const navigate = useNavigate();

  const defaultSeason = getSeasonId(new Date().toISOString());

  const [seasonData, setSeasonData] = useState(null);
  const [seasons, setSeasons] = useState([defaultSeason]);
  const [currentSeason, setCurrentSeason] = useState(defaultSeason);
  const [sortKey, setSortKey] = useState("totalEvents");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedPlayerId, setExpandedPlayerId] = useState(null);
  const [gamesByPlayer, setGamesByPlayer] = useState({});
  const [loadingGames, setLoadingGames] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load season data and season list on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchInitial() {
      setLoading(true);
      const [data, fetchedSeasons] = await Promise.all([
        loadSeasonStats(defaultSeason),
        listSeasons(),
      ]);
      if (cancelled) return;
      // Ensure current season always appears in dropdown
      const mergedSeasons = [
        defaultSeason,
        ...fetchedSeasons.filter((s) => s !== defaultSeason),
      ];
      setSeasonData(data);
      setSeasons(mergedSeasons);
      setLoading(false);
    }
    fetchInitial();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload season data when season selector changes
  async function handleSeasonChange(newSeason) {
    setCurrentSeason(newSeason);
    setExpandedPlayerId(null);
    setGamesByPlayer({});
    setLoading(true);
    const data = await loadSeasonStats(newSeason);
    setSeasonData(data);
    setLoading(false);
  }

  // Sort column header handler
  function handleSort(key) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(false); // new column: highest first (desc)
    }
  }

  // Player row tap — toggle accordion
  async function handleRowTap(playerId) {
    if (expandedPlayerId === playerId) {
      setExpandedPlayerId(null);
      return;
    }
    setExpandedPlayerId(playerId);

    // Lazy load games for this player if not already cached
    if (!gamesByPlayer[playerId]) {
      setLoadingGames(true);
      const allGames = await listGames();
      const seasonGames = allGames.filter(
        (g) => g.status === "completed" && getSeasonId(g.date) === currentSeason
      );
      setGamesByPlayer((prev) => ({ ...prev, [playerId]: seasonGames }));
      setLoadingGames(false);
    }
  }

  // ---- Derived data ----

  // Active stat columns: stats with at least one non-zero value across all players
  const allPlayerData = Object.values(seasonData?.players || {});
  const seenStats = new Set();
  for (const p of allPlayerData) {
    for (const [key, val] of Object.entries(p)) {
      if (key !== "minutes" && key !== "gamesPlayed" && val > 0) {
        seenStats.add(key);
      }
    }
  }
  const activeCols = STAT_ORDER.filter((s) => seenStats.has(s));
  // Add any stats not in STAT_ORDER that still appeared
  for (const s of seenStats) {
    if (!activeCols.includes(s)) activeCols.push(s);
  }

  // Build rows from INITIAL_ROSTER (all players always shown)
  const tableRows = INITIAL_ROSTER.map((player) => {
    const stats = seasonData?.players?.[String(player.id)] || {};
    const totalEvents = activeCols.reduce((sum, col) => sum + (stats[col] || 0), 0);
    return { player, stats, totalEvents };
  });

  // Sort rows
  tableRows.sort((a, b) => {
    let av, bv;
    if (sortKey === "totalEvents") {
      av = a.totalEvents;
      bv = b.totalEvents;
    } else if (sortKey === "minutes") {
      av = a.stats.minutes || 0;
      bv = b.stats.minutes || 0;
    } else if (sortKey === "gamesPlayed") {
      av = a.stats.gamesPlayed || 0;
      bv = b.stats.gamesPlayed || 0;
    } else {
      av = a.stats[sortKey] || 0;
      bv = b.stats[sortKey] || 0;
    }
    return sortAsc ? av - bv : bv - av;
  });

  // ---- Styles ----
  const containerStyle = {
    backgroundColor: C.navyDark,
    minHeight: "100vh",
    fontFamily: fontBase,
    paddingBottom: 80,
  };

  const headerStyle = {
    backgroundColor: C.navy,
    padding: "16px 16px 12px",
    borderBottom: `1px solid ${C.whiteAlpha}`,
  };

  const titleStyle = {
    fontFamily: fontDisplay,
    fontSize: 20,
    fontWeight: 700,
    color: C.white,
    margin: "0 0 12px 0",
  };

  const selectStyle = {
    backgroundColor: C.navyLight,
    color: C.white,
    border: `1px solid ${C.whiteAlpha}`,
    borderRadius: 8,
    padding: "8px 12px",
    fontFamily: fontBase,
    fontSize: 15,
    fontWeight: 500,
    width: "100%",
    maxWidth: 300,
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 36,
  };

  const tableWrapStyle = {
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    margin: "16px",
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
    fontFamily: fontBase,
    backgroundColor: C.navyLight,
    minWidth: 420,
  };

  const thBaseStyle = {
    backgroundColor: C.navy,
    color: C.white,
    padding: "10px 10px",
    textAlign: "left",
    fontWeight: 600,
    whiteSpace: "nowrap",
    fontSize: 12,
    borderBottom: `2px solid ${C.whiteAlpha}`,
    cursor: "pointer",
    userSelect: "none",
  };

  const thActiveStyle = {
    ...thBaseStyle,
    color: C.orange,
  };

  const tdBaseStyle = {
    padding: "9px 10px",
    borderBottom: `1px solid rgba(255,255,255,0.07)`,
    color: C.white,
    whiteSpace: "nowrap",
  };

  const tdNumStyle = {
    ...tdBaseStyle,
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
  };

  const tdExpandedStyle = {
    ...tdBaseStyle,
    backgroundColor: "rgba(232,100,32,0.08)",
  };

  const tdExpandedNumStyle = {
    ...tdNumStyle,
    backgroundColor: "rgba(232,100,32,0.08)",
  };

  const subRowStyle = {
    padding: "8px 10px",
    borderBottom: `1px solid rgba(255,255,255,0.05)`,
    color: "rgba(255,255,255,0.75)",
    whiteSpace: "nowrap",
    backgroundColor: "rgba(0,0,0,0.25)",
    textAlign: "center",
    fontSize: 12,
    cursor: "pointer",
  };

  const subRowFirstStyle = {
    ...subRowStyle,
    textAlign: "left",
    paddingLeft: 20,
    color: C.white,
  };

  const loadingStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    color: "rgba(255,255,255,0.5)",
    fontFamily: fontBase,
    fontSize: 16,
  };

  const emptyStyle = {
    padding: "40px 20px",
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontFamily: fontBase,
    fontSize: 15,
    lineHeight: 1.5,
  };

  // Sort indicator helper
  function sortIndicator(key) {
    if (sortKey !== key) return " ↕";
    return sortAsc ? " ▲" : " ▼";
  }

  // ---- Render ----

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <p style={titleStyle}>Season Stats</p>
        </div>
        <div style={loadingStyle}>Loading season stats...</div>
      </div>
    );
  }

  const hasAnyData = seasonData !== null;
  const noSeasonData = !hasAnyData;

  return (
    <div style={containerStyle}>
      {/* Header with season selector */}
      <div style={headerStyle}>
        <p style={titleStyle}>Season Stats</p>
        <select
          style={selectStyle}
          value={currentSeason}
          onChange={(e) => handleSeasonChange(e.target.value)}
        >
          {seasons.map((s) => (
            <option key={s} value={s}>
              {formatSeasonLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {/* Empty state */}
      {noSeasonData && (
        <div style={emptyStyle}>
          No season stats yet — finalize a game to start tracking
        </div>
      )}

      {/* Dashboard table */}
      {!noSeasonData && (
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={sortKey === "player" ? thActiveStyle : thBaseStyle}>
                  Player
                </th>
                <th
                  style={sortKey === "gamesPlayed" ? thActiveStyle : { ...thBaseStyle, textAlign: "center" }}
                  onClick={() => handleSort("gamesPlayed")}
                >
                  GP{sortIndicator("gamesPlayed")}
                </th>
                <th
                  style={sortKey === "minutes" ? thActiveStyle : { ...thBaseStyle, textAlign: "center" }}
                  onClick={() => handleSort("minutes")}
                >
                  MIN{sortIndicator("minutes")}
                </th>
                {activeCols.map((col) => (
                  <th
                    key={col}
                    style={sortKey === col ? { ...thActiveStyle, textAlign: "center" } : { ...thBaseStyle, textAlign: "center" }}
                    onClick={() => handleSort(col)}
                  >
                    {STAT_LABELS[col] || col}
                    {sortIndicator(col)}
                  </th>
                ))}
                <th
                  style={sortKey === "totalEvents" ? { ...thActiveStyle, textAlign: "center" } : { ...thBaseStyle, textAlign: "center" }}
                  onClick={() => handleSort("totalEvents")}
                >
                  Total{sortIndicator("totalEvents")}
                </th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(({ player, stats, totalEvents }) => {
                const isExpanded = expandedPlayerId === String(player.id);
                const playerLabel = `#${player.num} ${player.name}`;
                const playerGames = gamesByPlayer[String(player.id)];

                return (
                  <>
                    {/* Player row */}
                    <tr
                      key={player.id}
                      onClick={() => handleRowTap(String(player.id))}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={isExpanded ? { ...tdExpandedStyle, fontWeight: 600 } : tdBaseStyle}>
                        <span style={{ marginRight: 6, color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                          {isExpanded ? "▾" : "▸"}
                        </span>
                        {playerLabel}
                      </td>
                      <td style={isExpanded ? tdExpandedNumStyle : tdNumStyle}>
                        {stats.gamesPlayed || 0}
                      </td>
                      <td style={isExpanded ? tdExpandedNumStyle : tdNumStyle}>
                        {stats.minutes || 0}
                      </td>
                      {activeCols.map((col) => (
                        <td key={col} style={isExpanded ? tdExpandedNumStyle : tdNumStyle}>
                          {stats[col] || 0}
                        </td>
                      ))}
                      <td style={isExpanded ? { ...tdExpandedNumStyle, fontWeight: 600, color: C.orange } : { ...tdNumStyle, color: totalEvents > 0 ? C.orange : "rgba(255,255,255,0.35)" }}>
                        {totalEvents}
                      </td>
                    </tr>

                    {/* Accordion expanded view */}
                    {isExpanded && (
                      <tr key={`${player.id}-accordion`}>
                        <td
                          colSpan={3 + activeCols.length + 1}
                          style={{ padding: 0, backgroundColor: "rgba(0,0,0,0.2)" }}
                        >
                          {loadingGames && !playerGames ? (
                            <div style={{ ...loadingStyle, padding: "20px" }}>
                              Loading games...
                            </div>
                          ) : !playerGames || playerGames.length === 0 ? (
                            <div style={{ ...emptyStyle, padding: "16px 20px", fontSize: 13 }}>
                              No games played yet
                            </div>
                          ) : (
                            <table style={{ ...tableStyle, minWidth: 0, backgroundColor: "transparent" }}>
                              <thead>
                                <tr>
                                  <th style={{ ...thBaseStyle, backgroundColor: "rgba(0,0,0,0.3)", fontSize: 11, paddingLeft: 20 }}>
                                    Opponent
                                  </th>
                                  <th style={{ ...thBaseStyle, backgroundColor: "rgba(0,0,0,0.3)", fontSize: 11, textAlign: "center" }}>
                                    Date
                                  </th>
                                  <th style={{ ...thBaseStyle, backgroundColor: "rgba(0,0,0,0.3)", fontSize: 11, textAlign: "center" }}>
                                    MIN
                                  </th>
                                  {activeCols.map((col) => (
                                    <th key={col} style={{ ...thBaseStyle, backgroundColor: "rgba(0,0,0,0.3)", fontSize: 11, textAlign: "center" }}>
                                      {STAT_LABELS[col] || col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {playerGames.map((game) => {
                                  const { rows: gameRows } = buildSummaryRows(game);
                                  const playerRow = gameRows.find(
                                    (r) => String(r.player.id) === String(player.id)
                                  );
                                  const gameMins = playerRow?.mins ?? 0;
                                  const gameStats = playerRow?.stats ?? {};

                                  return (
                                    <tr
                                      key={game.id}
                                      onClick={() => navigate(`/games/${game.id}/summary`)}
                                      style={{ cursor: "pointer" }}
                                    >
                                      <td style={subRowFirstStyle}>{game.opponent || "—"}</td>
                                      <td style={subRowStyle}>{formatShortDate(game.date)}</td>
                                      <td style={subRowStyle}>{gameMins}</td>
                                      {activeCols.map((col) => (
                                        <td key={col} style={subRowStyle}>
                                          {gameStats[col] || 0}
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
