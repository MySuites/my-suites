# MyCSuite

A pnpm monorepo with two Expo/React Native apps (`apps/myhealth`, `apps/myfinancials`), shared packages (`packages/*`), and Supabase migrations, seeds & edge functions (`supabase/`).

Table of contents
- Overview
- Quick start
- Installation
- Environment
- Running (development)
- Supabase / Seeds
- Troubleshooting
- Useful locations
- Git hooks
- Contributing

---

## Overview

MyCSuite is a monorepo of Expo + React Native apps sharing UI and auth packages:

- `apps/myhealth` — the fitness/workout tracking app (outdoor GPS tracking, exercises, routines, progress pictures, etc.). Deployed to GitHub Pages as a web build on push to `master` (see `.github/workflows/deploy.yml`).
- `apps/myfinancials` — a finance app (package name `mycfo`), earlier-stage than myhealth.

Both share `packages/ui` and `packages/auth`, and both talk to the same Supabase project. The repo also includes helper scripts to create demo data and SQL files for migrations and seeds under `supabase/`.

## Quick start

1. Install dependencies: `pnpm install` at the repo root.
2. Create a `.env` in `apps/myhealth` (and/or `apps/myfinancials`) with your Supabase keys (see Environment).
3. Start the app: `cd apps/myhealth && pnpm run start` (or `cd apps/myfinancials && pnpm run start`) and open with Expo.

## Installation

Prerequisites

- Node.js (>= 18 recommended)
- pnpm: `npm install -g pnpm`
- git
- For iOS native builds: Xcode & CocoaPods (macOS only)
- For Android: Android Studio + SDK (for emulator)

Install workspace dependencies

```bash
pnpm install
```

If you only want to work inside the app folder:

```bash
cd apps/myhealth
pnpm install
```

## Environment

There are two separate sets of env vars in this repo — don't mix them up.

**App env (`apps/myhealth/.env`, and `apps/myfinancials/.env`)** — read by Expo at build/runtime, so vars must be prefixed `EXPO_PUBLIC_` to be exposed to client code:

```env
EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
EXPO_PUBLIC_SITE_URL="http://localhost:8081"
# myhealth only:
EXPO_PUBLIC_POWERSYNC_URL="https://your-project.powersync.journeyapps.com"
```

**Root-level scripts env (repo root `.env`, or exported in your shell)** — used only by the demo-user/seed helper scripts under `scripts/`, not by the apps themselves:

```env
SUPABASE_URL="https://your-project.supabase.co"
ANON_KEY="your_anon_key"
SERVICE_ROLE_KEY="your_service_role_key"
```

Notes

- Keep `SERVICE_ROLE_KEY` secret. Do not commit it, or either `.env` file.
- Consider adding `.env.example` files in `apps/myhealth` and `apps/myfinancials` (I can add these for you).

## Running (development)

Start the Expo dev server from the app folder (`apps/myhealth` or `apps/myfinancials`):

```bash
cd apps/myhealth
pnpm run start
# or, from the repo root, targeting a specific app:
pnpm --filter myhealth run start
```

Open the project in Expo Go (physical device) or run in a simulator/emulator. Note: `apps/myhealth` depends on native modules (camera, HealthKit, maps, PowerSync) that aren't available in plain Expo Go — use a development build (`pnpm run ios` / `pnpm run android` below, or `expo start --dev-client`).

Native iOS (macOS only)

```bash
cd apps/myhealth/ios
pod install
cd ..
pnpm run ios
# or, for a physical device:
npx expo run:ios --device
```

Android emulator

Make sure Android Studio + SDK are installed and an AVD is created, then from the app folder: `pnpm run android`.

Windows-specific notes

- WSL2 is recommended for a more Unix-like environment. Native iOS simulator builds are not supported on Windows.
- PowerShell example to set env vars (session only):

```powershell
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:ANON_KEY = "your_anon_key"
$env:SERVICE_ROLE_KEY = "your_service_role_key"
pnpm run create-demo
```

## Supabase / Seeds

- Migrations: `supabase/migrations`
- Seeds: `supabase/seeds`
- Edge functions: `supabase/functions`
- Helper script to create a demo user: `scripts/create_demo_user.js`, run via the root `create-demo` script (`scripts/run_create_demo.js`)
- Helper script to run seed SQL: `scripts/run_seeds.sh`, run via the root `run-seeds` script — needs `DATABASE_URL` (a Postgres connection string), not the `SUPABASE_URL`/`ANON_KEY`/`SERVICE_ROLE_KEY` vars used elsewhere

Create a demo user (one-shot)

```bash
# inline
SUPABASE_URL="https://your-project.supabase.co" SERVICE_ROLE_KEY="your_service_key" ANON_KEY="your_anon_key" pnpm run create-demo

# or export then run
export SUPABASE_URL="https://your-project.supabase.co"
export SERVICE_ROLE_KEY="your_service_key"
export ANON_KEY="your_anon_key"
pnpm run create-demo
```

Run seed SQL against your database

```bash
DATABASE_URL="postgres://user:pass@host:5432/dbname" pnpm run run-seeds
```

Or run the SQL in `supabase/seeds/` manually against your Supabase instance using the Supabase CLI or `psql`.

## Troubleshooting

- Clear Metro/Expo cache: `pnpm run start -- --clear` or `expo start -c` (from the app folder).
- If an iOS build fails, run `pod install` in `apps/myhealth/ios` on macOS and re-run.
- If `npx expo run:ios --device` fails with `Developer Mode disabled`: enable it on the device under Settings → Privacy & Security → Developer Mode, then reboot.
- If it fails with `Device is busy (Preparing ...)`: Xcode is still indexing symbols for that device — wait for it to finish in Xcode → Window → Devices and Simulators, then retry.
- If it fails with a provisioning/signing error (`No profiles for '...' were found`): open the `.xcworkspace` in Xcode, enable "Automatically manage signing" and pick a Team for each target (app + widgets, if any).
- App env vars (`.env` in `apps/myhealth`/`apps/myfinancials`) must be prefixed `EXPO_PUBLIC_` — see Environment.
- Root-level script env vars (`create-demo`, `run-seeds`) use unprefixed names: `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `DATABASE_URL`.

## Useful locations

- Apps: `apps/myhealth`, `apps/myfinancials`
- Shared packages: `packages/ui`, `packages/auth`
- Supabase migrations/seeds/functions: `supabase/migrations`, `supabase/seeds`, `supabase/functions`
- Helper scripts: `scripts/`
- CI/deploy: `.github/workflows/deploy.yml` (web export of `apps/myhealth` → GitHub Pages, on push to `master`)
- Pre-push hook: `.githooks/pre-push`

## Git hooks

The repo ships a tracked `pre-push` hook (`.githooks/pre-push`) that runs the same command GitHub Actions uses to deploy (`pnpm --filter myhealth exec expo export --platform web`), so a broken web export is caught locally before it fails CI. Some native-only packages (e.g. `react-native-maps`) can silently break the web build even though native builds are fine — this catches that class of issue.

It's opt-in per clone (`.git/hooks` isn't version-controlled). Enable it once:

```bash
git config core.hooksPath .githooks
```

To skip it for a single push (e.g. you know the web export is unaffected): `git push --no-verify`.

## Contributing

If you plan to contribute:

- Follow the coding conventions used in the repo.
- Run `pnpm install` at the repo root and `pnpm run start` in `apps/myhealth` to test changes locally.
- If adding native iOS code, make sure to run `pod install` in `apps/myhealth/ios` on macOS.
- Enable the pre-push hook (see "Git hooks" above) so you catch web-export breakage before pushing.
