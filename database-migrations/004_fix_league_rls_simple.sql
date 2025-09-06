-- Simpler fix: Replace problematic policies with basic ones

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view league members" ON league_members;
DROP POLICY IF EXISTS "League admins can manage members" ON league_members;

-- Simple policies that don't create recursion

-- Users can view any league membership (this is safe since it's just membership info)
CREATE POLICY "Users can view all league memberships" ON league_members
FOR SELECT USING (true);

-- Users can only insert/update/delete their own memberships
CREATE POLICY "Users can manage own membership" ON league_members
FOR ALL USING (auth.uid() = user_id);

-- Alternative: If you want to be more restrictive, allow viewing only for authenticated users
-- CREATE POLICY "Authenticated users can view memberships" ON league_members
-- FOR SELECT USING (auth.uid() IS NOT NULL);
