-- Extended test data for user: d2b2bf60-584c-43af-b494-7f8d450d322d
-- This creates a more realistic scenario with more matches

-- Insert comprehensive test points data
INSERT INTO user_points (user_id, match_id, points_earned, prediction_type, home_score_predicted, away_score_predicted, home_score_actual, away_score_actual) VALUES
-- Week 1 matches - Good performance
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w1_m1', 3, 'exact_score', 2, 1, 2, 1),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w1_m2', 3, 'exact_score', 0, 0, 0, 0),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w1_m3', 1, 'result', 3, 1, 2, 0),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w1_m4', 1, 'result', 1, 2, 0, 1),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w1_m5', 0, 'result', 2, 0, 0, 1),

-- Week 2 matches - Mixed performance
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w2_m1', 3, 'exact_score', 1, 1, 1, 1),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w2_m2', 1, 'result', 2, 1, 3, 0),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w2_m3', 1, 'result', 0, 1, 0, 2),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w2_m4', 0, 'result', 1, 0, 0, 0),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w2_m5', 1, 'result', 2, 2, 1, 1),

-- Week 3 matches - Average performance
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w3_m1', 1, 'result', 1, 0, 2, 0),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w3_m2', 0, 'exact_score', 2, 2, 1, 3),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w3_m3', 3, 'exact_score', 3, 0, 3, 0),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w3_m4', 1, 'result', 1, 1, 0, 0),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w3_m5', 0, 'result', 2, 1, 1, 2),

-- Week 4 matches - Recent matches
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w4_m1', 1, 'result', 0, 1, 0, 3),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w4_m2', 3, 'exact_score', 2, 1, 2, 1),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w4_m3', 0, 'result', 3, 0, 1, 1),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w4_m4', 1, 'result', 2, 2, 1, 1),
('d2b2bf60-584c-43af-b494-7f8d450d322d', 'epl_2024_w4_m5', 1, 'result', 1, 0, 2, 0);

-- Summary for this user:
-- Total points: 25 points (5 exact scores = 15 pts + 10 correct results = 10 pts)
-- Matches predicted: 20
-- Correct predictions: 15
-- Success rate: 75%
