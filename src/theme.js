// ---------- design tokens ----------
// Ported from the Lifter design (claude.ai/design → Lifter.dc.html): near-black
// surfaces, a single red accent, and white reserved for primary actions.
const T = {
    // surfaces
    bg: "#000000",
    card: "#1C1C1E",
    cardSunken: "#151516",
    raised: "#2C2C2E",
    track: "#232325",

    // accent + status
    accent: "#FF4D4D",
    accentSoft: "rgba(255,77,77,0.15)",
    accentBorder: "rgba(255,77,77,0.28)",
    accentGradient: "linear-gradient(120deg,#FF4D4D,#B2273D)",
    accentDot: "#3a2020",
    success: "#33E096",
    successInk: "#062",

    // text
    text: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.45)",
    textMuted: "rgba(255,255,255,0.4)",
    textFaint: "rgba(255,255,255,0.35)",
    textDisabled: "rgba(255,255,255,0.25)",

    // lines + fills
    hairline: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.08)",
    checkBorder: "rgba(255,255,255,0.25)",
    veil: "rgba(255,255,255,0.06)",

    font: '-apple-system, "SF Pro Text", system-ui, "Segoe UI", Roboto, sans-serif',

    // the design's 20px screen gutter, used everywhere
    gutter: 20,
};

export default T;
