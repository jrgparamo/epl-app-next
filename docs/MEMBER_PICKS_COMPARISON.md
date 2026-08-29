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
  matchday **reranks the leaderboard** to that week's points (isolated single
  matchday) and scopes the comparison modal to it; an **Overall** chip returns to
  the season‑total ranking (the default).

## Decision log

How this feature reached its current shape:

1. **Surface the global leaderboard** (replaced the "coming soon" placeholder)
   using existing season‑total points; no PII (display name only).
2. **Comparison modal** — tapping any leaderboard row opens "You vs {name}" for a
   matchday. Reveal‑until‑kickoff is server‑enforced; any user on any leaderboard
   is tappable; scorelines only.
3. **Matchday picker** added with the shared `WeekSelector`. First limited to
   completed matchdays, then changed to **`<= current`** so the in‑progress
   matchday is selectable (its picks stay locked until kickoff).
4. **Running totals** added to the modal header for **both** sides.
5. **Rerank the leaderboard by matchday** (this TODO). Two readings emerged:
   - **Option A — isolated week:** rank by points earned in that matchday only.
   - **Option B — cumulative:** standings as they stood after that matchday.
6. Both were built to compare in the UI: **Option A is on the current branch**
   and is the **leaning choice**; **Option B lives on a separate branch**
   (cumulative‑through‑matchday; drops the Overall chip since current MD already
   equals the season table).

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

### Matchday reranking — leaderboards (Option A: isolated week)

Picking a matchday reranks the leaderboard by points earned **in that matchday
only**; the **Overall** chip (`selectedMatchday === null`, the default) shows
season totals.

- `UserPoints` has `pointsEarned` per `matchId` (no matchday column). Matchday →
  matchIds via the cached `fetchMatchesByMatchday(N)`, so no extra football‑data
  call. Rank = one `groupBy` over `userPoints` filtered by those matchIds —
  computed real‑time, no schema change or denormalized table.
- `GET /api/leaderboard?matchday=N` and
  `GET /api/leagues/[leagueId]/leaderboard?matchday=N` add a matchday branch
  (absent = season, backward‑compatible). The league variant scopes the same
  `groupBy` to member ids via `getMatchdayPointsSummaries(userIds, matchIds)` in
  `src/lib/points.js`. `finished_matches` becomes the count of `FINISHED`
  fixtures in that matchday. Users with zero points that week are omitted from
  the global top‑50 but the caller is always appended.
- `useLeaderboard(matchday, cacheable)` and
  `useLeagueLeaderboard(leagueId, matchday, cacheable)` refetch on change and
  memoize **past** matchdays (immutable); Overall and the live current matchday
  always refetch.
- The page marks a matchday cacheable only when `matchday < currentMatchday`.

**Multi‑league note.** Predictions are per‑user and league‑independent (one
`Prediction` per user per match), so opening a comparison from any shared league
yields the identical modal — only the rank position differs per scope.

#### Why Option A (leaning choice)

| Aspect                  | Option A (isolated week)                                                                                                                       | Option B (cumulative)                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Football‑data fetch** | Only the selected matchday's fixtures — the `matches-<N>` cache entry already warmed by the modal and matches view. Usually **0 extra calls**. | Needs the whole season (`matches-all`) to map matchday→matchId, an entry nothing else warms → **up to 1 extra call**. |
| **DB work**             | One `groupBy` over `userPoints` filtered to a single matchday's matchIds.                                                                      | One `groupBy` over a matchId set that grows with the matchday number.                                                 |
| **Client cache**        | Past matchdays immutable → cached forever (`lb:<N>`, `league-lb:<league>:<N>`); reselect = **0 requests**.                                     | Same immutability, but each entry recomputed over a larger set on first load.                                         |
| **Insight**             | Shows weekly form / who won that round — **new** information.                                                                                  | A replay of the season table rewound to a week — largely redundant with the season view.                              |
| **Modal consistency**   | Leaderboard weekly points == the modal's per‑week totals (both isolated).                                                                      | Leaderboard is cumulative while the modal stays weekly → **mismatch**.                                                |
| **Cost of the choice**  | Needs the **Overall** chip to reach season totals.                                                                                             | No chip needed (current MD = season), but pricier and less novel.                                                     |

**Network & cache optimizations leveraged by Option A**

- **Shared match cache.** The matchday branch calls `fetchMatchesByMatchday(N)`,
  which reads the same `apiCache` key `matches-<N>` (30‑min TTL) that the compare
  modal and the matches view already populate — so the fixtures are normally a
  cache hit and no football‑data request is made.
- **No season‑wide fetch.** Only the selected matchday's fixtures are needed;
  Option A never pulls all season matches.
- **Picker needs no network.** `currentMatchday` comes from the client‑cached
  `getCurrentMatchday()` (`src/lib/api.js`), shared with the matches view, so the
  `WeekSelector` renders from an integer already in memory.
- **Immutable‑past client cache.** `useLeaderboard(matchday, cacheable)` and
  `useLeagueLeaderboard(leagueId, matchday, cacheable)` memoize **past** matchdays
  in a module‑level `Map`; reselecting a past week makes **0 requests**. Overall
  and the live current matchday always refetch. The page marks a matchday
  cacheable only when `matchday < currentMatchday`.
- **Modal reuse.** `useMemberPicks` caches past `userId:matchday` combos, so
  reopening the same comparison for a finished week is free.
- **Real‑time, no storage.** Points are aggregated on demand with a single
  `groupBy`; nothing is precomputed or denormalized, so there is no schema change
  and no write path to keep in sync.

**Option B availability.** Option B's code (cumulative standings via
`fetchMatchesThroughMatchday` and `standingsThroughMatchday`, no Overall chip) is
committed on a **separate branch** for side‑by‑side evaluation; it is not in this
branch.

## Files

Create:

- `src/lib/matches-service.js`
- `src/app/api/predictions/compare/route.js`
- `src/hooks/useMemberPicks.js`
- `src/app/components/MemberPicksModal.js`

Modify:

- `src/app/api/matches/route.js`
- `src/app/api/leaderboard/route.js` (adds `?matchday=N` reranking)
- `src/app/api/leagues/[leagueId]/leaderboard/route.js` (adds `?matchday=N`)
- `src/lib/points.js` (adds `getMatchdayPointsSummaries`)
- `src/hooks/useLeaderboard.js`, `src/hooks/useLeagues.js` (matchday + cache)
- `src/app/components/GlobalLeaderboard.js`
- `src/app/components/LeagueLeaderboard.js`
- `src/app/leaderboard/page.js` (adds the `WeekSelector` picker + Overall chip)

## Verification

- Tap a row on both leaderboards → modal opens; pre‑kickoff matches show locked;
  started/finished show the pick, result, and points; mobile = bottom sheet,
  desktop = dialog; closes on outside/esc.
- The picker lists matchdays up to and including the current one; picking one
  reranks the leaderboard to that week and scopes the modal; **Overall** restores
  season totals. The modal header total for each side matches the sum of
  per‑match points.
- Network: selecting **Overall**/current fires a leaderboard fetch; a past
  matchday fetches once then serves from cache on reselect; opening the modal
  fires exactly one `/api/predictions/compare`; reopening the same user for a
  **past** matchday fires none (the current matchday always refetches); no
  duplicate football‑data call (cache shared with `/api/matches`).
- Security: endpoint returns 401 unauthenticated; pre‑kickoff match row carries
  `{ locked: true }` with no scores; no `email` anywhere in the payload.
- `npm run lint` and editor diagnostics clean.

## Out of scope

- Changes to existing prediction edit/lock behavior.
- Server‑side points recompute (badge reuses the existing scoring rule client‑side).
