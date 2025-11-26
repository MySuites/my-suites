-- Migration: enable_rls_and_policies
-- Enable Row Level Security and add ownership policies for user-owned tables

-- Enable RLS and policies for exercises
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Exercises: public select, owner modify" ON public.exercises;
CREATE POLICY "Exercises: public select, owner modify" ON public.exercises
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Exercises: users can insert their own" ON public.exercises;
CREATE POLICY "Exercises: users can insert their own" ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Exercises: users can update their own" ON public.exercises;
CREATE POLICY "Exercises: users can update their own" ON public.exercises
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Exercises: users can delete their own" ON public.exercises;
CREATE POLICY "Exercises: users can delete their own" ON public.exercises
  FOR DELETE USING (auth.uid() = user_id);

-- exercise_pr (personal records) -> restrict to owner
ALTER TABLE public.exercise_pr ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Exercise PR: users can select their own" ON public.exercise_pr;
CREATE POLICY "Exercise PR: users can select their own" ON public.exercise_pr
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Exercise PR: users can insert their own" ON public.exercise_pr;
CREATE POLICY "Exercise PR: users can insert their own" ON public.exercise_pr
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Exercise PR: users can update their own" ON public.exercise_pr;
CREATE POLICY "Exercise PR: users can update their own" ON public.exercise_pr
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Exercise PR: users can delete their own" ON public.exercise_pr;
CREATE POLICY "Exercise PR: users can delete their own" ON public.exercise_pr
  FOR DELETE USING (auth.uid() = user_id);

-- routines -> owner-only access
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Routines: users can select their own" ON public.routines;
CREATE POLICY "Routines: users can select their own" ON public.routines
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Routines: users can insert their own" ON public.routines;
CREATE POLICY "Routines: users can insert their own" ON public.routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Routines: users can update their own" ON public.routines;
CREATE POLICY "Routines: users can update their own" ON public.routines
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Routines: users can delete their own" ON public.routines;
CREATE POLICY "Routines: users can delete their own" ON public.routines
  FOR DELETE USING (auth.uid() = user_id);

-- workouts -> owner-only
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workouts: users can select their own" ON public.workouts;
CREATE POLICY "Workouts: users can select their own" ON public.workouts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Workouts: users can insert their own" ON public.workouts;
CREATE POLICY "Workouts: users can insert their own" ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Workouts: users can update their own" ON public.workouts;
CREATE POLICY "Workouts: users can update their own" ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Workouts: users can delete their own" ON public.workouts;
CREATE POLICY "Workouts: users can delete their own" ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

-- workout_exercises -> owner via workouts
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "WorkoutExercises: users can select if they own workout" ON public.workout_exercises;
CREATE POLICY "WorkoutExercises: users can select if they own workout" ON public.workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workouts w WHERE w.workout_id = public.workout_exercises.workout_id AND w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "WorkoutExercises: users can insert if they own workout" ON public.workout_exercises;
CREATE POLICY "WorkoutExercises: users can insert if they own workout" ON public.workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts w WHERE w.workout_id = workout_id AND w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "WorkoutExercises: users can update if they own workout" ON public.workout_exercises;
CREATE POLICY "WorkoutExercises: users can update if they own workout" ON public.workout_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workouts w WHERE w.workout_id = public.workout_exercises.workout_id AND w.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts w WHERE w.workout_id = workout_id AND w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "WorkoutExercises: users can delete if they own workout" ON public.workout_exercises;
CREATE POLICY "WorkoutExercises: users can delete if they own workout" ON public.workout_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workouts w WHERE w.workout_id = public.workout_exercises.workout_id AND w.user_id = auth.uid()
    )
  );

-- exercise_sets -> owner via workout_exercises -> workouts
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ExerciseSets: users can select if they own workout" ON public.exercise_sets;
CREATE POLICY "ExerciseSets: users can select if they own workout" ON public.exercise_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON we.workout_id = w.workout_id
      WHERE we.workout_exercise_id = public.exercise_sets.workout_exercise_id
        AND w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ExerciseSets: users can insert if they own workout" ON public.exercise_sets;
CREATE POLICY "ExerciseSets: users can insert if they own workout" ON public.exercise_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON we.workout_id = w.workout_id
      WHERE we.workout_exercise_id = workout_exercise_id
        AND w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ExerciseSets: users can update if they own workout" ON public.exercise_sets;
CREATE POLICY "ExerciseSets: users can update if they own workout" ON public.exercise_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON we.workout_id = w.workout_id
      WHERE we.workout_exercise_id = public.exercise_sets.workout_exercise_id
        AND w.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON we.workout_id = w.workout_id
      WHERE we.workout_exercise_id = workout_exercise_id
        AND w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ExerciseSets: users can delete if they own workout" ON public.exercise_sets;
CREATE POLICY "ExerciseSets: users can delete if they own workout" ON public.exercise_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON we.workout_id = w.workout_id
      WHERE we.workout_exercise_id = public.exercise_sets.workout_exercise_id
        AND w.user_id = auth.uid()
    )
  );

-- workout_logs -> owner via user_id column
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "WorkoutLogs: users can select their own" ON public.workout_logs;
CREATE POLICY "WorkoutLogs: users can select their own" ON public.workout_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "WorkoutLogs: users can insert their own" ON public.workout_logs;
CREATE POLICY "WorkoutLogs: users can insert their own" ON public.workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "WorkoutLogs: users can update their own" ON public.workout_logs;
CREATE POLICY "WorkoutLogs: users can update their own" ON public.workout_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "WorkoutLogs: users can delete their own" ON public.workout_logs;
CREATE POLICY "WorkoutLogs: users can delete their own" ON public.workout_logs
  FOR DELETE USING (auth.uid() = user_id);

-- set_logs -> owner via workout_logs
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SetLogs: users can select if they own workout_log" ON public.set_logs;
CREATE POLICY "SetLogs: users can select if they own workout_log" ON public.set_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl WHERE wl.workout_log_id = public.set_logs.workout_log_id AND wl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "SetLogs: users can insert if they own workout_log" ON public.set_logs;
CREATE POLICY "SetLogs: users can insert if they own workout_log" ON public.set_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl WHERE wl.workout_log_id = workout_log_id AND wl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "SetLogs: users can update if they own workout_log" ON public.set_logs;
CREATE POLICY "SetLogs: users can update if they own workout_log" ON public.set_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl WHERE wl.workout_log_id = public.set_logs.workout_log_id AND wl.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl WHERE wl.workout_log_id = workout_log_id AND wl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "SetLogs: users can delete if they own workout_log" ON public.set_logs;
CREATE POLICY "SetLogs: users can delete if they own workout_log" ON public.set_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl WHERE wl.workout_log_id = public.set_logs.workout_log_id AND wl.user_id = auth.uid()
    )
  );