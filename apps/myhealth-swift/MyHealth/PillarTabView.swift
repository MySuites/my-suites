import SwiftUI

// Ported from apps/myhealth/components/ui/BottomNavBar.tsx's role: a
// pillar's main tabs, shown directly as native tabItems in a real TabView
// (genuine system Liquid Glass, not a hand-rolled .ultraThinMaterial
// approximation) — every destination gets its own tab, no "More" sheet.
// The right-side action button is a separate floating circle at the top
// using the real .glassEffect API, showing whichever action the currently
// selected tab defines.
//
// Uses the iOS 18+ `Tab(value:)` builder (falling back to the legacy
// `.tabItem{}.tag()` pattern pre-18, since deployment target is 17) rather
// than only the legacy form, since that's Apple's supported path for the
// floating/Liquid Glass tab bar look this app already gets by default.
struct MenuAction: Identifiable {
    let id = UUID()
    let label: String
    let icon: String
    let action: () -> Void
}

struct MainTabSpec: Identifiable {
    let id: String
    let label: String
    let icon: String
    let content: AnyView
    var menuIcon: String?
    var menuActions: [MenuAction] = []
    var scrollToTop: (() -> Void)?

    init<Content: View>(
        id: String,
        label: String,
        icon: String,
        menuIcon: String? = nil,
        menuActions: [MenuAction] = [],
        scrollToTop: (() -> Void)? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.id = id
        self.label = label
        self.icon = icon
        self.menuIcon = menuIcon
        self.menuActions = menuActions
        self.scrollToTop = scrollToTop
        self.content = AnyView(content())
    }
}

struct PillarTabView: View {
    let mainTabs: [MainTabSpec]

    @State private var selection: String

    init(mainTabs: [MainTabSpec]) {
        self.mainTabs = mainTabs
        _selection = State(initialValue: mainTabs.first?.id ?? "")
    }

    private var currentTab: MainTabSpec? {
        mainTabs.first { $0.id == selection }
    }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Group {
                if #available(iOS 18.0, *) {
                    TabView(selection: $selection) {
                        ForEach(mainTabs) { tab in
                            Tab(tab.label, systemImage: tab.icon, value: tab.id) {
                                tab.content
                            }
                        }
                    }
                } else {
                    TabView(selection: $selection) {
                        ForEach(mainTabs) { tab in
                            tab.content
                                .tabItem { Label(tab.label, systemImage: tab.icon) }
                                .tag(tab.id)
                        }
                    }
                }
            }
            .onChange(of: selection) { _, _ in
                currentTab?.scrollToTop?()
            }

            if let menuIcon = currentTab?.menuIcon, let actions = currentTab?.menuActions, !actions.isEmpty {
                Menu {
                    ForEach(actions) { item in
                        Button {
                            item.action()
                        } label: {
                            Label(item.label, systemImage: item.icon)
                        }
                    }
                } label: {
                    Image(systemName: menuIcon)
                        .font(.title2)
                        .frame(width: 44, height: 44)
                        .contentShape(.circle)
                }
                .modifier(ActionButtonGlass())
                .clipShape(.circle)
                .padding(.trailing, 16)
                .padding(.top, 12)
            }
        }
    }
}

private struct ActionButtonGlass: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content.glassEffect(.regular, in: .circle)
        } else {
            content.background(.ultraThinMaterial, in: Circle())
        }
    }
}
