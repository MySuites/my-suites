import Charts
import MyHealthKit
import SwiftUI

// The read-only "isLogView" mode of apps/myhealth/app/workouts/details.tsx —
// viewing a completed workout from History. The editable-template mode is
// RoutineEditorView. WorkoutOverviewChart is ported as the "Performance"
// section below: not a chart of this one log's own sets, but this
// workout's total-volume trend across every past log sharing its name.
struct WorkoutLogDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(WorkoutManagerStore.self) private var workoutManager
    let log: WorkoutLogRecord

    @State private var showDeleteConfirm = false
    @State private var expandedImageIndex: Int?
    @State private var showFullRoute = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    LabeledContent("Date", value: log.workoutDate.formatted(date: .abbreviated, time: .omitted))
                    LabeledContent("Duration", value: formatSeconds(log.duration))
                    if let distance = log.distance {
                        LabeledContent("Distance", value: String(format: "%.2f mi", distance / 1609.34))
                    }
                    if let calories = log.calories {
                        LabeledContent("Calories", value: "\(Int(calories)) kcal")
                    }
                }

                Section("Performance") {
                    WorkoutOverviewChart(workoutName: log.workoutName, history: workoutManager.workoutHistory)
                }

                if let route = log.route, route.count >= 2 {
                    Section("Route") {
                        Button {
                            showFullRoute = true
                        } label: {
                            RouteSnapshotMapView(routePoints: route)
                                .frame(height: 140)
                        }
                        .buttonStyle(.plain)
                    }
                }

                if let note = log.note, !note.isEmpty {
                    Section("Notes") { Text(note) }
                }

                if !log.imageUrls.isEmpty {
                    Section("Progress Photos") {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(Array(log.imageUrls.enumerated()), id: \.offset) { index, uri in
                                    Button {
                                        expandedImageIndex = index
                                    } label: {
                                        LogImage(uri: uri)
                                            .frame(width: 90, height: 90)
                                            .clipShape(RoundedRectangle(cornerRadius: 10))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                }

                Section("Exercises") {
                    ForEach(groupedSets, id: \.exerciseName) { group in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(group.exerciseName).font(.subheadline.weight(.semibold))
                            ForEach(Array(group.sets.enumerated()), id: \.offset) { index, set in
                                Text("Set \(index + 1): \(setSummary(set))")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
            .navigationTitle(log.workoutName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
                ToolbarItem(placement: .destructiveAction) {
                    Button(role: .destructive) { showDeleteConfirm = true } label: {
                        Image(systemName: "trash.fill")
                    }
                }
            }
            .alert("Delete Workout Log", isPresented: $showDeleteConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    workoutManager.deleteWorkoutLog(id: log.id)
                    dismiss()
                }
            } message: {
                Text("Are you sure you want to delete this workout from your history? This action cannot be undone.")
            }
            .fullScreenCover(item: Binding(
                get: { expandedImageIndex.map { ImageIndex(index: $0) } },
                set: { expandedImageIndex = $0?.index }
            )) { target in
                FullScreenImageViewer(urls: log.imageUrls, startIndex: target.index)
            }
            .fullScreenCover(isPresented: $showFullRoute) {
                ZStack(alignment: .topLeading) {
                    RouteSnapshotMapView(routePoints: log.route ?? [], interactive: true)
                        .ignoresSafeArea()
                    Button {
                        showFullRoute = false
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title)
                            .foregroundStyle(.white, .black.opacity(0.4))
                    }
                    .padding()
                }
            }
        }
    }

    private struct SetGroup {
        var exerciseName: String
        var sets: [SetLogRecord]
    }

    private var groupedSets: [SetGroup] {
        var order: [String] = []
        var byName: [String: [SetLogRecord]] = [:]
        for set in log.sets.sorted(by: { $0.createdAt < $1.createdAt }) {
            if byName[set.exerciseName] == nil { order.append(set.exerciseName) }
            byName[set.exerciseName, default: []].append(set)
        }
        return order.map { SetGroup(exerciseName: $0, sets: byName[$0] ?? []) }
    }

    private func setSummary(_ set: SetLogRecord) -> String {
        var parts: [String] = []
        if let weight = set.weight { parts.append("\(Int(weight)) lb") }
        if let reps = set.reps { parts.append("\(reps) reps") }
        if let duration = set.duration { parts.append("\(duration)s") }
        if let distance = set.distance { parts.append(String(format: "%.1f mi", distance)) }
        return parts.isEmpty ? "—" : parts.joined(separator: " · ")
    }
}

private struct LogImage: View {
    let uri: String
    var body: some View {
        if let url = URL(string: uri), let data = try? Data(contentsOf: url), let uiImage = UIImage(data: data) {
            Image(uiImage: uiImage).resizable()
        } else {
            Rectangle().fill(.quaternary).overlay(Image(systemName: "photo"))
        }
    }
}

private struct ImageIndex: Identifiable {
    let index: Int
    var id: Int { index }
}

// Full-screen tap-to-expand viewer for a log's progress photos — swipeable
// via TabView(.page) rather than RN's own pager, pinch-to-zoom per page via
// MagnificationGesture since SwiftUI's Image has no native zoom.
private struct FullScreenImageViewer: View {
    @Environment(\.dismiss) private var dismiss
    let urls: [String]
    let startIndex: Int

    @State private var currentIndex: Int

    init(urls: [String], startIndex: Int) {
        self.urls = urls
        self.startIndex = startIndex
        _currentIndex = State(initialValue: startIndex)
    }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()

            TabView(selection: $currentIndex) {
                ForEach(Array(urls.enumerated()), id: \.offset) { index, uri in
                    ZoomableImage(uri: uri)
                        .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: urls.count > 1 ? .always : .never))

            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.title)
                    .foregroundStyle(.white, .black.opacity(0.4))
            }
            .padding()
        }
    }
}

private struct ZoomableImage: View {
    let uri: String

    @State private var scale: CGFloat = 1
    @State private var lastScale: CGFloat = 1

    var body: some View {
        LogImage(uri: uri)
            .aspectRatio(contentMode: .fit)
            .scaleEffect(scale)
            .gesture(
                MagnificationGesture()
                    .onChanged { value in
                        scale = max(1, min(4, lastScale * value))
                    }
                    .onEnded { _ in
                        lastScale = scale
                    }
            )
            .onTapGesture(count: 2) {
                withAnimation {
                    scale = scale > 1 ? 1 : 2
                    lastScale = scale
                }
            }
    }
}

// Ported from apps/myhealth/components/workouts/WorkoutOverviewChart.tsx —
// total training volume (effective weight × reps, summed per session) for
// every past log sharing this workout's name, range-filtered by the M/3M/6M/Y
// control. RN aggregates via a shared TimeSeriesChart; here it's a plain
// Swift Charts BarMark, one bar per session date.
private struct WorkoutOverviewChart: View {
    let workoutName: String
    let history: [WorkoutLogRecord]

    private enum Range: String, CaseIterable, Identifiable {
        case month = "M", threeMonth = "3M", sixMonth = "6M", year = "Y"
        var id: String { rawValue }
        var days: Int {
            switch self {
            case .month: return 30
            case .threeMonth: return 90
            case .sixMonth: return 182
            case .year: return 365
            }
        }
    }

    @State private var selectedRange: Range = .sixMonth

    private struct Point: Identifiable {
        var date: Date
        var volume: Double
        var id: Date { date }
    }

    private var points: [Point] {
        guard let cutoff = Calendar.current.date(byAdding: .day, value: -selectedRange.days, to: .now) else { return [] }
        return history
            .filter { $0.workoutName == workoutName && $0.workoutDate >= cutoff }
            .map { log in
                let volume = log.sets.reduce(0.0) { sum, set in
                    sum + effectiveSetWeight(SetLog(bodyweight: set.bodyweight, weight: set.weight)) * Double(set.reps ?? 0)
                }
                return Point(date: log.workoutDate, volume: volume)
            }
            .sorted { $0.date < $1.date }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Picker("Range", selection: $selectedRange) {
                ForEach(Range.allCases) { range in
                    Text(range.rawValue).tag(range)
                }
            }
            .pickerStyle(.segmented)

            if points.isEmpty {
                Text("No data for this period")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 120)
            } else {
                let latest = points.last?.volume ?? 0
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(latest, format: .number.precision(.fractionLength(0)))
                        .font(.title2.weight(.bold))
                    Text("lb")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Chart(points) { point in
                    BarMark(
                        x: .value("Date", point.date, unit: .day),
                        y: .value("Volume (lb)", point.volume)
                    )
                }
                .frame(height: 150)
            }
        }
        .padding(.vertical, 4)
    }
}
