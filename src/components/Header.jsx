import {IconCircle} from "./ui/IconCircle.jsx";
import {Dumbbell} from "lucide-react";
import T from "../theme.js";

export default function Header() {
    return (
        <div style={{ padding: "18px 18px 4px", display: "flex", alignItems: "center", gap: 10 }}>
            <IconCircle><Dumbbell size={18} /></IconCircle>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.textPrimary }}>Lift Tracker</p>
        </div>
    )
}