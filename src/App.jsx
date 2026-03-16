import { HashRouter, Routes, Route, NavLink, Navigate } from "react-router";
import { C, fontDisplay } from "./shared/constants.js";
import MadeiraLineupPlanner from "./MadeiraLineupPlanner.jsx";
import GamesTab from "./tabs/GamesTab.jsx";
import StatsTab from "./tabs/StatsTab.jsx";

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

export default function App() {
  return (
    <HashRouter>
      <div style={{ paddingBottom: 56 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/lineup" replace />} />
          <Route path="/lineup" element={<MadeiraLineupPlanner />} />
          <Route path="/games" element={<GamesTab />} />
          <Route path="/stats" element={<StatsTab />} />
        </Routes>
      </div>
      <TabBar />
    </HashRouter>
  );
}
