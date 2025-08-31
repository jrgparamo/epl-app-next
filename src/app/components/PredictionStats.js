export function PredictionStats({ user, correctPredictions }) {
  if (!user) return null;

  return (
    <div className="mt-2 p-3 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg">
      <div className="text-center text-green-400">
        Correct Predictions:{" "}
        <span className="font-bold">{correctPredictions}</span>
      </div>
      <div className="text-xs text-green-300 text-center mt-1">
        1 point for correct result or 3 points for exact score
      </div>
    </div>
  );
}
