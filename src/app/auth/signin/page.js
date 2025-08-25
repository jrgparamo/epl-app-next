"use client";
import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SignIn() {
  const [providers, setProviders] = useState(null);

  useEffect(() => {
    const setAuthProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    setAuthProviders();
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <div className="bg-[#2d2d2d] p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-green-400 mb-2">
            EPL Top Picks
          </h1>
          <p className="text-gray-400">Sign in to make your predictions</p>
        </div>

        <div className="space-y-4">
          {providers &&
            Object.values(providers).map((provider) => (
              <button
                key={provider.name}
                onClick={() => signIn(provider.id, { callbackUrl: "/" })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-semibold"
              >
                Sign in with {provider.name}
              </button>
            ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            By signing in, you agree to our terms and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
