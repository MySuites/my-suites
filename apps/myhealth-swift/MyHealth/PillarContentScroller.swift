import SwiftUI

// Reveal detection for the pillar switcher, which each screen renders
// inline right below its title (not as a floating overlay) — hidden at
// rest, revealed by pulling down past the top.
//
// Reveals on overscroll past the top (minY > threshold) and auto-dismisses
// once the user scrolls back down into real content (minY <= 0). Both
// transitions key off the probe's own position, which sits above the
// switcher row and is unaffected by that row being inserted/removed below
// it — so growing/shrinking the switcher's content height never feeds back
// into the reading that drives it. Picking a pillar or tapping the row's
// chevron also dismiss explicitly, as a manual shortcut.
//
// The `.onPreferenceChange` MUST sit directly on (or immediately around)
// the probe itself, not on some distant ancestor several modifiers away —
// splitting them apart stopped firing reliably in testing, even though
// preferences are documented to bubble through any number of ancestors.
private struct PullOffsetKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

private let pillarPullCoordinateSpace = "pillarPullCoordinateSpace"

/// Place as the very first child inside the pillar's ScrollView/List content
/// (inside a List, wrap it in a zero-inset Section like the other rows).
/// Pass the same binding used to conditionally show `PillarSwitcherRow`
/// right below the title.
struct PillarPullProbe: View {
    @Binding var isRevealed: Bool

    var body: some View {
        GeometryReader { proxy in
            Color.clear.preference(key: PullOffsetKey.self, value: proxy.frame(in: .named(pillarPullCoordinateSpace)).minY)
        }
        // A true 0pt height risks some hosts (List rows especially) never
        // laying it out/calling the GeometryReader closure at all — 1pt
        // avoids that degenerate case and is visually imperceptible.
        .frame(height: 1)
        .allowsHitTesting(false)
        .onPreferenceChange(PullOffsetKey.self) { minY in
            if minY > 24, !isRevealed {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                    isRevealed = true
                }
            } else if minY < -4, isRevealed {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                    isRevealed = false
                }
            }
        }
    }
}

private struct HeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

extension View {
    /// Apply to the pillar's outer ScrollView/List — establishes the named
    /// coordinate space `PillarPullProbe` measures against.
    func pillarSwitcherCoordinateSpace() -> some View {
        coordinateSpace(name: pillarPullCoordinateSpace)
    }

    /// Reports this view's laid-out height into `binding` — used to size the
    /// content's reveal offset to the switcher panel's actual height instead
    /// of a guessed constant.
    func measureHeight(_ binding: Binding<CGFloat>) -> some View {
        onGeometryChange(for: CGFloat.self) { proxy in
            proxy.size.height
        } action: { newHeight in
            binding.wrappedValue = newHeight
        }
    }

    /// Strips a List row down to bare content — no separator, no
    /// list-provided background — so a `PillarSectionCard` wrapping the row's own
    /// content can supply properly inset rounded corners itself.
    /// `.listRowBackground` fills the row's full bleed width regardless of
    /// `.listRowInsets` on the content, which is why the background has to
    /// live on the content instead.
    func pillarBareRow() -> some View {
        listRowInsets(EdgeInsets())
            .listRowSeparator(.hidden)
            .listRowBackground(Color.clear)
    }
}

/// Rounded "card" look matching DashboardCard, wrapped around a List row's
/// own content (not applied as a `.listRowBackground`) so the card is
/// properly inset from both edges — pair with `.pillarBareRow()` on that row.
struct PillarSectionCard<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        content
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
            .padding(.horizontal, 16)
            .padding(.vertical, 4)
    }
}
