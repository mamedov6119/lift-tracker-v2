import T from "../../theme.js";

export function Toggle({checked, onChange, label}) {
    return (
        <button
            type="button"
            onClick={onChange}
            role="switch"
            aria-checked={checked}
            aria-label={label}
            style={{
                width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                background: checked ? T.accent : T.raised, position: "relative", flexShrink: 0,
                transition: "background 0.15s", padding: 0,
            }}
        >
      <span style={{
          position: "absolute", top: 3, left: checked ? 21 : 3, width: 20, height: 20,
          borderRadius: "50%", background: "#fff", transition: "left 0.15s",
      }}/>
        </button>
    );
}