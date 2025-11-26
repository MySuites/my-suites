# MyCSuite

## Create demo user

A convenience script is included to create or find a demo auth user in Supabase and upsert a matching `public.profiles` row.

Requirements
- Node (>= 18 recommended)
- A Supabase project (local or hosted) with the `public.profiles` table applied
- Supabase keys: `SERVICE_ROLE_KEY` (service/secret key) and `ANON_KEY` (publishable/anon key)

Scripts
- Root `package.json` includes: `"create-demo": "node scripts/create_demo_user.js"`

Run (one-shot)
```bash
SUPABASE_URL="https://your-project.supabase.co" SERVICE_ROLE_KEY="your_service_key" ANON_KEY="your_anon_key" pnpm run create-demo
```

Run (export env vars first)
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SERVICE_ROLE_KEY="your_service_key"
export ANON_KEY="your_anon_key"
pnpm run create-demo
```

Run with dotenv
```bash
# add keys to .env, then
node -r dotenv/config scripts/create_demo_user.js
```

Optional env vars (defaults are provided in the script)
- `DEMO_EMAIL`, `DEMO_PASSWORD`, `DEMO_USERNAME`, `DEMO_FULL_NAME`

What the script does
- Creates (or finds) a Supabase auth user via the Admin API
- Upserts a `profiles` row with the real auth user id (so no hard-coded UUIDs required)
- Signs in the demo user and prints the returned session (access/refresh tokens)

Security
- Keep `SERVICE_ROLE_KEY` secret. Do not commit it to version control.

If you want, add the same `create-demo` script to `apps/mycpo/package.json` for convenience when working inside the app folder.
# MyCSuite
