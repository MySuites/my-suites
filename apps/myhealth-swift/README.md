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

## Not yet done (Phase 2/3, not blocking scaffold)

- Real screens — `ContentView.swift` and `WatchContentView.swift` are placeholders.
- Navigation (`TabView`/`NavigationStack` mapped from Expo Router tree).
- `WatchConnectivity` sync between iPhone and Watch.
- CoreLocation, UserNotifications, PhotosUI service wrappers.
- Auth/account decision (see plan).
- `.db` import path for existing users' local data into the new SwiftData store.
