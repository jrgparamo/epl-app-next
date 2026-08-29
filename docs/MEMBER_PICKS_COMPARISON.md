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
- **Current matchday only.** A matchday selector is out of scope (future work).

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

`useMemberPicks(userId, matchday)` → `{ data, loading, error }`. Fetches on open,
skips when `userId`/`matchday` missing, cancels stale requests.

### Component — `src/app/components/MemberPicksModal.js`

`Sheet`/`Dialog` (mobile/desktop) titled "You vs {name}". One block per fixture:
home/away logos + short names, the final result if `FINISHED`, then two columns —
mine and theirs — each showing the scoreline, a lock placeholder, or a dash, plus
a points badge (0/1/3) when the match is finished. Loading / error / empty states.

### Wire‑up

- `GlobalLeaderboard.js` and `LeagueLeaderboard.js`: rows become clickable
  (keyboard accessible) and call `onUserSelect({ user_id, display_name })`.
- `leaderboard/page.js`: holds `selectedMember` + `currentMatchday`, passes
  `onUserSelect` to both leaderboards, renders a single `MemberPicksModal`.

## Files

Create:

- `src/lib/matches-service.js`
- `src/app/api/predictions/compare/route.js`
- `src/hooks/useMemberPicks.js`
- `src/app/components/MemberPicksModal.js`

Modify:

- `src/app/api/matches/route.js`
- `src/app/components/GlobalLeaderboard.js`
- `src/app/components/LeagueLeaderboard.js`
- `src/app/leaderboard/page.js`

## Verification

- Tap a row on both leaderboards → modal opens; pre‑kickoff matches show locked;
  started/finished show the pick, result, and points; mobile = bottom sheet,
  desktop = dialog; closes on outside/esc.
- Network: exactly one `/api/predictions/compare` call per open; no duplicate
  football‑data call (cache shared with `/api/matches`).
- Security: endpoint returns 401 unauthenticated; pre‑kickoff match row carries
  `{ locked: true }` with no scores; no `email` anywhere in the payload.
- `npm run lint` and editor diagnostics clean.

## Out of scope

- Matchday selector / past matchdays.
- Changes to existing prediction edit/lock behavior.
- Server‑side points recompute (badge reuses the existing scoring rule client‑side).
