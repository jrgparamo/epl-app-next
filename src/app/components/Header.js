"use client";

import { useState } from "react";
import AuthButton from "./AuthButton";
import HowToPlayModal from "./HowToPlayModal";

export default function Header({ predictions = 0 }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="bg-[#2d2d2d] border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-green-400">
                EPL Top Picks
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">This week</div>
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {predictions}
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                How to play
              </button>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <HowToPlayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
