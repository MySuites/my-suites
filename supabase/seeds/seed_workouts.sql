-- Sample workout tied to the sample routine
-- This inserts a workout named 'Full Body Day 1' and links it to the "Full Body Beginner" routine if present.

WITH demo AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = (
    SELECT value FROM public.seed_metadata WHERE key = 'demo_email'
  )
  LIMIT 1
), chosen_routine AS (
  SELECT routine_id FROM public.routines WHERE routine_name = 'Full Body Beginner' LIMIT 1
)
INSERT INTO public.workouts (workout_id, routine_id, user_id, workout_name, notes, created_at, updated_at)
SELECT gen_random_uuid(), cr.routine_id, demo.user_id, 'Full Body Day 1', 'Placeholder workout with sample exercises.', NOW(), NOW()
FROM chosen_routine cr, demo
WHERE demo.user_id IS NOT NULL
ON CONFLICT (workout_id) DO NOTHING;

INSERT INTO public.workouts (workout_id, routine_id, user_id, workout_name, notes, created_at, updated_at)
  WITH demo AS (
    SELECT id AS user_id
    FROM auth.users
    WHERE email = (
      SELECT value FROM public.seed_metadata WHERE key = 'demo_email'
    )
    LIMIT 1
  )
  SELECT gen_random_uuid(), NULL, demo.user_id, 'Full Body Day 1 (no routine)', 'Placeholder workout (no routine found).', NOW(), NOW()
  FROM demo
  WHERE demo.user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.workouts w WHERE w.workout_name = 'Full Body Day 1');
