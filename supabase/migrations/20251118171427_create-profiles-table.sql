-- Create the profiles table, linking it to the auth.users table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add a comment for clarity in the database
COMMENT ON TABLE public.profiles IS 'Profile information for each user.';

-- Enable Row Level Security on the table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create Security Policies:
-- 1. Anyone can view public profiles.
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

-- 2. A user can create their own profile.
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. A user can update their own profile.
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 4. A user can delete their own profile.
CREATE POLICY "Users can delete their own profile."
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Case-insensitive unique index for usernames
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_ci ON public.profiles (lower(username));
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_profiles_username_ci' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'COMMENT ON INDEX public.idx_profiles_username_ci IS ''Case-insensitive unique index on profiles.username''';
  END IF;
END;
$$ LANGUAGE plpgsql;
