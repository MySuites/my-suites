-- Migration: add_updated_at_triggers
-- Creates a reusable trigger function to set updated_at = now() on updates
-- Ensures updated_at columns exist and attaches BEFORE UPDATE triggers

-- Create or replace function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure `updated_at` column exists (idempotent) and attach trigger for each table

-- profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- routines
ALTER TABLE public.routines
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at_routines ON public.routines;
CREATE TRIGGER set_updated_at_routines
BEFORE UPDATE ON public.routines
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- workouts
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at_workouts ON public.workouts;
CREATE TRIGGER set_updated_at_workouts
BEFORE UPDATE ON public.workouts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- workout_exercises
ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at_workout_exercises ON public.workout_exercises;
CREATE TRIGGER set_updated_at_workout_exercises
BEFORE UPDATE ON public.workout_exercises
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- exercise_sets
ALTER TABLE public.exercise_sets
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at_exercise_sets ON public.exercise_sets;
CREATE TRIGGER set_updated_at_exercise_sets
BEFORE UPDATE ON public.exercise_sets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
