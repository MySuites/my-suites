-- Insert exercise sets for the workout_exercises previously created
-- Uses basic JSON details matching the `exercise_sets.details` structure

-- Bench Press: 3 sets x 8 reps, 135 lbs
INSERT INTO public.exercise_sets (exercise_set_id, workout_exercise_id, set_number, details, created_at, updated_at)
SELECT gen_random_uuid(), we.workout_exercise_id, s.set_number,
       jsonb_build_object('reps', s.reps, 'weight', s.weight::text), NOW(), NOW()
FROM (
  VALUES (1,8,'135 lbs'), (2,8,'135 lbs'), (3,8,'135 lbs')
) AS s(set_number, reps, weight)
JOIN public.workout_exercises we ON we.position = 0 -- bench press was position 0 (first inserted position logic uses 0-based)
JOIN public.workouts w ON w.workout_id = we.workout_id AND w.workout_name = 'Full Body Day 1'
ON CONFLICT DO NOTHING;

-- Pull-up: 3 sets x 5 reps (bodyweight)
INSERT INTO public.exercise_sets (exercise_set_id, workout_exercise_id, set_number, details, created_at, updated_at)
SELECT gen_random_uuid(), we.workout_exercise_id, s.set_number,
       jsonb_build_object('reps', s.reps), NOW(), NOW()
FROM (
  VALUES (1,5), (2,5), (3,5)
) AS s(set_number, reps)
JOIN public.workout_exercises we ON we.position = 1
JOIN public.workouts w ON w.workout_id = we.workout_id AND w.workout_name = 'Full Body Day 1'
ON CONFLICT DO NOTHING;

-- Bodyweight Squat: 3 sets x 12 reps
INSERT INTO public.exercise_sets (exercise_set_id, workout_exercise_id, set_number, details, created_at, updated_at)
SELECT gen_random_uuid(), we.workout_exercise_id, s.set_number,
       jsonb_build_object('reps', s.reps), NOW(), NOW()
FROM (
  VALUES (1,12), (2,12), (3,12)
) AS s(set_number, reps)
JOIN public.workout_exercises we ON we.position = 2
JOIN public.workouts w ON w.workout_id = we.workout_id AND w.workout_name = 'Full Body Day 1'
ON CONFLICT DO NOTHING;
