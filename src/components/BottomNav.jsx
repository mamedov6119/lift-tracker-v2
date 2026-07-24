import T from "../theme.js";

export default function BottomNav({ nav, activeTab, onChange }) {
    return (<div style={{ display: "flex", borderTop: `1px solid ${T.border}`, background: T.surface }}>
        {nav.map((n) => {
            const Icon = n.icon;
            const active = activeTab === n.id;
            return (
                <button
                    key={n.id}
                    onClick={() => onChange(n.id)}
                    style={{
                        flex: 1, background: "none", border: "none", cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                        padding: "10px 0 12px", position: "relative",
                        color: active ? T.tealLight : T.textMuted,
                    }}
                >
                    <div style={{ position: "relative" }}>
                        <Icon size={20} />
                        {n.badge > 0 && (
                            <span style={{
                                position: "absolute", top: -4, right: -8, background: T.amber, color: "#412402",
                                fontSize: 10, fontWeight: 700, borderRadius: 8, minWidth: 15, height: 15,
                                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
                            }}>{n.badge}</span>
                        )}
                    </div>
                    <span style={{ fontSize: 11 }}>{n.label}</span>
                </button>
            );
        })}
    </div>)
}