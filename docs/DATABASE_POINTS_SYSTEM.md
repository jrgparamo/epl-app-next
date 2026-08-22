# Database-Driven Points System

This document outlines the new database-driven points system that replaces the client-side localStorage-based approach.

## Overview

The new system automatically calculates and stores user points in the database when matches finish, providing consistent scoring across all devices and sessions.

## Architecture

### Database Schema

1. **`user_points` table**: Stores individual point records for each match prediction
2. **`user_points_summary` view**: Provides aggregated point totals per user
3. **`calculate_match_points()` function**: Automatically calculates points for finished matches

### API Endpoints

1. **`/api/points`** (GET): Retrieve the user's points summary. Before reading,
   it runs a throttled, best-effort `refreshRecentMatchPoints()` so recently
   finished matches are scored on read instead of waiting for the daily cron.
2. **`/api/points`** (POST): Calculate points for finished matches (admin/cron)
3. **`/api/cron/calculate-points`** (POST): Automatic point calculation trigger

### Hooks & Providers

1. **`useUserPoints`**: Fetches the points summary from `/api/points` and caches
   the response in `localStorage` (`user_points_cache_<userId>`) using a
   stale-while-revalidate strategy (30-minute TTL). It seeds from the cache on
   mount so the badge never flashes `0`, and revalidates on mount / tab focus.
2. **`PointsProvider` / `usePoints`**: Wraps the app (in `layout.js`) and shares
   a single `useUserPoints` instance so the **Season Total** badge is identical
   on the matches, account, and leaderboard pages.

> **Season Total is always the DB total.** Every page reads `points` from
> `usePoints()`. The old per-device incremental counter
> (`total_correct_predictions_<email>`) is no longer a source for the badge; it
> remains only inside `useCorrectPredictions` for the per-matchweek running
> total shown in `PredictionStats`.

## Points Calculation Rules

- **1 point**: Correct match result (home win, away win, or draw)
- **3 points**: Exact score prediction (includes the 1 point for correct result)

## Automatic Point Calculation

### Cron Job Setup

Vercel Cron (Hobby plan) is limited to **once per day**, so the scheduled job is
the backfill/safety net rather than the primary freshness mechanism:

```json
{
  "crons": [
    {
      "path": "/api/cron/calculate-points",
      "schedule": "0 4 * * *"
    }
  ]
}
```

### Near-real-time freshness (lazy refresh)

Because the cron only runs daily, `GET /api/points` also triggers
`refreshRecentMatchPoints()`:

- **Throttled** via a shared `CronLog` marker so the external football-data
  fetch runs at most once per ~10 minutes across all readers (respecting the
  provider's rate limits).
- **Scoped** to matches updated within the last ~3 days to keep the work bounded
  (older matches are covered by the daily cron).
- **Best-effort**: any failure is swallowed so a read never breaks.

The net effect: points become correct within minutes of a match finishing the
next time any user opens the app, without needing more frequent cron runs.

### Environment Variables Required

```bash
CRON_SECRET=your-secret-key-here
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Migration Strategy

The new system includes backwards compatibility:

1. **Database points** are used when available (preferred)
2. **localStorage points** are used as fallback for existing users
3. **Gradual migration** as matches finish and points are calculated

## Implementation Steps

### 1. Database Setup

Run the migration script:

```sql
-- Execute database-migrations/001_user_points.sql in your Supabase dashboard
```

### 2. Environment Variables

Add the CRON_SECRET to your environment:

```bash
# Add to .env.local and Vercel environment variables
CRON_SECRET=your-secure-random-string
```

### 3. Deploy

Deploy the application with the new endpoints and cron configuration.

### 4. Manual Point Calculation (Optional)

For existing finished matches, you can manually trigger point calculation:

```bash
curl -X POST https://your-app.vercel.app/api/cron/calculate-points \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

## Monitoring

### Check Point Calculation Status

```bash
# Health check
curl https://your-app.vercel.app/api/cron/calculate-points

# Manual trigger
curl -X POST https://your-app.vercel.app/api/cron/calculate-points \
  -H "Authorization: Bearer your-cron-secret"
```

### Database Queries

```sql
-- Check total points for all users
SELECT * FROM user_points_summary ORDER BY total_points DESC;

-- Check point records for a specific match
SELECT * FROM user_points WHERE match_id = 'your-match-id';

-- Recalculate points for a specific match
SELECT calculate_match_points('match-id', home_score, away_score);
```

## Benefits

1. **Consistency**: Points are the same across all devices
2. **Automatic Updates**: No need for users to navigate through weeks
3. **Real-time**: Points update as soon as matches finish
4. **Scalability**: Database-driven approach scales better
5. **Reliability**: No dependency on localStorage or client-side calculations

## Troubleshooting

### Points Not Updating

1. Check if cron job is running (Vercel Functions dashboard)
2. Verify CRON_SECRET environment variable
3. Check API logs for errors
4. Manually trigger point calculation

### Database Connection Issues

1. Verify Supabase credentials
2. Check Row Level Security policies
3. Ensure database migrations are applied

### Fallback behaviour

If `/api/points` is unavailable, `useUserPoints` keeps showing the last cached
DB summary (`user_points_cache_<userId>`) instead of dropping to `0`, so the
Season Total stays stable across transient network errors.
