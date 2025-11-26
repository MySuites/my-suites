-- Sample exercises for demo user (uses `gen_random_uuid()` for ids)
-- Requires `supabase/seeds/seed_profiles.sql` and `supabase/seeds/seed_muscle_groups.sql` to be run first.

WITH demo AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = (
    SELECT value FROM public.seed_metadata WHERE key = 'demo_email'
  )
  LIMIT 1
)
INSERT INTO public.exercises (exercise_id, exercise_name, exercise_type, description, user_id, created_at)
  SELECT gen_random_uuid(), e.name, e.type::type_of_exercise, e.description, demo.user_id, NOW()
FROM demo, (
  VALUES
    ('Bench Press','weight_reps','Barbell bench press, flat.'),
    ('Pull-up','bodyweight_reps','Standard pull-up (overhand grip).'),
    ('Bodyweight Squat','bodyweight_reps','Air squat, good form.')
) AS e(name, type, description)
WHERE demo.user_id IS NOT NULL
ON CONFLICT (exercise_id) DO NOTHING;

-- Map exercises to muscle groups (idempotent)
INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'chest'
WHERE e.exercise_name = 'Bench Press'
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'lats'
WHERE e.exercise_name = 'Pull-up'
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'quadriceps'
WHERE e.exercise_name = 'Bodyweight Squat'
ON CONFLICT DO NOTHING;
