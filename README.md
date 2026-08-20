# Goal Tracker

A local, standalone web app for capturing and tracking short/medium/long-term goals. Every goal reduces to one interaction — check off "I did the thing" — with a frequency target that determines what counts as progress.

## Stack

- **Backend:** Node/Express, data persisted to a local JSON file (`server/data/goals.json`, created on first run with a few sample goals). No database, no accounts, no hosting required.
- **Frontend:** React + Vite.

## Running it

```
npm install        # installs root, server, and client deps
npm run dev         # runs the API (port 3001) and the Vite dev server (port 5173) together
```

Open http://localhost:5173. In dev, if `APP_PASSWORD` isn't set, the password defaults to `goals`.

For a single-process production-style run (Express serves the built client):

```
npm start
```

Open http://localhost:3001.

## Auth

The whole app sits behind a single shared password (no accounts, matching the "local app" brief) — a login screen gates the UI, and every API route requires a signed, httpOnly session cookie good for 30 days.

Set these environment variables before deploying anywhere public:

- `APP_PASSWORD` — required in production; the server refuses to start without it. Locally it falls back to `goals` with a console warning.
- `APP_SESSION_SECRET` — signs the session cookie. If unset, a random secret is generated at boot, which means everyone gets logged out on every server restart. Set a fixed value to persist logins across restarts/deploys.

Login attempts are rate-limited (10 per 15 minutes per IP) and the cookie is marked `secure` automatically when `NODE_ENV=production`, so it only travels over HTTPS.

## Data model

A single `Goal` object with `title`, `tier` (short/medium/long-term), `domain` tag, `definition_of_success`, optional `qualifying_examples`, a `frequency_target` (`daily` / `N times per week or month` / `unlimited` / `until X`), an optional `parent_id` (for funnels and checklists), `status`, an optional `next_review_at`, and a timestamped `check_ins` log. Progress, streaks, and totals are all computed from `check_ins` — nothing is double-stored.

Data lives in `server/data/goals.json`, which is gitignored (it's local state, not source). Delete it to reset to the seeded sample goals.

## Design decisions

- **Weekly targets use the calendar week, resetting Monday** — not a rolling 7 days. This was called out as an open question in the build brief; calendar week keeps "this week" legible and matches how most people think about a weekly target.
- **Streaks have a one-day/one-period grace window**: today's (or this period's) streak isn't broken until the day/period actually ends, so opening the app in the morning doesn't show a broken streak from yesterday.
- **"Needs review"** applies to `active` goals only, and triggers when `next_review_at` has passed, or — if no review date is set — when the goal hasn't been touched (edited or checked into) in 14+ days.

## v1 scope

Implemented: the core goal object, the single check-in mechanic (with optional note), frequency-target progress and streaks, until-X progress, unlimited logging, the needs-review flag, and the home dashboard grouped by tier.

Also implemented (ahead of the "fast-follow" recommendation, since the data model needed it): `parent_id` linking, with parent cards showing a rollup of child totals and child goals linking back to their parent. Percentage conversion-rate math between funnel stages is the one piece left as a true fast-follow.
