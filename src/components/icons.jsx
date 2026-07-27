// Every glyph in the Lifter design is an inline SVG — no icon dependency and
// no font to load. Ported one-for-one from Lifter.dc.html.

export function BoltIcon({ size = 14, color = "#FF4D4D" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <path d="M7 0L2 8h4l-1 6 6-9H7l1-5z" fill={color} />
    </svg>
  );
}

// Small barbell for the volume tile — the design used a bolt there, but the
// bolt now belongs only to the insight banner.
export function WeightIcon({ size = 12, color = "rgba(255,255,255,0.5)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1" y="9" width="3" height="6" rx="1" fill={color} />
      <rect x="20" y="9" width="3" height="6" rx="1" fill={color} />
      <rect x="4.5" y="7" width="2.5" height="10" rx="1" fill={color} />
      <rect x="17" y="7" width="2.5" height="10" rx="1" fill={color} />
      <rect x="7" y="10.8" width="10" height="2.4" fill={color} />
    </svg>
  );
}

export function CheckCircleIcon({ size = 12, color = "rgba(255,255,255,0.5)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="5" fill="none" stroke={color} strokeWidth="1.4" />
      <path d="M3.5 6l1.8 1.8L8.5 4" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ width = 12, height = 10, color = "#fff" }) {
  return (
    <svg width={width} height={height} viewBox="0 0 12 10" aria-hidden="true">
      <path d="M1 5l3.5 3.5L11 1" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon({ color = "rgba(255,255,255,0.5)" }) {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
      <path d="M1 1l5 5 5-5" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronRightIcon({ color = "rgba(255,255,255,0.3)", width = 7, height = 12 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 7 12" aria-hidden="true">
      <path d="M1 1l5 5-5 5" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SwapIcon({ size = 11, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <path d="M1 4h9M10 4L7 1M13 10H4M4 10l3 3" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ size = 13, color = "rgba(255,255,255,0.7)", strokeWidth = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" aria-hidden="true">
      <path d="M1 1l11 11M12 1L1 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon({ size = 15, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l2.2 6.8H21l-5.6 4.1 2.1 6.9L12 15.8 6.5 19.8l2.1-6.9L3 8.8h6.8z" fill={color} />
    </svg>
  );
}

export function BarsIcon({ color = "rgba(255,255,255,0.6)" }) {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
      <rect x="0" y="8" width="3" height="6" fill={color} />
      <rect x="6.5" y="4" width="3" height="10" fill={color} />
      <rect x="13" y="0" width="3" height="14" fill={color} />
    </svg>
  );
}

export function ArrowRightIcon({ color = "#fff" }) {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
      <path d="M1 1l6 6-6 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CircleCheckIcon({ size = 14, color = "#000" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="6" fill="none" stroke={color} strokeWidth="1.4" />
      <path d="M4 7l2 2 4-4.5" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- exercise glyphs (keyed by exercise.icon) ----------
function BarbellGlyph({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="9" width="3" height="6" rx="1" fill={color} />
      <rect x="19" y="9" width="3" height="6" rx="1" fill={color} />
      <rect x="5" y="7" width="2" height="10" rx="1" fill={color} />
      <rect x="17" y="7" width="2" height="10" rx="1" fill={color} />
      <rect x="7" y="11" width="10" height="2" fill={color} />
    </svg>
  );
}

function RopeGlyph({ size, color, strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M1 8c2-4 4-4 6 0s4 4 6 0 4-4 6 0 4 4 6 0" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      <path d="M1 16c2-4 4-4 6 0s4 4 6 0 4-4 6 0 4 4 6 0" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ChevronGlyph({ size, color, strokeWidth = 2.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 15l8-7 8 7" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 21l8-7 8 7" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
}

function ArrowsGlyph({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12h7M9 12l-3-3M9 12l-3 3" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 12h-7M15 12l3-3M15 12l3 3" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const GLYPHS = { barbell: BarbellGlyph, rope: RopeGlyph, chevron: ChevronGlyph, arrows: ArrowsGlyph };

export function ExerciseGlyph({ icon = "barbell", size = 16, color = "currentColor", strokeWidth }) {
  const Glyph = GLYPHS[icon] || BarbellGlyph;
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} />;
}

// ---------- bottom navigation ----------
export function HomeNavIcon({ color }) {
  return (
    <svg width="20" height="19" viewBox="0 0 20 19" aria-hidden="true">
      <path d="M1 8.5L10 1l9 7.5V18H12v-6H8v6H1z" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function TrainingNavIcon({ color }) {
  return (
    <svg width="21" height="14" viewBox="0 0 21 14" aria-hidden="true">
      <rect x="0" y="4" width="3" height="6" rx="1" fill={color} />
      <rect x="18" y="4" width="3" height="6" rx="1" fill={color} />
      <rect x="3" y="6" width="15" height="2" fill={color} />
      <rect x="5" y="1" width="2.4" height="12" rx="1" fill={color} />
      <rect x="13.6" y="1" width="2.4" height="12" rx="1" fill={color} />
    </svg>
  );
}

export function ProgressNavIcon({ color }) {
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden="true">
      <rect x="0" y="9" width="3.5" height="7" rx="1" fill={color} />
      <rect x="7.2" y="4" width="3.5" height="12" rx="1" fill={color} />
      <rect x="14.4" y="0" width="3.5" height="16" rx="1" fill={color} />
    </svg>
  );
}

export function AccountNavIcon({ color }) {
  return (
    <svg width="16" height="19" viewBox="0 0 16 19" aria-hidden="true">
      <circle cx="8" cy="5" r="4.3" fill="none" stroke={color} strokeWidth="1.6" />
      <path d="M1 18c0-4.5 3-7 7-7s7 2.5 7 7" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyCheckIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.6" />
      <path d="M8 12.5l2.5 2.5L16 9" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
