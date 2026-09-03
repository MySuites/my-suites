# MyHealth (Swift scaffold)

Native Swift/SwiftUI rewrite of the MyHealth app. See [../myhealth/SWIFT_MIGRATION_PLAN.md](../myhealth/SWIFT_MIGRATION_PLAN.md) for the full migration plan — this README only covers what's in this directory.

Lives on the `swift-rewrite` branch. The RN app at `../myhealth` keeps shipping unchanged from `master` until this reaches parity.

## Structure

- `MyHealth/` — iOS app target.
- `MyHealth Watch App/` — watchOS companion app target.
- `MyHealthWidgets/` — widget extension hosting the workout Live Activity (ported from `../myhealth/targets/live-activity`).
- `Packages/MyHealthKit/` — local Swift Package shared by all three targets: domain logic, SwiftData models, HealthKit/live-activity services.
- `project.yml` — [XcodeGen](https://github.com/yonaskolb/XcodeGen) spec. **Do not hand-edit `MyHealth.xcodeproj`** — edit `project.yml` and regenerate:

```bash
xcodegen generate
```

## Phase 1 scaffold status

Done:
- Xcode project generated via XcodeGen with 3 targets (iOS app, watchOS app, widget extension) sharing the `MyHealthKit` package.
- Bundle IDs: `com.mysuite.myhealth` (iOS), `com.mysuite.myhealth.watchkitapp` (Watch), `com.mysuite.myhealth.widgets` (widget extension).
- Signing team `YGZKAF6C6H` set in `project.yml` (see plan's App Store Connect snapshot for why).
- Entitlements (HealthKit, `aps-environment`) and Info.plist usage-description strings carried over from the RN app's `app.json`.
- App icon copied from RN app's `assets/images/Lotus_Icon.png`.
- Live Activity widget (`WorkoutLiveActivity.swift`, `MyHealthWidgetsBundle.swift`) ported unchanged into `MyHealthWidgets/` — it was already pure SwiftUI/ActivityKit/WidgetKit with no RN dependency.
- `MyHealthKit` package: `WorkoutActivityAttributes` (shared between app and widget), `LiveActivityService` (native ActivityKit calls, ported from the old Expo bridge module), SwiftData models for the full local schema (`ExerciseRecord`, `WorkoutRecord`, `WorkoutLogRecord`, `SetLogRecord`, `BodyMeasurementRecord`, `ProgressPictureRecord`), and pure domain logic ported from `utils/workout-logic.ts`, `progressiveOverload.ts`, `strengthStandards.ts`, `weeklyGoal.ts` (draft/sequence-builder helpers from `workout-logic.ts` — `createExercise`, `reorderSequence`, `areExercisesEqual`, etc. — deferred to Phase 2/3 alongside the actual workout state machine they support).
- `MyHealthKit` package tests pass on iOS Simulator (`xcodebuild test -scheme MyHealthKit -destination 'platform=iOS Simulator,name=<device>'` from inside `Packages/MyHealthKit` — plain `swift test` won't work here since it runs on the Mac host and ActivityKit is iOS/watchOS-only).

Verified:
- `MyHealthKit` package builds and its 9 tests pass against the iOS Simulator SDK.
- Full `MyHealth` scheme (iOS app + watchOS companion + widget extension, all embedded) builds clean for iOS Simulator.
- App installs, launches, and renders on iPhone 17 Pro Simulator — SwiftData `ModelContainer` initializes without crashing.

Fix along the way: `ActivityKit` doesn't exist on watchOS at all, so `WorkoutActivityAttributes.swift` and `LiveActivityService.swift` in `MyHealthKit` are wrapped in `#if canImport(ActivityKit)` — they compile into the iOS build (app + widget extension) and compile out of the watchOS build.

## Phase 2 architecture status

Done, ported from the RN app into `MyHealthKit`:
- **`WorkoutRepository`** — SwiftData CRUD layer ported from `providers/DataRepository.tsx`: workouts, history/logs, exercise library, body measurements, progress pictures, bulk clear. `WorkoutRecord` gained a proper `exercises: [WorkoutExerciseTemplate]` (JSON-encoded, mirroring the RN schema's blob design) that Phase 1's model was missing.
- **`SettingsStore`** — `@Observable`, UserDefaults-backed, ports the settings slice of `WorkoutManagerProvider.tsx` (RPE, haptics, sound, progressive-overload rep ceiling, live activities, weekly goal).
- **`WorkoutManagerStore`** — `@Observable`, saved workouts + workout history CRUD over `WorkoutRepository`. Simplified vs. the RN original: `updateSavedWorkout`'s field-by-field completed-set merge logic isn't ported yet — it's UI-editing-flow specific, revisit once the workout editor screen exists in Phase 3.
- **`ActiveWorkoutStore`** — `@Observable`, the core session state machine ported from `ActiveWorkoutProvider.tsx`: start/pause/resume/reset, add/update/remove/reorder exercises, set completion with rest-timer trigger, finish/cancel with GPS+HealthKit-bodyweight fold-in, Live Activity sync. Deferred to Phase 3 (need concrete screens to know the UX): pre-filling `previousLog` from history, AI muscle-group analysis on saved progress pictures, and the completion-prompt `Alert` (exposed instead as `isWorkoutComplete` for the view layer to react to).
- **`NotificationService`** — `UserNotifications`, ports `services/NotificationService.ts` in full.
- **`LocationTrackingService`** — `CoreLocation`, ports `services/WorkoutLocationTrackingService.ts`. iOS-only (`#if os(iOS)`) — GPS route tracking is a phone feature, and several `CLLocationManager` properties used here are unavailable on watchOS anyway.
- **`HealthKitService`** — `HealthKit`, covers the same read/write scope as `services/HealthKitService.ts` (body mass, workouts, heart rate, active energy, distance). Full workout-import parity (activity-type labeling nuances, per-workout heart-rate statistics) deferred to Phase 3 alongside `WorkoutHealthKitSyncService`.

Verified:
- Full `MyHealth` scheme (iOS + watchOS + widget extension) still builds clean after all additions.
- `MyHealthKit` package tests: 14 tests covering domain logic, the repository, and `ActiveWorkoutStore`'s session lifecycle (start → complete sets → finish → saved to history).

Fix along the way: `ActivityKit` is referenced from `ActiveWorkoutStore` too, not just the two Phase 1 files — every call site is wrapped in `#if canImport(ActivityKit)` so the watchOS build of `MyHealthKit` compiles.

**Known flake, not an app bug**: this Xcode 26.3 / iOS 26.2 Simulator combination has an intermittent SwiftData crash-then-recover-on-retry when running the full test suite (`xcodebuild test` retries automatically and every test does end up passing — confirmed by rerunning several times and inspecting the `.xcresult`). It hit different tests on different runs, including ones proven reliable elsewhere, which rules out an actual logic bug in `WorkoutRepository`/`ActiveWorkoutStore`. If a CI run reports a crash here, rerun before assuming a regression.

## Not yet done (Phase 3, not blocking Phase 2 architecture)

- Real screens — `ContentView.swift` and `WatchContentView.swift` are still placeholders.
- Navigation (`TabView`/`NavigationStack` mapped from the Expo Router tree in `app/(tabs)`).
- Root app composition wiring `SettingsStore`/`WorkoutManagerStore`/`ActiveWorkoutStore`/`ModelContainer` together (mirrors `app/_layout.tsx`).
- `WatchConnectivity` sync between iPhone and Watch.
- `PhotosUI`/`AVFoundation` service wrapper for progress pictures (`ProgressPictureService.ts`).
- Auth/account decision (see plan) — data is local-only now, no code depends on an account existing.
- `.db` import path for existing users' local data into the new SwiftData store.
