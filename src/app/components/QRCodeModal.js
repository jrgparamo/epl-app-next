import { useState } from "react";
import Image from "next/image";

export default function QRCodeModal({ isOpen, onClose, joinCode, leagueName }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    `Join my EPL Prediction League "${leagueName}" with code: ${joinCode}`
  )}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy join code:", err);
    }
  };

  const handleShareText = async () => {
    const shareText = `Join my EPL Prediction League "${leagueName}" with code: ${joinCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join My League",
          text: shareText,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback to copying text
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Share League</h3>
          <button
            onClick={onClose}
            className="text-[#b3b3b3] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="text-center space-y-4">
          <p className="text-[#b3b3b3] text-sm mb-4">
            Share this QR code or join code with friends to invite them to your
            league
          </p>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg mx-auto inline-block">
            <Image
              src={qrCodeUrl}
              alt="League QR Code"
              width={192}
              height={192}
              className="mx-auto"
            />
          </div>

          {/* Join Code */}
          <div className="bg-[#1a1a1a] border border-[#404040] rounded-lg p-4">
            <p className="text-sm text-[#b3b3b3] mb-2">Join Code:</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xl font-mono font-bold text-[#00c851]">
                {joinCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1 bg-[#00c851] hover:bg-green-700 text-white text-sm rounded transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleShareText}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Share Invite
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
