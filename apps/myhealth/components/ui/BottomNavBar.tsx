import React, { useCallback, useState } from 'react';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname, useFocusEffect } from 'expo-router';
import { IconSymbol, useUITheme } from '@mysuite/ui';
import { findCurrentTab, isOnOwnDashboard } from '../../utils/navTabs';

// Height of the bar's own content row, not counting the device's bottom
// safe-area inset (added separately as padding).
export const BOTTOM_ACTION_BAR_HEIGHT = 40;

export interface BurgerMenuItem {
  label: string;
  icon: string;
  route: string;
}

interface BottomActionBarProps {
  // Default row: Dashboard + this screen's own tab buttons, plus a trailing
  // "More" BottomNavButton wired to the (menuVisible, toggleMenu) this
  // function receives — the bar owns the toggle now instead of each screen
  // running its own useState/useBurgerMenu.
  children: (menuVisible: boolean, toggleMenu: () => void) => React.ReactNode;
  // Section-specific items (see utils/burgerMenuItems.ts). Rendered as a
  // second row that morphs in over the default row in the same glass
  // surface — replaces the old separate BurgerMenu popover.
  menuItems: BurgerMenuItem[];
}

// Per-screen contextual actions (settings, history, etc.) that used to live
// in the top header now render here — the top banner is reserved for
// switching between the 5 main screens.
// UIGlassEffect (real Liquid Glass material) only exists on iOS 26+. Older
// iOS, Android, and web fall back to the expo-blur approximation built
// earlier — checked once per mount, not per render, since it can't change
// at runtime.
const HAS_NATIVE_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();

// Total visual height of the row content (icon+label button height plus its
// own top/bottom padding) — needed as an explicit number because the two
// rows stack absolutely on top of each other to crossfade, which would
// otherwise collapse their flex parent to zero height.
const ROW_HEIGHT = BOTTOM_ACTION_BAR_HEIGHT + 20;

export function BottomActionBar({ children, menuItems }: BottomActionBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useUITheme();
  const router = useRouter();
  const barBottom = Math.max(insets.bottom, 12);

  const [menuVisible, setMenuVisible] = useState(false);
  // Tabs stay mounted when you switch away — without this, leaving the menu
  // open and navigating elsewhere means it's still open when you come back.
  useFocusEffect(useCallback(() => () => setMenuVisible(false), []));
  const toggleMenu = useCallback(() => setMenuVisible((v) => !v), []);

  const morph = useSharedValue(0);
  React.useEffect(() => {
    morph.value = withTiming(menuVisible ? 1 : 0, { duration: 220 });
  }, [menuVisible]);
  const tabsRowStyle = useAnimatedStyle(() => ({
    opacity: 1 - morph.value,
    transform: [{ scale: 1 - morph.value * 0.06 }],
  }));
  const menuRowStyle = useAnimatedStyle(() => ({
    opacity: morph.value,
    transform: [{ scale: 0.94 + morph.value * 0.06 }],
  }));

  const rowContent = (
    <View style={{ height: ROW_HEIGHT, justifyContent: 'center' }}>
      <Animated.View
        pointerEvents={menuVisible ? 'none' : 'auto'}
        className="absolute inset-0 flex-row items-center px-2"
        style={tabsRowStyle}
      >
        {children(menuVisible, toggleMenu)}
      </Animated.View>
      <Animated.View
        pointerEvents={menuVisible ? 'auto' : 'none'}
        className="absolute inset-0 flex-row items-center px-2"
        style={menuRowStyle}
      >
        {menuItems.map((item) => (
          <BottomNavButton
            key={item.route}
            icon={item.icon}
            label={item.label}
            onPress={() => {
              setMenuVisible(false);
              router.push(item.route as any);
            }}
          />
        ))}
        <BottomNavButton icon="xmark" label="Close" onPress={() => setMenuVisible(false)} />
      </Animated.View>
    </View>
  );

  return (
    <>
      {HAS_NATIVE_GLASS ? (
        <GlassView
          glassEffectStyle="regular"
          colorScheme={theme.dark ? 'dark' : 'light'}
          isInteractive
          style={{
            position: 'absolute',
            left: 48,
            right: 48,
            bottom: barBottom,
            zIndex: 100,
            borderRadius: 999,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          {rowContent}
        </GlassView>
      ) : (
        <View
          className="absolute left-16 right-16 rounded-[999px] overflow-hidden border"
          style={{
            bottom: barBottom,
            zIndex: 100,
            borderColor: theme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.35)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <BlurView
            intensity={80}
            tint={theme.dark ? 'dark' : 'light'}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.dark ? 'rgba(20,24,32,0.35)' : 'rgba(255,255,255,0.25)',
            }}
          />
          {/* Specular highlight: light catching the top curve of the glass. */}
          <LinearGradient
            pointerEvents="none"
            colors={theme.dark
              ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']
              : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 28 }}
          />
          {rowContent}
        </View>
      )}
    </>
  );
}

// Soft translucent circle rendered behind an active icon, matching the
// Liquid Glass pill highlight (mockup) instead of a plain color swap.
function ActivePillHighlight({ visible, dark }: { visible: boolean; dark: boolean }) {
  if (!visible) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -6,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.5)',
      }}
    />
  );
}

interface BottomNavButtonProps {
    icon: string;
    label: string;
    onPress: () => void;
    // Highlights the icon/label in the primary color instead of the muted color.
    active?: boolean;
    // Tab buttons (Exercises/History) render their label bold when active; the
    // Menu toggle keeps it semibold. Defaults to the tab behavior.
    boldWhenActive?: boolean;
}

// A single action in the BottomActionBar — the muted/primary icon-over-label
// button repeated across every dashboard screen. Mirrors DashboardButton.
export function BottomNavButton({
    icon,
    label,
    onPress,
    active = false,
    boldWhenActive = true,
}: BottomNavButtonProps) {
    const theme = useUITheme();
    const color = active ? theme.primary : theme.textMuted;

    return (
        <TouchableOpacity
            onPress={onPress}
            className="flex-1 items-center justify-center"
            style={{ gap: 2 }}
        >
            <ActivePillHighlight visible={active} dark={theme.dark} />
            <IconSymbol name={icon as any} size={22} color={color} />
            <Text style={{ fontSize: 12, fontWeight: active && boldWhenActive ? '700' : '600', color }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

interface DashboardButtonProps {
    // Suppress the active highlight when some other bottom-bar icon (e.g. the
    // burger menu) is the one currently "selected".
    dimmed?: boolean;
}

// Each screen's own "dashboard" — points at itself (Workout's button stays on
// Workout, Sleep's stays on Sleep, etc.), not a shared Profile destination.
// Only highlighted while actually on that dashboard screen, not a sub-route
// of it (e.g. Workout History).
export function DashboardButton({ dimmed }: DashboardButtonProps) {
    const router = useRouter();
    const pathname = usePathname();
    const theme = useUITheme();

    const currentTab = findCurrentTab(pathname);
    const isActive = isOnOwnDashboard(pathname);
    const color = dimmed || !isActive ? theme.textMuted : theme.primary;

    return (
        <TouchableOpacity
            onPress={() => router.navigate(currentTab.href as any)}
            className="flex-1 items-center justify-center"
            style={{ gap: 2 }}
        >
            <ActivePillHighlight visible={!dimmed && isActive} dark={theme.dark} />
            <IconSymbol name="house.fill" size={20} color={color} />
            <Text style={{ fontSize: 12, fontWeight: '700', color }}>
                Dashboard
            </Text>
        </TouchableOpacity>
    );
}
