// =============================================
// PITCH SVG — reusable soccer pitch component
// =============================================
export default function PitchSVG({ lineColor = "rgba(255,255,255,0.75)" }) {
  return (
    <svg viewBox="0 0 400 540" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} preserveAspectRatio="none">
      <rect x="20" y="22" width="360" height="496" fill="none" stroke={lineColor} strokeWidth="2" />
      <line x1="20" y1="270" x2="380" y2="270" stroke={lineColor} strokeWidth="2" />
      <circle cx="200" cy="270" r="46" fill="none" stroke={lineColor} strokeWidth="2" />
      <circle cx="200" cy="270" r="3" fill={lineColor} />
      <rect x="100" y="22" width="200" height="80" fill="none" stroke={lineColor} strokeWidth="2" />
      <rect x="145" y="22" width="110" height="36" fill="none" stroke={lineColor} strokeWidth="2" />
      <rect x="168" y="6" width="64" height="16" fill="none" stroke={lineColor} strokeWidth="1.5" rx="1" />
      <path d="M 155 102 A 40 40 0 0 0 245 102" fill="none" stroke={lineColor} strokeWidth="2" />
      <circle cx="200" cy="80" r="2.5" fill={lineColor} />
      <rect x="100" y="438" width="200" height="80" fill="none" stroke={lineColor} strokeWidth="2" />
      <rect x="145" y="482" width="110" height="36" fill="none" stroke={lineColor} strokeWidth="2" />
      <rect x="168" y="518" width="64" height="16" fill="none" stroke={lineColor} strokeWidth="1.5" rx="1" />
      <path d="M 155 438 A 40 40 0 0 1 245 438" fill="none" stroke={lineColor} strokeWidth="2" />
      <circle cx="200" cy="460" r="2.5" fill={lineColor} />
      <path d="M 20 34 A 12 12 0 0 0 32 22" fill="none" stroke={lineColor} strokeWidth="2" />
      <path d="M 368 22 A 12 12 0 0 0 380 34" fill="none" stroke={lineColor} strokeWidth="2" />
      <path d="M 20 506 A 12 12 0 0 1 32 518" fill="none" stroke={lineColor} strokeWidth="2" />
      <path d="M 368 518 A 12 12 0 0 1 380 506" fill="none" stroke={lineColor} strokeWidth="2" />
    </svg>
  );
}
