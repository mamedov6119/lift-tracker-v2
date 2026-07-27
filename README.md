# Lift Tracker

Personal lift-tracking web app. A small rules engine watches your own logged
data and surfaces research-backed, non-guilt nudges — one collapsible
"Today's Insight" banner per screen, always dismissible.

The UI implements the **Lifter** design from Claude Design
(`Lifter.dc.html`): near-black surfaces, a single red accent, and four
screens — Home, Training, Progress, Account. The design is a phone mock; here
it renders as a centred column that goes full-bleed on mobile.

## Architecture

```
shared/rules.js     insight rules — imported by BOTH the client and the server
server/             Express 5 API + SQLite (node:sqlite, no native modules)
  db.js               schema, migrations, WAL
  seed.js             exercise catalog + 8 weeks of demo history
  lib/repo.js         data access + derived analytics
  routes/             profile, plan, sets, analytics
src/                React 18 + Vite client
  lib/api.js          fetch wrapper over /api
  lib/format.js       weight / reps / time display formatting
  hooks/              useLiftData (one date's worth of state), useProgress
  components/         icons, insight banner, calendar, advisor deck, charts
  tabs/               HomeTab, TrainingTab, ProgressTab, AccountTab
```

The server is the source of truth. Every calorie total, trend and insight is
computed server-side, so the client never has to recompute them and a future
client (digest email, push notification) gets the same answers.

## Run locally

```bash
npm install
npm run dev
```

`npm run dev` starts both processes: the API on **:3001** and Vite on
**:5173**, with `/api` proxied across. To run them separately use
`npm run server` and `npm run web`.

On first boot the server creates `data/lift.db` and seeds the exercise
catalog plus eight weeks of demo history, so the charts and calendar have
something to show. Delete `data/` to start empty — or use **Account → Reset
all data**, which clears your history but keeps the catalog.

## Production

```bash
npm run build
npm start
```

`server/index.js` serves `dist/` when it exists, so the built client and the
API run on one origin and one port — one thing to deploy. Deep links
(`/training`) fall back to `index.html`; `/api/*` never does.

### What it needs from the host

1. **Node 22.5 or newer.** The app uses the built-in `node:sqlite` module,
   which doesn't exist on older Node. Enforced via `engines` in
   `package.json`.
2. **A persistent writable disk**, mounted wherever `LIFT_DB` points
   (default `./data/lift.db`). SQLite is a file: with no volume, every
   redeploy or container restart wipes your entire training history.
3. **devDependencies installed at build time.** `vite` is a devDependency, so
   an install run with `NODE_ENV=production` or `--omit=dev` will skip it and
   `npm run build` will fail. Build first, prune after — which is exactly what
   the two-stage `Dockerfile` does.

`docker build -t lift-tracker . && docker run -p 3001:3001 -v lift-data:/data lift-tracker`
covers all three.

### Deploying to Fly.io

`fly.toml` is committed and already wires the volume, the health check and
`LIFT_DB`. From a clean checkout:

```bash
fly auth login
fly launch --no-deploy --copy-config --name <your-unique-app-name>
fly volumes create lift_data --size 1 --region <your-region>
fly deploy
```

Set `primary_region` in `fly.toml` to the region you picked, and pass that same
region to `fly volumes create` — a volume in a different region than the app
will never be mounted.

**After `fly launch` finishes, re-open `fly.toml`.** The wizard rewrites it and
routinely drops `[[mounts]]` and `[env]`. If `[[mounts]]` is missing the deploy
still succeeds, then silently recreates an empty database on every release —
the worst kind of failure, because it looks like it worked. Confirm all three
survived: `[[mounts]]`, `LIFT_DB`, and `internal_port` matching `PORT`.

The app runs as a single machine because a Fly volume attaches to exactly one —
do not `fly scale count` above 1, or the second machine gets its own empty
database.

To back up, `fly ssh console -C "cat /data/lift.db" > backup.db`, or run
`fly volumes snapshots list lift_data`.

### Where it will *not* work as-is

**Vercel, Netlify, Cloudflare Pages and other serverless hosts.** They run
functions with an ephemeral, read-only filesystem and no long-lived process —
a SQLite file has nowhere to live and won't survive between requests. A
long-running container host (Fly.io, Railway, Render, a VPS) with a mounted
volume is the right shape. Moving to serverless would mean swapping SQLite for
a hosted Postgres, which is a `server/lib/repo.js` change, not an app rewrite.

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | HTTP port |
| `LIFT_DB` | `./data/lift.db` | SQLite file path — point this at your volume |
| `LIFT_SEED_DEMO` | unset | `1` forces demo history, `0` forbids it; unset means dev-only |
| `LIFT_PASSWORD` | unset | Shared password. **Unset means no auth at all** |
| `LIFT_USER` | `lifter` | Username paired with `LIFT_PASSWORD` |

`GET /api/health` returns `{"ok":true}` for platform health checks.

## Authentication

There is one shared password over HTTP Basic, guarding the API *and* the built
client. It is not a user system — it's a lock on the front door of a
single-profile app, which is what a personal training log on a public URL
needs.

```bash
fly secrets set LIFT_PASSWORD='your-long-random-password'
```

Setting a secret triggers a redeploy. The browser then prompts once and
remembers the credentials for the session, including for the app's own API
calls.

Three things worth knowing:

- **With `LIFT_PASSWORD` unset there is no protection at all.** That's the
  default so local development stays frictionless; the server prints a loud
  warning at boot if it's missing in production.
- **`/api/health` is deliberately exempt.** Fly's health checks are
  unauthenticated, and a 401 there would mark the machine unhealthy and roll
  back every deploy.
- Comparison is constant-time on a SHA-256 digest of both username and
  password, so neither value leaks through response timing or length.

### First boot in production

The exercise catalog always loads — it's real reference data. The eight weeks
of **demo history are deliberately skipped when `NODE_ENV=production`**, so a
deployed app starts genuinely empty rather than inventing workouts you never
did. Set `LIFT_SEED_DEMO=1` if you want a populated staging environment.

Schema migrations in `server/db.js` run automatically on every boot and are
idempotent, so redeploying over an existing database is safe.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET / PATCH | `/api/profile` | single-user profile, weight unit, mute |
| GET / POST | `/api/exercises` | exercise catalog (+ custom exercises) |
| DELETE | `/api/data` | reset logged history |
| GET / POST | `/api/plan` | a day's plan; add an exercise to it |
| PATCH / DELETE | `/api/plan/:id` | tick off / remove a plan item |
| POST | `/api/plan/complete-all` | "Mark Complete" |
| GET / POST | `/api/sets` | logged sets |
| DELETE | `/api/sets/:id` | remove a set |
| GET | `/api/summary?month=` | calendar activity + month counters |
| GET | `/api/session?date=` | one day's volume, completion, duration, RPE |
| GET | `/api/progress[/:id]` | every logged exercise; one exercise's series |
| GET | `/api/insights?date=` | today's insights, per surface |
| POST | `/api/insights/:id/dismiss` | dismiss for the day |
| GET / POST | `/api/advisor` | Exercise Advisor queue; swipe result |

## Design system

`design-system/lifter/MASTER.md` holds the generated reference. Two deliberate
departures from it, both recorded here so they aren't "corrected" later:

- **The accent stays `#FF4D4D`,** not the recommended energy-orange. The UI was
  imported from a specific Claude Design source built around that red; swapping
  the brand colour would discard the design rather than elevate it.
- **The suggested page pattern was ignored.** It resolved to a webinar
  registration funnel, which has nothing to do with a training log.

What *was* adopted: Barlow Condensed / Barlow (an athletic pairing), an
off-black `#0A0A0B` base instead of pure black, and the accessibility and
motion rules below.

### Contrast and touch rules

Text alpha tokens in `src/theme.js` are tuned against the **card** surface
(`#1C1C1E`), the worst case in the app. Two consequences worth knowing:

- **`accentInk` exists because white-on-`#FF4D4D` only reaches 3.27:1.** Any
  text or glyph sitting on an accent fill (selected calendar day, active pill)
  uses the dark ink instead, at 6.4:1 — the same dark-on-colour treatment the
  design already used for the advisor's green accept button.
- **`accentGradient` starts at `#D93A3A`, not `#FF4D4D`,** so the white label on
  the Exercise Advisor button clears 4.5:1.

Every interactive element is ≥44×44px. Where the design calls for a small
visual — the 22px plan checkbox, the 34px calendar day — the control renders
the small mark inside a full-size button rather than shrinking the hit area.

Press feedback is a `.pressable` class: a 140ms `scale(0.97)`. Transform only,
never a property that changes layout bounds and nudges neighbouring rows.
Everything is disabled under `prefers-reduced-motion`.

## How exercises are measured

Every exercise carries a `metric`, and it drives the log form, the plan
subtitle and the progress chart:

| Metric | Examples | Logged as | Charted as |
| --- | --- | --- | --- |
| `weight` | squat, bench, row | weight + reps | estimated 1RM (Epley) |
| `reps` | pull-up, box jump | reps | best set of the day |
| `time` | plank, battle ropes | seconds | longest hold of the day |

Charting weight work as **estimated 1RM** means changing rep ranges doesn't
read as a regression. Bodyweight and timed work never had a weight to plot,
which is why they get their own units rather than being forced onto a
weight axis.

**Volume** (Home tile, Training stat line) is weight moved — `weight × reps`
summed. Bodyweight and timed work contribute zero to it by design; it is a
loaded-lifting metric and only ever compares against itself.

**Duration** is real seconds for timed work, and estimated at ~3.5 min per
set (including rest) for everything else.

## Current scope

Single profile, protected by one shared password (see [Authentication](#authentication)) —
everything lives in a single SQLite file.
The schema already carries `profile_id` on every row, so adding real users
later means relaxing the `PROFILE_ID` constant in `server/db.js` rather than
reshaping tables.

Cross-device sync and push notifications that reach you while the app is
closed would build on this API (a hosted DB, node-cron, Web Push/VAPID);
they aren't wired up yet.
