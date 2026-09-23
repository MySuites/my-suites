# MySuite: Repo-Wide Expo → Swift Migration Plan

Repo-level plan covering the whole monorepo. The app-level detail for MyHealth
(domain-logic reference, frozen schema, service audit, App Store Connect
snapshot) lives in [apps/myhealth/SWIFT_MIGRATION_PLAN.md](apps/myhealth/SWIFT_MIGRATION_PLAN.md)
and is still the ground truth for that app — this document does not restate it.

Branch: `swift-migration-repo` (branched from `swift-rewrite`, which carries the
completed MyHealth Phases 1–3). `master` keeps shipping the RN apps untouched
until Phase 6.

---

## 1. Repository scope (as audited)

pnpm workspace (`apps/*`, `packages/*`) + Turborepo, Expo SDK 54 / React Native 0.81,
NativeWind 4, TypeScript 5.9.

| Path | What it is | Size | Migration verdict |
|---|---|---|---|
| `apps/myhealth` | Real shipping app (TestFlight, `com.mysuite.myhealth`) | ~32k LOC TS/TSX, 148 source + 21 test files | **Port** — in progress |
| `apps/myhealth-swift` | Native Swift/SwiftUI rewrite target | ~8.2k LOC Swift, 3 targets + `MyHealthKit` package | **Destination** |
| `apps/myfinancials` | Expo Router template, name `mycfo` | ~870 LOC, boilerplate only | **Rewrite from scratch** — nothing worth porting |
| `packages/ui` | 13 NativeWind RN components | small | **Replace** with SwiftUI design system |
| `packages/auth` | Single-file auth shim | 1 file | **Likely delete** — data is local-only |
| `scripts/`, `turbo.json`, `pnpm-*`, `tailwind.config.js`, `postcss.config.js` | JS toolchain | — | **Delete at Phase 6** |

Non-app assets that must survive: `apps/myhealth/assets/` (icons, sounds,
`muscular_system.png`, `default-exercises.ts`, `muscle-groups.ts`),
`apps/myhealth/public/{tos,privacy_policy}.html`, `.github/` CI.

---

## 2. Target end state

```
MySuite/
  MyHealth/          Swift package + Xcode project (iOS, watchOS, widget ext)
  MyFinancials/      Swift package + Xcode project (iOS)
  SuiteUI/           shared SwiftUI design system package
  SuiteKit/          shared cross-app primitives (units, formatting, theming)
```

No Node, no pnpm, no Metro, no EAS. Builds are `xcodegen generate` + `xcodebuild`.

---

## 3. Phase status and remaining work

### Phases 1–3 (MyHealth) — done on `swift-rewrite`

Scaffold, architecture (SwiftData, `@Observable` stores, HealthKit / notifications /
location / Live Activity services), and the screen-by-screen SwiftUI port. See
`apps/myhealth-swift/README.md` for per-phase verification notes.

### Phase 3.5 — MyHealth parity gap closure (next)

Audited gaps between `apps/myhealth` and `apps/myhealth-swift`. Ordered by
user-visible impact:

1. **Dashboard widgets** — `MuscleHeatmap`, `StrengthRankCard`,
   `WeeklyCompletionRing`, `WidgetGrid`, `MetricWidgetCard`, `MetricDetailModal`,
   `utils/widgetOrder.ts`, `hooks/dashboard/useMuscleVolumes.ts`.
   Heatmap needs `muscular_system.png` + `components/dashboard/muscleData.ts` regions.
2. **Charts** — `ExerciseChart`, `TimeSeriesChart`, `WorkoutOverviewChart`,
   `VolumeTrendCard`, `useWorkoutVolumeTrend`. Target: Swift Charts, no third-party dep.
3. **Body weight** — `BodyWeightService`, `BodyWeightCard`, `WeightLogModal`,
   `useBodyWeightTrend`, `useLatestBodyWeight`. Model exists
   (`BodyMeasurementRecord`); service + UI do not.
4. **GPS / outdoor workouts UI** — `LocationTrackingService.swift` exists, but
   `LiveWorkoutMap`, `WorkoutRouteMap`, `RouteSnapshotMap`, `OutdoorRunPanel`
   have no Swift counterpart. Target: MapKit + `MKPolyline`, plus route
   snapshot rendering for history rows.
5. **HealthKit sync parity** — `WorkoutHealthKitSyncService.ts` is only partly
   ported (activity-type labeling, per-workout HR statistics, import dedupe).
   Its RN test (`__tests__/WorkoutHealthKitSyncService.test.ts`) translates
   directly to XCTest.
6. **Exercise detail depth** — `VariationTree`, `VariationDetailModal`,
   `InstructionsList`, `ExerciseAdvancedSection`, `useExerciseSections`.
7. **Units & formatting** — `utils/units.ts`, `height.ts`, `formatting.ts`,
   `UnitPreferenceProvider`. Partly absorbed by `SettingsStore`; finish and
   port `__tests__/formatting.test.ts` to XCTest.
8. **Export** — `exportUserData.ts`, `exportWorkoutHistory.ts` →
   `ShareLink` / `FileDocument`. Covered by `__tests__/delete-data.test.ts`.
9. **Legacy import wiring** — `LegacyImportService.swift` exists and is tested,
   but first-launch detection of the existing on-device `myhealth.db` is not
   wired into app startup. This is the one item with data-loss risk for
   existing TestFlight users — do it before any public build.
10. **Watch app** — `WatchContentView.swift` is a placeholder. Scope: active
    workout view + quick set logging + `WCSession` state sync with the phone.
    Optionally on-device `HKWorkoutSession`.
11. **AI stack** — 13 files under `services/ai/`, `useAIModelManager`,
    `app/settings/ai-models.tsx`, `analyzeProgressPicture.ts`.
    **Deferred, not blocking.** On-device VLM JSON output was already found
    unreliable in the RN app. Recommendation: ship Swift parity without it and
    revisit as a native `FoundationModels` / Core ML feature afterwards.

Not a gap: Sleep, Mind, and Nutrition are placeholder screens in **both** apps.

Per-item exit criteria unchanged from the app plan: build clean, `MyHealthKit`
tests green, verified in Simulator against the RN app, shipped as an internal
TestFlight build before the next item starts.

### Phase 4 — Shared Swift packages

Extract from the MyHealth port once it is parity-complete (extract after, not
before — premature sharing is what makes both apps awkward):

- **`SuiteUI`** — SwiftUI replacement for `packages/ui`: `RaisedCard`,
  `HollowedCard`, `ActionCard`, `Toast`, `Skeleton`, `IconSymbol`, theme
  tokens from `ThemeContext.tsx` + `tailwind.config.js`.
- **`SuiteKit`** — units, height, formatting, color-scheme handling.
- `packages/auth` is **not** extracted. Data is local-only; decide explicitly
  whether an account layer survives at all before writing any Swift for it.

### Phase 5 — MyFinancials

`apps/myfinancials` is unmodified Expo Router template output (Tab One / Tab Two,
a demo NativeWind button, a theme toggle). There is no product logic to port.

Build `MyFinancials/` as a fresh SwiftUI app on `SuiteUI` + `SuiteKit`. Treat
requirements as new work, not migration. Bundle ID and App Store Connect record
need to be created — unlike MyHealth, nothing exists yet.

### Phase 6 — Teardown and cutover

Only after MyHealth Swift has been TestFlight-verified at parity:

1. Merge to `master`, deleting `apps/myhealth`, `apps/myfinancials`,
   `packages/`, `node_modules`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`,
   `turbo.json`, `tailwind.config.js`, `postcss.config.js`, root
   `package.json`/`tsconfig.json`, and `scripts/`.
2. Move `apps/myhealth-swift` → `MyHealth/`.
3. Rewrite root `README.md` and `.github/` workflows for `xcodebuild`.
4. Preserve before deleting: assets listed in §1, `migrations/local_schema.md`,
   both `SWIFT_MIGRATION_PLAN.md` files (move to `docs/`).

The RN tree stays reachable in git history; nothing is lost by deleting it once
`master` has the Swift app.

---

## 4. Risks

- **Data migration is the only irreversible step.** Existing TestFlight users
  have a populated `myhealth.db`. Phase 3.5 item 9 must be verified against a
  real device backup before a build that could overwrite it ships.
- **Schema ground truth** is `apps/myhealth/utils/db/database.ts`, not
  `powersync/AppSchema.ts` or `migrations/local_schema.md` — both were found
  stale during the app-level audit.
- **Known environment flake**: Xcode 26.3 / iOS 26.2 Simulator intermittently
  crashes SwiftData during full test runs and passes on retry. Rerun before
  treating it as a regression.
- **Scope creep via AI features.** Item 11 is the largest surface with the least
  proven value. Keeping it out of the parity definition is deliberate.
