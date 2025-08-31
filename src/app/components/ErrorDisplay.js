export function ErrorDisplay({ error }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-red-500 text-xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
        <p className="text-gray-400 mb-4">{error}</p>
        <p className="text-sm text-gray-500">
          Make sure you have set up your Football Data API key in your
          environment variables.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
