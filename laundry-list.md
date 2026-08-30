# Laundry List

## Critical

- [ ] Revisit caching strategy for football-data.org
      currentSeason.currentMatchday - update any caching docs
- [ ] Is Prisma caching queries?

- [ ] Instead of fetching all matches - could we store the finished matches with their results in the db?
- [ ] optimize page load network request for comapring player points per match looks like it will be massive by week 38

- [ ] matchday can be cached for longer

## DONE

- [x] Need to simulate actual season to test
- [x] Fix cron job

## Non-Critical

- [ ] Fix spacing on sign in modal and data fetch on tap
- [ ] Address ui FOR scrollbars
- [ ] Clean up db and /docs dir among other legacy files.

- [ ] On load scroll to the next match

- [ ] Cron jobs calculates all finished matches - can we just limit to all finished within the matchday?

- [ ] Fix this [auth][warn][experimental-webauthn] Read more: https://warnings.authjs.dev
- [ ] Fix this Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
      In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.
      To prepare for this change:
  - If you want the current behavior, explicitly use 'sslmode=verify-full'
  - If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'
    See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.

## Done

- [x] add global leaderboard
- [x] Fix the 2/2 correct in the leagues page - figure out what matches_predicted is
      (replaced `matches_predicted` with `correct_predictions/finished_matches`;
      per-user `predicted_matches` now stored from the predictions table)
- [x] Show live score with blinking live chip
- [x] Add an easier way to see members choices
- [x] Add click on season total for breakdown- not needed using leaderboards
- [x] ON matches view on touch of match card show current league users picks
