import MyHealthKit
import SwiftData
import SwiftUI

@main
struct MyHealthApp: App {
    @State private var settings = SettingsStore()
    let container: ModelContainer
    let workoutManager: WorkoutManagerStore
    let activeWorkout: ActiveWorkoutStore

    init() {
        let schema = Schema(MyHealthSchema.models)
        let container = try! ModelContainer(for: schema)
        self.container = container
        let repository = WorkoutRepository(context: container.mainContext)
        let settings = SettingsStore()
        LegacyImportService.importIfNeeded(context: container.mainContext)
        try? repository.seedDefaultExercisesIfNeeded(loadDefaultExercises(), version: defaultExerciseDataVersion)
        let workoutManager = WorkoutManagerStore(repository: repository)
        workoutManager.loadInitialData()
        self.workoutManager = workoutManager
        self.activeWorkout = ActiveWorkoutStore(settings: settings, workoutManager: workoutManager, repository: repository)
        self._settings = State(initialValue: settings)
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(settings)
                .environment(workoutManager)
                .environment(activeWorkout)
                .preferredColorScheme(settings.appearance.colorScheme)
        }
        .modelContainer(container)
    }
}
