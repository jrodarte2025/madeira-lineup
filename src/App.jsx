import { HashRouter, Routes, Route, NavLink, Navigate, useLocation, useParams } from "react-router";
import { C, fontDisplay } from "./shared/constants.js";
import MadeiraLineupPlanner from "./MadeiraLineupPlanner.jsx";
import GamesTab from "./tabs/GamesTab.jsx";
import StatsTab from "./tabs/StatsTab.jsx";

// ---------------------------------------------------------------------------
// LiveGameScreen placeholder — Plan 05-02 will replace this component
// ---------------------------------------------------------------------------
function LiveGameScreen() {
  const { id } = useParams();
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111B3A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 12,
        color: "rgba(255,255,255,0.6)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 16,
      }}
    >
      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>
        Game ID: {id}
      </span>
      <span>Loading game...</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TabBar
// ---------------------------------------------------------------------------
function TabBar() {
  const tabStyle = {
    flex: 1,
    textAlign: "center",
    padding: "10px 0 8px",
    fontFamily: fontDisplay,
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: "0.5px",
    textDecoration: "none",
    transition: "color 0.15s",
    userSelect: "none",
  };

  const activeStyle = {
    color: C.orange,
    borderBottom: `3px solid ${C.orange}`,
  };

  const inactiveStyle = {
    color: "rgba(255,255,255,0.55)",
    borderBottom: "3px solid transparent",
  };

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        backgroundColor: C.navy,
        zIndex: 100,
        borderTop: `1px solid rgba(255,255,255,0.1)`,
      }}
    >
      <NavLink
        to="/lineup"
        style={({ isActive }) => ({ ...tabStyle, ...(isActive ? activeStyle : inactiveStyle) })}
      >
        Lineup
      </NavLink>
      <NavLink
        to="/games"
        style={({ isActive }) => ({ ...tabStyle, ...(isActive ? activeStyle : inactiveStyle) })}
      >
        Games
      </NavLink>
      <NavLink
        to="/stats"
        style={({ isActive }) => ({ ...tabStyle, ...(isActive ? activeStyle : inactiveStyle) })}
      >
        Stats
      </NavLink>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// AppShell — renders routes and conditionally shows TabBar
// ---------------------------------------------------------------------------
function AppShell() {
  const location = useLocation();
  // Hide TabBar when on a live game screen to reclaim vertical space
  const isGameScreen = /^\/games\/.+/.test(location.pathname);

  return (
    <div style={isGameScreen ? undefined : { paddingBottom: 56 }}>
      <Routes>
        <Route path="/" element={<Navigate to="/lineup" replace />} />
        <Route path="/lineup" element={<MadeiraLineupPlanner />} />
        <Route path="/games" element={<GamesTab />} />
        <Route path="/games/:id" element={<LiveGameScreen />} />
        <Route path="/stats" element={<StatsTab />} />
      </Routes>
      {!isGameScreen && <TabBar />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
