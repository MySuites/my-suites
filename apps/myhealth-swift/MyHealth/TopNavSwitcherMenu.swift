import SwiftUI

// Ported from apps/myhealth/components/ui/TopNavBanner.tsx — replaces the
// RN Modal dropdown with the pillar-card row built directly into each
// pillar's own scrollable content, above its title (see
// PillarContentScroller.swift). It's not a floating overlay: at rest the
// scroll position starts just below this row, so it's naturally offscreen
// until the user scrolls/pulls down, exactly like content you scrolled past.
struct PillarSwitcherRow: View {
    @Environment(NavSelection.self) private var nav

    // Dismisses the reveal — auto-collapse-on-scroll proved fragile (fed
    // back into the same scroll geometry it was reading, three different
    // ways, across three attempts), so dismissal is explicit instead:
    // picking a pillar, or this chevron.
    var onDismiss: (() -> Void)?

    var body: some View {
        HStack(spacing: 8) {
            ForEach(NavSection.allCases) { section in
                PillarCard(section: section, isActive: section == nav.current) {
                    nav.current = section
                    onDismiss?()
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 16)
        .background(Color(.systemGray5))
    }
}

// One item list per top-nav section — ported from
// apps/myhealth/utils/burgerMenuItems.ts. Consumed by PillarTabView's More sheet.
struct BurgerMenuItemSpec {
    let label: String
    let icon: String
    let action: () -> Void
}

private struct PillarCard: View {
    let section: NavSection
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: section.icon)
                    .font(.body)
                Text(section.label)
                    .font(.system(size: 11, weight: .semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 58)
            .foregroundStyle(isActive ? .white : .primary)
            .background(isActive ? Color.accentColor : Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}
