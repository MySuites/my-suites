import SwiftUI

// Ported from apps/myhealth/components/ui/BottomNavBar.tsx's role: a
// pillar's main tabs plus a "More" destination for that section's
// burgerMenuItems.ts row. RN morphs the same bar in place; here "More"
// instead presents a native bottom sheet (slide up, drag indicator, medium
// detent) listing those items — same destinations, standard iOS sheet
// presentation instead of a custom in-bar transition.
struct MainTabSpec: Identifiable {
    let id: String
    let label: String
    let icon: String
    let content: AnyView

    init<Content: View>(id: String, label: String, icon: String, @ViewBuilder content: () -> Content) {
        self.id = id
        self.label = label
        self.icon = icon
        self.content = AnyView(content())
    }
}

struct PillarTabView: View {
    let mainTabs: [MainTabSpec]
    let moreItems: [BurgerMenuItemSpec]

    @State private var selection = ""
    @State private var lastRealTag = ""
    @State private var showMoreSheet = false

    private var defaultTag: String { mainTabs.first?.id ?? "" }

    var body: some View {
        TabView(selection: $selection) {
            ForEach(mainTabs) { tab in
                tab.content
                    .tabItem { Label(tab.label, systemImage: tab.icon) }
                    .tag(tab.id)
            }
            Color.clear
                .tabItem { Label("More", systemImage: "line.3.horizontal") }
                .tag("more")
        }
        // Backdrop stays visible (not swapped to blank/scaled-down) but
        // blurs while the sheet's up, then sharpens back on dismiss.
        // No .animation here — animating a Gaussian blur radius means
        // recomputing the filter every intermediate frame, which is heavy
        // enough (especially in Simulator) to visibly lag behind the
        // sheet's own dismiss transition. Snapping it instead keeps the
        // backdrop in sync with `showMoreSheet` exactly.
        .blur(radius: showMoreSheet ? 12 : 0)
        .allowsHitTesting(!showMoreSheet)
        .onAppear {
            selection = defaultTag
            lastRealTag = defaultTag
        }
        .onChange(of: selection) { _, newValue in
            if newValue == "more" {
                // Snap back to whichever real tab was showing before —
                // "more" is a trigger for the sheet below, not an actual
                // destination, so its content (Color.clear) should never
                // actually show.
                selection = lastRealTag
                showMoreSheet = true
            } else {
                lastRealTag = newValue
            }
        }
        .sheet(isPresented: $showMoreSheet) {
            MoreSheet(items: moreItems) { item in
                showMoreSheet = false
                item.action()
            }
            .presentationDetents([.medium])
            .presentationDragIndicator(.visible)
            .presentationBackground(.ultraThinMaterial)
        }
    }
}

private struct MoreSheet: View {
    let items: [BurgerMenuItemSpec]
    let onSelect: (BurgerMenuItemSpec) -> Void

    var body: some View {
        NavigationStack {
            List(Array(items.enumerated()), id: \.offset) { _, item in
                Button {
                    onSelect(item)
                } label: {
                    Label(item.label, systemImage: item.icon)
                }
                .foregroundStyle(.primary)
            }
            .navigationTitle("More")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
