-- Sample workout for the demo user.
-- This inserts a workout named 'Full Body Day 1' if not already present.

WITH demo AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = (
    SELECT value FROM public.seed_metadata WHERE key = 'demo_email'
  )
  LIMIT 1
)
INSERT INTO public.workouts (workout_id, user_id, workout_name, notes, created_at, updated_at)
SELECT gen_random_uuid(), demo.user_id, 'Full Body Day 1', 'Placeholder workout with sample exercises.', NOW(), NOW()
FROM demo
WHERE demo.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.workouts w WHERE w.workout_name = 'Full Body Day 1');
