-- Create Muscle Groups Table
CREATE TABLE IF NOT EXISTS public.muscle_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);