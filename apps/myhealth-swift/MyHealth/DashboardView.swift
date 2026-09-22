import Charts
import MyHealthKit
import SwiftData
import SwiftUI

// Ported from apps/myhealth/app/(tabs)/index.tsx (the "Profile"/Dashboard
// tab). Scoped down from the RN original for this first pass:
// - Fixed widget order, no drag-to-reorder edit mode (WidgetGrid's DnD).
// - MuscleHeatmap's anatomical SVG body diagram is replaced with a plain
//   top-muscle-groups volume list — porting the SVG art asset is a separate,
//   larger effort than the rest of this screen.
// Body weight, strength rank, and volume trend keep their RN behavior,
// backed by Swift Charts instead of the RN custom chart components.
struct DashboardView: View {
    @Environment(SettingsStore.self) private var settings
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \WorkoutLogRecord.workoutDate, order: .reverse) private var history: [WorkoutLogRecord]
    @Query private var exercises: [ExerciseRecord]
    @Query(sort: \BodyMeasurementRecord.date) private var bodyWeights: [BodyMeasurementRecord]

    @Binding var scrollToTopTick: Int

    @State private var showWeightLog = false

    var body: some View {
        NavigationStack {
                VStack(spacing: 0) {
                    ZStack {
                        Text("Dashboard")
                            .font(.largeTitle.weight(.bold))
                            .frame(maxWidth: .infinity, alignment: .center)
                        HStack {
                            SidebarToggleButton()
                            Spacer()
                        }
                    }
                        .padding(.horizontal, 16)
                        .padding(.top, 16)
                        .padding(.bottom, 8)
                        .background(Color(.systemBackground))

                    ScrollViewReader { proxy in
                        ScrollView {
                            Color.clear.frame(height: 1).id("top")
                            VStack(alignment: .leading, spacing: 16) {
                                WeeklyCompletionCard(completed: weeklyCompletedCount, goal: settings.weeklyGoal)
                                StrengthRankCard(history: history, bodyweight: latestBodyWeight, heightInches: settings.heightInches)
                                BodyWeightCard(measurements: bodyWeights, unitSystem: settings.unitSystem) {
                                    showWeightLog = true
                                }
                                VolumeTrendCard(history: history)
                                MuscleVolumeCard(history: history, exercises: exercises)
                            }
                            .padding(16)
                        }
                        .onChange(of: scrollToTopTick) {
                            withAnimation { proxy.scrollTo("top", anchor: .top) }
                        }
                    }
                }
                .background(Color(.systemBackground))
            .background(Color(.systemBackground))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showWeightLog) {
                WeightLogSheet(unitSystem: settings.unitSystem) { weightLb, date in
                    let repository = WorkoutRepository(context: modelContext)
                    try? repository.saveBodyWeight(weightLb, date: date)
                }
            }
        }
    }

    private var weeklyCompletedCount: Int {
        let calendar = Calendar.current
        guard let weekInterval = calendar.dateInterval(of: .weekOfYear, for: .now) else { return 0 }
        return history.filter { weekInterval.contains($0.workoutDate) }.count
    }

    private var latestBodyWeight: Double? {
        bodyWeights.last?.weight
    }
}

// MARK: - Weekly completion ring

private struct WeeklyCompletionCard: View {
    let completed: Int
    let goal: Int

    var body: some View {
        DashboardCard(title: "This Week") {
            HStack(spacing: 20) {
                ZStack {
                    Circle().stroke(.quaternary, lineWidth: 10)
                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(.tint, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    Text("\(completed)/\(goal)")
                        .font(.headline)
                }
                .frame(width: 72, height: 72)

                VStack(alignment: .leading, spacing: 4) {
                    Text("\(completed) of \(goal) workouts").font(.subheadline.weight(.semibold))
                    Text(completed >= goal ? "Weekly goal reached!" : "Keep going to hit your goal.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
        }
    }

    private var progress: Double {
        guard goal > 0 else { return 0 }
        return min(1, Double(completed) / Double(goal))
    }
}

// MARK: - Strength rank

private struct StrengthRankCard: View {
    let history: [WorkoutLogRecord]
    let bodyweight: Double?
    let heightInches: Double?

    var body: some View {
        DashboardCard(title: "Strength Rank") {
            if let bodyweight {
                VStack(spacing: 12) {
                    ForEach(rankedLifts, id: \.exerciseId) { lift in
                        let best = bestE1RM(for: lift.exerciseId)
                        HStack {
                            Text(lift.name).font(.subheadline.weight(.medium))
                            Spacer()
                            if let best, let rank = strengthRank(exerciseId: lift.exerciseId, estimatedOneRepMax: best, bodyweight: bodyweight, sex: .male, heightInches: heightInches) {
                                Text(rank.tier?.rawValue ?? "Below Beginner")
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(.secondary)
                            } else {
                                Text("No data").font(.caption).foregroundStyle(.tertiary)
                            }
                        }
                    }
                }
            } else {
                Text("Log your bodyweight to see strength rankings.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func bestE1RM(for exerciseId: String) -> Double? {
        history
            .flatMap(\.sets)
            .filter { $0.exerciseId == exerciseId }
            .compactMap { set -> Double? in
                guard let weight = set.weight, let reps = set.reps else { return nil }
                return estimatedOneRepMax(weight: weight, reps: reps)
            }
            .max()
    }
}

// MARK: - Body weight

private struct BodyWeightCard: View {
    let measurements: [BodyMeasurementRecord]
    let unitSystem: SettingsStore.UnitSystem
    let onLogWeight: () -> Void

    @State private var showDetail = false

    var body: some View {
        DashboardCard(title: "Body Weight") {
            Button {
                if !measurements.isEmpty { showDetail = true }
            } label: {
                HStack {
                    if let latest = measurements.last {
                        Text(displayWeight(latest.weight))
                            .font(.title2.weight(.bold))
                    } else {
                        Text("No entries yet").foregroundStyle(.secondary)
                    }
                    Spacer()
                }
            }
            .buttonStyle(.plain)

            if measurements.count > 1 {
                Chart(measurements) { measurement in
                    LineMark(
                        x: .value("Date", measurement.date),
                        y: .value("Weight", displayValue(measurement.weight))
                    )
                    .interpolationMethod(.catmullRom)
                }
                .frame(height: 120)
                .padding(.top, 8)
                .allowsHitTesting(false)
            }

            Button("Log Weight", action: onLogWeight)
                .buttonStyle(.bordered)
        }
        .sheet(isPresented: $showDetail) {
            MetricDetailSheet(
                icon: "scalemass.fill",
                title: "Body Weight",
                color: .blue
            ) { range in
                let filtered = filteredMeasurements(range: range)
                return AnyView(
                    VStack(alignment: .leading, spacing: 12) {
                        Text(filtered.last.map { displayWeight($0.weight) } ?? "—")
                            .font(.system(size: 32, weight: .bold))
                        if filtered.count > 1 {
                            Chart(filtered) { measurement in
                                LineMark(
                                    x: .value("Date", measurement.date),
                                    y: .value("Weight", displayValue(measurement.weight))
                                )
                                .interpolationMethod(.catmullRom)
                            }
                            .frame(height: 200)
                        } else {
                            Text("Not enough data for this period.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, minHeight: 120)
                        }
                    }
                )
            }
        }
    }

    private func filteredMeasurements(range: MetricDateRange) -> [BodyMeasurementRecord] {
        guard let cutoff = range.cutoffDate else { return measurements }
        return measurements.filter { $0.date >= cutoff }
    }

    private func displayValue(_ lb: Double) -> Double {
        unitSystem == .imperial ? lb : lb * 0.453592
    }

    private func displayWeight(_ lb: Double) -> String {
        let value = displayValue(lb)
        return String(format: "%.1f %@", value, unitSystem == .imperial ? "lb" : "kg")
    }
}

// MARK: - Volume trend

private struct VolumeTrendCard: View {
    let history: [WorkoutLogRecord]

    @State private var showDetail = false

    private struct WeeklyVolume: Identifiable {
        var id: Date { weekStart }
        var weekStart: Date
        var volume: Double
    }

    var body: some View {
        DashboardCard(title: "Training Volume") {
            let data = weeklyVolumes(since: nil).suffix(8)
            if data.isEmpty {
                Text("Log a workout to see your volume trend.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Button {
                    showDetail = true
                } label: {
                    Chart(data) { entry in
                        BarMark(
                            x: .value("Week", entry.weekStart, unit: .weekOfYear),
                            y: .value("Volume (lb)", entry.volume)
                        )
                    }
                    .frame(height: 140)
                }
                .buttonStyle(.plain)
            }
        }
        .sheet(isPresented: $showDetail) {
            MetricDetailSheet(
                icon: "chart.bar.fill",
                title: "Training Volume",
                color: .orange
            ) { range in
                let filtered = weeklyVolumes(since: range.cutoffDate)
                return AnyView(
                    VStack(alignment: .leading, spacing: 12) {
                        Text(filtered.last.map { Int($0.volume).formatted() } ?? "—")
                            .font(.system(size: 32, weight: .bold))
                        if filtered.isEmpty {
                            Text("Not enough data for this period.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, minHeight: 120)
                        } else {
                            Chart(filtered) { entry in
                                BarMark(
                                    x: .value("Week", entry.weekStart, unit: .weekOfYear),
                                    y: .value("Volume (lb)", entry.volume)
                                )
                            }
                            .frame(height: 200)
                        }
                    }
                )
            }
        }
    }

    private func weeklyVolumes(since cutoff: Date?) -> [WeeklyVolume] {
        let calendar = Calendar.current
        var totals: [Date: Double] = [:]
        for log in history {
            if let cutoff, log.workoutDate < cutoff { continue }
            guard let weekStart = calendar.dateInterval(of: .weekOfYear, for: log.workoutDate)?.start else { continue }
            let logVolume = log.sets.reduce(0.0) { sum, set in
                sum + (set.weight ?? 0) * Double(set.reps ?? 0)
            }
            totals[weekStart, default: 0] += logVolume
        }
        return totals
            .map { WeeklyVolume(weekStart: $0.key, volume: $0.value) }
            .sorted { $0.weekStart < $1.weekStart }
    }
}

// MARK: - Muscle volume (stand-in for the RN MuscleHeatmap SVG diagram)

private struct MuscleVolumeCard: View {
    let history: [WorkoutLogRecord]
    let exercises: [ExerciseRecord]

    private struct MuscleVolume: Identifiable {
        var id: String { muscle }
        var muscle: String
        var volume: Double
    }

    var body: some View {
        DashboardCard(title: "Muscle Volume") {
            let data = topMuscles
            if data.isEmpty {
                Text("Log a workout to see muscle volume.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(data) { entry in
                    HStack {
                        Text(entry.muscle.capitalized).font(.caption)
                        Spacer()
                        Text(Int(entry.volume).formatted()).font(.caption).foregroundStyle(.secondary)
                    }
                    GeometryReader { proxy in
                        Capsule().fill(.tint)
                            .frame(width: proxy.size.width * (entry.volume / (data.first?.volume ?? 1)), height: 6)
                    }
                    .frame(height: 6)
                }
            }
        }
    }

    private var topMuscles: [MuscleVolume] {
        let exercisesById = Dictionary(uniqueKeysWithValues: exercises.map { ($0.id, $0) })
        var totals: [String: Double] = [:]
        for set in history.flatMap(\.sets) {
            guard let exercise = exercisesById[set.exerciseId] else { continue }
            let volume = (set.weight ?? 0) * Double(set.reps ?? 0)
            guard volume > 0 else { continue }
            for muscle in exercise.muscleGroups {
                totals[muscle, default: 0] += volume
            }
        }
        return totals
            .map { MuscleVolume(muscle: $0.key, volume: $0.value) }
            .sorted { $0.volume > $1.volume }
            .prefix(5)
            .map { $0 }
    }
}

// MARK: - Metric detail sheet (ported from MetricDetailModal.tsx)

// A shared M/3M/6M/Y range control + expanded chart, opened by tapping a
// dashboard card. RN's version is a generic modal fed via props/children;
// here `content` gets rebuilt per range selection and returns its own
// primary-value/chart body since each metric's aggregation differs too much
// to share beyond the chrome (title/icon/range picker).
private enum MetricDateRange: String, CaseIterable, Identifiable {
    case month = "M", threeMonth = "3M", sixMonth = "6M", year = "Y"
    var id: String { rawValue }

    var cutoffDate: Date? {
        let days: Int
        switch self {
        case .month: days = 30
        case .threeMonth: days = 90
        case .sixMonth: days = 182
        case .year: days = 365
        }
        return Calendar.current.date(byAdding: .day, value: -days, to: .now)
    }
}

private struct MetricDetailSheet: View {
    @Environment(\.dismiss) private var dismiss
    let icon: String
    let title: String
    var color: Color = .accentColor
    let content: (MetricDateRange) -> AnyView

    @State private var selectedRange: MetricDateRange = .sixMonth

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Picker("Range", selection: $selectedRange) {
                        ForEach(MetricDateRange.allCases) { range in
                            Text(range.rawValue).tag(range)
                        }
                    }
                    .pickerStyle(.segmented)

                    content(selectedRange)
                }
                .padding()
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Label(title, systemImage: icon)
                        .foregroundStyle(color)
                        .font(.headline)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}

// MARK: - Log weight sheet

private struct WeightLogSheet: View {
    @Environment(\.dismiss) private var dismiss
    let unitSystem: SettingsStore.UnitSystem
    let onSave: (_ weightLb: Double, _ date: Date) -> Void

    @State private var weightText = ""
    @State private var date = Date.now

    var body: some View {
        NavigationStack {
            Form {
                HStack {
                    TextField("Weight", text: $weightText)
                        #if os(iOS)
                        .keyboardType(.decimalPad)
                        #endif
                    Text(unitSystem == .imperial ? "lb" : "kg")
                }
                DatePicker("Date", selection: $date, in: ...Date.now, displayedComponents: .date)
            }
            .navigationTitle("Log Weight")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        guard let value = Double(weightText), value > 0 else { return }
                        let lb = unitSystem == .imperial ? value : value / 0.453592
                        onSave(lb, date)
                        dismiss()
                    }
                    .disabled(Double(weightText) == nil)
                }
            }
        }
    }
}

// MARK: - Shared card container

private struct DashboardCard<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
            content
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.background.secondary, in: RoundedRectangle(cornerRadius: 16))
    }
}

#Preview {
    DashboardView(scrollToTopTick: .constant(0))
        .environment(SettingsStore())
        .environment(NavSelection())
        .modelContainer(for: MyHealthSchema.models, inMemory: true)
}
