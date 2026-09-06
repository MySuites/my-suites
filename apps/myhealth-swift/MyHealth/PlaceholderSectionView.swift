import SwiftUI

// Ported from apps/myhealth/components/ui/PlaceholderScreen.tsx — shared
// "To be implemented" body for the not-yet-built Sleep/Mind/Nutrition
// sections. Each keeps its own thin wrapper file (matching the RN
// sleep.tsx/mind.tsx/nutrition.tsx split) so it can grow its own screen
// later without touching the others.
struct PlaceholderSectionView: View {
    let title: String

    var body: some View {
        NavigationStack {
            Text("To be implemented")
                .font(.headline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .navigationTitle(title)
        }
    }
}

struct SleepView: View {
    var body: some View { PlaceholderSectionView(title: "Sleep") }
}

struct MindView: View {
    var body: some View { PlaceholderSectionView(title: "Mind") }
}

struct NutritionView: View {
    var body: some View { PlaceholderSectionView(title: "Nutrition") }
}
