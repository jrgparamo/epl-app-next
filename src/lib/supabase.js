import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a mock client if environment variables are not set (for development)
const createSupabaseClient = () => {
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("your_supabase") ||
    supabaseAnonKey.includes("your_supabase")
  ) {
    console.warn(
      "Supabase environment variables not configured. Using mock client."
    );

    // Return a mock client for development
    return {
      auth: {
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        signInWithPassword: () =>
          Promise.resolve({
            data: null,
            error: { message: "Supabase not configured" },
          }),
        signUp: () =>
          Promise.resolve({
            data: null,
            error: { message: "Supabase not configured" },
          }),
        signInWithOtp: () =>
          Promise.resolve({
            data: null,
            error: { message: "Supabase not configured" },
          }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        upsert: () => ({
          select: () => Promise.resolve({ data: [], error: null }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    };
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();
