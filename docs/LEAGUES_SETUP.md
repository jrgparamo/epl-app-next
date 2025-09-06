# League System Setup

## Quick Setup Instructions

### 1. Database Migration

Run the league migration in your Supabase dashboard:

```sql
-- Execute the contents of database-migrations/002_leagues.sql
```

This will create:

- `leagues` table for league information
- `league_members` table for membership tracking
- `profiles` table (if needed) for user display names
- All necessary indexes and RLS policies
- Helper functions for league management

### 2. Verify Setup

After running the migration, you can test the league system:

1. **Start Development Server**:

   ```bash
   npm run dev
   ```

2. **Test League Creation**:

   - Go to `/leaderboard` page
   - Switch to "League Leaderboards" tab
   - Click "Create League"
   - Fill in league name and create

3. **Test League Joining**:

   - Use another account or share the join code
   - Click "Join League"
   - Enter the 6-character code

4. **Test QR Code Sharing**:
   - As a league creator, click the "QR" button
   - Verify QR code modal opens
   - Test copy/share functionality

### 3. Features Available

✅ **League Management**

- Create leagues with custom names/descriptions
- Join leagues using 6-character codes
- Multiple league memberships per user

✅ **Leaderboards**

- Global leaderboard (all users)
- League-specific leaderboards
- Real-time ranking updates

✅ **Sharing**

- Copy join codes to clipboard
- QR code generation for mobile sharing
- Native mobile share API support

✅ **Security**

- Row Level Security on all tables
- Users can only access leagues they've joined
- Secure join code validation

### 4. Next Steps

The league system is ready to use! Users can:

1. Create private groups for friends/family
2. Join multiple leagues to compete in different groups
3. View separate rankings for each league
4. Share leagues easily via codes or QR codes

All league data integrates with the existing points system, so rankings will update automatically as users make predictions and matches are scored.

## Support

If you encounter any issues:

1. Check that the database migration completed successfully
2. Verify RLS policies are enabled in Supabase
3. Ensure your Supabase environment variables are correct
4. Check browser console for any API errors

The league system leverages your existing authentication and points systems, so no additional configuration should be needed beyond the database migration.
