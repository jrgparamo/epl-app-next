export function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-400">{text}</p>
      </div>
    </div>
  );
}
