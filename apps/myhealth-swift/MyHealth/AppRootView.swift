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
    @State private var showAddProgressPicture = false
    @State private var showCreateWorkout = false
    @State private var showAddExercise = false
    @State private var startEmptyWorkoutTick = 0
    @State private var exportHistoryTick = 0
    @State private var profileDashboardScrollTick = 0
    @State private var progressPicturesScrollTick = 0
    @State private var workoutDashboardScrollTick = 0
    @State private var exercisesScrollTick = 0
    @State private var savedScrollTick = 0
    @State private var historyScrollTick = 0

    var body: some View {
        PillarSidebarScreen {
            Group {
                switch nav.current {
                case .sleep:
                    PillarTabView(
                        mainTabs: [MainTabSpec(id: "dashboard", label: "Dashboard", icon: "house.fill") { SleepView() }]
                    )
                case .mind:
                    PillarTabView(
                        mainTabs: [MainTabSpec(id: "dashboard", label: "Dashboard", icon: "house.fill") { MindView() }]
                    )
                case .nutrition:
                    PillarTabView(
                        mainTabs: [MainTabSpec(id: "dashboard", label: "Dashboard", icon: "house.fill") { NutritionView() }]
                    )
                case .profile:
                    PillarTabView(
                        mainTabs: [
                            MainTabSpec(
                                id: "dashboard", label: "Dashboard", icon: "house.fill",
                                scrollToTop: { profileDashboardScrollTick += 1 }
                            ) { DashboardView(scrollToTopTick: $profileDashboardScrollTick) },
                            MainTabSpec(
                                id: "progress", label: "Progress Pics", icon: "camera.fill",
                                menuIcon: "ellipsis",
                                menuActions: [
                                    MenuAction(label: "Add Picture", icon: "plus") { showAddProgressPicture = true },
                                ],
                                scrollToTop: { progressPicturesScrollTick += 1 }
                            ) { ProgressPicturesListView(showAddSheet: $showAddProgressPicture, scrollToTopTick: $progressPicturesScrollTick) },
                        ]
                    )
                case .workout:
                    PillarTabView(
                        mainTabs: [
                            MainTabSpec(
                                id: "dashboard", label: "Dashboard", icon: "house.fill",
                                menuIcon: "ellipsis",
                                menuActions: [
                                    MenuAction(label: "New Workout", icon: "square.and.pencil") { showCreateWorkout = true },
                                    MenuAction(label: "Start Empty Workout", icon: "bolt.fill") { startEmptyWorkoutTick += 1 },
                                ],
                                scrollToTop: { workoutDashboardScrollTick += 1 }
                            ) { WorkoutsHomeView(showCreateNew: $showCreateWorkout, startEmptyWorkoutTick: $startEmptyWorkoutTick, scrollToTopTick: $workoutDashboardScrollTick) },
                            MainTabSpec(
                                id: "exercises", label: "Exercises", icon: "dumbbell.fill",
                                menuIcon: "ellipsis",
                                menuActions: [
                                    MenuAction(label: "Add Exercise", icon: "plus") { showAddExercise = true },
                                ],
                                scrollToTop: { exercisesScrollTick += 1 }
                            ) { ExercisesLibraryView(showAddExercise: $showAddExercise, scrollToTopTick: $exercisesScrollTick) },
                            MainTabSpec(
                                id: "saved", label: "Routines", icon: "list.bullet.clipboard",
                                menuIcon: "ellipsis",
                                menuActions: [
                                    MenuAction(label: "Create Routine", icon: "square.and.pencil") { showCreateWorkout = true },
                                    MenuAction(label: "Start Empty Workout", icon: "bolt.fill") { startEmptyWorkoutTick += 1 },
                                ],
                                scrollToTop: { savedScrollTick += 1 }
                            ) { RoutinesView(showCreateNew: $showCreateWorkout, startEmptyWorkoutTick: $startEmptyWorkoutTick, scrollToTopTick: $savedScrollTick) },
                            MainTabSpec(
                                id: "history", label: "History", icon: "clock.fill",
                                menuIcon: "square.and.arrow.down",
                                menuActions: [
                                    MenuAction(label: "Export CSV", icon: "square.and.arrow.down") { exportHistoryTick += 1 },
                                ],
                                scrollToTop: { historyScrollTick += 1 }
                            ) { HistoryView(scrollToTopTick: $historyScrollTick, exportTick: $exportHistoryTick) },
                        ]
                    )
                }
            }
        }
        .environment(nav)
        .fullScreenCover(isPresented: $nav.showSettings) { SettingsView() }
        .simultaneousGesture(TapGesture().onEnded { UIApplication.shared.endEditing() })
    }
}

#if os(iOS)
import UIKit

extension UIApplication {
    func endEditing() {
        sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}
#endif

#Preview {
    AppRootView()
        .environment(SettingsStore())
}
