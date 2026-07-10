-- Allow users to view points of other users in shared leagues
-- This enables the league leaderboard to display all member points

-- Add a new policy to user_points table to allow viewing points of users in shared leagues
CREATE POLICY "Users can view points of league members" ON user_points
FOR SELECT USING (
  -- Users can see their own points (existing functionality)
  auth.uid() = user_id
  OR
  -- Users can see points of other users if they share a league
  EXISTS (
    SELECT 1
    FROM league_members lm1
    JOIN league_members lm2 ON lm1.league_id = lm2.league_id
    WHERE lm1.user_id = auth.uid()
    AND lm2.user_id = user_points.user_id
  )
);

-- Drop the old restrictive policy
DROP POLICY "Users can view their own points" ON user_points;
