-- Ensure enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_of_exercise') THEN
    CREATE TYPE type_of_exercise AS ENUM ('weight_reps', 'bodyweight_reps', 'weighted_bodyweight', 'assisted_bodyweight', 'duration', 'distance_duration', 'duration_weight', 'distance_weight');
  END IF;
END;
$$;

-- Table to store exercises
CREATE TABLE IF NOT EXISTS public.exercises (
    exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_name TEXT NOT NULL,
    exercise_type type_of_exercise NOT NULL,
    description TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exercise_muscle_groups (
  exercise_id UUID NOT NULL REFERENCES public.exercises(exercise_id) ON DELETE CASCADE,
  muscle_group_id INT NOT NULL REFERENCES public.muscle_groups(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'secondary', -- e.g. 'primary' | 'secondary'
  PRIMARY KEY (exercise_id, muscle_group_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.conname = 'chk_role_valid'
      AND t.relname = 'exercise_muscle_groups'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'ALTER TABLE public.exercise_muscle_groups ADD CONSTRAINT chk_role_valid CHECK (role IN (''primary'',''secondary''))';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Table to store personal records (PRs) for exercises
CREATE TABLE IF NOT EXISTS public.exercise_pr (
    exercise_pr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL REFERENCES public.exercises(exercise_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pr_value TEXT NOT NULL, -- e.g., "100 lbs", "30 minutes"
    pr_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

  -- Indexes for common queries
  CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON public.exercises(user_id);
  CREATE INDEX IF NOT EXISTS idx_exercises_created_at ON public.exercises(created_at);

  -- Full-text search index for exercise name/description
  CREATE INDEX IF NOT EXISTS idx_exercises_fts ON public.exercises USING gin (to_tsvector('english', coalesce(exercise_name,'') || ' ' || coalesce(description,'')));

  CREATE INDEX IF NOT EXISTS idx_exercise_muscle_groups_exercise_id ON public.exercise_muscle_groups(exercise_id);
  CREATE INDEX IF NOT EXISTS idx_exercise_muscle_groups_muscle_group_id ON public.exercise_muscle_groups(muscle_group_id);

  CREATE INDEX IF NOT EXISTS idx_exercise_pr_exercise_id ON public.exercise_pr(exercise_id);
  CREATE INDEX IF NOT EXISTS idx_exercise_pr_user_id ON public.exercise_pr(user_id);

  -- Prevent duplicate exercise names per user (case-insensitive)
  CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_user_name_ci ON public.exercises (user_id, lower(exercise_name));
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'idx_exercises_user_name_ci' AND n.nspname = 'public'
    ) THEN
      EXECUTE 'COMMENT ON INDEX public.idx_exercises_user_name_ci IS ''Unique index to prevent duplicate exercise names for the same user (case-insensitive)''';
    END IF;
  END;
  $$ LANGUAGE plpgsql;