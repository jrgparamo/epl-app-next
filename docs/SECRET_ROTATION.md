# Secret Rotation Runbook

A step-by-step guide to rotate the secrets that were exposed and replace them
everywhere they live. Rotate **one secret at a time**, verify, then move on —
this keeps the blast radius small and makes it obvious which change broke
something if anything does.

> Scope: `Gmail app password` (inside `EMAIL_SERVER`), `AUTH_SECRET`,
> `CRON_SECRET`, and the database credentials in `DATABASE_URL`.

## Where each secret lives

| Secret                              | Local files                                            | Vercel env     | GitHub Actions secret | Source of truth to rotate at   |
| ----------------------------------- | ------------------------------------------------------ | -------------- | --------------------- | ------------------------------ |
| Gmail app password (`EMAIL_SERVER`) | `.env.local`, `.env.test`                              | `EMAIL_SERVER` | —                     | Google Account → App passwords |
| `AUTH_SECRET`                       | `.env.local`, `.env.test`                              | `AUTH_SECRET`  | —                     | Self-generated (`openssl`)     |
| `CRON_SECRET`                       | `.env.local`, `.env.test`                              | `CRON_SECRET`  | `CRON_SECRET`         | Self-generated (`openssl`)     |
| DB creds (`DATABASE_URL`)           | `.env.local` (prod DB), `.env.test` (separate test DB) | `DATABASE_URL` | —                     | Prisma Postgres console        |

`.env.local` and `.env.test` are gitignored, so they were never committed — but
they still hold live values on your machine and must be updated.

## General procedure (applies to every secret)

1. **Generate / obtain** the new value at its source of truth.
2. **Update every store** that holds it (local env files, Vercel, GitHub).
3. **Redeploy** so the running app picks up the new Vercel env values
   (Vercel env changes do **not** apply to existing deployments).
4. **Verify** the dependent feature still works.
5. **Revoke / delete** the old value at the source.

Vercel env commands used below (repeat per environment — `production`,
`preview`, `development`):

```bash
vercel env rm <NAME> production      # remove old
vercel env add <NAME> production     # paste new value when prompted
# ...repeat for preview and development...
vercel --prod                        # redeploy production with new values
```

GitHub Actions secret (needs the `gh` CLI, or use the web UI under
Settings → Secrets and variables → Actions):

```bash
gh secret set CRON_SECRET            # paste new value when prompted
```

---

## 1. Gmail app password (`EMAIL_SERVER`)

Used by [`src/auth.js`](../src/auth.js) to send magic-link emails over SMTP.
The password is embedded in the `EMAIL_SERVER` URL.

- [ ] Go to https://myaccount.google.com/apppasswords and **delete** the old
      "EPL App" entry.
- [ ] Create a new app password (Mail → Other → "EPL App"). Copy the 16
      characters with **no spaces**.
- [ ] Rebuild the SMTP URL (URL-encode the `@` in the address as `%40`):
      `smtp://jrgparamo%40gmail.com:<NEW_APP_PASSWORD>@smtp.gmail.com:587`
- [ ] Update `EMAIL_SERVER` in `.env.local` and `.env.test`.
- [ ] Update `EMAIL_SERVER` in Vercel (all environments) and redeploy.
- [ ] **Verify:** trigger a magic-link sign-in and confirm the email arrives.

> The old app password is revoked the moment you delete it in step 1, so send a
> test email only **after** the new value is in place everywhere.

## 2. `AUTH_SECRET`

Read implicitly by Auth.js v5 to sign CSRF tokens, magic-link/verification
tokens, and WebAuthn challenges. Sessions use the `"database"` strategy, so
**already-signed-in users stay signed in** — but any in-flight magic links or
pending passkey challenges become invalid and must be retried.

- [ ] Generate a new value:
      `bash
    openssl rand -base64 32
    `
- [ ] Update `AUTH_SECRET` in `.env.local` and `.env.test`.
- [ ] Update `AUTH_SECRET` in Vercel (all environments) and redeploy.
- [ ] **Verify:** complete a fresh magic-link sign-in and, if you use them, a
      passkey sign-in.

> There is no external service to revoke here — the old value is dead as soon as
> every store holds the new one and production is redeployed.

## 3. `CRON_SECRET`

Authorizes calls to [`/api/cron/calculate-points`](../src/app/api/cron/calculate-points/route.js)
and [`/api/points`](../src/app/api/points/route.js). It lives in **two** remote
stores — Vercel **and** the GitHub Actions repo secret used by the backup
scheduler in [`.github/workflows/calculate-points.yml`](../.github/workflows/calculate-points.yml).
Update both in the same sitting or the scheduled job will start returning `401`.

- [ ] Generate a new value (64 hex chars, matching the current format):
      `bash
    openssl rand -hex 32
    `
- [ ] Update `CRON_SECRET` in `.env.local` and `.env.test`.
- [ ] Update `CRON_SECRET` in Vercel (all environments) and redeploy.
- [ ] Update the `CRON_SECRET` **GitHub Actions repo secret**
      (`gh secret set CRON_SECRET` or the web UI).
- [ ] **Verify:** run the job manually against production and expect `200`:
      `bash
    npm run points:calc -- --live --url https://epl-app-next.vercel.app/
    `
      Then trigger the GitHub workflow via **Actions → Calculate Points
      (backup scheduler) → Run workflow** and confirm it succeeds.

## 4. Database credentials (`DATABASE_URL`)

A Prisma Postgres pooled connection string (`pooled.db.prisma.io`) whose
password is the embedded `sk_...` API key. Consumed by Prisma everywhere via
[`src/lib/prisma.js`](../src/lib/prisma.js). The **production** DB (`.env.local`)
and the **test** DB (`.env.test`) are separate databases — rotate each at its
own project.

- [ ] In the Prisma Console (https://console.prisma.io) open the database, go to
      its connection strings / API keys, and **create a new** connection string
      (this issues a fresh `sk_` key).
- [ ] Update `DATABASE_URL` in `.env.local` with the new production string.
- [ ] Update `DATABASE_URL` in Vercel (all environments) and redeploy.
- [ ] **Verify production** reads the DB — load the app and confirm the
      leaderboard / predictions render, or run a read against the deployed site.
- [ ] Repeat for the **test** database, updating `DATABASE_URL` in `.env.test`,
      then verify locally:
      `bash
    npm run dev:test
    `
- [ ] **Revoke** the old connection string / API key in the Prisma Console once
      the new one is confirmed working.

> Rotating the DB key briefly interrupts connections. Do it during a quiet
> window and redeploy Vercel immediately after so the runtime reconnects with
> the new credentials.

---

## Post-rotation checklist

- [ ] `git status` shows no secret values staged (env files stay gitignored).
- [ ] Production redeployed after **every** Vercel env change.
- [ ] Magic-link sign-in works (covers `EMAIL_SERVER` + `AUTH_SECRET`).
- [ ] `points:calc` against production returns `200` (covers `CRON_SECRET`).
- [ ] Backup GitHub workflow run succeeds (covers `CRON_SECRET` in Actions).
- [ ] App reads/writes data (covers `DATABASE_URL`).
- [ ] Old values revoked at their sources (Gmail app password, Prisma key).

## Also exposed in that chat (not in the requested scope)

For completeness, two other values were visible and are worth rotating on the
same pass:

- **`FOOTBALL_DATA_API_KEY`** — regenerate at https://www.football-data.org and
  update `.env.local`, `.env.test`, and Vercel.
- **`VERCEL_OIDC_TOKEN`** — short-lived and auto-managed by the Vercel CLI; it
  expires on its own and refreshes on the next `vercel env pull` / `vercel dev`.
  No manual action needed.
