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

1. **`/api/points`** (GET): Retrieve user's total points
2. **`/api/points`** (POST): Calculate points for finished matches (admin/cron)
3. **`/api/cron/calculate-points`** (POST): Automatic point calculation trigger

### Hooks

1. **`useUserPoints`**: Fetches user points from database with localStorage fallback

## Points Calculation Rules

- **1 point**: Correct match result (home win, away win, or draw)
- **3 points**: Exact score prediction (includes the 1 point for correct result)

## Automatic Point Calculation

### Cron Job Setup

The system runs automatic point calculation every 2 hours via Vercel Cron:

```json
{
  "crons": [
    {
      "path": "/api/cron/calculate-points",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

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

### Fallback to localStorage

If database points are unavailable, the system automatically falls back to localStorage for backwards compatibility.
