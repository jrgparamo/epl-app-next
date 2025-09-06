-- Auto-populate profiles table when new users are created
-- Add this to your Supabase database migrations

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Optional: Function to backfill existing users
CREATE OR REPLACE FUNCTION backfill_profiles()
RETURNS INTEGER AS $$
DECLARE
  users_added INTEGER := 0;
BEGIN
  INSERT INTO public.profiles (id, email, display_name, created_at, updated_at)
  SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
    created_at,
    updated_at
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM public.profiles);

  GET DIAGNOSTICS users_added = ROW_COUNT;
  RETURN users_added;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run this to backfill existing users:
-- SELECT backfill_profiles();
