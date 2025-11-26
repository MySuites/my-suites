#!/usr/bin/env bash
set -euo pipefail

# Run SQL seed files in order using psql and DATABASE_URL.
# Usage: set DATABASE_URL env var (Postgres connection string) or put it in .env.
# Example: DATABASE_URL="postgres://..." bash scripts/run_seeds.sh

# Load .env if present (simple parser, ignores comments)
if [ -f .env ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env | xargs) || true
fi

if [ -z "${DATABASE_URL:-}" ]; then
  cat <<'MSG'
DATABASE_URL is not set. The script needs a Postgres connection string to run seeds.

Options:
  1) Set DATABASE_URL (recommended for automated runs):
     export DATABASE_URL="postgres://user:pass@host:5432/dbname"
     bash scripts/run_seeds.sh

  2) Run the SQL files manually in Supabase Studio (run seed_config.sql first):
     supabase/seeds/seed_config.sql
     supabase/seeds/seed_muscle_groups.sql
     supabase/seeds/seed_exercises.sql
     supabase/seeds/seed_routines.sql
     supabase/seeds/seed_workouts.sql
     supabase/seeds/seed_workout_exercises.sql
     supabase/seeds/seed_exercise_sets.sql
     supabase/seeds/seed_workout_and_set_logs.sql

MSG
  exit 1
fi

SEEDS=(
  "supabase/seeds/seed_config.sql"
  "supabase/seeds/seed_muscle_groups.sql"
  "supabase/seeds/seed_exercises.sql"
  "supabase/seeds/seed_routines.sql"
  "supabase/seeds/seed_workouts.sql"
  "supabase/seeds/seed_workout_exercises.sql"
  "supabase/seeds/seed_exercise_sets.sql"
  "supabase/seeds/seed_workout_and_set_logs.sql"
)

for sql in "${SEEDS[@]}"; do
  if [ -f "$sql" ]; then
    echo "\n----- Running: $sql -----\n"
    psql "$DATABASE_URL" -f "$sql"
  else
    echo "Skipping missing seed file: $sql"
  fi
done

echo "\nAll seeds run (or skipped if missing)."