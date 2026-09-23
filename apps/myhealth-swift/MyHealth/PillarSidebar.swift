import SwiftUI

// Left-edge swipe-open sidebar drawer, matching the standard iOS drawer
// pattern. Wraps AppRootView's whole section switch ONCE, at the root — not
// per-section — so it survives nav.current changing sections. Wrapping it
// per-section (inside PillarTabView) let AppRootView's switch tear down and
// remount a fresh PillarSidebarScreen on every cross-section tap: the new
// instance mounted still reading the pre-close nav.sidebarOpen snapshot, so
// the panel appeared, but the closing `nav.sidebarOpen = false` that ran
// right after (same onSelect closure) landed on the already-discarded old
// instance and never took visual effect — sidebar stuck open after
// selecting any section other than the one already showing.
//
// A NavigationSplitView + List(.sidebar) native-sidebar rewrite was tried
// here and abandoned: every row Button inside it was completely dead to
// taps (tested extensively, including swapping a computed columnVisibility
// Binding for a real @State one) — root cause never found. Reverted to this
// known-working custom drawer.
//
// The open-drag gesture only lives on a thin strip at the leading edge, and
// only while closed; the close-drag/tap-to-dismiss only lives on the dimming
// scrim over the content, and only while open. Neither ever overlaps the
// sidebar's own row buttons — attaching a drag gesture to a container that
// also holds Buttons made every button tap get swallowed by the gesture
// recognizer, even as `.simultaneousGesture`, so the gesture's hit-testing
// region must stay physically separate from the sidebar at all times.
private let pillarSidebarWidth: CGFloat = 260
private let pillarSidebarEdgeHotZone: CGFloat = 24

struct PillarSidebarScreen<Content: View>: View {
    @Environment(NavSelection.self) private var nav

    @State private var dragTranslation: CGFloat = 0

    @ViewBuilder let content: Content

    private var openAmount: CGFloat {
        let base: CGFloat = nav.sidebarOpen ? pillarSidebarWidth : 0
        return max(0, min(pillarSidebarWidth, base + dragTranslation))
    }

    var body: some View {
        ZStack(alignment: .leading) {
            content
                .disabled(nav.sidebarOpen)

            if nav.sidebarOpen || dragTranslation != 0 {
                Color.black.opacity(Double(openAmount / pillarSidebarWidth) * 0.3)
                    .ignoresSafeArea()
                    .contentShape(Rectangle())
                    .onTapGesture {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                            nav.sidebarOpen = false
                        }
                    }
                    .gesture(
                        DragGesture(minimumDistance: 8)
                            .onChanged { value in
                                dragTranslation = min(0, value.translation.width)
                            }
                            .onEnded { _ in
                                let settleOpen = openAmount > pillarSidebarWidth / 2
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                                    nav.sidebarOpen = settleOpen
                                    dragTranslation = 0
                                }
                            }
                    )
            }

            PillarSidebarPanel { section in
                nav.current = section
                withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                    nav.sidebarOpen = false
                }
            } onSettings: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                    nav.sidebarOpen = false
                }
                nav.showSettings = true
            }
            .frame(width: pillarSidebarWidth)
            .offset(x: openAmount - pillarSidebarWidth)

            if !nav.sidebarOpen {
                Color.clear
                    .frame(width: pillarSidebarEdgeHotZone)
                    .contentShape(Rectangle())
                    .gesture(
                        DragGesture(minimumDistance: 8)
                            .onChanged { value in
                                guard value.startLocation.x < pillarSidebarEdgeHotZone else { return }
                                dragTranslation = max(0, value.translation.width)
                            }
                            .onEnded { _ in
                                let settleOpen = openAmount > pillarSidebarWidth / 2
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                                    nav.sidebarOpen = settleOpen
                                    dragTranslation = 0
                                }
                            }
                    )
            }
        }
    }
}

// Inline title-row button — each screen's title Text is preceded by this,
// calling nav.sidebarOpen = true. Shared here so every screen's toggle
// matches the sidebar's own show/hide animation.
struct SidebarToggleButton: View {
    @Environment(NavSelection.self) private var nav

    var body: some View {
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                nav.sidebarOpen = true
            }
        } label: {
            Image(systemName: "sidebar.left")
                .font(.title2)
        }
    }
}

private struct PillarSidebarPanel: View {
    @Environment(NavSelection.self) private var nav
    let onSelect: (NavSection) -> Void
    let onSettings: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Color.clear.frame(height: 60)
            ForEach(NavSection.allCases) { section in
                let isActive = section == nav.current
                Button {
                    onSelect(section)
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: section.icon)
                            .frame(width: 28)
                        Text(section.label)
                            .font(.body.weight(isActive ? .semibold : .regular))
                        Spacer()
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(isActive ? Color.accentColor.opacity(0.15) : Color.clear, in: RoundedRectangle(cornerRadius: 10))
                    .foregroundStyle(isActive ? Color.accentColor : .primary)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 8)
            }
            Spacer()
            Button(action: onSettings) {
                HStack(spacing: 12) {
                    Image(systemName: "gearshape.fill")
                        .frame(width: 28)
                    Text("Settings")
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color.clear, in: RoundedRectangle(cornerRadius: 10))
                .contentShape(Rectangle())
                .foregroundStyle(.primary)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 8)
            .padding(.bottom, 24)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(Color(.secondarySystemBackground))
        .ignoresSafeArea()
    }
}
