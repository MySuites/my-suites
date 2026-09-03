import SwiftUI

// Phase 1 scaffold placeholder. Watch app's real surface (active workout +
// quick set logging) is scoped for after the iOS Workouts screen stabilizes
// in Phase 3 — see SWIFT_MIGRATION_PLAN.md.
struct WatchContentView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "figure.strengthtraining.traditional")
            Text("MyHealth")
                .font(.headline)
        }
    }
}

#Preview {
    WatchContentView()
}
