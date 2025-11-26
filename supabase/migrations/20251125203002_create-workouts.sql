-- Stores all user created workouts
-- Ensure `gen_random_uuid()` is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;
 
CREATE TABLE IF NOT EXISTS public.workouts (
    workout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID REFERENCES public.routines(routine_id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores exercises associated with each workout
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    workout_exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES public.workouts(workout_id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(exercise_id) ON DELETE CASCADE,
    position INT,
    CONSTRAINT uq_workout_exercises_workout_position UNIQUE (workout_id, position),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores sets associated with each workout exercise
CREATE TABLE IF NOT EXISTS public.exercise_sets (
    exercise_set_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(workout_exercise_id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    details JSONB, -- Depends on the exercise type: e.g., {"reps": 10, "weight": "100 lbs", "duration": "00:30:00", "distance": "5 km"}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE c.conname = 'chk_set_number_positive'
            AND t.relname = 'exercise_sets'
            AND n.nspname = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE public.exercise_sets ADD CONSTRAINT chk_set_number_positive CHECK (set_number > 0)';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_routine_id ON public.workouts(routine_id);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON public.workouts(created_at);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON public.workout_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_position ON public.workout_exercises(workout_id, position);

-- Trigger function to automatically assign `position` on insert when not provided
CREATE OR REPLACE FUNCTION public.set_workout_exercise_position()
RETURNS trigger AS $$
DECLARE
    max_pos INT;
BEGIN
    -- If caller already set a position, keep it
    IF NEW.position IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Compute next position for the workout (0-based)
    SELECT COALESCE(MAX(position), -1) INTO max_pos FROM public.workout_exercises WHERE workout_id = NEW.workout_id;
    NEW.position := max_pos + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to assign position before insert
DROP TRIGGER IF EXISTS trg_set_position_workout_exercises ON public.workout_exercises;
CREATE TRIGGER trg_set_position_workout_exercises
BEFORE INSERT ON public.workout_exercises
FOR EACH ROW
EXECUTE FUNCTION public.set_workout_exercise_position();

CREATE INDEX IF NOT EXISTS idx_exercise_sets_workout_exercise_id ON public.exercise_sets(workout_exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_created_at ON public.exercise_sets(created_at);
-- Ensure set_number is unique per workout_exercise to prevent duplicate set numbers
CREATE UNIQUE INDEX IF NOT EXISTS uq_exercise_sets_workout_setnumber ON public.exercise_sets (workout_exercise_id, set_number);