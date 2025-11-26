-- Attach exercises to the workout inserted above.
-- Relies on `seed_exercises.sql` and `seed_workouts.sql` having run.

-- Add Bench Press and Pull-up and Squat to 'Full Body Day 1' if they exist
INSERT INTO public.workout_exercises (workout_exercise_id, workout_id, exercise_id, position, created_at, updated_at)
SELECT gen_random_uuid(), w.workout_id, e.exercise_id, pos, NOW(), NOW()
FROM (
  VALUES (1), (2), (3)
) AS p(pos)
CROSS JOIN LATERAL (
  -- map position to exercise by name
  SELECT CASE p.pos
    WHEN 1 THEN (SELECT exercise_id FROM public.exercises WHERE exercise_name = 'Bench Press' LIMIT 1)
    WHEN 2 THEN (SELECT exercise_id FROM public.exercises WHERE exercise_name = 'Pull-up' LIMIT 1)
    WHEN 3 THEN (SELECT exercise_id FROM public.exercises WHERE exercise_name = 'Bodyweight Squat' LIMIT 1)
  END AS exercise_id
) e
JOIN public.workouts w ON w.workout_name = 'Full Body Day 1'
WHERE e.exercise_id IS NOT NULL
ON CONFLICT DO NOTHING;
