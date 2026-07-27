// The engine itself lives in shared/ so the Express server evaluates the exact
// same rules the UI does. This re-export keeps the browser-side import path
// stable (and keeps rules.test.js pointing at ./rules.js).
export * from "../../shared/rules.js";
