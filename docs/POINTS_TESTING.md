# Points Calculation — Testing Plan & Runbook

How we test the points-calculation cron end to end with dummy data, and how
to run the job manually from your machine.

> Scoring status is verified against a **separate, reusable test database** so
> production data is never touched.

---

## 1. Objective

Prove that after each matchweek the total points are calculated correctly by:

1. Seeding a test database with users + predictions.
2. Feeding it **real 2025/26 final scores** (committed as fixtures).
3. Running the calculate-points job.
4. Asserting `user_points` totals match an independently computed expectation.

The job must be runnable **manually from this machine** (local test, or when the
scheduler is down) and on a **free schedule** in production.

---

## 2. Key architecture facts

- **No local `Match` table.** Matches and results come live from
  [football-data.org](https://www.football-data.org) (competition `2021`).
  `Prediction` and `UserPoints` store only a string `matchId`.
- **Scoring** — [`calculateMatchPoints`](../src/lib/points.js): `3` exact
  score, `1` correct result, `0` otherwise. Idempotent (clears prior
  `UserPoints` for the match before inserting).
- **Result injection points:**
  - `GET /api/cron/calculate-points` — Vercel Cron; fetches **live** finished
    matches (current season) and writes `cron_logs`.
  - `POST /api/cron/calculate-points` — with `{ matches: [...] }` it scores
    **those exact matches** (test/backfill override). Without a body it behaves
    like the GET (live fetch).
  - `POST /api/points` — also accepts a `matches` array; same scoring, no
    `cron_logs`.
- All calculate endpoints require `Authorization: Bearer <CRON_SECRET>`.
- Prisma v7 + `@prisma/adapter-pg`, single `DATABASE_URL`, no Accelerate.
  `prisma.config.ts` loads `.env.local` then `.env` (dotenv does not overwrite
  already-set vars).
- Match IDs are sequential: MW1 = `537785–537794`, MW2 = `537795–537804`
  (10 per matchday). `scores/*.json` keys are these IDs.

---

## 3. Decisions

| Topic         | Choice                                                             |
| ------------- | ------------------------------------------------------------------ |
| Test DB       | **Prisma Postgres**, new dedicated free database (reusable)        |
| Season        | **2025/26** (complete; 2026/27 hasn't started)                     |
| Predictions   | Existing `scores/*.json` **+ synthetic** for more users/matchweeks |
| Results       | **Fetched once** from football-data.org, committed as fixtures     |
| Cron override | **Yes** — `POST { matches }` scores supplied results               |
| Scheduling    | Vercel Cron (prod) + GitHub Actions backup + local manual          |

---

## 4. Phased plan

Each phase is independently verifiable.

### Phase 1 — Provision test DB + tooling

- Create a new Prisma Postgres database for testing. Grab its **direct TCP
  `postgres://` connection string** (not the `prisma+postgres://` Accelerate
  URL — the `@prisma/adapter-pg` setup needs a real TCP connection).
- Create `.env.test` with `DATABASE_URL` (test), `CRON_SECRET` (test),
  `FOOTBALL_DATA_API_KEY`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
  Add `.env.test` to `.gitignore`.
- Apply the schema:
  ```bash
  npx dotenv -e .env.test -- prisma migrate deploy
  ```
- **Verify:** `npx dotenv -e .env.test -- prisma studio` shows empty tables.

> If the free tier exposes only the Accelerate URL, fall back to local Docker
> Postgres or a Neon branch for the test DB.

### Phase 2 — Seed users, league, predictions

- `prisma/seed-test.js` upserts the 7 users from `scores/*.json`
  (jorge, eric, ever, ray, ricardo, rob, cisco) + a test league, imports their
  predictions into `user_predictions`, and generates deterministic synthetic
  predictions (seeded RNG) for MW1–MW5, saved under
  `test-fixtures/2025-26/predictions/` for stability.
- **Verify:** per-user prediction counts; leaderboard shows everyone at 0 pts.

### Phase 3 — Results fixtures + expected-points oracle

- `scripts/fetch-results.js` fetches finished MW1–MW5 for season 2025
  (`/v4/competitions/2021/matches?season=2025&matchday=<n>`) and writes
  `test-fixtures/2025-26/results/matchday-<n>.json` (football-data shape).
  Respect the free-tier limit (~10 req/min).
- `scripts/compute-expected.js` re-implements the 3/1/0 rules over
  (predictions + results) and writes `test-fixtures/2025-26/expected-points.json`
  (per user, per matchweek, cumulative). This is the assertion oracle.
- **Verify:** every predicted matchId has a result; expected table prints.

### Phase 4 — Run the job & verify (core)

- Start a dev server against the test DB, then run the local runner
  (see §6). Score matchday by matchday, then all.
- **Verify:** `user_points` totals equal `expected-points.json`; re-running is
  idempotent (no change); leaderboard order is correct.

### Phase 5 — API/auth path

- **Verify:** `POST /api/cron/calculate-points` with `{ matches }` scores the
  same totals; `401` on missing/wrong secret; `cron_logs` rows written.

### Phase 6 — Free scheduling + fallback

- Keep Vercel Cron ([`vercel.json`](../vercel.json), `0 4 * * *` — free on
  Hobby, daily). **Prisma cannot run this job for free.**
- Add a GitHub Actions workflow (`schedule` + `workflow_dispatch`) that curls
  the deployed cron endpoint with `secrets.CRON_SECRET` / `secrets.APP_URL` as a
  free backup scheduler.
- Manual fallback: the local runner in §6.
- **Verify:** manual `workflow_dispatch` run succeeds.

### Phase 7 (optional) — Regression test

- `scripts/test-points.js`: seed → calculate → assert totals == oracle, exit
  non-zero on mismatch. Wire into CI later.

---

## 5. Cron override (`POST { matches }`)

The live cron fetches finished matches for the **current** season, so it can't
score historical 2025/26 data on its own. The override lets us feed exact
results to the real cron function ([route](../src/app/api/cron/calculate-points/route.js)):

- `POST` body `{ matches: [ { id, status: "FINISHED", score: { fullTime: { home, away } } }, ... ] }`
  → scores those matches, skips the live fetch, still writes `cron_logs`.
- `POST` with no body, or `GET` → unchanged live behaviour.

This exercises the full cron path (auth + logging + loop), not just the scoring
function.

---

## 6. Running the job locally

Use the runner to trigger the job by hand from this machine — for testing, or
as a fallback if the scheduler is down. It POSTs to
`/api/cron/calculate-points`, so a server must be running (local dev or the
deployed app).

```bash
npm run points:calc -- [options]
# or
node scripts/calculate-points.mjs [options]
```

### Arguments

| Argument               | Description                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `-m, --matchday <n>`   | Score committed fixtures for one matchday (`test-fixtures/2025-26/results/matchday-<n>.json`). |
| `--all`                | Score every `matchday-*.json` fixture, merged.                                                 |
| `-r, --results <file>` | Score a specific results JSON file. Overrides `--matchday`.                                    |
| `--live`               | Send no matches; the server fetches live finished matches (real production behaviour).         |
| `--url <baseUrl>`      | Target server. Default: `$NEXT_PUBLIC_APP_URL` or `http://localhost:3000`.                     |
| `--env <file>`         | Env file to load `CRON_SECRET` / URL from. Default: `.env.local`.                              |
| `--secret <token>`     | `CRON_SECRET` override (else read from env).                                                   |
| `--dry-run`            | Print the request that would be sent; don't send it.                                           |
| `-h, --help`           | Show usage.                                                                                    |

The result source is optional — with none of `--matchday`, `--all`,
`--results`, or `--live`, it defaults to a **live** run.

### Accepted results-file shapes

The runner normalises any of these into what the cron expects:

- football-data response: `{ "matches": [ { id, status, score.fullTime… } ] }`
- a bare array of those match objects
- a flat id→score map (handy for hand-written fixtures):
  ```json
  { "537785": { "home": 2, "away": 1 }, "537786": { "home": 0, "away": 0 } }
  ```

### Examples

```bash
# Score matchday 1 fixtures against a local dev server (.env.local secret)
npm run points:calc -- --matchday 1

# Score all fixtures against the test-DB dev server
npm run points:calc -- --all --env .env.test

# Preview the payload without sending
npm run points:calc -- --matchday 2 --dry-run

# Trigger a real live run on production
npm run points:calc -- --live --url https://your-app.vercel.app
```

> To test against the test database, start the server with the test env first,
> e.g. `npx dotenv -e .env.test -- next dev`, then point the runner at it with
> `--env .env.test`.

---

## 7. Files

| Path                                                 | Purpose                                         |
| ---------------------------------------------------- | ----------------------------------------------- |
| `src/app/api/cron/calculate-points/route.js`         | Cron endpoint + `{ matches }` override          |
| `scripts/calculate-points.mjs`                       | Manual local runner                             |
| `docs/POINTS_TESTING.md`                             | This document                                   |
| `.env.test` _(planned)_                              | Test DB connection + secrets (gitignored)       |
| `prisma/seed-test.js` _(planned)_                    | Seed users / league / predictions               |
| `scripts/fetch-results.js` _(planned)_               | One-time results fetch → fixtures               |
| `scripts/compute-expected.js` _(planned)_            | Independent expected-points oracle              |
| `test-fixtures/2025-26/**` _(planned)_               | Results, synthetic predictions, expected points |
| `.github/workflows/calculate-points.yml` _(planned)_ | Free backup scheduler                           |
