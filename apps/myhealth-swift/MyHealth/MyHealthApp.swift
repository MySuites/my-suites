import MyHealthKit
import SwiftData
import SwiftUI

@main
struct MyHealthApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: MyHealthSchema.models)
    }
}
