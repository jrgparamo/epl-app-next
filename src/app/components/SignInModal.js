"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function SignInModal({ isOpen, onClose, onSignInSuccess }) {
  const { signInWithEmail, signUpWithEmail, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (useMagicLink) {
        const { error } = await signInWithMagicLink(email);
        if (error) throw error;
        setMessage("Check your email for the magic link!");
      } else if (isSignUp) {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
        setMessage("Check your email to confirm your account!");
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        // Close modal and notify parent on successful sign in
        onClose();
        if (onSignInSuccess) onSignInSuccess();
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setMessage("");
    setUseMagicLink(false);
    setIsSignUp(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

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
          <h2 className="text-xl font-bold text-white">
            {isSignUp ? "Create Account" : "Sign In"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00c851] focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          {!useMagicLink && (
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00c851] focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
          )}

          <div className="flex flex-col space-y-3 text-sm">
            <label className="flex items-center text-gray-300 cursor-pointer p-2 rounded-lg hover:bg-[#404040] hover:bg-opacity-30 transition-colors">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={useMagicLink}
                  onChange={(e) => setUseMagicLink(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    useMagicLink
                      ? "bg-[#00c851] border-[#00c851]"
                      : "border-gray-600 bg-transparent"
                  }`}
                >
                  {useMagicLink && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="ml-3 select-none">Use magic link</span>
            </label>

            {!useMagicLink && (
              <label className="flex items-center text-gray-300 cursor-pointer p-2 rounded-lg hover:bg-[#404040] hover:bg-opacity-30 transition-colors">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isSignUp}
                    onChange={(e) => setIsSignUp(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isSignUp
                        ? "bg-[#00c851] border-[#00c851]"
                        : "border-gray-600 bg-transparent"
                    }`}
                  >
                    {isSignUp && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="ml-3 select-none">Create new account</span>
              </label>
            )}
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.includes("Check your email")
                  ? "bg-[#00c851] bg-opacity-20 text-[#00c851] border border-[#00c851] border-opacity-30"
                  : "bg-[#ff4444] bg-opacity-20 text-[#ff4444] border border-[#ff4444] border-opacity-30"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00c851] hover:bg-[#00a844] disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading...
              </div>
            ) : useMagicLink ? (
              "Send Magic Link"
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Sign in to make predictions and compete with friends!</p>
        </div>
      </div>
    </div>
  );
}
