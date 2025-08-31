"use client";
import { useAuth } from "./AuthProvider";
import { useState } from "react";

export default function AuthButton() {
  const {
    user,
    loading,
    signOut,
    signInWithEmail,
    signInWithMagicLink,
    signUpWithEmail,
  } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (loading) {
    return (
      <div className="bg-gray-600 text-white px-4 py-2 rounded-lg">
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-white text-sm">
          {user.user_metadata?.full_name || user.email}
        </span>
        <button
          onClick={() => signOut()}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
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
        setShowLogin(false);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  if (showLogin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a1a] rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">
              {isSignUp ? "Sign Up" : "Sign In"}
            </h2>
            <button
              onClick={() => setShowLogin(false)}
              className="text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[#2d2d2d] text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            {!useMagicLink && (
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-[#2d2d2d] text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="magicLink"
                checked={useMagicLink}
                onChange={(e) => setUseMagicLink(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="magicLink" className="text-white text-sm">
                Use magic link (no password needed)
              </label>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {authLoading
                ? "Loading..."
                : useMagicLink
                ? "Send Magic Link"
                : isSignUp
                ? "Sign Up"
                : "Sign In"}
            </button>

            {!useMagicLink && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {isSignUp
                    ? "Already have an account? Sign In"
                    : "Don't have an account? Sign Up"}
                </button>
              </div>
            )}

            {message && (
              <p
                className={`text-sm text-center ${
                  message.includes("Check") ? "text-green-400" : "text-red-400"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowLogin(true)}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
    >
      Sign In
    </button>
  );
}
