-- Create leagues table
CREATE TABLE leagues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  join_code VARCHAR(10) UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 100
);

-- Create league_members table for many-to-many relationship
CREATE TABLE league_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  UNIQUE(league_id, user_id)
);

-- Create profiles table if it doesn't exist (for display names and email access)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name VARCHAR(100),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX idx_leagues_join_code ON leagues(join_code);
CREATE INDEX idx_leagues_created_by ON leagues(created_by);
CREATE INDEX idx_league_members_league ON league_members(league_id);
CREATE INDEX idx_league_members_user ON league_members(user_id);

-- Enable Row Level Security
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leagues table
-- Users can view leagues they are members of
CREATE POLICY "Users can view leagues they belong to" ON leagues
FOR SELECT USING (
  id IN (
    SELECT league_id FROM league_members WHERE user_id = auth.uid()
  )
);

-- Users can create new leagues
CREATE POLICY "Users can create leagues" ON leagues
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- League creators and admins can update their leagues
CREATE POLICY "League admins can update leagues" ON leagues
FOR UPDATE USING (
  id IN (
    SELECT league_id FROM league_members
    WHERE user_id = auth.uid() AND is_admin = TRUE
  ) OR created_by = auth.uid()
);

-- RLS Policies for league_members table
-- Users can view league members for leagues they belong to
CREATE POLICY "Users can view league members" ON league_members
FOR SELECT USING (
  league_id IN (
    SELECT league_id FROM league_members WHERE user_id = auth.uid()
  )
);

-- Users can join leagues (insert themselves)
CREATE POLICY "Users can join leagues" ON league_members
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave leagues (delete themselves)
CREATE POLICY "Users can leave leagues" ON league_members
FOR DELETE USING (auth.uid() = user_id);

-- League admins can manage members
CREATE POLICY "League admins can manage members" ON league_members
FOR ALL USING (
  league_id IN (
    SELECT league_id FROM league_members
    WHERE user_id = auth.uid() AND is_admin = TRUE
  )
);

-- Function to generate unique join codes
CREATE OR REPLACE FUNCTION generate_league_join_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-character alphanumeric code
    code := upper(substr(encode(gen_random_bytes(4), 'base64'), 1, 6));
    -- Remove any confusing characters
    code := replace(code, '0', 'A');
    code := replace(code, '1', 'B');
    code := replace(code, 'I', 'C');
    code := replace(code, 'O', 'D');
    code := replace(code, '+', 'E');
    code := replace(code, '/', 'F');

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM leagues WHERE join_code = code) INTO code_exists;

    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a league and automatically add creator as admin
CREATE OR REPLACE FUNCTION create_league(
  league_name VARCHAR(100),
  league_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_league_id UUID;
  join_code TEXT;
BEGIN
  -- Generate unique join code
  join_code := generate_league_join_code();

  -- Create the league
  INSERT INTO leagues (name, description, join_code, created_by)
  VALUES (league_name, league_description, join_code, auth.uid())
  RETURNING id INTO new_league_id;

  -- Add creator as admin member
  INSERT INTO league_members (league_id, user_id, is_admin)
  VALUES (new_league_id, auth.uid(), TRUE);

  RETURN new_league_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join a league by code
CREATE OR REPLACE FUNCTION join_league_by_code(code VARCHAR(10))
RETURNS UUID AS $$
DECLARE
  league_id_found UUID;
  member_count INTEGER;
  max_members_allowed INTEGER;
BEGIN
  -- Find the league by join code
  SELECT id, max_members INTO league_id_found, max_members_allowed
  FROM leagues
  WHERE join_code = upper(code) AND is_active = TRUE;

  IF league_id_found IS NULL THEN
    RAISE EXCEPTION 'League not found or inactive';
  END IF;

  -- Check if user is already a member
  IF EXISTS(SELECT 1 FROM league_members WHERE league_id = league_id_found AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Already a member of this league';
  END IF;

  -- Check member limit
  SELECT COUNT(*) INTO member_count FROM league_members WHERE league_id = league_id_found;

  IF member_count >= max_members_allowed THEN
    RAISE EXCEPTION 'League is full';
  END IF;

  -- Add user to league
  INSERT INTO league_members (league_id, user_id, is_admin)
  VALUES (league_id_found, auth.uid(), FALSE);

  RETURN league_id_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for league leaderboards
CREATE VIEW league_leaderboard AS
SELECT
  lm.league_id,
  l.name as league_name,
  lm.user_id,
  COALESCE(ups.total_points, 0) as total_points,
  COALESCE(ups.matches_predicted, 0) as matches_predicted,
  COALESCE(ups.correct_predictions, 0) as correct_predictions,
  lm.joined_at,
  lm.is_admin,
  ROW_NUMBER() OVER (PARTITION BY lm.league_id ORDER BY COALESCE(ups.total_points, 0) DESC) as rank
FROM league_members lm
JOIN leagues l ON l.id = lm.league_id
LEFT JOIN user_points_summary ups ON ups.user_id = lm.user_id
WHERE l.is_active = TRUE
ORDER BY lm.league_id, rank;

-- Enable RLS on the view
ALTER VIEW league_leaderboard SET (security_invoker = true);
