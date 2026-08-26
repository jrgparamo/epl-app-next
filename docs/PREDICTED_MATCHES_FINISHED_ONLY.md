# Shelved Plan: `predicted_matches` = finished-only

**Status:** Tabled (not implemented). Low priority.
**Date:** 2026-08-26

## Summary

Redefine the per-user `predicted_matches` stat to count **only predictions for
matches that have finished**, instead of all predictions the user has submitted
(which currently includes upcoming, not-yet-played matches).

## Why it was shelved

- The stat is surfaced in the UI only on the **account page**, so the payoff is
  small relative to the work.
- The current, simpler definition (all submitted predictions) is adequate once
  the account page carries a short note explaining what it means.

Instead of the change below, the account page now shows helper text:

- **Correct Predictions** — "Correct picks out of matches played so far this
  season."
- **Matches Predicted** — "Total predictions you've submitted, including upcoming
  matches."

## Current behavior (for reference)

- `correct_predictions` — per user, `COUNT(user_points WHERE points_earned > 0)`.
- `predicted_matches` — per user, `COUNT(user_predictions WHERE user_id = ?)`
  (**all** predictions, incl. upcoming).
- `finished_matches` — season-wide, from the latest `cron_logs` marker
  (`metadata.finishedMatches`).

See [DATABASE_POINTS_SYSTEM.md](./DATABASE_POINTS_SYSTEM.md#prediction-stats).

## The change, if resumed later

Goal: `predicted_matches` counts predictions whose `match_id` is a finished
match. There is **no local matches table** — finished state lives only in the
external football-data.org API (free tier: 10 req/min), so leaderboards must not
fetch it per request.

1. **Persist the finished-match ID set.** The cron
   (`cron_calculate_points`) and lazy refresh (`points_lazy_refresh`) already
   fetch `?status=FINISHED`. Extend the completed `cron_logs` marker metadata
   from `{ finishedMatches: count }` to
   `{ finishedMatches: count, finishedMatchIds: string[] }` (IDs as strings, to
   match `user_predictions.match_id`). Bounded to ~380 IDs per season.
   - **Override guard:** only write the marker on a full **live fetch**. Skip it
     on partial backfill runs (`--matchday`, `--all`, `--results` via the cron
     override) so a partial set can't clobber the season-wide list.

2. **Helper.** Add `getFinishedMatchInfo()` returning `{ count, ids }` from the
   latest marker (older markers without the id set yield `ids: []`). Keep
   `getFinishedMatchesCount()` as a thin wrapper.

3. **Filter predictions by finished ids.** In `getUserPointsSummary` and
   `getUserPointsSummaries` (and the global leaderboard route's inline current-
   user query), count predictions with `matchId: { in: finishedIds }`. Pass the
   ids in from the route so the marker is read once per request.

4. **UI.** No leaderboard change (leaderboards keep `correct / finished`). The
   account page's "Matches Predicted" would then read finished-only; update its
   helper note accordingly.

## Seeding caveat

`finishedMatchIds` only appears after the first live cron / lazy-refresh run
following deployment. Until then `getFinishedMatchInfo().ids` is `[]` and any
finished-only count would read `0`.

## Affected files (if resumed)

- `src/lib/points.js` — helper + both summary functions.
- `src/app/api/cron/calculate-points/route.js` — write `finishedMatchIds` (live only).
- `src/app/api/leaderboard/route.js` — filter current-user predicted count.
- `src/app/api/leagues/[leagueId]/leaderboard/route.js`, `src/app/api/points/route.js` — pass ids into summaries.
- `src/app/account/page.js` — update the "Matches Predicted" note.
- `docs/DATABASE_POINTS_SYSTEM.md` — redefine the stat.
