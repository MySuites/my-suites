-- Logs for each workout exercise performed
CREATE TABLE IF NOT EXISTS public.workout_logs (
    workout_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID REFERENCES public.workouts(workout_id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs for each set performed within a workout exercise
CREATE TABLE IF NOT EXISTS public.set_logs (
    set_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_id UUID NOT NULL REFERENCES public.workout_logs(workout_log_id) ON DELETE CASCADE,
    exercise_set_id UUID REFERENCES public.exercise_sets(exercise_set_id) ON DELETE SET NULL,
    details JSONB, -- e.g., {"reps": 10, "weight": "100 lbs", "duration": "00:30:00", "distance": "5 km"}
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_id ON public.workout_logs(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_time ON public.workout_logs(workout_time);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_time ON public.workout_logs (user_id, workout_time DESC);

CREATE INDEX IF NOT EXISTS idx_set_logs_workout_log_id ON public.set_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_exercise_set_id ON public.set_logs(exercise_set_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_created_at ON public.set_logs(created_at);