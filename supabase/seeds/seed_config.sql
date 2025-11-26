-- Seed metadata table for configurable seed values (idempotent)
CREATE TABLE IF NOT EXISTS public.seed_metadata (
  key text PRIMARY KEY,
  value text
);

-- Set the demo email used by other seeds. Update this single row to change the demo user email.
INSERT INTO public.seed_metadata (key, value)
VALUES ('demo_email', 'john.doe@example.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
