import T from "../theme.js";
import { AccountNavIcon, HomeNavIcon, ProgressNavIcon, TrainingNavIcon } from "./icons.jsx";

export const TABS = [
  { id: "home", label: "Home", Icon: HomeNavIcon },
  { id: "training", label: "Training", Icon: TrainingNavIcon },
  { id: "progress", label: "Progress", Icon: ProgressNavIcon },
  { id: "account", label: "Account", Icon: AccountNavIcon },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      aria-label="Main"
      style={{
        flexShrink: 0, display: "flex", padding: "6px 8px",
        paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
        background: T.bg, borderTop: `1px solid ${T.border}`,
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        const color = isActive ? T.accent : T.textMuted;
        return (
          <button
            key={id}
            type="button"
            className="pressable"
            onClick={() => onChange(id)}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            style={{
              flex: 1, minHeight: 48, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer", padding: "4px 0",
              borderRadius: 12,
            }}
          >
            <Icon color={color} />
            <span
              style={{
                fontSize: 10.5, fontWeight: isActive ? 700 : 600, letterSpacing: 0.2, color,
                transition: "color 160ms ease",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
