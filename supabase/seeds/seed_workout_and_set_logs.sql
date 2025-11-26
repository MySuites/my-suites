-- Insert a sample workout_log and associated set_logs for the demo user
-- This simulates completing the 'Full Body Day 1' workout once.

WITH demo AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = (
    SELECT value FROM public.seed_metadata WHERE key = 'demo_email'
  )
  LIMIT 1
), chosen_workout AS (
  SELECT workout_id FROM public.workouts WHERE workout_name = 'Full Body Day 1' LIMIT 1
), ins AS (
  INSERT INTO public.workout_logs (workout_log_id, workout_id, user_id, workout_time, notes, created_at)
  SELECT gen_random_uuid(), cw.workout_id, demo.user_id, NOW(), 'Demo workout log', NOW()
  FROM chosen_workout cw, demo
  WHERE demo.user_id IS NOT NULL
  RETURNING workout_log_id, workout_id
)
-- Insert set logs by matching exercise_sets that belong to the workout
INSERT INTO public.set_logs (set_log_id, workout_log_id, exercise_set_id, details, notes, created_at)
SELECT gen_random_uuid(), i.workout_log_id, es.exercise_set_id,
       es.details, NULL, NOW()
FROM ins i
JOIN public.exercise_sets es ON es.workout_exercise_id IN (
  SELECT workout_exercise_id FROM public.workout_exercises we WHERE we.workout_id = i.workout_id
)
ON CONFLICT DO NOTHING;
