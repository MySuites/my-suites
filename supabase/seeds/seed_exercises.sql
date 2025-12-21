-- Sample exercises for demo user (uses `gen_random_uuid()` for ids)
-- Requires `supabase/seeds/seed_profiles.sql` and `supabase/seeds/seed_muscle_groups.sql` to be run first.

-- Ensure exercise_type is TEXT
DO $$ BEGIN
    ALTER TABLE public.exercises ALTER COLUMN exercise_type TYPE TEXT;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Exercise Properties: Bodyweight, Distance, Duration, Reps, Weighted

WITH demo AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = (
    SELECT value FROM public.seed_metadata WHERE key = 'demo_email'
  )
  LIMIT 1
)
INSERT INTO public.exercises (exercise_id, exercise_name, exercise_type, description, user_id, created_at)
  SELECT gen_random_uuid(), e.name, e.type, e.description, demo.user_id, NOW()
FROM demo, (
  VALUES
    -- Weights: Chest
    ('Incline Bench Press', 'Weighted, Reps', 'Barbell incline bench press.'),
    ('Flat Bench Press', 'Weighted, Reps', 'Barbell flat bench press.'),
    ('Decline Bench Press', 'Weighted, Reps', 'Barbell decline bench press.'),
    ('Incline Smith Machine Bench Press', 'Weighted, Reps', 'Smith machine bench press, incline.'),
    ('Flat Smith Machine Bench Press', 'Weighted, Reps', 'Smith machine bench press, flat.'),
    ('Decline Smith Machine Bench Press', 'Weighted, Reps', 'Smith machine bench press, decline.'),
    ('Dumbbell Flys', 'Weighted, Reps', 'Flat or incline dumbbell flys.'),
    ('Cable Flys', 'Weighted, Reps', 'Cable flys for chest thickness.'),
    ('Incline Dumbbell Bench Press', 'Weighted, Reps', 'Dumbbell bench press, incline.'),
    ('Flat Dumbbell Bench Press', 'Weighted, Reps', 'Dumbbell bench press, flat.'),
    ('Decline Dumbbell Bench Press', 'Weighted, Reps', 'Dumbbell bench press, decline.'),
    
    -- Weights: Back
    ('Lat Pulldown', 'Weighted, Reps', 'Cable lat pulldown.'),
    ('Seated Cable Row', 'Weighted, Reps', 'Seated cable row for back thickness.'),

    -- Weights: Shoulders
    ('Face Pull', 'Weighted, Reps', 'Cable face pull for rear delts.'),
    ('Lateral Raise', 'Weighted, Reps', 'Dumbbell lateral raise.'),
    ('Front Raise', 'Weighted, Reps', 'Dumbbell or plate front raise.'),
    ('Arnold Press', 'Weighted, Reps', 'Dumbbell shoulder press with rotation.'),
    
    -- Weights: Legs
    ('Romanian Deadlift', 'Weighted, Reps', 'Barbell or dumbbell RDL.'),
    ('Deadlift', 'Weighted, Reps', 'Barbell deadlift.'),
    ('Bulgarian Split Squat', 'Weighted, Reps', 'Single-leg split squat.'),
    ('Calf Raise', 'Weighted, Reps', 'Standing or seated calf raise.'),
    ('Leg Extension', 'Weighted, Reps', 'Machine leg extension.'),
    ('Leg Curl', 'Weighted, Reps', 'Machine hamstring curl.'),
    ('Barbell Squat', 'Weighted, Reps', 'Barbell squat for quads.'),
    ('Leg Press', 'Weighted, Reps', 'Machine leg press.'),
    ('Smith Machine Squat', 'Weighted, Reps', 'Smith machine squat for quads.'),
    
    -- Weights: Biceps
    ('Barbell Curl', 'Weighted, Reps', 'Barbell curl for biceps.'),
    ('Dumbbell Curl', 'Weighted, Reps', 'Dumbbell curl for biceps.'),
    ('Seated Dumbbell Curl', 'Weighted, Reps', 'Seated dumbbell curl for biceps.'),
    ('Incline Dumbbell Curl', 'Weighted, Reps', 'Dumbbell curl for biceps, incline.'),
    ('Decline Dumbbell Curl', 'Weighted, Reps', 'Dumbbell curl for biceps, decline.'),
    ('Spider Curl', 'Weighted, Reps', 'Spider curl for biceps.'),
    ('Hammer Curl', 'Weighted, Reps', 'Neutral grip dumbbell curl.'),
    ('Cable Curl', 'Weighted, Reps', 'Cable curl for biceps.'),
    ('Incline Cable Curl', 'Weighted, Reps', 'Cable curl for biceps, incline.'),
    ('Decline Cable Curl', 'Weighted, Reps', 'Cable curl for biceps, decline.'),
    ('Preacher Curl', 'Weighted, Reps', 'Preacher curl for biceps.'),

    -- Weights: Triceps
    ('Skullcrusher', 'Weighted, Reps', 'Lying tricep extension.'),
    ('Overhead Tricep Extension', 'Weighted, Reps', 'Overhead tricep extension.'),
    ('Cable Tricep Pushdown', 'Weighted, Reps', 'Cable tricep pushdown.'),
    ('Dumbbell Tricep Pushdown', 'Weighted, Reps', 'Dumbbell tricep pushdown.'),
    ('Tricep Pushdown', 'Weighted, Reps', 'Cable tricep pushdown.'),
    ('Tricep Kickback', 'Weighted, Reps', 'Cable tricep pushdown.'),
    ('Tricep Extension', 'Weighted, Reps', 'Cable tricep pushdown.'),
    ('One-Arm Tricep Extension', 'Weighted, Reps', 'One-arm tricep extension.'),
    
    -- Weights: Abs
    ('Hanging Leg Raise', 'Bodyweight, Reps', 'Hanging from bar, raising legs.'),
    ('Cable Crunch', 'Weighted, Reps', 'Cable crunch for abs.'),

    -- Bodyweight: Chest and Triceps and Shoulders
    ('Push-up', 'Bodyweight, Reps', 'Standard push-up.'),
    ('Incline Push-up', 'Bodyweight, Reps', 'Incline push-up.'),
    ('Decline Push-up', 'Bodyweight, Reps', 'Decline push-up.'),
    ('Diamond Push-up', 'Bodyweight, Reps', 'Diamond push-up.'),
    ('Close Push-up', 'Bodyweight, Reps', 'Close grip push-up.'),
    ('Wide Push-up', 'Bodyweight, Reps', 'Wide grip push-up.'),
    ('Pike Push-up', 'Bodyweight, Reps', 'Pike push-up.'),
    ('Pseudo Planche Push-up', 'Bodyweight, Reps', 'Pseudo planche push-up.'),

    -- Bodyweight: Back and Biceps
    ('Pull-up', 'Bodyweight, Reps', 'Standard pull-up (overhand grip).'),
    ('Chin-up', 'Bodyweight, Reps', 'Chin-up (underhand grip).'),
    ('Bodyweight Rows', 'Bodyweight, Reps', 'Bodyweight rows for back thickness.'),

    -- Bodyweight: Legs
    ('Lunges', 'Bodyweight, Reps', 'Walking or stationary lunges.'),
    ('Calf Raises', 'Bodyweight, Reps', 'Calf raises for calf thickness.'),
    ('Bodyweight Squats', 'Bodyweight, Reps', 'Squats for leg strength.'),
    ('Split Squats', 'Bodyweight, Reps', 'Split squats for leg strength.'),
    ('Bulgarian Split Squats', 'Bodyweight, Reps', 'Bulgarian split squats for leg strength.'),
    ('Shrimp Squats', 'Bodyweight, Reps', 'Shrimp squats for leg strength.'),
    ('Pistol Squats', 'Bodyweight, Reps', 'Pistol squats for leg strength.'),
    ('Sissy Squats', 'Bodyweight, Reps', 'Sissy squats for leg strength.'),
    ('Dragon Squats', 'Bodyweight, Reps', 'Dragon squats for leg strength.'),

    -- Bodyweight: Abs
    ('Plank', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Russian Twist', 'Bodyweight, Reps', 'Seated rotational core exercise.'),
    ('Side Plank', 'Bodyweight, Duration', 'Isometric core strength exercise.'),

    -- Weighted Bodyweight
    ('Weighted Push-up', 'Weighted, Bodyweight, Reps', 'Weighted push-up.'),
    ('Weighted Pull-up', 'Weighted, Bodyweight, Reps', 'Weighted pull-up (overhand grip).'),
    ('Weighted Chin-up', 'Weighted, Bodyweight, Reps', 'Weighted chin-up (underhand grip).'),
    ('Weighted Rows', 'Weighted, Bodyweight, Reps', 'Weighted rows for back thickness.'),
    ('Weighted Dips', 'Weighted, Bodyweight, Reps', 'Weighted dips for chest thickness.'),
    ('Weighted Lunges', 'Weighted, Bodyweight, Reps', 'Weighted lunges for leg strength.'),
    ('Weighted Plank', 'Weighted, Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Weighted Squat', 'Weighted, Bodyweight, Reps', 'Weighted squat for quads.'),

    -- Advanced Calisthenics Skills
    ('Chest-to-Wall Handstand', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Back-to-Wall Handstand', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Handstand', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Wall Handstand Push-up', 'Bodyweight, Reps', 'Wall handstand push-up.'),
    ('Handstand Push-up', 'Bodyweight, Reps', 'Handstand push-up.'),
    ('One-Arm Handstand', 'Bodyweight, Duration', 'Isometric core strength exercise.'),

    ('Pike Handstand Press', 'Bodyweight, Reps', 'Pike handstand press for chest thickness.'),
    ('Straddle Handstand Press', 'Bodyweight, Reps', 'Straddle handstand press for chest thickness.'),
    ('Handstand Press', 'Bodyweight, Reps', 'Handstand press for chest thickness.'),

    ('Elbow Lever', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Bent-Arm Planche', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('90-Degree Push-up', 'Bodyweight, Reps', '90-degree push-up.'),

    ('Tuck Planche', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Advanced Tuck Planche', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Half-Lay Planche', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Straddle Planche', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Planche', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Planche Push-up', 'Bodyweight, Reps', 'Planche push-up.'),
    ('Maltese', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Dragon Maltese', 'Bodyweight, Duration', 'Isometric core strength exercise.'),

    ('Tuck Front Lever', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Advanced Tuck Front Lever', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Half-Lay Front Lever', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Straddle Front Lever', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Front Lever', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Front Lever Pull-up', 'Bodyweight, Reps', 'Front lever pull-up.'),
    ('Front Lever Touch', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('One-Arm Front Lever', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    
    ('Tuck Back Lever', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Advanced Tuck Back Lever', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Half-Lay Back Lever', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Straddle Back Lever', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Back Lever', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Back Lever Pull-up', 'Bodyweight, Reps', 'Back lever pull-up.'),
    ('Back Lever Touch', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('One-Arm Back Lever', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    
    ('Frog Stand', 'Bodyweight, Duration', 'Isometric core strength exercise.'),
    ('Crow Stand', 'Bodyweight, Duration', 'Isometric core strength exercise.'),

    ('Threadmill', 'Distance, Duration', 'Running on a treadmill.'),
    ('Elliptical', 'Distance, Duration', 'Elliptical machine.'),
    ('Rowing Machine', 'Distance, Duration', 'Rowing machine.'),
    ('Stationary Bike', 'Distance, Duration', 'Stationary bike.'),
    ('Jump Rope', 'Reps, Duration', 'Jump rope.'),
    ('Cycling', 'Distance, Duration', 'Cycling.'),
    ('Swimming', 'Distance, Duration', 'Swimming.'),
    ('Rowing', 'Distance, Duration', 'Rowing.'),

    ('Farmers Walk', 'Weighted, Distance', 'Farmers walk for grip strength.')

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
WHERE e.exercise_name IN (
  'Bench Press', 'Incline Bench Press', 'Flat Bench Press', 'Decline Bench Press',
  'Incline Smith Machine Bench Press', 'Flat Smith Machine Bench Press', 'Decline Smith Machine Bench Press',
  'Dumbbell Flys', 'Cable Flys', 'Incline Dumbbell Bench Press', 'Flat Dumbbell Bench Press', 'Decline Dumbbell Bench Press',
  'Push-up', 'Incline Push-up', 'Decline Push-up', 'Diamond Push-up', 'Close Push-up', 'Wide Push-up', 'Pike Push-up',
  'Weighted Push-up', 'Weighted Dips'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'lats'
WHERE e.exercise_name IN (
  'Pull-up', 'Weighted Pull-up', 'Chin-up', 'Weighted Chin-up', 'Dumbbell Row', 'Lat Pulldown', 'Seated Cable Row',
  'Bodyweight Rows', 'Weighted Rows', 'Front Lever', 'Back Lever'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'quadriceps'
WHERE e.exercise_name IN (
  'Bodyweight Squat', 'Weighted Squat', 'Barbell Squat', 'Smith Machine Squat',
  'Lunges', 'Weighted Lunges', 'Leg Press', 'Bulgarian Split Squat', 'Leg Extension',
  'Pistol Squats', 'Sissy Squats', 'Split Squats', 'Shrimp Squats', 'Dragon Squats'
)
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
WHERE e.exercise_name IN (
  'Overhead Press', 'Face Pull', 'Lateral Raise', 'Front Raise', 'Arnold Press',
  'Handstand Push-up', 'Wall Handstand Push-up', 'Pike Handstand Press', 'Straddle Handstand Press', 'Handstand Press',
  'Planche Push-up', 'Maltese', 'Planche', 'Handstand'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'abdominals'
WHERE e.exercise_name IN (
  'Plank', 'Weighted Plank', 'Side Plank', 'Russian Twist', 'Hanging Leg Raise', 'Cable Crunch',
  'L-Sit', 'V-Sit', 'Front Lever', 'Back Lever', 'Dragon Flag', 'Elbow Lever'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'biceps'
WHERE e.exercise_name IN (
  'Barbell Curl', 'Dumbbell Curl', 'Seated Dumbbell Curl', 'Incline Dumbbell Curl', 'Decline Dumbbell Curl',
  'Spider Curl', 'Hammer Curl', 'Cable Curl', 'Incline Cable Curl', 'Decline Cable Curl', 'Preacher Curl',
  'Chin-up', 'Weighted Chin-up'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'triceps'
WHERE e.exercise_name IN (
  'Tricep Extension', 'Skullcrusher', 'Tricep Pushdown', 'Overhead Tricep Extension',
  'Cable Tricep Pushdown', 'Dumbbell Tricep Pushdown', 'Tricep Kickback', 'One-Arm Tricep Extension',
  'Push-up', 'Diamond Push-up', 'Weighted Dips'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id, role)
SELECT e.exercise_id, mg.id, 'primary'
FROM public.exercises e
JOIN public.muscle_groups mg ON lower(mg.name) = 'calves'
WHERE e.exercise_name IN ('Calf Raise', 'Calf Raises')
ON CONFLICT DO NOTHING;
