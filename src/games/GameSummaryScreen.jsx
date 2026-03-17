import { useParams } from "react-router";
import { C, fontBase } from "../shared/constants";

// =============================================
// GAME SUMMARY SCREEN — placeholder
// Fully implemented in Plan 02
// =============================================
export default function GameSummaryScreen() {
  const { id: gameId } = useParams(); // eslint-disable-line no-unused-vars

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.navy,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.white,
        fontFamily: fontBase,
        fontSize: 16,
      }}
    >
      Loading summary...
    </div>
  );
}
