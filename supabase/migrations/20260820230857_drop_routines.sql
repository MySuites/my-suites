-- Routine feature removed: drop the routines table and its FK from workouts.
ALTER TABLE public.workouts DROP CONSTRAINT IF EXISTS workouts_routine_id_fkey;
ALTER TABLE public.workouts DROP COLUMN IF EXISTS routine_id;
DROP TABLE IF EXISTS public.routines;
