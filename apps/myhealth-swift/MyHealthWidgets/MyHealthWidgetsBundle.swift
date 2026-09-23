import SwiftUI
import WidgetKit

// Ported unchanged from apps/myhealth/targets/live-activity/MyHealthWidgetsBundle.swift.
@main
struct MyHealthWidgetsBundle: WidgetBundle {
    var body: some Widget {
        WorkoutLiveActivity()
    }
}
