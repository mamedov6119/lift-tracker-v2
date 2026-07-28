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
| `LIFT_SIGNUP_CODE` | unset | If set, creating an account requires this code. Unset means open registration |

`GET /api/health` returns `{"ok":true}` for platform health checks.

## Authentication

Email + password accounts, with the session in an httpOnly cookie. **No new
dependencies** — `express`, `node:sqlite` and `node:crypto` cover all of it.

Why this shape:

- **scrypt from `node:crypto`, not bcrypt or argon2.** Those are native
  modules, and this project deliberately avoids native compilation (see
  `node:sqlite`) so the Alpine image builds with a plain `npm ci`. scrypt is
  memory-hard and OWASP-listed for password storage. Cost parameters are stored
  per-hash, so raising them later doesn't invalidate existing passwords.
- **A session cookie, not a JWT in localStorage.** Client and API are
  same-origin, so there's no cross-domain reason for a bearer token — and an
  httpOnly cookie can't be read by JavaScript, so XSS can't exfiltrate the
  session. Revocation is immediate (logout, password change) with no
  refresh-token machinery.
- **Not Clerk / Auth0 / Supabase.** An external dependency and a bill, for what
  is one container and one SQLite file.

Details worth knowing:

- Only a **SHA-256 of the session token** is stored, so a leaked database
  yields no usable sessions — the same reasoning as not storing raw passwords.
- Sessions last 30 days and **slide**: used within that window they re-issue,
  so an app in regular use never signs you out mid-week.
- **Changing your password signs out every other device.**
- Login is rate-limited to 10 attempts per 15 min **keyed on the email**, not
  the IP, so one account under attack can't lock out everyone behind the same
  NAT. Signup is 5/hour per IP.
- Wrong password and unknown account return the **same message with comparable
  timing**, so the endpoint can't be used to discover who has an account.
- CSRF cover is `SameSite=Lax` plus a JSON-only API with no CORS: a cross-site
  form post can't set `Content-Type: application/json`, so it never reaches a
  handler.
- **`/api/health` stays public.** Fly's health checks are unauthenticated, and
  a 401 there would mark the machine unhealthy and roll back every deploy.

### Per-account data isolation

Every table carries `profile_id`, which is now the user id, and every repo
function takes the caller's id explicitly — there is no ambient "current user"
to forget. The built-in exercise catalog is shared; **custom exercises belong
to the account that created them** and are invisible to everyone else.

`server/lib/auth.test.js` asserts this directly: one account cannot read,
modify, delete or reset another's sets, plan items or custom exercises.

### Upgrading an existing deployment

Data logged before accounts existed lives under profile id 1. **The first
account created adopts it**, so an existing install keeps its history rather
than stranding it. Every account after that starts empty.

`LIFT_PASSWORD` and `LIFT_USER` (the old shared-password gate) are gone:

```bash
fly secrets unset LIFT_PASSWORD LIFT_USER
```

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
| POST | `/api/auth/signup` | create an account |
| POST | `/api/auth/login` | sign in |
| POST | `/api/auth/logout` | sign out |
| GET | `/api/auth/me` | the signed-in account, or 401 |
| POST | `/api/auth/password` | change password; signs out other devices |
| GET / PATCH | `/api/profile` | profile name, training style, weight unit, mute |
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

## Splash

`src/components/SplashScreen.jsx` is the app-open animation — a 2.5s
clean-and-jerk that ends with the wordmark dropping onto the bar, ported from
the Claude Design project `Lifter Splash.dc.html`. The pose maths, timeline and
drawing are carried over verbatim; only the DC runtime wrapper was replaced
with a plain `requestAnimationFrame` loop, so nothing extra ships.

Two behavioural changes from the source: the design **loops**, this plays one
pass and reports done (its built-in fade at `u≈0.9–1.0` doubles as the exit),
and the tweakable props are pinned to the values saved in the design
(`weight 0.9`, `showFloor true`, wordmark "Lifter").

- It renders **over an already-mounted app**, so the 2.5s covers the first data
  fetch rather than adding to it.
- **Tap or press any key to skip.**
- Under `prefers-reduced-motion` it holds the landed frame for 900ms instead of
  animating, so the brand moment still happens with no motion.
- The wordmark needs **Barlow italic 800**, which is why `index.html` requests
  the `ital` axis.
- Dev only: `?splash=0.62` freezes the timeline at that normalised position to
  inspect a single frame. Guarded by `import.meta.env.DEV`, so it is stripped
  from production builds.

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

Multi-account with per-account data isolation (see
[Authentication](#authentication)); everything lives in a single SQLite file.
The schema already carries `profile_id` on every row, so adding real users
later means relaxing the `PROFILE_ID` constant in `server/db.js` rather than
reshaping tables.

Cross-device sync and push notifications that reach you while the app is
closed would build on this API (a hosted DB, node-cron, Web Push/VAPID);
they aren't wired up yet.
