# Legacy Supabase migrations (archived)

These SQL files describe the schema and RLS policies from when this app ran
on Supabase Postgres. They are kept for historical reference only.

The current schema is managed by **Prisma** — see:

- `prisma/schema.prisma`
- `prisma/migrations/`

RPCs previously defined here (`calculate_match_points`, `create_league`,
`join_league_by_code`, `generate_league_join_code`) have been reimplemented
in JavaScript under:

- `src/lib/points.js`
- `src/lib/leagues.js`

RLS policies have been replaced by explicit server-side authorization checks
in each API route (see `src/lib/auth-helpers.js`).
