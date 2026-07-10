"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function SignInModal({ isOpen, onClose, onSignInSuccess }) {
  const { signInWithMagicLink, signInWithPasskey } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // "success" | "error" | "info"

  const resetForm = () => {
    setEmail("");
    setMessage("");
    setMessageType("info");
    setLoading(false);
    setPasskeyLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await signInWithMagicLink(email);
      if (error) throw error;
      setMessage("Check your email for the sign-in link!");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Failed to send magic link.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskey = async () => {
    setPasskeyLoading(true);
    setMessage("");
    try {
      const { error } = await signInWithPasskey();
      if (error) throw error;
      handleClose();
      if (onSignInSuccess) onSignInSuccess();
    } catch (error) {
      setMessage(error.message || "Passkey sign-in failed.");
      setMessageType("error");
    } finally {
      setPasskeyLoading(false);
    }
  };

  if (!isOpen) return null;

  const messageClasses =
    messageType === "success"
      ? "bg-[#000] bg-opacity-20 text-white border border-[#00c851] border-opacity-30"
      : "bg-[#ff4444] bg-opacity-20 text-white border border-[#ff4444] border-opacity-30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-[#2d2d2d] border border-[#404040] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Sign in</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email webauthn"
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00c851] focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${messageClasses}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || passkeyLoading}
            className="w-full bg-[#00c851] hover:bg-[#00a844] disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Sending…
              </span>
            ) : (
              "Send magic link"
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5 text-xs text-gray-500">
          <div className="flex-1 border-t border-[#404040]" />
          <span>or</span>
          <div className="flex-1 border-t border-[#404040]" />
        </div>

        <button
          type="button"
          onClick={handlePasskey}
          disabled={loading || passkeyLoading}
          className="w-full bg-[#1a1a1a] hover:bg-[#252525] disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors font-medium border border-[#404040] flex items-center justify-center gap-2"
        >
          {passkeyLoading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Waiting for passkey…
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a4 4 0 11-8 0 4 4 0 018 0zm-4 6a7 7 0 00-6.93 6.07M17 14l2 2m0 0l2-2m-2 2v-6"
                />
              </svg>
              Sign in with a passkey
            </>
          )}
        </button>

        <div className="mt-5 text-center text-xs text-gray-400">
          <p>
            No password needed. New accounts are created automatically the first
            time you sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
