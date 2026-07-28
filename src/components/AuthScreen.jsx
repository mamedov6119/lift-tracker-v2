import { useEffect, useRef, useState } from "react";
import T from "../theme.js";
import { ExerciseGlyph } from "./icons.jsx";

const field = {
  background: T.raised, border: `1px solid ${T.border}`, borderRadius: 12,
  minHeight: T.tap, padding: "0 14px", color: T.text, fontSize: 16, outline: "none",
  width: "100%", minWidth: 0,
};
const labelStyle = {
  fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.3, textTransform: "uppercase",
};

export default function AuthScreen({ onLogin, onSignup }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [signupCode, setSignupCode] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef(null);

  const isSignup = mode === "signup";

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const switchMode = () => {
    setMode(isSignup ? "login" : "signup");
    setError(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isSignup) await onSignup({ email, password, name, signupCode });
      else await onLogin({ email, password });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh", background: T.bg, display: "flex",
        alignItems: "center", justifyContent: "center", padding: `24px ${T.gutter}px`,
      }}
    >
      <form
        onSubmit={submit}
        style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 18 }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <ExerciseGlyph icon="barbell" size={44} color={T.text} />
          <h1
            style={{
              margin: 0, fontFamily: "'Barlow', sans-serif", fontStyle: "italic", fontWeight: 800,
              fontSize: 40, letterSpacing: -1, color: T.text, lineHeight: 1,
            }}
          >
            Lifter
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: T.textSecondary, textAlign: "center" }}>
            {isSignup ? "Create an account to start tracking." : "Sign in to pick up where you left off."}
          </p>
        </div>

        {isSignup && (
          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>Name</span>
            <input
              style={field}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Optional"
            />
          </label>
        )}

        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Email</span>
          <input
            ref={emailRef}
            style={field}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Password</span>
          <input
            style={field}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            // Tells password managers to offer a new strong password on signup
            // and the saved one on sign-in.
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
          />
          {isSignup && (
            <span style={{ fontSize: 11.5, color: T.textFaint }}>At least 8 characters.</span>
          )}
        </label>

        {isSignup && (
          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>Signup code</span>
            <input
              style={field}
              value={signupCode}
              onChange={(e) => setSignupCode(e.target.value)}
              placeholder="Only if this app asks for one"
            />
          </label>
        )}

        {error && (
          <p role="alert" style={{ margin: 0, fontSize: 13, color: T.accent, lineHeight: 1.5 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="pressable"
          disabled={busy}
          style={{
            minHeight: T.tap, padding: 14, borderRadius: 20, background: "#fff", color: "#000",
            fontSize: 15, fontWeight: 700, border: "none",
            cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Just a moment…" : isSignup ? "Create account" : "Sign in"}
        </button>

        <button
          type="button"
          className="pressable"
          onClick={switchMode}
          style={{
            minHeight: T.tap, background: "none", border: "none", cursor: "pointer",
            color: T.textSecondary, fontSize: 13.5,
          }}
        >
          {isSignup ? (
            <>Already have an account? <span style={{ color: T.accent, fontWeight: 600 }}>Sign in</span></>
          ) : (
            <>New here? <span style={{ color: T.accent, fontWeight: 600 }}>Create an account</span></>
          )}
        </button>
      </form>
    </div>
  );
}
