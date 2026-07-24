# Lift Tracker

Personal lift-tracking app with a small rules engine that surfaces
research-backed, non-guilt nudges based on your own logged data.

Data is stored in your browser's localStorage — nothing leaves your device
unless you later add the backend described below.

## Run locally

```
npm install
npm run dev
```

## Deploy (Stage A — this project, as-is)

1. Push this folder to a new GitHub repo.
2. Go to vercel.com (or netlify.com) → "New Project" → import the repo.
3. Framework preset: Vite. Build command `npm run build`, output dir `dist`
   — both are usually auto-detected.
4. Deploy. You'll get a live URL (e.g. `lift-tracker.vercel.app`).
5. Open that URL on your phone → browser menu → "Add to Home Screen".
   The manifest + service worker in this project make it installable.

That's the whole deploy. No servers, no environment variables, no database
to provision.

## Known limitation

Data is per-browser. Logging on your phone and laptop won't sync between
them, and reinstalling the browser/clearing site data wipes it. That's
fine for solo use on one device; if you want cross-device sync and real
push notifications that reach you while the app is closed, that requires
the backend described in Stage B (see chat history / architecture notes):
Express + Prisma + a hosted DB + node-cron + Web Push (VAPID), deployed
separately (e.g. on Railway or Fly.io) with this frontend calling its API
instead of localStorage.
