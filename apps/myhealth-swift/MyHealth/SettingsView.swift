import MyHealthKit
import SwiftData
import SwiftUI
import UniformTypeIdentifiers

// Ported from apps/myhealth/app/settings/index.tsx — see SWIFT_MIGRATION_PLAN.md
// Phase 3, screen 1. AI model management isn't ported — the on-device
// muscle-group AI reliability work is deferred separately (see memory), and
// that whole services/ai/* surface goes with it. The developer SQLite
// viewer is ported as DeveloperDatabaseView.
struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Environment(SettingsStore.self) private var settings
    @Environment(WorkoutManagerStore.self) private var workoutManager

    @State private var isHealthConnected = false
    @State private var isExporting = false
    @State private var showDeleteConfirm = false
    @State private var exportedFile: ExportedFile?
    @State private var toastMessage: String?

    @State private var isImportPickerPresented = false
    @State private var isImporting = false
    @State private var showImportConfirm = false
    @State private var pendingImportData: Data?
    @State private var pendingImportCounts: (workouts: Int, history: Int, exercises: Int, bodyWeight: Int)?

    private static let privacyPolicyURL = URL(string: "https://mysuites.github.io/my-suites/privacy_policy.html")!
    private static let termsOfServiceURL = URL(string: "https://mysuites.github.io/my-suites/tos.html")!

    private struct ExportedFile: Identifiable {
        let url: URL
        var id: URL { url }
    }

    var body: some View {
        NavigationStack {
            Form {
                appearanceSection
                generalSection
                photosSection
                bodySection
                integrationsSection
                notificationsSection
                workoutsSection
                legalSection
                developerSection
                dataSection
                versionFooter
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "chevron.left")
                    }
                }
            }
            .task { await refreshHealthStatus() }
            .alert("Delete All Data?", isPresented: $showDeleteConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) { deleteAllData() }
            } message: {
                Text("This will permanently delete ALL workouts, logs, and measurements stored on this device. This action cannot be undone.")
            }
            .sheet(item: $exportedFile) { file in
                ActivityShareSheet(activityItems: [file.url])
            }
            .fileImporter(isPresented: $isImportPickerPresented, allowedContentTypes: [.json]) { result in
                handleImportPick(result)
            }
            .alert("Import Data?", isPresented: $showImportConfirm) {
                Button("Cancel", role: .cancel) {
                    pendingImportData = nil
                    pendingImportCounts = nil
                }
                Button("Import") { performImport() }
            } message: {
                if let counts = pendingImportCounts {
                    Text("This will merge \(counts.workouts) saved workout(s), \(counts.history) history log(s), \(counts.exercises) exercise(s), \(counts.bodyWeight) body weight log(s) into your current data. Items with matching IDs will be overwritten.")
                }
            }
            .overlay(alignment: .bottom) {
                if let toastMessage {
                    Text(toastMessage)
                        .font(.footnote)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(.thinMaterial, in: Capsule())
                        .padding(.bottom, 24)
                        .transition(.opacity)
                }
            }
        }
    }

    // MARK: - Appearance

    private var appearanceSection: some View {
        Section("Appearance") {
            Picker("Theme", selection: Binding(get: { settings.appearance }, set: { settings.appearance = $0 })) {
                Text("System").tag(SettingsStore.Appearance.system)
                Text("Light").tag(SettingsStore.Appearance.light)
                Text("Dark").tag(SettingsStore.Appearance.dark)
            }
        }
    }

    // MARK: - General

    private var generalSection: some View {
        Section("General") {
            Toggle("Haptic (Vibration) Feedback", isOn: Binding(
                get: { settings.isHapticsEnabled },
                set: { settings.isHapticsEnabled = $0; toast($0 ? "Haptic feedback enabled" : "Haptic feedback disabled") }
            ))
            Toggle("Allow Sound Effects", isOn: Binding(
                get: { settings.isSoundEnabled },
                set: { settings.isSoundEnabled = $0; toast($0 ? "Sound effects enabled" : "Sound effects disabled") }
            ))
            Toggle("Live Activities", isOn: Binding(
                get: { settings.isLiveActivitiesEnabled },
                set: { settings.isLiveActivitiesEnabled = $0; toast($0 ? "Live Activities enabled" : "Live Activities disabled") }
            ))
            Picker("Units", selection: Binding(
                get: { settings.unitSystem },
                set: { newValue in
                    settings.unitSystem = newValue
                    toast("Weight units set to \(newValue == .imperial ? "lb" : "kg")")
                }
            )) {
                Text("Imperial").tag(SettingsStore.UnitSystem.imperial)
                Text("Metric").tag(SettingsStore.UnitSystem.metric)
            }
            .pickerStyle(.segmented)
        }
    }

    // MARK: - Photos

    private var photosSection: some View {
        Section("Photos") {
            Toggle("Auto-Save Progress Photos to Library", isOn: Binding(
                get: { settings.autoSavePhotosToGallery },
                set: { settings.autoSavePhotosToGallery = $0; toast($0 ? "Auto-save enabled" : "Auto-save disabled") }
            ))
        }
    }

    // MARK: - Body (height)

    private var bodySection: some View {
        Section("Body") {
            HStack {
                Text("Height")
                Spacer()
                if settings.unitSystem == .imperial {
                    HeightImperialField()
                } else {
                    HeightMetricField()
                }
            }
        }
    }

    // MARK: - Integrations

    private var integrationsSection: some View {
        Section("Integrations") {
            Toggle("Apple Health & Watch", isOn: Binding(
                get: { isHealthConnected },
                set: { enabled in
                    if enabled {
                        Task { await connectHealth() }
                    } else {
                        HealthKitService.disableSync()
                        isHealthConnected = HealthKitService.isAuthorized()
                        toast("HealthKit sync stopped")
                    }
                }
            ))
#if os(iOS)
            Toggle("Allow GPS Route Tracking", isOn: Binding(
                get: { settings.gpsTrackingEnabled },
                set: { enabled in
                    if enabled {
                        Task {
                            let granted = await LocationTrackingService.shared.requestPermissions()
                            if granted {
                                settings.gpsTrackingEnabled = true
                                toast("GPS route tracking enabled")
                            } else {
                                toast("Location permission denied")
                            }
                        }
                    } else {
                        settings.gpsTrackingEnabled = false
                        toast("GPS route tracking disabled")
                    }
                }
            ))
#endif
        }
    }

    // MARK: - Notifications

    private var notificationsSection: some View {
        Section("Notifications") {
            Toggle("Push Notifications", isOn: Binding(
                get: { settings.pushNotificationsEnabled },
                set: { enabled in
                    if enabled {
                        Task {
                            let granted = await NotificationService.requestPermissions()
                            settings.pushNotificationsEnabled = granted
                            toast(granted ? "Push notifications enabled" : "Permission denied")
                        }
                    } else {
                        settings.pushNotificationsEnabled = false
                        toast("Push notifications disabled")
                    }
                }
            ))
            Toggle("Daily Workout Reminder", isOn: Binding(
                get: { settings.dailyReminderEnabled },
                set: { enabled in
                    Task {
                        if enabled {
                            let granted = await NotificationService.requestPermissions()
                            settings.dailyReminderEnabled = granted
                            if granted {
                                await NotificationService.scheduleDailyReminder(hour: settings.reminderHour, minute: settings.reminderMinute)
                                toast("Daily reminder enabled")
                            } else {
                                toast("Permission denied")
                            }
                        } else {
                            settings.dailyReminderEnabled = false
                            await NotificationService.cancelAllReminders()
                            toast("Daily reminder disabled")
                        }
                    }
                }
            ))
            .disabled(!settings.pushNotificationsEnabled)

            if settings.dailyReminderEnabled && settings.pushNotificationsEnabled {
                DatePicker(
                    "Reminder Time",
                    selection: Binding(
                        get: { reminderDate },
                        set: { newDate in
                            let calendar = Calendar.current
                            settings.reminderHour = calendar.component(.hour, from: newDate)
                            settings.reminderMinute = calendar.component(.minute, from: newDate)
                            Task {
                                await NotificationService.scheduleDailyReminder(hour: settings.reminderHour, minute: settings.reminderMinute)
                                toast("Reminder rescheduled")
                            }
                        }
                    ),
                    displayedComponents: .hourAndMinute
                )
            }

            Toggle("Long Workout Reminder", isOn: Binding(
                get: { settings.longWorkoutReminderEnabled },
                set: { settings.longWorkoutReminderEnabled = $0; toast($0 ? "Long workout reminder enabled" : "Long workout reminder disabled") }
            ))
            .disabled(!settings.pushNotificationsEnabled)

            if settings.longWorkoutReminderEnabled && settings.pushNotificationsEnabled {
                Stepper(
                    "Duration: \(settings.longWorkoutReminderMinutes) min",
                    value: Binding(get: { settings.longWorkoutReminderMinutes }, set: { settings.longWorkoutReminderMinutes = $0 }),
                    in: 30...180,
                    step: 15
                )
            }
        }
    }

    private var reminderDate: Date {
        var components = Calendar.current.dateComponents([.year, .month, .day], from: .now)
        components.hour = settings.reminderHour
        components.minute = settings.reminderMinute
        return Calendar.current.date(from: components) ?? .now
    }

    // MARK: - Workouts

    private var workoutsSection: some View {
        Section("Workouts") {
            Toggle("Enable RPE Tracking", isOn: Binding(
                get: { settings.isRpeEnabled },
                set: { settings.isRpeEnabled = $0; toast($0 ? "RPE tracking enabled" : "RPE tracking disabled") }
            ))
            Toggle("Progressive Overload Guide", isOn: Binding(
                get: { settings.isProgressiveOverloadEnabled },
                set: { settings.isProgressiveOverloadEnabled = $0; toast($0 ? "Progressive overload guide enabled" : "Progressive overload guide disabled") }
            ))
            if settings.isProgressiveOverloadEnabled {
                Stepper(
                    "Reps before Weight Increase: \(settings.progressiveOverloadRepCeiling)",
                    value: Binding(get: { settings.progressiveOverloadRepCeiling }, set: { settings.progressiveOverloadRepCeiling = $0 }),
                    in: repCeilingMin...repCeilingMax
                )
            }
            Stepper(
                "Weekly Workout Goal: \(settings.weeklyGoal)",
                value: Binding(get: { settings.weeklyGoal }, set: { settings.weeklyGoal = $0 }),
                in: 1...7
            )
        }
    }

    // MARK: - Legal

    private var legalSection: some View {
        Section("Legal") {
            Link("Privacy Policy", destination: Self.privacyPolicyURL)
            Link("Terms of Service", destination: Self.termsOfServiceURL)
        }
    }

    // MARK: - Developer

    private var developerSection: some View {
        Section("Developer") {
            Toggle("Developer Mode", isOn: Binding(
                get: { settings.developerMode },
                set: { settings.developerMode = $0; toast($0 ? "Developer mode enabled" : "Developer mode disabled") }
            ))
            if settings.developerMode {
                NavigationLink("View SQLite Database") {
                    DeveloperDatabaseView()
                }
            }
        }
    }

    // MARK: - Data

    private var dataSection: some View {
        Section("Data") {
            Button {
                exportData()
            } label: {
                Label(isExporting ? "Exporting…" : "Export Data", systemImage: "square.and.arrow.down")
            }
            .disabled(isExporting)

            Button {
                isImportPickerPresented = true
            } label: {
                Label(isImporting ? "Importing…" : "Import Data", systemImage: "square.and.arrow.up")
            }
            .disabled(isImporting)

            Button(role: .destructive) {
                showDeleteConfirm = true
            } label: {
                Label("Delete Data", systemImage: "trash.fill")
            }
        }
    }

    private var versionFooter: some View {
        Section {
            HStack {
                Spacer()
                Text("Version \(Bundle.main.appVersionString)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
            }
            .listRowBackground(Color.clear)
        }
    }

    // MARK: - Actions

    private func refreshHealthStatus() async {
        isHealthConnected = HealthKitService.isAuthorized()
        if isHealthConnected {
            WorkoutHealthKitSyncService.syncWorkoutsFromHealthKit(context: modelContext)
        }
    }

    private func connectHealth() async {
        do {
            try await HealthKitService.requestAuthorization()
            HealthKitService.enableSync()
            isHealthConnected = HealthKitService.isAuthorized()
            await WorkoutHealthKitSyncService.syncWorkoutsFromHealthKit(context: modelContext).value
            toast("HealthKit synced successfully")
        } catch {
            toast("Failed to sync HealthKit")
        }
    }

    private func exportData() {
        isExporting = true
        defer { isExporting = false }
        do {
            let repository = WorkoutRepository(context: modelContext)
            let data = try repository.exportUserData()
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("myhealth_export_\(Int(Date().timeIntervalSince1970))")
                .appendingPathExtension("json")
            try data.write(to: url)
            exportedFile = ExportedFile(url: url)
        } catch {
            toast("Failed to export data")
        }
    }

    private func handleImportPick(_ result: Result<URL, Error>) {
        switch result {
        case .success(let url):
            guard url.startAccessingSecurityScopedResource() else {
                toast("Couldn't access file")
                return
            }
            defer { url.stopAccessingSecurityScopedResource() }
            do {
                let data = try Data(contentsOf: url)
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                // Mirrors WorkoutRepository.importUserData's own fallback:
                // try this app's native export shape first, then the RN
                // app's export shape (same top-level keys, different field
                // names/types - see LegacyJSONImport.swift). Only used here
                // to preview counts before the user confirms; performImport
                // re-decodes the same way when it actually applies the data.
                let counts: (workouts: Int, history: Int, exercises: Int, bodyWeight: Int)
                if let export = try? decoder.decode(WorkoutRepository.UserDataExport.self, from: data) {
                    counts = (export.savedWorkouts.count, export.workoutHistory.count, export.exercises.count, export.bodyWeightHistory.count)
                } else if let legacy = try? JSONDecoder().decode(LegacyJSONImport.Bundle.self, from: data) {
                    counts = (legacy.savedWorkouts.count, legacy.workoutHistory.count, legacy.exercises.count, legacy.bodyWeightHistory.count)
                } else {
                    toast("File is not a valid MyHealth data export")
                    return
                }
                pendingImportData = data
                pendingImportCounts = counts
                showImportConfirm = true
            } catch {
                toast("Failed to read file")
            }
        case .failure:
            toast("Failed to read file")
        }
    }

    private func performImport() {
        guard let data = pendingImportData else { return }
        isImporting = true
        defer {
            isImporting = false
            pendingImportData = nil
            pendingImportCounts = nil
        }
        do {
            let repository = WorkoutRepository(context: modelContext)
            try repository.importUserData(data)
            // WorkoutManagerStore caches routines/workoutHistory itself
            // (loaded once, then kept in sync only through its own
            // save/delete methods) rather than observing SwiftData live via
            // @Query, so a bulk write made directly through the repository
            // like this leaves it stale - Routines/History kept showing the
            // pre-import data until the app was relaunched. DashboardView
            // uses real @Query and doesn't need this.
            workoutManager.loadInitialData()
            toast("Data imported successfully")
        } catch {
            toast("Failed to import data")
        }
    }

    private func deleteAllData() {
        do {
            let repository = WorkoutRepository(context: modelContext)
            try repository.clearAllLocalData(preservingExerciseIds: [])
            HealthKitService.disableSync()
            isHealthConnected = false
            // See the comment in performImport - same staleness issue.
            workoutManager.loadInitialData()
            toast("All data deleted")
        } catch {
            toast("Failed to delete data")
        }
    }

    private func toast(_ message: String) {
        withAnimation { toastMessage = message }
        Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            withAnimation { toastMessage = nil }
        }
    }
}

// MARK: - Height input fields (ported from the RN screen's feet/in and cm TextInputs)

private struct HeightImperialField: View {
    @Environment(SettingsStore.self) private var settings
    @State private var feetText = ""
    @State private var inchesText = ""

    var body: some View {
        HStack(spacing: 6) {
            TextField("–", text: $feetText)
                #if os(iOS)
                .keyboardType(.numberPad)
                #endif
                .multilineTextAlignment(.center)
                .frame(width: 32)
                .onChange(of: feetText) { _, _ in commit() }
            Text("ft").foregroundStyle(.secondary)
            TextField("–", text: $inchesText)
                #if os(iOS)
                .keyboardType(.numberPad)
                #endif
                .multilineTextAlignment(.center)
                .frame(width: 32)
                .onChange(of: inchesText) { _, _ in commit() }
            Text("in").foregroundStyle(.secondary)
        }
        .onAppear(perform: sync)
    }

    private func sync() {
        guard let height = settings.heightInches else { return }
        let (feet, inches) = totalInchesToFeetInches(height)
        feetText = String(feet)
        inchesText = String(inches)
    }

    private func commit() {
        guard let feet = Int(feetText.isEmpty ? "0" : feetText),
              let inches = Int(inchesText.isEmpty ? "0" : inchesText),
              feet > 0 || inches > 0 else { return }
        settings.heightInches = feetInchesToTotalInches(feet, inches)
    }
}

private struct HeightMetricField: View {
    @Environment(SettingsStore.self) private var settings
    @State private var cmText = ""

    var body: some View {
        HStack(spacing: 6) {
            TextField("–", text: $cmText)
                #if os(iOS)
                .keyboardType(.numberPad)
                #endif
                .multilineTextAlignment(.center)
                .frame(width: 44)
                .onChange(of: cmText) { _, _ in commit() }
            Text("cm").foregroundStyle(.secondary)
        }
        .onAppear(perform: sync)
    }

    private func sync() {
        guard let height = settings.heightInches else { return }
        cmText = String(Int(inchesToCm(height).rounded()))
    }

    private func commit() {
        guard let cm = Double(cmText), cm > 0 else { return }
        settings.heightInches = cmToInches(cm)
    }
}

private extension Bundle {
    var appVersionString: String {
        let version = infoDictionary?["CFBundleShortVersionString"] as? String ?? "—"
        let build = infoDictionary?["CFBundleVersion"] as? String
        return build.map { "\(version) (\($0))" } ?? version
    }
}

#if os(iOS)
import UIKit

private struct ActivityShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
#else
private struct ActivityShareSheet: View {
    let activityItems: [Any]
    var body: some View { Text("Sharing not supported on this platform") }
}
#endif

#Preview {
    SettingsView()
        .environment(SettingsStore())
        .modelContainer(for: MyHealthSchema.models, inMemory: true)
}
