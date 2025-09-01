-- Add user points tracking table
CREATE TABLE user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  prediction_type TEXT CHECK (prediction_type IN ('result', 'exact_score')),
  home_score_predicted INTEGER,
  away_score_predicted INTEGER,
  home_score_actual INTEGER,
  away_score_actual INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id, prediction_type)
);

-- Create index for faster queries
CREATE INDEX idx_user_points_user ON user_points(user_id);
CREATE INDEX idx_user_points_match ON user_points(match_id);
CREATE INDEX idx_user_points_calculated ON user_points(calculated_at);

-- Enable Row Level Security
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- Create policy so users can only access their own points
CREATE POLICY "Users can view their own points" ON user_points
FOR SELECT USING (auth.uid() = user_id);

-- Create a summary view for total user points
CREATE VIEW user_points_summary AS
SELECT
  user_id,
  SUM(points_earned) as total_points,
  COUNT(DISTINCT match_id) as matches_predicted,
  COUNT(CASE WHEN points_earned > 0 THEN 1 END) as correct_predictions,
  MAX(calculated_at) as last_updated
FROM user_points
GROUP BY user_id;

-- Enable RLS on the view
ALTER VIEW user_points_summary SET (security_invoker = true);

-- Function to calculate points for a finished match
CREATE OR REPLACE FUNCTION calculate_match_points(match_id_param TEXT, home_score_actual INTEGER, away_score_actual INTEGER)
RETURNS INTEGER AS $$
DECLARE
  points_calculated INTEGER := 0;
  pred RECORD;
BEGIN
  -- Loop through all predictions for this match
  FOR pred IN
    SELECT user_id, home_score, away_score
    FROM user_predictions
    WHERE match_id = match_id_param
  LOOP
    -- Clear any existing points for this match/user
    DELETE FROM user_points
    WHERE user_id = pred.user_id AND match_id = match_id_param;

    -- Check for exact score match (3 points)
    IF pred.home_score = home_score_actual AND pred.away_score = away_score_actual THEN
      INSERT INTO user_points (user_id, match_id, points_earned, prediction_type,
                              home_score_predicted, away_score_predicted,
                              home_score_actual, away_score_actual)
      VALUES (pred.user_id, match_id_param, 3, 'exact_score',
              pred.home_score, pred.away_score, home_score_actual, away_score_actual);
      points_calculated := points_calculated + 3;
    -- Check for correct result (1 point)
    ELSIF (
      (pred.home_score > pred.away_score AND home_score_actual > away_score_actual) OR
      (pred.home_score < pred.away_score AND home_score_actual < away_score_actual) OR
      (pred.home_score = pred.away_score AND home_score_actual = away_score_actual)
    ) THEN
      INSERT INTO user_points (user_id, match_id, points_earned, prediction_type,
                              home_score_predicted, away_score_predicted,
                              home_score_actual, away_score_actual)
      VALUES (pred.user_id, match_id_param, 1, 'result',
              pred.home_score, pred.away_score, home_score_actual, away_score_actual);
      points_calculated := points_calculated + 1;
    END IF;
  END LOOP;

  RETURN points_calculated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
