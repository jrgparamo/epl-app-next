## Cron / Automatic Points: Secrets & Setup

This document lists the secrets and minimal steps required so the scheduled GitHub Action can call your deployed app's cron endpoint and the app can fetch matches from the Football Data API.

Required secrets
- FOOTBALL_DATA_API_KEY — server-only API key for https://api.football-data.org (use the value from your local `.env.local`).
- CRON_SECRET — a random secret used to authorize calls to `/api/cron/calculate-points`.
- VERCEL_URL — the full URL of your deployed site, e.g. `https://your-app.vercel.app` (used by the workflow to call the endpoint).

Where to add them

- Vercel (server-side, project settings)
  - Add `FOOTBALL_DATA_API_KEY` and `CRON_SECRET` under Project → Settings → Environment Variables.
  - Make sure both are *server-side* (do not mark as public). Deploy/redeploy after adding.

- GitHub (repository secrets for Actions)
  - Add `VERCEL_URL` (the deployed URL without a trailing slash) and `CRON_SECRET` under Settings → Secrets and variables → Actions.
  - If you plan to run the app inside the Action instead of calling a deployed instance, also add `FOOTBALL_DATA_API_KEY` and `CRON_SECRET` to Actions secrets.

Why this matters
- The `/api/matches` route calls the football-data API server-side using `process.env.FOOTBALL_DATA_API_KEY`. If that env var is missing on the deployed host, the endpoint returns 500 and the cron job fails with "Failed to fetch matches".
- The workflow posts to `/api/cron/calculate-points` and must provide the `CRON_SECRET` in the Authorization header.

Quick test commands (replace placeholders)

1) Check matches endpoint on the deployed site:

```bash
curl -i "https://your-app.vercel.app/api/matches?status=FINISHED"
```

2) Trigger the cron endpoint on the deployed site:

```bash
curl -i -X POST "https://your-app.vercel.app/api/cron/calculate-points" \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json"
```

Expected results
- `200` JSON on success. If you see `500`, read the response body in the action logs or curl output — the app logs upstream football-data status and body when fetches fail.

Suggested GitHub Actions improvements (diagnostic-friendly)

Replace the single-line curl in `.github/workflows/calculate-points.yml` with a short block that prints the response body in the Action logs:

```yaml
- name: Calculate Points
  run: |
    curl -i -X POST "${{ secrets.VERCEL_URL }}/api/cron/calculate-points" \
      -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
      -H "Content-Type: application/json" || (echo "curl failed with exit code $?"; exit 1)
```

Notes
- Prefer server-only env names (no `NEXT_PUBLIC_` prefix) for secrets.
- After adding Vercel env vars, redeploy so the runtime receives them.

If you'd like, I can open a tiny PR that adds this doc and updates the workflow with the diagnostic curl change.
