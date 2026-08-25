# Security Audit

**Date:** 2026-08-24
**Scope:** Full application source (`src/`), config, and repository secrets hygiene.
**Method:** Static review — secret scanning, auth/authorization review of all
API routes, IDOR checks, injection review (SQL/raw queries), PII exposure,
security headers, rate limiting, and `.gitignore` / tracked-file inspection.

## Summary

| Severity | Finding                                              | Status                |
| -------- | ---------------------------------------------------- | --------------------- |
| HIGH     | Email PII exposed in leaderboard API responses       | Fixed                 |
| MEDIUM   | `/api/cache` management endpoint unauthenticated     | Fixed                 |
| MEDIUM   | No HTTP security headers (CSP/HSTS/etc.)             | Fixed (CSP enforcing) |
| LOW      | Cron secret compared with non-constant-time `!==`    | Documented            |
| LOW      | League join-code endpoint has no rate limit          | Documented            |
| NOTE     | Prior secret exposure referenced in rotation runbook | Verify rotated        |

No hardcoded credentials, no committed `.env` files, and no raw/unparameterized
SQL were found. Prisma is used throughout with parameterized queries, so the app
is not exposed to SQL injection.

---

## HIGH — Email PII exposed in leaderboard responses

**Location:**

- `src/app/api/leaderboard/route.js` (global, public endpoint)
- `src/app/api/leagues/[leagueId]/leaderboard/route.js` (league members)

**Impact:** Both endpoints returned each user's real `email` address in the JSON
payload. The global leaderboard is reachable without authentication, so any
anonymous visitor could retrieve the email addresses of the top-50 users. This
is a personal-data (PII) disclosure.

**Fix:** Removed the `email` field from both response payloads. The public
display name is derived server-side (`displayName`, falling back to the
local-part of the email), so the UI is unaffected. The dead `player.email`
fallback in `src/app/components/LeagueLeaderboard.js` was also removed.

**Decision:** The global leaderboard remains public by design; the fix removes
the PII rather than gating the endpoint behind authentication.

## MEDIUM — Unauthenticated cache management endpoint

**Location:** `src/app/api/cache/route.js`

**Impact:** The `POST` (revalidate tags), `GET` (cache stats), and `DELETE`
(clear cache) handlers had no authorization check. Any unauthenticated caller
could repeatedly invalidate/clear the cache, forcing cache stampedes and
upstream calls to the football-data.org API — burning the rate-limited API
quota and degrading availability (a denial-of-service vector).

**Fix:** All three methods now require an admin session via `requireAdmin()`
from `src/lib/auth-helpers.js`. The dev-only `CacheDebug` component calls these
same-origin with the session cookie, so it continues to work when signed in as
an admin.

## MEDIUM — Missing HTTP security headers

**Location:** `next.config.mjs`

**Impact:** No `Content-Security-Policy`, `Strict-Transport-Security`,
`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or
`Permissions-Policy` headers were sent. This leaves the app more exposed to
clickjacking, MIME sniffing, protocol downgrade, and reduces XSS defense-in-depth.

**Fix:** Added a `headers()` config applying to all routes, plus a nonce-based
CSP set from `src/middleware.js`:

- `Content-Security-Policy` — **enforcing, nonce-based**. `script-src` is
  `'self' 'nonce-<per-request>' 'strict-dynamic'` (no `'unsafe-inline'`;
  `'unsafe-eval'` added in development only for React Refresh/HMR). The nonce is
  generated per request in middleware; Next.js stamps it onto the framework
  scripts it renders. `connect-src` allows `ws:`/`wss:` in development only so
  HMR works. CSP lives in middleware (not `next.config`) because the nonce must
  vary per request.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Follow-up:** `style-src` still allows `'unsafe-inline'` (inline styles are hard
to nonce and lower risk than scripts); tighten later if feasible.

## LOW — Cron secret compared with non-constant-time equality

**Location:** `src/app/api/cron/calculate-points/route.js`,
`src/app/api/points/route.js`

**Impact:** The bearer token check uses `authHeader !== \`Bearer ${CRON_SECRET}\``.
String `!==` short-circuits on the first differing byte, leaking timing
information. Practical exploitation over a network is very difficult, so risk is
low, but constant-time comparison is best practice.

**Recommendation:** Compare using `crypto.timingSafeEqual` over equal-length
buffers (after confirming the header is present and the expected length).

## LOW — League join-code endpoint not rate limited

**Location:** `src/app/api/leagues/route.js` (join-by-code branch),
`src/lib/leagues.js`

**Impact:** Join codes are 6 characters over a 32-symbol alphabet (~1.07e9
combinations) generated with a CSPRNG (`crypto.randomBytes`), so blind guessing
is impractical. However, the join endpoint has no per-user/IP throttle, so a
determined attacker could attempt enumeration to join private leagues.

**Recommendation:** Apply `enforceRateLimit` (already used for magic-link sends)
to the join-by-code path, keyed per user or IP.

## NOTE — Prior secret exposure

**Location:** `docs/SECRET_ROTATION.md`

The rotation runbook states that several secrets "were exposed": the Gmail app
password (inside `EMAIL_SERVER`), `AUTH_SECRET`, `CRON_SECRET`, and the
`DATABASE_URL` credentials. The document itself contains **no live secret
values**, and `.env*` files are gitignored and were never committed.

**Action:** Confirm all four secrets have been rotated at their source of truth
and the old values revoked. If unverified, rotate now per the runbook.

---

## Positive findings (controls working as intended)

- **No hardcoded secrets** in source; `.env*` is gitignored and untracked.
- **No SQL injection surface** — Prisma parameterized queries only; no
  `$queryRaw`/`$executeRaw`/raw string SQL.
- **Authentication** via Auth.js v5 (magic-link + WebAuthn passkeys), database
  session strategy.
- **Magic-link rate limiting** — 5 sends per email per 15 minutes before SMTP
  (`src/auth.js`, `src/lib/rate-limit.js`).
- **IDOR protection** — predictions and profile routes enforce ownership via
  `canActAsUser` / explicit `user.id` checks.
- **Admin authorization** — admin routes gate on `isEffectiveAdmin` /
  `requireAdmin`.
- **CSPRNG join codes** — `crypto.randomBytes` with an unambiguous alphabet.

## Recommended next steps

1. Rotate/verify the previously exposed secrets (NOTE above).
2. Adopt constant-time comparison for the cron bearer secret (LOW).
3. Rate-limit the league join-by-code path (LOW).
4. Optionally tighten `style-src` off `'unsafe-inline'`; monitor CSP in prod after deploy.

# Plan: Fix HIGH/MEDIUM security risks + audit doc

## Goal

Fix HIGH + MEDIUM findings from security scan. Document ALL risks (HIGH/MED/LOW + prior-leak note + positives) in a new `SECURITY_AUDIT.md` at repo root.

## Findings recap

- HIGH: email PII leak in leaderboard payloads; global leaderboard has no auth gate (unauth stranger gets top-50 emails).
- MEDIUM: `/api/cache` POST+DELETE unauthenticated (cache-invalidation DoS + API quota burn).
- MEDIUM: no security headers in next.config.mjs (CSP/HSTS/X-Frame-Options/X-Content-Type-Options).
- LOW: cron secret compared with `!==` (not constant-time).
- LOW: league join-code no rate limit (enumeration).
- NOTE: docs/SECRET_ROTATION.md says secrets were exposed previously — confirm rotated.

## Client-consumption research (done)

- No client reads `email` from `/api/leaderboard` (useLeaderboard.js + leaderboard/page.js don't touch it).
- `src/app/components/LeagueLeaderboard.js` line 131 uses `player.email` ONLY as fallback: `(player.display_name || player.email || "?")`. Server always sends non-null `display_name` (falls back to email.split("@")[0]). So email fallback is dead — safe to remove.
- `/api/cache` GET/DELETE only called by `src/app/components/CacheDebug.js` (dev-only, gated NODE_ENV==="development"). Same-origin fetch sends session cookie automatically → requireAdmin works if dev signed in as admin.
- admin/users route legitimately returns email (admin-gated) — leave as-is.

## Steps

### Phase 1 — HIGH: stop email leak (parallel edits)

1. src/app/api/leaderboard/route.js: remove `email` field from both payload builders (top-N map ~L54 and current-user append ~L88). Keep display_name fallback logic. Require auth: after `getSessionUser()`, if null return 401 (currently proceeds). Decide: keep global board login-required (recommended) vs public-without-email.
2. src/app/api/leagues/[leagueId]/leaderboard/route.js: remove `email` from member payload (~L58). Already requires membership.
3. src/app/components/LeagueLeaderboard.js: drop `player.email` fallback at L131 → `(player.display_name || "?")`.

### Phase 2 — MEDIUM: gate cache endpoint

4. src/app/api/cache/route.js: add `requireAdmin()` guard at top of POST and DELETE (import from @/lib/auth-helpers). Optionally gate GET too (leaks cache internals). Return the 401/403 response if present.

### Phase 3 — MEDIUM: security headers

5. next.config.mjs: add async `headers()` returning for all routes: Content-Security-Policy (start report-friendly / conservative), Strict-Transport-Security, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy. Keep existing images config.

### Phase 4 — audit doc

6. Create SECURITY_AUDIT.md at repo root: date 2026-08-24, methodology, all findings (severity/location/impact/fix/status), positives, prior-leak note, recommendations for LOW items (constant-time compare, join-code rate limit).

## Verification

1. `npm run lint` clean.
2. `npm run dev`, curl `/api/leaderboard` unauth → 401 (or 200 with no email if kept public). Signed-in → 200, JSON has no `email` key.
3. curl league leaderboard as member → no `email` key; league page still shows names.
4. curl `-X POST /api/cache` unauth → 401/403; CacheDebug (dev, admin) still works.
5. curl `-I` any page → CSP/HSTS/X-Frame-Options/X-Content-Type-Options present.
6. LeagueLeaderboard renders names (no "?" regressions).

## Scope

- IN: HIGH + MEDIUM fixes + SECURITY_AUDIT.md documenting all risks.
- OUT (documented only, not fixed now): LOW items (constant-time cron compare, join-code rate limit), secret rotation execution.

## Open decisions

1. Global leaderboard: require login (recommended) vs keep public minus email.
2. Cache GET: gate too (recommended) vs leave readable.
3. CSP strictness: conservative allowlist vs report-only first.

# Plan: Fix HIGH/MEDIUM security risks + audit doc

## Goal

Fix HIGH + MEDIUM findings from security scan. Document ALL risks (HIGH/MED/LOW + prior-leak note + positives) in a new `SECURITY_AUDIT.md` at repo root.

## Findings recap

- HIGH: email PII leak in leaderboard payloads; global leaderboard has no auth gate (unauth stranger gets top-50 emails).
- MEDIUM: `/api/cache` POST+DELETE unauthenticated (cache-invalidation DoS + API quota burn).
- MEDIUM: no security headers in next.config.mjs (CSP/HSTS/X-Frame-Options/X-Content-Type-Options).
- LOW: cron secret compared with `!==` (not constant-time).
- LOW: league join-code no rate limit (enumeration).
- NOTE: docs/SECRET_ROTATION.md says secrets were exposed previously — confirm rotated.

## Client-consumption research (done)

- No client reads `email` from `/api/leaderboard` (useLeaderboard.js + leaderboard/page.js don't touch it).
- `src/app/components/LeagueLeaderboard.js` line 131 uses `player.email` ONLY as fallback: `(player.display_name || player.email || "?")`. Server always sends non-null `display_name` (falls back to email.split("@")[0]). So email fallback is dead — safe to remove.
- `/api/cache` GET/DELETE only called by `src/app/components/CacheDebug.js` (dev-only, gated NODE_ENV==="development"). Same-origin fetch sends session cookie automatically → requireAdmin works if dev signed in as admin.
- admin/users route legitimately returns email (admin-gated) — leave as-is.

## Steps

### Phase 1 — HIGH: stop email leak (parallel edits)

DECISION Q1 = Option B: keep global leaderboard PUBLIC, just strip PII. Do NOT add 401 gate.

1. src/app/api/leaderboard/route.js: remove `email` field from both payload builders (top-N map ~L54 and current-user append ~L88). Keep display_name fallback logic. No auth gate change.
2. src/app/api/leagues/[leagueId]/leaderboard/route.js: remove `email` from member payload (~L58). Already requires membership.
3. src/app/components/LeagueLeaderboard.js: drop `player.email` fallback at L131 → `(player.display_name || "?")`.

### Phase 2 — MEDIUM: gate cache endpoint

DECISION Q2 = gate all methods. 4. src/app/api/cache/route.js: add `requireAdmin()` guard at top of POST, DELETE, AND GET (import from @/lib/auth-helpers). Return the 401/403 response if present.

### Phase 3 — MEDIUM: security headers

DECISION Q3 = CSP report-only first. 5. next.config.mjs: add async `headers()` for all routes: Content-Security-Policy-Report-Only (report-only mode, not enforcing yet), Strict-Transport-Security, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy. Keep existing images config. Other headers enforced normally; only CSP is report-only.

### Phase 4 — audit doc

6. Create SECURITY_AUDIT.md at repo root: date 2026-08-24, methodology, all findings (severity/location/impact/fix/status), positives, prior-leak note, recommendations for LOW items (constant-time compare, join-code rate limit).

## Verification

1. `npm run lint` clean.
2. `npm run dev`, curl `/api/leaderboard` unauth → 200 (public) with NO `email` key. Signed-in → 200, still no email.
3. curl league leaderboard as member → no `email` key; league page still shows names.
4. curl `-X POST /api/cache` unauth → 401/403; GET + DELETE also gated; CacheDebug (dev, admin) still works.
5. curl `-I` any page → HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy present + Content-Security-Policy-Report-Only header (report-only, not enforcing).
6. LeagueLeaderboard renders names (no "?" regressions).

## Scope

- IN: HIGH + MEDIUM fixes + SECURITY_AUDIT.md documenting all risks.
- OUT (documented only, not fixed now): LOW items (constant-time cron compare, join-code rate limit), secret rotation execution.

## Decisions (locked)

1. Q1 = Option B: global leaderboard stays PUBLIC, strip PII (email). No login gate added.
2. Q2 = gate `/api/cache` on ALL methods (GET/POST/DELETE) with requireAdmin.
3. Q3 = CSP report-only first (Content-Security-Policy-Report-Only). Other headers enforced.
