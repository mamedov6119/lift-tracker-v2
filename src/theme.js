// ---------- design tokens ----------
// Ported from the Lifter design (claude.ai/design → Lifter.dc.html): near-black
// surfaces, a single red accent, and white reserved for primary actions.
//
// Text alpha values are tuned for contrast against the CARD surface (#1C1C1E),
// which is the worst case in the app — anything readable there is readable on
// the page background too.
const T = {
    // surfaces
    // Not pure #000: on OLED panels true black smears during scroll, and it
    // leaves no room for a darker layer beneath the cards.
    bg: "#0A0A0B",
    card: "#1C1C1E",
    cardSunken: "#151516",
    raised: "#2C2C2E",
    track: "#232325",

    // accent + status
    accent: "#FF4D4D",
    accentSoft: "rgba(255,77,77,0.15)",
    accentBorder: "rgba(255,77,77,0.28)",
    // Darker than the design's #FF4D4D start so white text on it clears 4.5:1.
    accentGradient: "linear-gradient(120deg,#D93A3A,#8E1F30)",
    // Ink for text/icons sitting ON an accent fill. White only reaches 3.27:1
    // against #FF4D4D; this reaches 6.4:1, and mirrors the dark-on-green
    // treatment the design already uses for the advisor accept button.
    accentInk: "#2B0A0A",
    accentDot: "#3a2020",
    success: "#33E096",
    successInk: "#062",

    // text — see note above about contrast ratios on #1C1C1E
    text: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.62)", // body secondary  ~6.9:1
    textMuted: "rgba(255,255,255,0.55)",     // labels          ~6.0:1
    textFaint: "rgba(255,255,255,0.48)",     // captions        ~4.7:1
    textDisabled: "rgba(255,255,255,0.50)",  // adjacent-month days — still tappable, so still needs 4.5:1

    // lines + fills
    hairline: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.10)",
    checkBorder: "rgba(255,255,255,0.30)",
    veil: "rgba(255,255,255,0.06)",

    // type — Barlow Condensed carries numerals and headings (athletic, and it
    // buys horizontal room for long localised dates); Barlow carries body.
    font: "'Barlow', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif",
    fontDisplay: "'Barlow Condensed', 'Barlow', -apple-system, system-ui, sans-serif",

    // the design's 20px screen gutter, used everywhere
    gutter: 20,

    // minimum comfortable tap area (WCAG 2.5.5 / iOS HIG)
    tap: 44,
};

export default T;
