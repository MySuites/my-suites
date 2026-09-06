import MyHealthKit
import SwiftUI

struct ContentView: View {
    var body: some View {
        AppRootView()
    }
}

#Preview {
    ContentView()
        .environment(SettingsStore())
        .modelContainer(for: MyHealthSchema.models, inMemory: true)
}
