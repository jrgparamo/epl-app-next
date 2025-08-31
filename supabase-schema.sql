-- Create user predictions table
CREATE TABLE user_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  confidence INTEGER DEFAULT 1 CHECK (confidence >= 1 AND confidence <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Create index for faster queries
CREATE INDEX idx_user_predictions_user_match ON user_predictions(user_id, match_id);
CREATE INDEX idx_user_predictions_created ON user_predictions(created_at);

-- Enable Row Level Security
ALTER TABLE user_predictions ENABLE ROW LEVEL SECURITY;

-- Create policy so users can only access their own predictions
CREATE POLICY "Users can manage their own predictions" ON user_predictions
FOR ALL USING (auth.uid() = user_id);

-- Create a leaderboard view (optional)
CREATE VIEW leaderboard AS
SELECT
  user_id,
  COUNT(*) as total_predictions,
  SUM(CASE
    WHEN home_score = actual_home_score AND away_score = actual_away_score THEN 3
    WHEN (home_score > away_score AND actual_home_score > actual_away_score) OR
         (home_score < away_score AND actual_home_score < actual_away_score) OR
         (home_score = away_score AND actual_home_score = actual_away_score) THEN 1
    ELSE 0
  END) as total_points
FROM user_predictions
GROUP BY user_id
ORDER BY total_points DESC;
