import T from "../../theme.js";

// Top of each screen. The safe-area inset matters once the app is installed to
// the home screen — in standalone mode the web view runs under the status bar,
// and a fixed padding would put the title behind the clock.
export default function ScreenHeader({ title, subtitle, trailing }) {
  return (
    <div
      style={{
        padding: `calc(26px + env(safe-area-inset-top)) ${T.gutter}px 4px`,
        display: "flex", alignItems: "flex-start", gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            margin: 0, fontFamily: T.fontDisplay, fontSize: 34, fontWeight: 700,
            color: T.text, letterSpacing: 0.2, lineHeight: 1.05, textTransform: "uppercase",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: T.textSecondary }}>{subtitle}</p>
        )}
      </div>
      {trailing}
    </div>
  );
}
