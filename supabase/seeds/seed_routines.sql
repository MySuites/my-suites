-- Sample routine for the demo user
WITH demo AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = (
    SELECT value FROM public.seed_metadata WHERE key = 'demo_email'
  )
  LIMIT 1
)
INSERT INTO public.routines (routine_id, user_id, routine_name, description, created_at, updated_at)
SELECT gen_random_uuid(), demo.user_id, 'Full Body Beginner', '3x/week full body starter routine.', NOW(), NOW()
FROM demo
WHERE demo.user_id IS NOT NULL
ON CONFLICT (routine_id) DO NOTHING;
