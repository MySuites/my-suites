import MyHealthKit
import SwiftUI

// Replaces the earlier TabView-based root. Ported from the RN app's real
// navigation shape: apps/myhealth/app/(tabs)/_layout.tsx hides the OS tab
// bar; TopNavBanner (the dropdown) is reimagined as PillarSwitcherRow built
// directly into each pillar's own scrollable content (see
// TopNavSwitcherMenu.swift + PillarContentScroller.swift) rather than a
// fixed banner here — each pillar's PillarTabView (real Liquid Glass tab
// bar) whose "More" tab presents that pillar's burgerMenuItems.ts row as a
// bottom sheet.
struct AppRootView: View {
    @State private var nav = NavSelection()
    @State private var showSettings = false
    @State private var showProgressPictures = false
    @State private var showWorkoutHistory = false

    var body: some View {
        Group {
            switch nav.current {
                case .sleep:
                    PillarTabView(
                        mainTabs: [MainTabSpec(id: "dashboard", label: "Dashboard", icon: "house.fill") { SleepView() }],
                        moreItems: [BurgerMenuItemSpec(label: "Settings", icon: "gearshape.fill") { showSettings = true }]
                    )
                case .mind:
                    PillarTabView(
                        mainTabs: [MainTabSpec(id: "dashboard", label: "Dashboard", icon: "house.fill") { MindView() }],
                        moreItems: [BurgerMenuItemSpec(label: "Settings", icon: "gearshape.fill") { showSettings = true }]
                    )
                case .nutrition:
                    PillarTabView(
                        mainTabs: [MainTabSpec(id: "dashboard", label: "Dashboard", icon: "house.fill") { NutritionView() }],
                        moreItems: [BurgerMenuItemSpec(label: "Settings", icon: "gearshape.fill") { showSettings = true }]
                    )
                case .profile:
                    PillarTabView(
                        mainTabs: [
                            MainTabSpec(id: "dashboard", label: "Dashboard", icon: "house.fill") { DashboardView() },
                        ],
                        moreItems: [
                            BurgerMenuItemSpec(label: "Progress Pics", icon: "camera.fill") { showProgressPictures = true },
                            BurgerMenuItemSpec(label: "Settings", icon: "gearshape.fill") { showSettings = true },
                        ]
                    )
                case .workout:
                    PillarTabView(
                        mainTabs: [
                            MainTabSpec(id: "dashboard", label: "Dashboard", icon: "house.fill") { WorkoutsHomeView() },
                            MainTabSpec(id: "exercises", label: "Exercises", icon: "dumbbell.fill") { ExercisesLibraryView() },
                            MainTabSpec(id: "saved", label: "Saved", icon: "list.bullet.clipboard") { SavedWorkoutsView() },
                        ],
                        moreItems: [
                            BurgerMenuItemSpec(label: "Workout History", icon: "clock.fill") { showWorkoutHistory = true },
                            BurgerMenuItemSpec(label: "Settings", icon: "gearshape.fill") { showSettings = true },
                        ]
                    )
            }
        }
        .environment(nav)
        .sheet(isPresented: $showSettings) { SettingsView() }
        .sheet(isPresented: $showProgressPictures) { ProgressPicturesListView() }
        .sheet(isPresented: $showWorkoutHistory) { HistoryView() }
    }
}

#Preview {
    AppRootView()
        .environment(SettingsStore())
}
