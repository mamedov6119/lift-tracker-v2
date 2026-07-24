import React from "react";
import ReactDOM from "react-dom/client";
import "./storage.js"; // must run before App.jsx touches window.storage
import LiftTracker from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LiftTracker />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // non-fatal — app still works without the service worker,
      // it just won't be installable as a home-screen app
    });
  });
}
