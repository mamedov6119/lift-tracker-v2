import T from "../../theme.js"
import React from "react";

export function IconCircle({children, tone = "teal"}) {
    const bg = tone === "amber" ? T.amberDim : T.tealDim;
    const fg = tone === "amber" ? T.amber : T.tealLight;
    return (
        <div style={{
            width: 36, height: 36, borderRadius: 12, background: bg, color: fg,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
            {children}
        </div>
    );
}