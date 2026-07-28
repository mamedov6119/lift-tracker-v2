import { useState } from "react";
import T from "../theme.js";
import ScreenHeader from "../components/ui/ScreenHeader.jsx";
import { Toggle } from "../components/ui/Toggle.jsx";
import { ChevronRightIcon } from "../components/icons.jsx";

const field = {
  background: T.raised, border: `1px solid ${T.border}`, borderRadius: 10,
  minHeight: T.tap, padding: "0 12px", color: T.text, fontSize: 14, outline: "none", width: "100%",
};
const fieldLabel = { fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.3, textTransform: "uppercase" };

function Row({ label, open, onClick, danger, children, last }) {
  return (
    <>
      <button
        type="button"
        className="pressable"
        onClick={onClick}
        aria-expanded={children ? open : undefined}
        style={{
          display: "flex", alignItems: "center", width: "100%", padding: 14,
          borderBottom: last && !open ? "none" : `1px solid ${T.hairline}`,
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ flex: 1, fontSize: 15, color: danger ? T.accent : T.text }}>{label}</span>
        {children && (
          <span style={{ display: "flex", transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }}>
            <ChevronRightIcon />
          </span>
        )}
      </button>
      {open && children && (
        <div style={{ padding: "4px 14px 16px", display: "grid", gap: 14, borderBottom: last ? "none" : `1px solid ${T.hairline}` }}>
          {children}
        </div>
      )}
    </>
  );
}

export default function AccountTab({ profile, summary, onUpdateProfile, onReset, account, onSignOut }) {
  const [open, setOpen] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const toggle = (key) => setOpen((current) => (current === key ? null : key));

  if (!profile) return null;

  return (
    <>
      <ScreenHeader title="Account" />

      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: `18px ${T.gutter}px 0` }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,#3a3a3c,#1c1c1e)", flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{profile.name}</div>
          <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 2 }}>
            {profile.trainingStyle} · {summary?.daysCompleted ?? 0} days this month
          </div>
          {account?.email && (
            <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
              {account.email}
            </div>
          )}
        </div>
      </div>

      <div style={{ margin: `22px ${T.gutter}px 0`, background: T.card, borderRadius: 16, overflow: "hidden" }}>
        <Row label="Personal details" open={open === "details"} onClick={() => toggle("details")}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={fieldLabel}>Name</span>
            <input
              style={field}
              value={profile.name}
              onChange={(e) => onUpdateProfile({ name: e.target.value })}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={fieldLabel}>Training style</span>
            <input
              style={field}
              value={profile.trainingStyle}
              onChange={(e) => onUpdateProfile({ trainingStyle: e.target.value })}
            />
          </label>
        </Row>

        <Row label="Units & preferences" open={open === "units"} onClick={() => toggle("units")}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={fieldLabel}>Weight unit</span>
            <select style={field} value={profile.unit} onChange={(e) => onUpdateProfile({ unit: e.target.value })}>
              <option value="lb">Pounds (lb)</option>
              <option value="kg">Kilograms (kg)</option>
            </select>
          </label>
          <p style={{ margin: 0, fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
            Applies to logging and to every weight-based chart. Existing entries keep the
            numbers you typed — changing this relabels them, it doesn't convert them.
          </p>
        </Row>

        <Row label="Notifications" open={open === "notifications"} onClick={() => toggle("notifications")}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: T.text }}>Daily insights</div>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                Off means no insight banner appears on any screen. Your data keeps recording either way.
              </p>
            </div>
            <Toggle
              checked={!profile.muted}
              onChange={() => onUpdateProfile({ muted: !profile.muted })}
              label="Daily insights"
            />
          </div>
        </Row>

        <Row label="Sign out" onClick={onSignOut} />

        <Row
          label={confirmReset ? "Tap again to erase everything" : "Reset all data"}
          danger
          last
          onClick={() => {
            if (!confirmReset) return setConfirmReset(true);
            setConfirmReset(false);
            onReset();
          }}
        />
      </div>

      <p style={{ margin: `16px ${T.gutter}px 0`, fontSize: 11.5, color: T.textFaint, lineHeight: 1.5 }}>
        Your data is private to this account. Resetting clears your history and custom exercises; it does not delete the account.
      </p>
    </>
  );
}
