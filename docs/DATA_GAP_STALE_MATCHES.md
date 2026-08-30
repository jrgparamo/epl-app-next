# Data Gap: Matches Stuck at `TIMED`

## Summary

The app reads live fixtures from the **football-data.org free tier**. Some
fixtures never get promoted past their pre-kickoff `TIMED` status, so the API
returns them with a `null` score long after they were actually played. The app
faithfully renders this stale data, which produces two visible symptoms:

- The match card shows **"Match started — predictions locked"** indefinitely
  instead of a final score.
- Points are **never calculated** for those matches, so members' picks for them
  can never be scored.

This is an **upstream data problem**, not a bug in the app's status handling.

## Evidence (observed 2026-08-30)

Querying the competition matches endpoint for the surrounding dates:

```
560555  2026-08-28T19:00:00Z  status=FINISHED  score={home:1, away:4}
560552  2026-08-29T11:30:00Z  status=TIMED     score={home:null, away:null}
560560  2026-08-29T14:00:00Z  status=TIMED     score={home:null, away:null}
560554  2026-08-30T13:00:00Z  status=FINISHED  score={home:1, away:0}
```

Newer-day matches are already `FINISHED` while the previous day's are still
`TIMED`. The single-match endpoint confirms the record is frozen:

```
GET /v4/matches/560552
status      = TIMED
utcDate     = 2026-08-29T11:30:00Z
lastUpdated = 2026-08-29T05:20:36Z   ← frozen ~6h BEFORE kickoff
score       = { fullTime: { home: null, away: null }, ... }
```

`lastUpdated` predates kickoff, so the free tier simply stopped updating the
record. There is no result to read at the source.

Quick manual check (reads the key from `.env.local` without printing it):

```bash
KEY=$(grep '^FOOTBALL_DATA_API_KEY=' .env.local | cut -d= -f2- | tr -d '"')
curl -s -H "X-Auth-Token: $KEY" \
  "https://api.football-data.org/v4/competitions/2021/matches?dateFrom=2026-08-26&dateTo=2026-09-01"
```

## Why it surfaces in the UI and points

- Status enum (football-data v4): `SCHEDULED, TIMED, IN_PLAY, PAUSED, FINISHED,
SUSPENDED, POSTPONED, CANCELLED, AWARDED`. `TIMED` means the kickoff time is
  confirmed but the match has **not started** — a genuinely past `TIMED` match
  is only ever caused by stale source data.
- `src/app/components/MatchCard.js` derives `matchStarted` from `utcDate`
  (past → true) and `matchFinished` from status (`FINISHED`/`AWARDED` only →
  false here), so a past `TIMED` match falls into the "predictions locked"
  branch.
- `src/lib/points.js` skips anything that is not `FINISHED` with a full-time
  score (`if (match?.status !== "FINISHED" || !match?.score?.fullTime) continue;`),
  so no `UserPoints` rows are ever written for stuck matches.

## Mitigation options (as considered)

1. **Wait for the source (original behavior).** If the free tier eventually
   updates the record, the daily cron / lazy refresh backfills points and the
   card shows the score. For records frozen before kickoff this may never
   happen.
2. **Persist results on `FINISHED`.** Add a `MatchResult` table and snapshot
   `score.fullTime` the first time a match is seen as `FINISHED`. Read the card
   score and points from that snapshot so a later stale API response cannot
   regress a match that was already final. Does not help matches that were
   _never_ delivered as `FINISHED`.
3. **Admin manual entry.** Allow an admin to enter a final score for matches the
   API abandons, feeding the same `MatchResult` store so picks can be scored.
4. **Paid API tier.** More reliable/faster result updates reduce (but don't
   fully eliminate) the gap.

## Decision record

**Chosen: options 2 + 3 together** — snapshot real results as soon as they
arrive, and provide a manual override for the ones that never do. Prisma became
the source of truth for finished matches. Option 4 (paid tier) was declined for
cost; option 1 alone was insufficient because some records freeze before
kickoff and never advance.

### Read-path sub-decision: A vs B

Both options share the same core (per-match overlay where the DB score wins,
manual entry, auto-snapshot). They differ only in how a **past matchday** read
touches the football API:

- **Option A — DB-first + `MatchdayMeta` (CHOSEN).** When every fixture of a
  matchday is snapshotted (`MatchResult` row count == learned `fixtureCount`),
  the matchday is served entirely from Prisma and the football API is skipped.
  - Pros: zero football-data calls when browsing finished matchweeks; protects
    the football free tier's ~10 req/min limit; survives serverless cold starts
    (in-memory fixture cache is per-instance and short-lived).
  - Cons: one extra tiny table (`MatchdayMeta`) and a completeness check.
- **Option B — always overlay (rejected).** Every view fetches the football API
  (30-min in-memory cache) and overlays DB scores. Simpler (no extra table), but
  past matchweeks still hit the football API on every cold start / cache miss.

**Why A:** the stated goals were "maximize cached data, minimal external
requests" and "Prisma is the source of truth." The football rate limit is the
scarcer resource, and A eliminates those calls for finished history at the cost
of one small table. B → A is a non-breaking upgrade (overlay is the foundation;
DB-first bolts on top), so B could have been a stepping stone, but A was adopted
directly.

**Why not hardcode "10 fixtures per matchday":** fixtures per matchday are not
always 10 — postponed/rescheduled matches keep their matchday number but move
dates. Completeness therefore uses the fixture count learned from the last
football-data fetch (`MatchdayMeta.fixtureCount`), not a constant.

## Implemented solution

- **Tables** (`prisma/schema.prisma`, migration `add_match_results`):
  - `MatchResult` — one row per finished match: fixtures (teams, `utcDate`,
    `matchday`) + `homeScore`/`awayScore` + `status` + `source` (`api` |
    `manual`). `matchId` PK; indexed by `matchday`.
  - `MatchdayMeta` — `{ matchday, fixtureCount }`, backs the DB-first
    completeness check.
- **Helpers** (`src/lib/match-results.js`): `getCompleteMatchdayFromDb` (serve
  a fully-snapshotted matchday from Prisma), `overlayMatchdayResults` (DB score
  wins; also learns `fixtureCount`), `snapshotFinishedMatches` (batched: one
  read, writes only new/changed, never overwrites `manual`), and
  `upsertManualMatchResult` (admin, always wins). Reads are cached in-process
  per matchday (60 s TTL) and invalidated on write.
- **Read path** (`src/lib/matches-service.js`): `fetchMatchesByMatchday` now
  tries DB-first, else fetches the fixture list (cached 30 min) and overlays DB
  results. This one change covers `/api/matches`, `/api/predictions/compare`,
  and `/api/predictions/league-picks` (they share the function).
- **Auto-snapshot**: the daily cron (`/api/cron/calculate-points`) and the lazy
  refresh (`src/lib/points.js` `refreshRecentMatchPoints`) call
  `snapshotFinishedMatches` on the results they already fetched — no new
  external request. `calculateMatchPoints` scoring logic is unchanged.
- **Manual entry**: `POST /api/admin/match-result` (global-admin only) writes a
  `manual` `MatchResult` and immediately reruns `calculateMatchPoints`. The
  `/admin` page has a "Match Results" section to enter/override scores and
  flags stuck matches.

## Prisma Postgres free-tier limits (drove the design)

Source: prisma.io/pricing (2026). Free plan:

- **200k database operations / month** — 1 query = 1 op (create/read/update/
  delete each count; **cached reads also count**). This is the binding
  constraint, so reads are batched (one `findMany` per matchday) and cached
  in-process, and snapshot writes only happen for new/changed results.
- **500 MB storage**, **50 databases**.
- **Pooled connections capped at 10** (direct also 10), 60-min idle timeout —
  hence the singleton `PrismaClient` in `src/lib/prisma.js` (never per-request).
- **No backups** on free (start at the Starter tier). Community support. No
  overage — usage hard-stops at the limits.
- The app uses the `@prisma/adapter-pg` driver (direct pg) via a singleton, so
  **Prisma Accelerate `cacheStrategy` is not available** — all caching is
  app-level (in-memory).

Budget impact: the overlay adds ≤1 cached DB read per matchday view; auto-
snapshot writes only when a result is new or changed (~0 after a matchday
settles). Comfortably within 200k ops/month.

## Notes

- The `scores/` directory is **dummy seed data** for a test database and is
  **not** a runtime fallback for missing results.
- Known edge: if a fixture is added to a matchday _after_ it was already served
  from the DB as complete (rare late reschedule), the new fixture may be missed
  until the matchday is re-fetched; an admin can enter it manually. Overlay,
  manual entry, and auto-snapshot are all count-agnostic and unaffected.
