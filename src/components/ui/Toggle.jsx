import T from "../../theme.js";
import React from "react";

export function Toggle({checked, onChange}) {
    return (
        <button
            onClick={onChange}
            role="switch"
            aria-checked={checked}
            style={{
                width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                background: checked ? T.teal : T.surface2, position: "relative", flexShrink: 0,
                transition: "background 0.15s",
            }}
        >
      <span style={{
          position: "absolute", top: 3, left: checked ? 21 : 3, width: 20, height: 20,
          borderRadius: "50%", background: "#fff", transition: "left 0.15s",
      }}/>
        </button>
    );
}