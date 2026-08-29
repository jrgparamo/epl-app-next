# Member Picks Comparison Modal

Tap any leaderboard row (global or league) to open a modal that compares your
current‑matchday predictions side‑by‑side with the tapped user's predictions.

Covers the laundry‑list item: **"Add an easier way to see members choices."**

## Product decisions

- **Reveal timing:** another user's pick for a match is hidden until that match
  kicks off. Enforced on the server (the score is never sent pre‑kickoff).
- **Scope:** any user on any leaderboard is tappable. Only scorelines are shown,
  no PII (no email).
- **Locked matches:** the fixture row is still shown with a "locked until
  kickoff" placeholder instead of the score.
- **Matchday picker:** a `WeekSelector` on the standings view lets you choose
  which matchday to compare (up to and including the current one). Picking a
  matchday shows the **cumulative standings as of that matchday** and scopes the
  comparison modal to that week's picks. The current matchday (the default)
  equals the season table, so no separate "Overall" toggle is needed.
  (Option A — isolated single-week ranking with an Overall chip — lives on a
  branch for comparison.)

## Data facts

- `Prediction` model → table `user_predictions`: `userId`, `matchId`,
  `homeScore`, `awayScore`, `confidence`. Unique on `[userId, matchId]`.
- Existing `GET /api/predictions?userId=X` is locked to self/admin via
  `canActAsUser` — not reusable for viewing others. No bulk route exists.
- Matches come from football‑data.org, fetched in `/api/matches` via `apiCache`
  key `matches-<matchday>` (30‑min TTL). Fixture id is numeric; prediction
  `matchId` is a string — normalize with `String(id)`.
- `hasMatchStarted(utcDate)` and `getTeamLogo(name)` live in `src/lib/utils.js`.
- Modal pattern: `HowToPlayModal` uses `Sheet` (mobile bottom) + `Dialog`
  (desktop) selected by `useIsMobile`.
- Scoring: correct outcome = 1 pt, exact score = 3 pts.

## Architecture

### Shared match fetch helper

Extract the football‑data fetch + transform from `src/app/api/matches/route.js`
into `src/lib/matches-service.js` as `fetchMatchesByMatchday(matchday, { status })`,
reusing the same `apiCache` key so both routes share the cache. Refactor the
matches route to call it (no behavior change).

### Compare endpoint — `GET /api/predictions/compare?matchday=N&userId=<target>`

1. `requireUser` (401 if unauthenticated).
2. `fetchMatchesByMatchday(N)` → fixtures (served from cache when warm).
3. One `prisma.prediction.findMany` for `userId in [me, target]` and
   `matchId in [fixtureIds]`.
4. Build one row per fixture. For the target: pre‑kickoff → `{ locked: true }`
   (score omitted server‑side); post‑kickoff → the scoreline or `null`. My own
   pick is always included.
5. `display_name` resolved from the user record (`displayName` ||
   email prefix). No email in the payload.

Cost: 1 DB query + 1 network call per modal open; match data from cache.

### Hook — `src/hooks/useMemberPicks.js`

`useMemberPicks(userId, matchday, cacheable)` → `{ data, loading, error }`.
Fetches on open, skips when `userId`/`matchday` missing, cancels stale requests.
When `cacheable` is true, responses are memoized in a module‑level cache keyed
`userId:matchday` so reopening the same combo makes no request. The modal marks
only **past** matchdays cacheable (`matchday < currentMatchday`); the current
matchday changes live (locks, results) and is always refetched.

### Component — `src/app/components/MemberPicksModal.js`

`Sheet`/`Dialog` (mobile/desktop) titled "You vs {name}". A header shows the
selected matchday's running total for **both** sides (You and the tapped user),
summed from each side's per‑match points. One block per fixture: home/away logos +
short names, the final result if `FINISHED`, then two columns — mine and theirs —
each showing the scoreline, a lock placeholder, or a dash, plus a points badge
(0/1/3) when the match is finished. Loading / error / empty states.

### Matchday picker — standings view

- Reuses the existing `WeekSelector` component (same as the matches view).
- Matchdays up to and including the current one are listed:
  `totalWeeks = currentMatchday`, derived purely from the `currentMatchday`
  integer already loaded on the page — no season‑wide fetch. Defaults to the
  current matchday. In‑progress fixtures stay locked until kickoff (the compare
  endpoint withholds their scores), so the current matchday is safe to include.
- `currentMatchday` comes from the client‑cached `getCurrentMatchday()`
  (`src/lib/api.js`), shared with the matches view, so it is usually a cache hit
  with no new request.
- The picker sits above the leaderboard and applies to both the Global and League
  tabs; its selection is passed to `MemberPicksModal` as `matchday`.

### Wire‑up

- `GlobalLeaderboard.js` and `LeagueLeaderboard.js`: rows become clickable
  (keyboard accessible) and call `onUserSelect({ user_id, display_name })`.
- `leaderboard/page.js`: holds `selectedMember`, `currentMatchday`, and
  `selectedMatchday`; renders the `WeekSelector` and a single `MemberPicksModal`
  scoped to the selected matchday.

### Matchday reranking — leaderboards (Option B: cumulative standings)

Picking a matchday shows the leaderboard as it stood **after that matchday**
(cumulative points across matchdays 1..N). The current matchday (the default)
equals the live season table, so no Overall chip is needed. Option A (isolated
single-week ranking) is preserved on a branch.

- `UserPoints` has `pointsEarned` per `matchId` (no matchday column).
  `fetchMatchesThroughMatchday(N)` (`src/lib/matches-service.js`) returns all
  season fixtures with `matchday <= N` from the shared `matches-all` cache entry,
  so cumulative standings cost at most one extra football-data call regardless of
  the matchday. Rank = one `groupBy` over `userPoints` filtered by those matchIds
  — computed real-time, no schema change or denormalized table.
- `GET /api/leaderboard?matchday=N` and
  `GET /api/leagues/[leagueId]/leaderboard?matchday=N` add a matchday branch
  (absent = season, backward-compatible). The league variant scopes the same
  `groupBy` to member ids via `getMatchdayPointsSummaries(userIds, matchIds)` in
  `src/lib/points.js`. `finished_matches` becomes the count of `FINISHED`
  fixtures through that matchday.
- `useLeaderboard(matchday, cacheable)` and
  `useLeagueLeaderboard(leagueId, matchday, cacheable)` refetch on change and
  memoize **past** matchdays (immutable); the live current matchday always
  refetches. The page marks a matchday cacheable only when
  `matchday < currentMatchday`.

**Multi‑league note.** Predictions are per‑user and league‑independent (one
`Prediction` per user per match), so opening a comparison from any shared league
yields the identical modal — only the rank position differs per scope.

## Files

Create:

- `src/lib/matches-service.js`
- `src/app/api/predictions/compare/route.js`
- `src/hooks/useMemberPicks.js`
- `src/app/components/MemberPicksModal.js`

Modify:

- `src/app/api/matches/route.js`
- `src/app/api/leaderboard/route.js` (adds `?matchday=N` cumulative standings)
- `src/app/api/leagues/[leagueId]/leaderboard/route.js` (adds `?matchday=N`)
- `src/lib/matches-service.js` (adds `fetchMatchesThroughMatchday`)
- `src/lib/points.js` (adds `getMatchdayPointsSummaries`)
- `src/hooks/useLeaderboard.js`, `src/hooks/useLeagues.js` (matchday + cache)
- `src/app/components/GlobalLeaderboard.js`
- `src/app/components/LeagueLeaderboard.js`
- `src/app/leaderboard/page.js` (adds the `WeekSelector` picker)

## Verification

- Tap a row on both leaderboards → modal opens; pre‑kickoff matches show locked;
  started/finished show the pick, result, and points; mobile = bottom sheet,
  desktop = dialog; closes on outside/esc.
- The picker lists matchdays up to and including the current one; picking one
  shows cumulative standings as of that matchday and scopes the modal; the
  current matchday equals the season table. The modal header total for each side
  matches the sum of per‑match points.
- Network: selecting the current matchday fires a leaderboard fetch; a past
  matchday fetches once then serves from cache on reselect; opening the modal
  fires exactly one `/api/predictions/compare`; reopening the same user for a
  **past** matchday fires none (the current matchday always refetches); at most
  one extra football‑data call for the season fixtures (`matches-all`, cached).
- Security: endpoint returns 401 unauthenticated; pre‑kickoff match row carries
  `{ locked: true }` with no scores; no `email` anywhere in the payload.
- `npm run lint` and editor diagnostics clean.

## Out of scope

- Changes to existing prediction edit/lock behavior.
- Server‑side points recompute (badge reuses the existing scoring rule client‑side).
