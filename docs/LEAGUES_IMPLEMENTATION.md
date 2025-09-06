# League System Implementation

## Overview

The league system allows users to create and join private groups to compete with specific sets of users, in addition to the global leaderboard. Users can join multiple leagues and see separate leaderboards for each.

## Features

### 1. League Management

- **Create League**: Users can create new leagues with custom names and descriptions
- **Join League**: Users can join existing leagues using 6-character join codes
- **Multiple Memberships**: Users can be members of multiple leagues simultaneously
- **Admin System**: League creators are automatically admins and can manage their leagues

### 2. Join Methods

- **Join Code**: Simple 6-character alphanumeric codes (e.g., "ABC123")
- **QR Code**: Automatic QR code generation for easy mobile sharing
- **Share Function**: Native mobile sharing or clipboard fallback

### 3. League Leaderboards

- **Separate Rankings**: Each league has its own leaderboard showing only members
- **Real-time Updates**: Rankings update when points are calculated
- **Member Stats**: Shows join dates, admin status, and individual performance
- **League Statistics**: Total predictions and correct predictions across all members

## Database Schema

### Tables Created

1. **`leagues`**

   - Stores league information (name, description, join code, creator)
   - Has member limits (default 100) and active status

2. **`league_members`**

   - Many-to-many relationship between users and leagues
   - Tracks join dates and admin status
   - Prevents duplicate memberships

3. **`profiles`** (if not exists)
   - Stores user display names and emails for leaderboard display
   - Uses Row Level Security for privacy

### Views Created

1. **`league_leaderboard`**
   - Combines league membership with user points
   - Automatically calculates rankings within each league
   - Includes all necessary data for frontend display

## API Endpoints

### `/api/leagues` (GET/POST)

- **GET**: Fetch all leagues the current user is a member of
- **POST**: Create new league or join existing league by code

### `/api/leagues/[leagueId]/leaderboard` (GET)

- Fetch leaderboard for a specific league
- Includes league info and member rankings
- Requires league membership for access

## Security

### Row Level Security (RLS)

- Users can only view leagues they're members of
- Users can only join leagues (not manage others' memberships)
- League admins can manage their league settings
- All operations require authentication

### Join Code Security

- Codes are randomly generated and unique
- Confusing characters (0, 1, I, O) are replaced
- Codes are case-insensitive for user convenience

## Frontend Components

### `LeagueManager`

- Displays user's leagues with join/create options
- Handles league selection for leaderboard display
- Shows admin status and join codes for owned leagues

### `LeagueLeaderboard`

- Shows league-specific rankings
- Displays league stats and member information
- Includes sharing functionality for league creators

### `QRCodeModal`

- Generates QR codes for easy mobile sharing
- Provides multiple sharing options (native share, copy code)
- External QR code API for simplicity

## Usage Flow

1. **Creating a League**:

   - User clicks "Create League"
   - Fills in name and optional description
   - System generates unique join code
   - User becomes admin and first member

2. **Joining a League**:

   - User receives join code from friend
   - Enters code in "Join League" form
   - System validates code and adds user to league

3. **Viewing Leaderboards**:

   - User switches between Global and League tabs
   - Selects specific league from their list
   - Views rankings within that league only

4. **Sharing Leagues**:
   - League creator/admin can copy join code
   - QR code modal provides visual sharing
   - Native share API for mobile convenience

## Configuration

### Database Migration

Run `database-migrations/002_leagues.sql` in your Supabase dashboard to set up the league system.

### Environment Variables

No additional environment variables required - uses existing Supabase configuration.

## Future Enhancements

### Potential Features

- League-specific settings (scoring rules, match types)
- Tournament/bracket systems within leagues
- League chat or messaging
- League avatars/logos
- Member roles beyond admin (moderator, etc.)
- League statistics and insights
- Export league data
- League invitation system via email

### Technical Improvements

- Better QR code solution (local generation)
- League search/discovery
- League categories or tags
- Advanced member management
- League archiving/deletion
- Bulk member operations

## Testing

### Manual Testing Steps

1. Create a new league and verify join code generation
2. Join the league with another account using the code
3. Check that leaderboards show correct data
4. Test QR code generation and sharing
5. Verify RLS policies prevent unauthorized access
6. Test member limits and validation

### Database Testing

```sql
-- Test league creation
SELECT create_league('Test League', 'Description');

-- Test joining by code
SELECT join_league_by_code('ABC123');

-- Test leaderboard view
SELECT * FROM league_leaderboard WHERE league_id = 'your-league-id';
```

The league system is now fully implemented and ready for use!
