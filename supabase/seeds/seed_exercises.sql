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
    -- Original Basic
    ('Bench Press','weight_reps','Barbell bench press, flat.'),
    ('Pull-up','bodyweight_reps','Standard pull-up (overhand grip).'),
    ('Bodyweight Squat','bodyweight_reps','Air squat, good form.'),
    ('Deadlift', 'weight_reps', 'Conventional barbell deadlift.'),
    ('Overhead Press', 'weight_reps', 'Standing barbell overhead press.'),
    ('Dumbbell Row', 'weight_reps', 'One-arm dumbbell row.'),
    ('Push-up', 'bodyweight_reps', 'Standard push-up.'),
    ('Plank', 'duration', 'Isometric core strength exercise.'),
    ('Lunges', 'weight_reps', 'Walking or stationary lunges.'),
    ('Bicep Curl', 'weight_reps', 'Standing barbell or dumbbell curl.'),
    ('Tricep Extension', 'weight_reps', 'Cable or dumbbell tricep extension.'),
    ('Leg Press', 'weight_reps', 'Machine leg press.'),
    
    -- Chest
    ('Incline Bench Press', 'weight_reps', 'Barbell incline bench press.'),
    ('Dumbbell Flys', 'weight_reps', 'Flat or incline dumbbell flys.'),
    ('Chest Dip', 'bodyweight_reps', 'Bodyweight dip focusing on chest.'),
    
    -- Back
    ('Lat Pulldown', 'weight_reps', 'Cable lat pulldown.'),
    ('Seated Cable Row', 'weight_reps', 'Seated cable row for back thickness.'),
    
    -- Shoulders
    ('Face Pull', 'weight_reps', 'Cable face pull for rear delts.'),
    ('Lateral Raise', 'weight_reps', 'Dumbbell lateral raise.'),
    ('Front Raise', 'weight_reps', 'Dumbbell or plate front raise.'),
    ('Arnold Press', 'weight_reps', 'Dumbbell shoulder press with rotation.'),
    
    -- Legs
    ('Romanian Deadlift', 'weight_reps', 'Barbell or dumbbell RDL.'),
    ('Bulgarian Split Squat', 'weight_reps', 'Single-leg split squat.'),
    ('Calf Raise', 'weight_reps', 'Standing or seated calf raise.'),
    ('Leg Extension', 'weight_reps', 'Machine leg extension.'),
    ('Leg Curl', 'weight_reps', 'Machine hamstring curl.'),
    
    -- Arms
    ('Hammer Curl', 'weight_reps', 'Neutral grip dumbbell curl.'),
    ('Skullcrusher', 'weight_reps', 'Lying tricep extension.'),
    ('Tricep Pushdown', 'weight_reps', 'Cable tricep pushdown.'),
    
    -- Abs
    ('Russian Twist', 'bodyweight_reps', 'Seated rotational core exercise.'),
    ('Hanging Leg Raise', 'bodyweight_reps', 'Hanging from bar, raising legs.')

) AS e(name, type, description)
WHERE demo.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Map exercises to muscle groups (idempotent)

-- Helper temporary table to simplify insertions? 
-- Standard SQL approach is safer.

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'chest'
WHERE e.exercise_name IN ('Bench Press', 'Incline Bench Press', 'Dumbbell Flys', 'Chest Dip', 'Push-up')
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'lats'
WHERE e.exercise_name IN ('Pull-up', 'Dumbbell Row', 'Lat Pulldown', 'Seated Cable Row')
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'quadriceps'
WHERE e.exercise_name IN ('Bodyweight Squat', 'Lunges', 'Leg Press', 'Bulgarian Split Squat', 'Leg Extension')
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'hamstrings'
WHERE e.exercise_name IN ('Romanian Deadlift', 'Leg Curl')
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'lower back'
WHERE e.exercise_name IN ('Deadlift')
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'shoulders'
WHERE e.exercise_name IN ('Overhead Press', 'Face Pull', 'Lateral Raise', 'Front Raise', 'Arnold Press')
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'abdominals'
WHERE e.exercise_name IN ('Plank', 'Russian Twist', 'Hanging Leg Raise')
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'biceps'
WHERE e.exercise_name IN ('Bicep Curl', 'Hammer Curl')
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'triceps'
WHERE e.exercise_name IN ('Tricep Extension', 'Skullcrusher', 'Tricep Pushdown')
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'calves'
WHERE e.exercise_name IN ('Calf Raise')
ON CONFLICT DO NOTHING;
