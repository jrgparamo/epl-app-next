// Scoring for a score prediction against a final result:
// exact score = 3, correct outcome = 1, otherwise 0. Null when unknown/locked.
export function scorePick(pick, fullTime) {
  if (!pick || pick.locked) return null;
  if (fullTime?.home == null || fullTime?.away == null) return null;
  if (pick.home_score === fullTime.home && pick.away_score === fullTime.away) {
    return 3;
  }
  const pickDiff = Math.sign(pick.home_score - pick.away_score);
  const resultDiff = Math.sign(fullTime.home - fullTime.away);
  return pickDiff === resultDiff ? 1 : 0;
}
