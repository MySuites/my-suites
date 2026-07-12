import ActivityKit
import SwiftUI
import WidgetKit

private func frozenElapsedText(_ context: ActivityViewContext<WorkoutActivityAttributes>) -> String {
    let elapsed = max(0, Date().timeIntervalSince(context.state.startedAt))
    let totalSeconds = Int(elapsed)
    let hours = totalSeconds / 3600
    let minutes = (totalSeconds % 3600) / 60
    let seconds = totalSeconds % 60
    if hours > 0 {
        return String(format: "%d:%02d:%02d", hours, minutes, seconds)
    }
    return String(format: "%d:%02d", minutes, seconds)
}

@ViewBuilder
private func ElapsedTimeText(_ context: ActivityViewContext<WorkoutActivityAttributes>) -> some View {
    if context.state.isPaused {
        Text(frozenElapsedText(context))
    } else {
        Text(timerInterval: context.state.startedAt...Date.distantFuture, countsDown: false)
    }
}

@ViewBuilder
private func RestCountdownText(_ context: ActivityViewContext<WorkoutActivityAttributes>) -> some View {
    if context.state.isResting, let restEndsAt = context.state.restEndsAt {
        Text(timerInterval: Date()...restEndsAt, countsDown: true)
    }
}

struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
            // Lock Screen / Banner UI
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(context.state.workoutName)
                        .font(.headline)
                    Spacer()
                    ElapsedTimeText(context)
                        .font(.headline.monospacedDigit())
                }
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.state.exerciseName)
                            .font(.subheadline)
                        Text(context.state.setProgress)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    if context.state.isResting {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("Rest")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            RestCountdownText(context)
                                .font(.subheadline.monospacedDigit())
                        }
                    }
                }
            }
            .padding()
            .activityBackgroundTint(Color.black.opacity(0.8))
            .activitySystemActionForegroundColor(Color.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.state.exerciseName)
                            .font(.subheadline)
                        Text(context.state.setProgress)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.isResting {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("Rest")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            RestCountdownText(context)
                                .font(.subheadline.monospacedDigit())
                        }
                    } else {
                        ElapsedTimeText(context)
                            .font(.subheadline.monospacedDigit())
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.workoutName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            } compactLeading: {
                Image(systemName: "figure.strengthtraining.traditional")
            } compactTrailing: {
                if context.state.isResting {
                    RestCountdownText(context)
                        .font(.caption2.monospacedDigit())
                } else {
                    ElapsedTimeText(context)
                        .font(.caption2.monospacedDigit())
                }
            } minimal: {
                Image(systemName: "figure.strengthtraining.traditional")
            }
        }
    }
}
