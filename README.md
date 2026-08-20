# Goal Tracker

A standalone web app for capturing and tracking short/medium/long-term goals. Every goal reduces to one interaction — check off "I did the thing" — with a frequency target that determines what counts as progress.

## Stack

Static React + Vite app, deployed to GitHub Pages. There is no backend: goals persist to the browser's `localStorage`, seeded with a few sample goals on first load. Data lives only in the browser/device it was entered on — it doesn't sync across devices, and clearing site data or using a different browser starts fresh.

## Running it locally

```
npm install
npm run dev
```

Open the URL Vite prints (http://localhost:5173/goal-tracker/).

## Deploying

Pushing to `main` (or the active feature branch — see `.github/workflows/deploy-pages.yml`) triggers a GitHub Actions workflow that builds the app and publishes it to GitHub Pages. One-time setup in the repo: **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.

The Vite `base` and the router's `basename` are both set to `/goal-tracker/` to match this repo's Pages URL (`https://<owner>.github.io/goal-tracker/`). A `404.html` redirect trick (see `client/public/404.html`) makes deep links and page refreshes work despite GitHub Pages having no server-side routing.

## Auth

The app sits behind a single shared password, checked client-side, with the unlocked state remembered in `localStorage` for 30 days.

**This is not real security.** Because the app is 100% static, the password and all the app's logic ship inside the JS bundle that loads in the browser — anyone with the URL can read the source or open dev tools and bypass the check, or inspect `localStorage` directly. It only deters a casual look, not someone who tries. Given that tradeoff, keep in mind this is personal data (health, work, family goals) sitting behind a lock that's mostly cosmetic.

The password lives in `client/src/api.js` (`PASSWORD` constant) — change it there and redeploy if you want a different one.

## Data model

A single `Goal` object with `title`, `tier` (short/medium/long-term), `domain` tag, `definition_of_success`, optional `qualifying_examples`, a `frequency_target` (`daily` / `N times per week or month` / `unlimited` / `until X`), an optional `parent_id` (for funnels and checklists), `status`, an optional `next_review_at`, and a timestamped `check_ins` log. Progress, streaks, and totals are all computed from `check_ins` — nothing is double-stored.

## Design decisions

- **Weekly targets use the calendar week, resetting Monday** — not a rolling 7 days. This was called out as an open question in the build brief; calendar week keeps "this week" legible and matches how most people think about a weekly target.
- **Streaks have a one-day/one-period grace window**: today's (or this period's) streak isn't broken until the day/period actually ends, so opening the app in the morning doesn't show a broken streak from yesterday.
- **"Needs review"** applies to `active` goals only, and triggers when `next_review_at` has passed, or — if no review date is set — when the goal hasn't been touched (edited or checked into) in 14+ days.

## v1 scope

Implemented: the core goal object, the single check-in mechanic (with optional note), frequency-target progress and streaks, until-X progress, unlimited logging, the needs-review flag, and the home dashboard grouped by tier.

Also implemented (ahead of the "fast-follow" recommendation, since the data model needed it): `parent_id` linking, with parent cards showing a rollup of child totals and child goals linking back to their parent. Percentage conversion-rate math between funnel stages is the one piece left as a true fast-follow.
