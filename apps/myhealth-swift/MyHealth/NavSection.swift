import Observation
import SwiftUI

// Ported from apps/myhealth/utils/navTabs.ts — the 5 main app sections, shared
// between the top nav switcher (switches between them) and each section's
// burger menu. "Workout" covers workout/exercises/saved/history as sub-
// destinations reached from within WorkoutsHomeView, matching the RN
// NAV_TABS `match` grouping, rather than each getting its own switcher slot.
enum NavSection: String, CaseIterable, Identifiable {
    case sleep, mind, profile, workout, nutrition
    var id: String { rawValue }

    var label: String {
        switch self {
        case .sleep: return "Sleep"
        case .mind: return "Mind"
        case .profile: return "Profile"
        case .workout: return "Workout"
        case .nutrition: return "Nutrition"
        }
    }

    var icon: String {
        switch self {
        case .sleep: return "moon.zzz.fill"
        case .mind: return "brain.head.profile"
        case .profile: return "person.fill"
        case .workout: return "dumbbell.fill"
        case .nutrition: return "fork.knife"
        }
    }
}

// Ported from apps/myhealth/components/ui/TopNavBanner.tsx's role — shared
// mutable selection so the switcher and the root view agree on which
// section is current. Kept separate from SettingsStore/WorkoutManagerStore
// since it's pure UI navigation state, not persisted or domain data.
@Observable
@MainActor
final class NavSelection {
    var current: NavSection = .profile
    var showSettings = false
    var sidebarOpen = false
}
