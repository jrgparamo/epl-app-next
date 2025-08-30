"use client";

export default function HowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">How to play</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-[#2d2d2d] rounded-lg p-6">
              <h4 className="font-semibold text-white text-center mb-2">
                Predict the upcoming matches
              </h4>
              <p className="text-white">
                You can edit your predictions until the match kicks off.
              </p>
            </div>

            <div className="bg-[#2d2d2d] rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-white text-center">
                Scoring
              </h3>
              <div className="relative flex items-center justify-between mb-6">
                <div className="flex flex-col gap-3">
                  <h4 className="font-medium text-white">Correct outcome</h4>
                  <p className="text-sm font-medium text-gray-400">
                    Winner or draw
                  </p>
                </div>
                <p className="justify-center text-green-400 text-center text-xs font-semibold">
                  1 Point
                </p>
              </div>
              <div className="relative flex items-center justify-between ">
                <div className="flex flex-col gap-3">
                  <h4 className="font-medium text-white">Exact Score</h4>
                  <p className="text-sm font-medium text-gray-400">
                    Winner or draw with exact score
                  </p>
                </div>
                <p className="justify-center text-green-400 text-center text-xs font-semibold">
                  3 Points
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
