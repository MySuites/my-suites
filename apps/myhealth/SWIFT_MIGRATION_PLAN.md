# MyHealth: Expo/RN → Native Swift Migration Plan

Scope: iOS + watchOS only (no Android, no iPadOS/macOS). Distribution stays TestFlight, same bundle ID `com.mysuite.myhealth`, same Apple Team `YGZKAF6C6H` (see [App Store Connect Snapshot](#app-store-connect--developer-portal-snapshot-prep-item-7) — the `7Y22TWVLZ2` value in `app.json`/Xcode project is stale, ignore it).

## Branch strategy

Do all Swift rewrite work on a separate branch (e.g. `swift-rewrite`), not `master`. `master`/RN app keeps shipping as-is throughout. Once Swift version reaches parity and is verified working (TestFlight-tested through Phase 3), merge `swift-rewrite` into `master`, overriding/removing the RN app entirely. If the rewrite stalls or fails, `master` is untouched — old RN code stays shippable, no rollback needed.

## Prep now (while still in RN/Expo)

All 7 prep items done. Full detail in the sections below this plan:

1. **Domain logic reference** — [Domain Logic Reference](#domain-logic-reference-for-swift-port). Covers `workout-logic.ts`, `progressiveOverload.ts`, `strengthStandards.ts`, `weeklyGoal.ts`, and the exercise-metadata inference helpers in `DataRepository.tsx` — all portable ~1:1 as reference for Swift.
2. **Frozen schema** — [Frozen Data Schema](#frozen-data-schema-for-swiftdata-port). Ground truth is the actual `CREATE TABLE`/`ALTER TABLE` statements in `utils/db/database.ts` — **not** `powersync/AppSchema.ts` or `migrations/local_schema.md`, both found stale/inconsistent with the live schema during this audit. Includes known data quirks (JSON-vs-plain-string columns, `image_url` inconsistency) to resolve during import, not replicate.
3. **Service interface audit** — [Service Interface Audit](#service-interface-audit). `services/` is already clean — one object-literal namespace per native capability, no RN-side refactor needed before porting.
4. **Avoid new coupling to `@mysuite/auth`/`@mysuite/ui`** — both dropped in the rewrite; new dependence on them is work you redo. Ongoing discipline, no action item.
5. **Sync/auth behavior** — [Current Sync & Auth Behavior](#current-sync--auth-behavior-captured-before-powersyncbackend-context-is-deleted). Finding: sync is already a no-op (`useSyncService.ts` stub, no Supabase references left anywhere) — the app is already local-only in practice, so PowerSync removal drops an inert dependency, not an active sync path. Auth (`@mysuite/auth`) is used only to key local data by `user.id`; no live sync consumer depends on it — points toward dropping auth entirely in the rewrite, flagged as an explicit decision for Phase 2.
6. **Test suite audit** — [Test Suite Audit](#test-suite-audit--what-survives-the-rewrite-as-a-spec). Sorted every test file into what translates to Swift/XCTest specs directly (DataRepository, workout-logic, geo, service tests) vs what's RN-only and doesn't survive (component snapshots, `__tests__/flows`) — the latter still useful as manual QA scripts for Phase 3 screen verification. No further test-writing needed now.
7. **App Store Connect / developer portal snapshot** — [App Store Connect / Developer Portal Snapshot](#app-store-connect--developer-portal-snapshot-prep-item-7). Capabilities, TestFlight groups, IAP, certs, and the team-ID mismatch — all resolved.

## Phase 1 — Scaffold

- Xcode project, 2 targets: iOS app + watchOS companion app, sharing a Swift Package (models, business logic, data layer, HealthKit service).
- Bundle IDs: `com.mysuite.myhealth` (iOS), `com.mysuite.myhealth.watchkitapp` (Watch).
- Signing team: `YGZKAF6C6H` (the only real team — see [App Store Connect Snapshot](#app-store-connect--developer-portal-snapshot-prep-item-7)).
- Carry entitlements (HealthKit, Live Activities, camera/photo/mic/location) + assets from [app.json](app.json) / [assets](assets).
- Port existing Swift live-activity module ([modules/live-activity](modules/live-activity), [targets/live-activity](targets/live-activity)) as a widget extension — already native, minimal rework.
- Replace EAS build with native Xcode archive/upload for TestFlight.

## Phase 2 — Architecture

- **Data layer**: SwiftData, local-only, no PowerSync/backend sync. Port schema from the [Frozen Data Schema](#frozen-data-schema-for-swiftdata-port) section below. Decide later: import existing on-device `.db` into new store on first launch.
- **HealthKit**: native framework, both targets — watchOS gets on-device `HKWorkoutSession` (richer than current iPhone-only setup). Replaces `@kingstinct/react-native-healthkit` + [services/HealthKitService.ts](services/HealthKitService.ts) / [services/WorkoutHealthKitSyncService.ts](services/WorkoutHealthKitSyncService.ts).
- **Navigation**: Expo Router tree ([app/(tabs)](app/(tabs)), [app/_layout.tsx](app/_layout.tsx)) → SwiftUI `TabView` + `NavigationStack`, map routes 1:1.
- **State**: [providers/](providers) → `@Observable` classes, environment injection.
- **WatchConnectivity**: sync active workout state (start/stop, set logging, rest timer) between iPhone and Watch — design alongside ActiveWorkoutProvider port.
- **Auth**: `@mysuite/auth` — deferred decision; data now local-only, question whether account layer still needed at all. See recommendation in [Current Sync & Auth Behavior](#current-sync--auth-behavior-captured-before-powersyncbackend-context-is-deleted).
- **UI**: new SwiftUI component library, replacing `@mysuite/ui`.
- **Location/notifications**: CoreLocation + UserNotifications frameworks.

## Phase 3 — Screen-by-screen rewrite

iOS, in order:
1. Settings (simplest, low state)
2. Progress pictures (camera/photo library)
3. Dashboard/exercises
4. Workouts (most complex: active workout state, live activity, HealthKit sync, location tracking)
5. History

Each screen: rewrite in SwiftUI, wire to Phase 2 architecture, verify in Simulator against current RN app, ship as internal TestFlight build before starting the next screen. Use the RN `__tests__/flows/*` tests as manual QA scripts per screen (see [Test Suite Audit](#test-suite-audit--what-survives-the-rewrite-as-a-spec)).

Watch app: scoped after iOS Workouts screen stabilizes. Small surface only — active workout view + quick set logging — not a full port of iOS screens.

## Open decisions (deferred, not blocking Phase 1)

- Import path for existing users' local `.db` data into new SwiftData store.
- Whether auth/account layer survives once data is local-only.

---

# Domain Logic Reference (for Swift port)

Source of truth for pure business logic in the current RN app. Port these to Swift ~1:1 — they have no framework dependency and are the highest-value carryover from the rewrite.

## [utils/workout-logic.ts](utils/workout-logic.ts)

- `getEffectiveSetWeight(set)` — sums `bodyweight` baseline + `weight` delta (weight can be negative for assisted pull-ups). Old data has only one field set; both cases must degrade correctly.
- `BODYWEIGHT_LOAD_PERCENTAGE` — per-exercise-id map of what fraction of bodyweight a movement loads (e.g. push-up 0.67, pull-up 0.92, plank 0.75). Unlisted ids default to 1.0 (full bodyweight) — correct only for single-point-suspension movements; anything else needs an explicit entry or it silently over-counts.
- `getBodyweightLoadPercentage(exercise)`, `getEffectiveBodyweightLoad(exercise, latestBodyWeight)` — apply the above; pass `null`/`undefined` bodyweight through unchanged.
- `createExercise(name, setsStr, repsStr, properties?, restTime?)` — builds an `Exercise` with per-set `setTargets`, target field (`reps`/`duration`/`distance`) chosen from `properties`.
- `createSequenceItem(item)`, `reorderSequence(sequence, index, dir)` — sequence/superset builder helpers.
- `calculateNextWorkoutState(exercises, currentIndex)` — increments `completedSets` on current exercise, advances index once `completedSets >= sets`, always signals `shouldRest: true`.
- `generateSummary(workoutSeconds, exercises)` — JSON string summary (used for share/export, not critical logic).
- `OUTDOOR_GPS_EXERCISE_IDS` (`running`, `cycling`), `isOutdoorGpsExercise(exercise)` — checks id set OR a `'Location'` entry in the comma-joined `properties` string (custom exercises opt in via a UI toggle using this same convention).
- `workoutHasOutdoorExercise(exercises)` — any exercise GPS-tracked.
- `isUnilateralExercise(name)` — substring heuristic on lift name (`single`, `one-arm`, `lunge`, `dumbbell row`, etc).
- `areExercisesEqual(exs1, exs2)` — field-by-field diff (not deep-equal) used to detect unsaved workout-draft changes; ignores transient/UI-only fields by design.

## [utils/progressiveOverload.ts](utils/progressiveOverload.ts)

Double-progression scheme: at a fixed weight, add a rep each session until hitting a rep ceiling, then reset reps to floor and bump weight. RPE (if tracked) modulates aggressiveness.

Constants: `DEFAULT_REP_CEILING=12`, `REP_CEILING_MIN=6`, `REP_CEILING_MAX=30`, `WEIGHT_INCREMENT_LB=5`, `WEIGHT_INCREMENT_LB_AGGRESSIVE=10`, `RPE_EASY_THRESHOLD=6`, `RPE_HARD_THRESHOLD=9`. Weight always canonically stored in lb — convert for display only at the call site.

- `getSuggestedGoal(prev, avgRpe?, repCeiling?)` — bilateral suggestion. RPE ≥9 → hold steady. RPE ≤6 (easy) → bigger jump. At ceiling → reset to floor (`ceiling - 4`, min 1) and bump weight; else → +1 rep (+2 if easy), capped at ceiling.
- `getSuggestedUnilateralGoal(prev, avgRpe?, repCeiling?)` — same logic, but driven by the **weaker** side (`min(reps_left, reps_right)`) so suggestions never outrun the weaker limb.
- `getSuggestedDurationGoal(prev, avgRpe?, durationCeiling?)` — same double-progression idea for timed holds. Constants: `DEFAULT_DURATION_CEILING_SEC=60`, `MIN=15`, `MAX=300`, `INCREMENT_SEC=5`, `INCREMENT_SEC_AGGRESSIVE=10`. Floor = `ceiling - 20` (min 5). If exercise has no trackable weight (bodyweight-only hold), keeps extending duration past ceiling instead of resetting (no natural reset point without added load).

## [utils/strengthStandards.ts](utils/strengthStandards.ts)

Bodyweight-relative estimated-1RM tiering for bench press / squat / deadlift only (`RANKED_LIFTS`) — the only lifts with widely-agreed public norms.

- `STANDARDS[sex][exerciseId]` — 5 bodyweight-multiple thresholds per lift/sex: `[Beginner, Novice, Intermediate, Advanced, Elite]`. Community-consensus figures, not from a single cited source.
- Height adjustment: `REFERENCE_HEIGHT_INCHES` (male 69", female 64") + `HEIGHT_ADJUSTMENT_PER_INCH` (bench 0.4%/in, squat/deadlift 0.6%/in — squat/deadlift more ROM-sensitive to height) — taller lifters get lower required ratios. Capped at ±15% (`MAX_HEIGHT_ADJUSTMENT`). Heuristic, not peer-reviewed.
- `getStrengthRank(exerciseId, e1RM, bodyweight, sex, heightInches?)` → `{ ratio, tier, nextTier, progressToNextTier (0-1) }`. Returns `null` if inputs invalid or exercise not in `STANDARDS`.

## [utils/weeklyGoal.ts](utils/weeklyGoal.ts)

Trivial: `WEEKLY_GOAL_STORAGE_KEY`, `DEFAULT_WEEKLY_GOAL = 4`.

## Exercise-metadata inference (in [providers/DataRepository.tsx](providers/DataRepository.tsx), not utils/)

Fallback heuristics used when explicit exercise metadata is missing (older/imported data):
- `inferEquipment(name)` — substring match → `dumbbell`/`barbell`/`cable`/`machine`/`parallettes`/`pull up bar`/`none`/`other`.
- `inferMovementType(name, equipment)` — unilateral if name suggests single-limb, or equipment is dumbbell; else `uniform`.
- `inferAngle(name)` — `incline`/`decline`/`flat` from name.
- `inferAttachment(name)` — grip/bar-type substring match.
- `generateDefaultInstructions(name, description, muscleGroups)` — large substring-keyed lookup table generating 4-step instructions per lift family (bench, fly, pulldown, row, raises, press, deadlift, squat, lunge, split squat, leg extension/curl, calf raise, curl, tricep, plank, crunch, push-up, pull-up), falling back to muscle-group-based or description-sentence-split default. Low-priority to port faithfully (display text only), but keep the exercise-family list if reused.

---

# Frozen Data Schema (for SwiftData port)

**Ground truth is [utils/db/database.ts](utils/db/database.ts)** (actual `CREATE TABLE` + migration `ALTER TABLE` statements run against the on-device SQLite DB). Two other schema docs exist in this repo and are both **stale/inconsistent with the live schema** — do not use them as source of truth for the port, though `local_schema.md`'s prose relationships are still directionally correct:
- [powersync/AppSchema.ts](powersync/AppSchema.ts) — PowerSync table defs, missing many columns below (no `sync_status` semantics beyond text, no `progress_pictures`/`profiles` tables, no healthkit/route/sort_order columns). Being deleted anyway per the no-PowerSync decision.
- [migrations/local_schema.md](migrations/local_schema.md) — describes an older AsyncStorage-collection design; actual storage is SQLite (see `utils/db/database.ts`), not AsyncStorage, except for two loose keys noted below.

Do not port `sync_status` / `deleted_at` semantics as-is — those exist for the old pending/synced backend-sync model being dropped. A local-only SwiftData store just needs the data columns; soft-delete (`deleted_at`) may still be worth keeping for undo/trash UX, decide per-screen.

## Tables (as actually created, RN app)

### `workouts` (templates)
| column | type | notes |
|---|---|---|
| id | TEXT PK | |
| user_id | TEXT | |
| name | TEXT | |
| exercises | TEXT | JSON blob of exercise templates — consider normalizing to a real relation in SwiftData |
| created_at | TEXT | ISO string |
| updated_at | INTEGER | epoch ms |
| deleted_at | INTEGER | epoch ms, nullable |
| sync_status | TEXT | drop |
| sort_order | INTEGER | added via migration |

### `workout_logs` (performed workout headers)
| column | type | notes |
|---|---|---|
| id | TEXT PK | |
| user_id | TEXT | |
| workout_date | TEXT | |
| workout_name | TEXT | |
| duration | INTEGER | seconds |
| note | TEXT | |
| created_at | TEXT | |
| updated_at | INTEGER | |
| deleted_at | INTEGER | nullable |
| sync_status | TEXT | drop |
| image_url | TEXT | JSON array or single string (inconsistent — see DataRepository parsing logic) |
| healthkit_uuid | TEXT | dedupe key for HealthKit-imported (Apple Watch) workouts — **keep**, still relevant native |
| avg_heart_rate | REAL | bpm |
| max_heart_rate | REAL | bpm |
| calories | REAL | kcal |
| distance | REAL | meters |
| elevation_gain | REAL | meters |
| route | TEXT | JSON array of `{latitude, longitude, timestamp}` |
| metrics_source | TEXT | `'healthkit' \| 'gps'` |

### `set_logs` (individual set performance, FK → workout_logs.id)
| column | type | notes |
|---|---|---|
| id | TEXT PK | |
| workout_log_id | TEXT | FK |
| exercise_id | TEXT | |
| exercise_name | TEXT | denormalized snapshot |
| weight | REAL | lb, canonical unit |
| reps | INTEGER | |
| reps_left | INTEGER | unilateral |
| reps_right | INTEGER | unilateral |
| distance | REAL | |
| duration | INTEGER | seconds |
| bodyweight | BOOLEAN | stored as 0/1 int; see [Domain Logic Reference](#domain-logic-reference-for-swift-port) `getEffectiveSetWeight` for how this combines with `weight` |
| rpe | REAL | |
| equipment | TEXT | sometimes JSON-array-encoded string, sometimes plain — DataRepository normalizes on read |
| attachment | TEXT | same JSON-or-plain quirk |
| created_at | TEXT | |
| sync_status | TEXT | drop |

### `exercises` (exercise library, built-in + custom)
| column | type | notes |
|---|---|---|
| id | TEXT PK | |
| name | TEXT | |
| muscle_groups | TEXT | JSON string array |
| properties | TEXT | comma-joined string (`Weighted,Bodyweight,Reps,Duration,Distance,Location`, etc) — **not** JSON; see `isOutdoorGpsExercise` in [Domain Logic Reference](#domain-logic-reference-for-swift-port) for the `Location` convention |
| description | TEXT | |
| progression_id | TEXT | |
| difficulty | REAL | supports fractional (1.5, 2.5) |
| is_active_progression | INTEGER | 0/1 |
| next_variations | TEXT | JSON string array of exercise ids |
| tips | TEXT | JSON string array |
| instructions | TEXT | JSON string array; falls back to `generateDefaultInstructions()` if empty (see [Domain Logic Reference](#domain-logic-reference-for-swift-port)) |
| equipment | TEXT | JSON-array-or-plain quirk, same as set_logs |
| movement_type | TEXT | `unilateral \| uniform` |
| attachment | TEXT | |
| created_at | TEXT | |
| updated_at | INTEGER | |
| deleted_at | INTEGER | nullable |
| sync_status | TEXT | drop |

Missing from the original `CREATE TABLE` but referenced elsewhere and worth double-checking against current `utils/db/database.ts` at port time: `angle` column (`inferAngle` heuristic exists, unclear if persisted or always inferred).

### `body_measurements`
| column | type |
|---|---|
| id | TEXT PK |
| user_id | TEXT |
| weight | REAL |
| date | TEXT |
| created_at | TEXT |
| updated_at | INTEGER |
| sync_status | TEXT — drop |

### `profiles`
| column | type | notes |
|---|---|---|
| id | TEXT PK | |
| email | TEXT | |
| username | TEXT | |
| full_name | TEXT | |
| updated_at | INTEGER | |
| sync_status | TEXT | drop — **whole table's relevance depends on the deferred auth decision** (see plan's [Open decisions](#open-decisions-deferred-not-blocking-phase-1)) |

### `progress_pictures`
| column | type | notes |
|---|---|---|
| id | TEXT PK | |
| user_id | TEXT | defaults to `'guest'` when null |
| image_uri | TEXT | |
| date | TEXT | |
| notes | TEXT | |
| muscle_groups | TEXT | JSON: `{ primaryMuscles: string[], secondaryMuscles: string[], confidence: number, source: 'local' \| 'cloud' }` — on-device VLM JSON output for this field has known reliability issues (deferred work item, see prior notes) |
| created_at | TEXT | |
| updated_at | INTEGER | |
| sync_status | TEXT | drop |

## Loose AsyncStorage keys (not SQL tables)
- `exercise_data_version` (int) — tracks whether default exercise seed data needs re-seeding.
- `weekly_workout_goal` (int, see [utils/weeklyGoal.ts](utils/weeklyGoal.ts))
- `strength_ranking_sex` (see [utils/strengthStandards.ts](utils/strengthStandards.ts))
- Others likely exist ([utils/storage.ts](utils/storage.ts), [utils/widgetOrder.ts](utils/widgetOrder.ts)) — audit that file directly at port time, not exhaustively listed here.

## Relationships
- `workout_logs` 1:N `set_logs` via `workout_log_id`.
- `set_logs.exercise_id` → `exercises.id` (metadata lookup/join, not an enforced FK).
- History view (`DataRepository.getHistory`) does this join **in application code**, not SQL — port as a computed/derived relationship in SwiftData, not a stored denormalization.

## Known data quirks to replicate carefully in migration/import
- `equipment`/`attachment` columns on both `exercises` and `set_logs` are inconsistently JSON-array-encoded vs plain string — read path in `DataRepository.tsx` has defensive unwrapping for both. Decide at import time whether to normalize once during migration (recommended) rather than replicate the defensive parsing forever.
- `image_url` on `workout_logs` similarly inconsistent (single string vs JSON array).
- `bodyweight` on `set_logs` is a boolean flag, not the bodyweight value itself — the actual bodyweight number lives elsewhere per set (check `set_logs` read mapping in DataRepository — `set.bodyweight` is passed through as a number in `getHistory`, worth resolving this apparent type mismatch during the port, not guessing).

---

# Service Interface Audit

Checked [services/](services) for isolation ahead of the Swift port. Verdict: **already clean, no RN-side refactor needed.** Each file exports one object-literal namespace wrapping a native capability — maps 1:1 to a Swift service class/struct.

| RN service | Native capability wrapped | Swift target |
|---|---|---|
| [HealthKitService.ts](services/HealthKitService.ts) | `@kingstinct/react-native-healthkit` | `HealthKit` framework directly |
| [WorkoutHealthKitSyncService.ts](services/WorkoutHealthKitSyncService.ts) | Sync logic between local workout logs and HealthKit (dedupe via `healthkit_uuid`) | Port logic as-is, swap HealthKit calls |
| [WorkoutLocationTrackingService.ts](services/WorkoutLocationTrackingService.ts) | `expo-location` (GPS route tracking for outdoor exercises) | `CoreLocation` |
| [LiveActivityService.ts](services/LiveActivityService.ts) | Bridges to `modules/live-activity` native module | Already Swift underneath — direct reuse of [modules/live-activity](modules/live-activity), just drop the JS bridge layer |
| [NotificationService.ts](services/NotificationService.ts) | `expo-notifications` | `UserNotifications` framework |
| [BodyWeightService.ts](services/BodyWeightService.ts) | Wraps `DataRepository` body-measurement calls + HealthKit read | Port as thin domain service over SwiftData + HealthKit |
| [ProgressPictureService.ts](services/ProgressPictureService.ts) | Camera/photo library (`expo-image-picker`, `expo-media-library`) + local storage | `PhotosUI`/`AVFoundation` |

`services/ai/*` (AIProvider, CloudAIProvider, LocalAIProvider, executorch model management) — not audited here, separate concern from core data/workout services; revisit when the on-device muscle-group AI reliability work resumes.

No action needed now — this section is the checklist for Phase 2 service-layer work, confirming the current RN structure won't fight the port.

---

# Current Sync & Auth Behavior (captured before PowerSync/backend context is deleted)

## Sync: already effectively off

[hooks/useSyncService.ts](hooks/useSyncService.ts) is a no-op stub:

```ts
// Sync temporarily disabled while Supabase is removed.
// Returns a no-op interface so WorkoutManagerProvider compiles unchanged.
```

No `supabase` references remain anywhere in the app source (grepped clean). PowerSync's `AppSchema.ts` is present but the app already reads/writes through a plain local SQLite layer ([utils/db/database.ts](utils/db/database.ts) via `DataRepository`), not through PowerSync's sync engine. **The app is already local-only in practice** — dropping PowerSync for the Swift rewrite removes a currently-inert dependency, not an active sync path. No cross-device continuity or conflict-resolution behavior exists today to replicate.

The `sync_status` (`'pending' | 'synced'`) and `deleted_at` columns throughout the schema (see [Frozen Data Schema](#frozen-data-schema-for-swiftdata-port)) are vestiges of the old Supabase-backed design and can be dropped in the SwiftData port — no live consumer depends on their semantics beyond local soft-delete filtering (`WHERE deleted_at IS NULL`), which can be replaced with a hard delete or a simpler local `isDeleted` flag if undo UX is wanted.

## Auth: present but load-bearing only as a local user-id key

`@mysuite/auth`'s `useAuth()` (returning `{ user, session }`) is imported in 9 files, always for the same purpose: reading `user.id` (or `user?.id ?? 'guest'`) to key/filter local data — e.g. `getLatestBodyWeight(userId)`, `getProgressPictures(userId)`, `ActiveWorkoutProvider`, `WorkoutManagerProvider`. No file in the app calls a login/signup/session-refresh flow directly (that logic lives inside the `@mysuite/auth` package itself, wrapped by `AuthProvider` in [app/_layout.tsx](app/_layout.tsx)).

Given sync is already off, auth today provides:
1. A stable id to partition local rows between a signed-in user and `'guest'`.
2. Whatever UI (sign-in screen, account settings) `@mysuite/auth`/`@mysuite/ui` render — not audited here, check `AuthProvider` internals at Phase 2 time if this needs enumerating.

**Recommendation for the Phase 2 "does auth survive" decision**: since there's no backend to authenticate against for sync anymore, the honest options are (a) drop auth entirely and make the app single-profile/guest-only on-device, or (b) keep a minimal local "profile switcher" (the `profiles` table already exists locally) without any real network auth. Full account/login system is very likely not worth porting to Swift given zero current sync consumer — flag this to decide explicitly before Phase 2 architecture work starts, but the data here points toward dropping it.

---

# Test Suite Audit — what survives the rewrite as a spec

Component/flow tests test RN rendering and don't translate; logic/data tests describe behavior worth re-verifying in Swift (as new XCTest cases, not ported code).

## High value — translate to Swift/XCTest specs directly
Pure logic or data-layer behavior, framework-agnostic:
- [__tests__/DataRepository.test.ts](__tests__/DataRepository.test.ts) (284 lines) — CRUD + read-mapping behavior against the schema in [Frozen Data Schema](#frozen-data-schema-for-swiftdata-port). Best available spec for the SwiftData repository layer.
- [__tests__/database-migration.test.ts](__tests__/database-migration.test.ts) (512 lines) — column/table migration behavior. Not directly portable (SQLite `ALTER TABLE` migrations vs SwiftData's own migration model), but documents every schema change made over time — cross-reference against [Frozen Data Schema](#frozen-data-schema-for-swiftdata-port) for anything missed.
- [__tests__/workout.test.ts](__tests__/workout.test.ts) (104 lines) — workout-logic.ts behavior, maps directly to [Domain Logic Reference](#domain-logic-reference-for-swift-port).
- [__tests__/geo.test.ts](__tests__/geo.test.ts) (47 lines) — `computeRouteDistance`/`computeElevationGain` (used by ActiveWorkoutProvider), pure math, portable.
- [__tests__/formatting.test.ts](__tests__/formatting.test.ts) (21 lines) — display formatting rules, small but portable.
- [__tests__/delete-data.test.ts](__tests__/delete-data.test.ts) (49 lines) — `clearAllLocalData` behavior, portable spec.
- [__tests__/ProgressPictureService.test.ts](__tests__/ProgressPictureService.test.ts), [__tests__/WorkoutHealthKitSyncService.test.ts](__tests__/WorkoutHealthKitSyncService.test.ts), [__tests__/WorkoutLocationTrackingService.test.ts](__tests__/WorkoutLocationTrackingService.test.ts) — service-level behavior specs (HealthKit dedupe logic, location tracking rules) worth re-implementing as Swift unit tests against the native frameworks directly.

## Medium value — behavior worth preserving, but test itself is RN-shaped
- [__tests__/WorkoutManagerProvider.test.tsx](__tests__/WorkoutManagerProvider.test.tsx) (312 lines), [__tests__/ActiveWorkoutProvider.test.tsx](__tests__/ActiveWorkoutProvider.test.tsx) (151 lines) — exercise state-machine/provider behavior. The *rules* being tested (set completion, rest transitions, draft dirty-checking) matter for the `@Observable` Swift port; the RN Testing Library mechanics don't.
- [__tests__/LocalFirstVerification.test.tsx](__tests__/LocalFirstVerification.test.tsx) (105 lines), [__tests__/GuestStats.test.tsx](__tests__/GuestStats.test.tsx) (87 lines), [__tests__/GuestExercises.test.tsx](__tests__/GuestExercises.test.tsx) (32 lines) — guest/local-only behavior assertions, relevant to the "auth becomes optional" direction noted in [Current Sync & Auth Behavior](#current-sync--auth-behavior-captured-before-powersyncbackend-context-is-deleted).

## Low/no value — RN component rendering, does not survive
- [__tests__/components/](__tests__/components) (7 files: ActiveWorkoutOverlay, BodyWeightCard, Charts, ExerciseCard, ThemedCard, VolumeTrendCard, WorkoutTab) — snapshot/render tests of RN components being deleted wholesale.
- [__tests__/flows/](__tests__/flows) (7 files: exercise-details, exercise-management, saved-workouts, settings-flow, workout-end-flow, workout-flow, workout-history) — RN Testing Library end-to-end flow tests. Useful only as **manual QA scripts** for what to click through when verifying each Phase 3 SwiftUI screen against the old app — not portable as automated tests.
- [__tests__/hooks/](__tests__/hooks) (6 files) — RN hook tests (`use-color-scheme`, `useActiveWorkoutPersistence`, `useActiveWorkoutTimers`, `useExerciseStats`, `useLatestBodyWeight`, `useWorkoutDraft`) — logic worth preserving conceptually, mechanics won't port (SwiftUI doesn't have hooks).

## Recommendation per prep item #6
No RN test-writing work needed now beyond what's already here — the useful ones (DataRepository, workout-logic, geo, formatting, delete-data, service specs) are already solid. Don't invest further in `__tests__/components` or `__tests__/flows` — that effort doesn't survive the rewrite; use the flow tests as a manual verification checklist per screen in Phase 3 instead.

---

# App Store Connect / Developer Portal Snapshot (prep item #7)

Captured manually by user from developer.apple.com and appstoreconnect.apple.com, 2026-09-01.

## Team — RESOLVED
- Account membership page confirms: **only one team exists**, `YGZKAF6C6H`, Individual enrollment, Apple Developer Program. No team switcher, no second team.
- Therefore `DEVELOPMENT_TEAM = 7Y22TWVLZ2` in [ios/MyHealth.xcodeproj/project.pbxproj](ios/MyHealth.xcodeproj/project.pbxproj) and `appleTeamId: "7Y22TWVLZ2"` in [app.json](app.json) are **stale/incorrect values**, not a legitimate second team — likely left over from a past re-enrollment or account change. The app still ships today either because Xcode's automatic signing silently resolves/overrides the wrong ID at build time, or the value goes unused in the actual EAS/Xcode build path.
- **Action for Phase 1 scaffold**: use `YGZKAF6C6H` as the team ID for the new Swift project's signing config — it's the only real team. Also worth a quick fix to `app.json`/Xcode project's stale `7Y22TWVLZ2` in the current RN app while at it (low priority, doesn't block anything since master keeps shipping unchanged).
- All Certificates/App IDs/capabilities/TestFlight groups/IAP captured below were correctly viewed under the one real team — nothing to re-verify.

## App IDs (Certificates, Identifiers & Profiles → Identifiers)
- `com.mysuite.myhealth` — main app. Platforms: iOS, iPadOS, macOS, tvOS, watchOS, visionOS (broad default set, not app-specific).
- `com.mysuite.myhealth.widgets` — live-activity/widget extension.

## Capabilities enabled on `com.mysuite.myhealth`
- **HealthKit** ✓
- **Push Notifications** ✓
- All others unchecked.
- Live Activities has no App ID capability toggle — enabled via `NSSupportsLiveActivities` in Info.plist only, already present in [app.json](app.json).

## Capabilities enabled on `com.mysuite.myhealth.widgets`
- None ticked — widget extension needs no App ID capabilities of its own (live activities work via the parent app's entitlement + widget extension target type, not a capability toggle here).

## TestFlight (app store display name "MyHealth - Harmony")
Confirmed: this **is** the live shipping app — build history goes up to 1.9.0 (matches git log's v1.9.54-scale versioning). The earlier "1.0 Prepare for Submission" screen seen was just the App Store *submission* draft (separate from TestFlight, which has been shipping independently) — not a stale duplicate listing. No concern.

Latest build: **1.9.0 (1.8.3)**, uploaded Aug 7, 2026.

Tester groups:
- Internal Testing: **Beta Testers**, **Team (Expo)**
- External Testing: **Beta Testers**, **Youtube Testers**

## In-App Purchases
None configured — no IAP items exist on the app. Nothing to carry over.

## Certificates
2 certs on developer.apple.com: Development (exp 2027/02/01), iOS Distribution (exp 2027/04/06). Both valid, not expiring soon — no action needed.
