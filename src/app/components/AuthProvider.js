"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import {
  SessionProvider,
  useSession,
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
} from "next-auth/react";
import { signIn as webauthnSignIn } from "next-auth/webauthn";

// localStorage key for a given user id.
export const adminCacheKey = (userId) => `admin_status_${userId}`;

const AuthContext = createContext({});

/**
 * Flatten an Auth.js session user into a plain object exposed to consumers.
 */
function adaptUser(sessionUser) {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    displayName: sessionUser.displayName ?? null,
    isAdmin: Boolean(sessionUser.isAdmin),
  };
}

function InnerAuthProvider({ children }) {
  const { data: session, status, update } = useSession();

  const user = useMemo(() => adaptUser(session?.user), [session?.user]);
  const loading = status === "loading";

  // Keep the localStorage admin cache in sync with the resolved session.
  // Runs only when the session finishes loading so we never write stale data.
  useEffect(() => {
    if (loading) return;
    if (user?.id) {
      try {
        localStorage.setItem(adminCacheKey(user.id), JSON.stringify(user.isAdmin));
      } catch {
        // localStorage unavailable (SSR, private browsing quota) — safe to ignore.
      }
    }
  }, [user?.id, user?.isAdmin, loading]);

  // Magic-link sign-in via Auth.js Nodemailer provider.
  const signInWithMagicLink = useCallback(async (email) => {
    try {
      const result = await nextAuthSignIn("nodemailer", {
        email,
        redirect: false,
      });
      if (result?.error) {
        return { data: null, error: new Error(result.error) };
      }
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  // Passkey authentication (existing user).
  // WebAuthn requires the dedicated signIn from next-auth/webauthn so the
  // browser can run the credential ceremony (navigator.credentials.get).
  const signInWithPasskey = useCallback(async () => {
    try {
      const result = await webauthnSignIn("passkey", { redirect: false });
      if (result?.error) {
        return { data: null, error: new Error(result.error) };
      }
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  // Passkey registration for the currently signed-in user.
  // Auth.js v5 exposes `signIn("passkey", { action: "register" })` for this,
  // but it must come from next-auth/webauthn (not next-auth/react).
  const registerPasskey = useCallback(async () => {
    try {
      const result = await webauthnSignIn("passkey", {
        action: "register",
        redirect: false,
      });
      if (result?.error) {
        return { data: null, error: new Error(result.error) };
      }
      await update();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, [update]);

  const signOut = useCallback(async () => {
    try {
      // Clear the admin cache so it never bleeds into the next session.
      if (user?.id) {
        try {
          localStorage.removeItem(adminCacheKey(user.id));
        } catch {
          // localStorage unavailable — safe to ignore.
        }
      }
      await nextAuthSignOut({ redirect: false });
      return { error: null };
    } catch (error) {
      return { error };
    }
  }, [user?.id]);

  // Legacy API: re-fetch the session. Auth.js `update()` reloads from the
  // DB when using the database session strategy.
  const refreshUser = useCallback(async () => {
    try {
      const updated = await update();
      return { user: adaptUser(updated?.user), error: null };
    } catch (error) {
      return { user: null, error };
    }
  }, [update]);

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithMagicLink,
      signInWithPasskey,
      registerPasskey,
      signOut,
      refreshUser,
    }),
    [
      user,
      loading,
      signInWithMagicLink,
      signInWithPasskey,
      registerPasskey,
      signOut,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </SessionProvider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthProvider;
