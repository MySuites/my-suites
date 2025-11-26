# MyCSuite

A pnpm monorepo that contains an Expo/React Native app (`apps/mycpo`), shared packages (`packages/*`), and Supabase migrations & seeds (`supabase/`).

Table of contents
- Overview
- Quick start
- Installation
- Environment
- Running (development)
- Supabase / Seeds
- Troubleshooting
- Useful locations
- Contributing

---

## Overview

MyCSuite is an Expo + React Native application with shared UI and auth packages. The repo includes helper scripts to create demo data and SQL files for migrations and seeds under `supabase/`.

## Quick start

1. Install dependencies: `pnpm install` at the repo root.
2. Create a `.env` in `apps/mycpo` with your Supabase keys (see Environment).
3. Start the app: `cd apps/mycpo && pnpm run start` and open with Expo.

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
cd apps/mycpo
pnpm install
```

## Environment

Create a `.env` file in `apps/mycpo` (or export env vars in your shell) with these values:

```env
SUPABASE_URL="https://your-project.supabase.co"
ANON_KEY="your_anon_key"
SERVICE_ROLE_KEY="your_service_role_key"
```

Notes

- Keep `SERVICE_ROLE_KEY` secret. Do not commit it.
- Consider adding a `.env.example` in `apps/mycpo` (I can add this for you).

## Running (development)

Start the Expo dev server from the app folder:

```bash
cd apps/mycpo
pnpm run start
# or
expo start
```

Open the project in Expo Go (physical device) or run in a simulator/emulator.

Native iOS (macOS only)

```bash
cd apps/mycpo/ios
pod install
cd ../..
pnpm run ios
```

Android emulator

Make sure Android Studio + SDK are installed and an AVD is created. Then run the app with your usual RN/Expo commands (or `pnpm run android` if configured).

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
- Helper script to create a demo user: `scripts/create_demo_user.js` (root `package.json` includes the `create-demo` script)

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

You can run the SQL in `supabase/seeds/` against your Supabase instance using the Supabase CLI or `psql`.

## Troubleshooting

- Clear Metro/Expo cache: `pnpm run start -- --clear` or `expo start -c`.
- If an iOS build fails, run `pod install` in `apps/mycpo/ios` on macOS and re-run.
- Ensure env var names match: `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`.

## Useful locations

- App: `apps/mycpo`
- Shared packages: `packages/ui`, `packages/auth`
- Supabase migrations/seeds: `supabase/migrations`, `supabase/seeds`
- Helper scripts: `scripts/`

## Contributing

If you plan to contribute:

- Follow the coding conventions used in the repo.
- Run `pnpm install` at the repo root and `pnpm run start` in `apps/mycpo` to test changes locally.
- If adding native iOS code, make sure to run `pod install` in `apps/mycpo/ios` on macOS.

---

If you'd like, I can also:

- Add a `apps/mycpo/.env.example` file.
- Create `docs/windows.md` with step-by-step Windows/WSL instructions.
- Open a branch and create a PR for these README updates.
