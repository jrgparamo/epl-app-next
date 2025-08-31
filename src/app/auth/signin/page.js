"use client";
import { useAuth } from "../../components/AuthProvider";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const { user, signInWithEmail, signUpWithEmail, signInWithMagicLink } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Redirect if already signed in
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

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
        router.push("/");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="bg-[#2d2d2d] p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-green-400 mb-2">
            EPL Top Picks
          </h1>
          <p className="text-gray-400">
            {isSignUp
              ? "Create your account"
              : "Sign in to make your predictions"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-[#1a1a1a] text-white rounded border border-gray-600 focus:border-green-400 focus:outline-none"
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
                className="w-full p-3 bg-[#1a1a1a] text-white rounded border border-gray-600 focus:border-green-400 focus:outline-none"
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
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors font-semibold disabled:opacity-50"
          >
            {loading
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
                className="text-green-400 hover:text-green-300 text-sm"
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

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            By signing in, you agree to our terms and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
