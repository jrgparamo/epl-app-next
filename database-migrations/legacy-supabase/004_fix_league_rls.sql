-- Fixed RLS Policies for league_members table to avoid infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view league members" ON league_members;
DROP POLICY IF EXISTS "League admins can manage members" ON league_members;

-- Simpler, non-recursive policies

-- Users can view their own memberships
CREATE POLICY "Users can view own memberships" ON league_members
FOR SELECT USING (user_id = auth.uid());

-- Users can view members of leagues where they are members (using a function to avoid recursion)
CREATE OR REPLACE FUNCTION user_is_league_member(target_league_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM league_members
    WHERE league_id = target_league_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy that uses the function to check membership
CREATE POLICY "Users can view league members if they are members" ON league_members
FOR SELECT USING (user_is_league_member(league_id));

-- Users can join leagues (insert themselves)
CREATE POLICY "Users can join leagues" ON league_members
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave leagues (delete themselves)
CREATE POLICY "Users can leave leagues" ON league_members
FOR DELETE USING (auth.uid() = user_id);

-- League admins can manage members (using a function to avoid recursion)
CREATE OR REPLACE FUNCTION user_is_league_admin(target_league_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM league_members
    WHERE league_id = target_league_id
    AND user_id = auth.uid()
    AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for admin management
CREATE POLICY "League admins can manage members" ON league_members
FOR ALL USING (user_is_league_admin(league_id) OR user_id = auth.uid());
