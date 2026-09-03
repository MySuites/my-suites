import MyHealthKit
import SwiftUI

// Phase 1 scaffold placeholder — real screens land in Phase 3
// (see SWIFT_MIGRATION_PLAN.md). This exists to prove the app target
// builds, links MyHealthKit, and renders on the simulator.
struct ContentView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.strengthtraining.traditional")
                .font(.system(size: 48))
            Text("MyHealth")
                .font(.title)
            Text("Swift scaffold — Phase 1")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
