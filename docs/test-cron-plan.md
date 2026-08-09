# Plan: Points-Calculation Testing Harness (EPL app)

## Context / decisions (confirmed with user)

- Test DB: **Prisma Postgres, new dedicated free DB** (reusable for future tests).
- Season: **2025/26 (complete)**; 2026/27 not started (date 2026-08-09).
- Predictions: existing scores/\*.json (MW1 x7 users, MW2 jorge) **+ synthetic** predictions for more users/matchweeks.
- Actual results: **fetch once via football-data.org** (user has key locally), commit as static fixtures for offline determinism.
- Deliverable doc lives in `docs/POINTS_TESTING.md` (create during implementation).

## Key architecture facts

- NO local Match table. Matches/results come live from football-data.org (competition 2021). Prediction & UserPoints store string `matchId` only.
- Scoring: src/lib/points.js `calculateMatchPoints(matchId, homeActual, awayActual)` -> 3 exact / 1 result / 0. Idempotent (deletes prior UserPoints for match). Same file has getUserPointsSummary.
- Injection points for "actual results":
  - `/api/cron/calculate-points` (GET/POST, Bearer CRON_SECRET) — IGNORES body, fetches live `/api/matches?status=FINISHED` (current season) + writes cron_logs.
  - `POST /api/points` (Bearer CRON_SECRET) — accepts `{ matches: [{id,status,score:{fullTime:{home,away}}}] }` in BODY. Best for controlled tests. Does NOT write cron_logs.
- Prisma v7 + @prisma/adapter-pg, single DATABASE_URL, no Accelerate. prisma.config.ts loads .env.local then .env (dotenv does not override already-set vars).
- Match IDs: MW1=537785-537794, MW2=537795-537804 (10/matchday sequential). scores/\*.json keys are these IDs.
- seed.js already instantiates its own PrismaClient+PrismaPg (pattern to reuse in scripts).
- package.json: dotenv (not dotenv-cli), tsx installed. jsconfig.json has @/\* alias (no tsconfig.json).

## Phases (each independently verifiable)

### Phase 1 — Provision test DB + tooling

- Create new Prisma Postgres DB (test). Grab **direct TCP postgres:// string** (NOT prisma+postgres:// accelerate) so @prisma/adapter-pg works.
- Create `.env.test`: DATABASE_URL(test), CRON_SECRET(test), FOOTBALL_DATA_API_KEY, NEXT_PUBLIC_APP_URL=http://localhost:3000. Add `.env.test` to .gitignore.
- Add devDeps: dotenv-cli, tsconfig-paths. Add tsconfig.json (or reuse) with paths @/_->./src/_ for tsx script imports.
- Add npm scripts: db:test:migrate (dotenv -e .env.test -- prisma migrate deploy), db:test:studio, db:test:seed, dev:test, points:calc, points:trigger, test:points.
- Run db:test:migrate -> schema created.
- VERIFY: prisma studio (test env) shows all tables empty.

### Phase 2 — Seed users/league/predictions

- prisma/seed-test.js: upsert 7 real users (jorge,eric,ever,ray,ricardo,rob,cisco @example.com) + 1 admin, a test league + memberships; import scores/_.json into user_predictions (upsert on userId+matchId); add deterministic synthetic predictions (seeded RNG) for MW1-MW5 across all users, saved to test-fixtures/2025-26/predictions/_.json for stability.
- Run db:test:seed.
- VERIFY: per-user/matchday prediction counts; leaderboard shows users at 0 pts.

### Phase 3 — Results fixtures + expected-points oracle

- scripts/fetch-results.js: one-time, fetch competition 2021 season 2025 finished matches for MW1-MW5 (`?season=2025&matchday=N`), save test-fixtures/2025-26/results/matchday-N.json in football-data matches shape. Respect free-tier rate limit (10/min).
- scripts/compute-expected.js: pure re-implementation of 3/1/0 rules over (predictions + results) -> test-fixtures/2025-26/expected-points.json (per-user per-MW + cumulative). Independent oracle.
- VERIFY: results cover every predicted matchId; expected table printed.

### Phase 4 — Manual local runner (CORE)

- scripts/calculate-points.js: loads .env.test, reads results fixtures (`--matchday N` | `--all`), imports the REAL calculateMatchPoints from @/lib/points (via tsconfig-paths+tsx), calls it per finished match. This is the offline "cron down" fallback.
- Run points:calc -- --all.
- VERIFY: user_points totals == expected-points.json exactly; re-run => idempotent (unchanged); leaderboard order correct.

### Phase 5 — API/cron path end-to-end

- dev:test starts next dev with .env.test.
- scripts/trigger-cron.js: POST results fixtures to /api/points with Bearer CRON_SECRET (body {matches:[...]}).
- VERIFY: same totals as Phase 4; 401 on bad/missing secret; per-matchday cumulative correct.
- NOTE: /api/cron/calculate-points can't score 2025/26 (fetches live current season) — treat /api/points as scoring-path test; validate real cron against prod live data separately.

### Phase 6 — Free scheduling + fallback + docs

- Keep Vercel Cron vercel.json 0 4 \* \* \* (free on Hobby daily) for prod. Document Prisma can't run job free.
- Add .github/workflows/calculate-points.yml: schedule + workflow_dispatch, curls deployed /api/cron/calculate-points with secrets CRON_SECRET, APP_URL. Free backup scheduler.
- Document manual command (points:calc / trigger-cron) for cron-down scenario.
- Create docs/POINTS_TESTING.md runbook (the documented plan).
- VERIFY: workflow_dispatch runs OK; scheduled entry visible.

### Phase 7 (optional) — Regression test

- scripts/test-points.js: seed -> calc -> assert totals==oracle, exit nonzero on mismatch. npm test:points. Optionally CI.
- VERIFY: passes; break a prediction => fails.

## Files (new unless noted)

- docs/POINTS_TESTING.md; .env.test; .gitignore(mod); package.json(mod); tsconfig.json;
- prisma/seed-test.js; scripts/fetch-results.js; scripts/compute-expected.js; scripts/calculate-points.js; scripts/trigger-cron.js;
- test-fixtures/2025-26/{results,predictions}/\*.json, expected-points.json; .github/workflows/calculate-points.yml
- Reuse (no edit): src/lib/points.js, src/app/api/points/route.js, src/app/api/cron/calculate-points/route.js, scores/\*.json, src/lib/prisma.js, prisma/seed.js, prisma.config.ts

## DONE (this session)

- Cron override ADDED: src/app/api/cron/calculate-points/route.js POST {matches:[...]} scores supplied, else live. Doc comment updated.
- scripts/calculate-points.mjs created (HTTP runner -> POST cron endpoint). Args: -m/--matchday, --all, -r/--results, --live, --url, --env(default .env.local), --secret, --dry-run, -h. Normalises football-data / array / flat id->{home,away} shapes. Loads env via dotenv. Node .mjs, global fetch.
- package.json script: points:calc = node scripts/calculate-points.mjs.
- docs/POINTS_TESTING.md created (plan + override + local runner usage/args). References planned files.
- Lint clean. Fixtures dir not created yet (Phase 1-3 pending) so --matchday errors ENOENT (expected).

## Further considerations / risks

1. Prisma Postgres URL type — need direct TCP postgres:// for adapter-pg. If only accelerate URL: fallback local Docker/Neon, or add @prisma/extension-accelerate. Rec: direct string; Docker fallback.
2. Alias @/ in standalone scripts — use tsconfig-paths + tsx (rec) so offline runner reuses exact calculateMatchPoints. Alt: post to running dev server (not fully offline).
3. Cron endpoint vs historical data — /api/cron/calculate-points ignores body/live-fetches. Rec (A) use /api/points as scoring test + validate real cron on prod. Alt (B) add optional results override to cron (more code).
