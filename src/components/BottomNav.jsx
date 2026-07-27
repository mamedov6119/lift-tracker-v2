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
      style={{
        flexShrink: 0, display: "flex", padding: "10px 12px",
        paddingBottom: "calc(14px + env(safe-area-inset-bottom))",
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
            onClick={() => onChange(id)}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              background: "none", border: "none", cursor: "pointer", padding: "2px 0",
            }}
          >
            <Icon color={color} />
            <span style={{ fontSize: 10.5, fontWeight: 600, color }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
