import T from "../../theme.js";
import React from "react";

export function Card({children, style, ...rest}) {
    return (
        <div
            style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 16,
                padding: 16,
                ...style,
            }}
            {...rest}
        >
            {children}
        </div>
    );
}