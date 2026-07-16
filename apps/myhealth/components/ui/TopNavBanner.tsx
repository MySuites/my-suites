import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { IconSymbol, useUITheme } from '@mysuite/ui';
import { NAV_TABS as TABS } from '../../utils/navTabs';

const PILL_WIDTH = 92;
const ROW_PADDING_X = 8; // matches the icon row's px-2

// Top nav banner replacing the OS bottom tab bar: switches between the 5 main
// screens. Sits above every (tabs) screen, outside the Tabs navigator, so it
// persists across tab switches instead of remounting per screen.
export function TopNavBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useUITheme();
  const [rowWidth, setRowWidth] = useState(0);

  const activeIndex = Math.max(0, TABS.findIndex((tab) => tab.match.some((m) => pathname === m)));
  const activeTab = TABS[activeIndex];
  const columnWidth = (rowWidth - ROW_PADDING_X * 2) / TABS.length;

  const pillX = useSharedValue(0);

  React.useEffect(() => {
    if (columnWidth > 0) {
      const target = ROW_PADDING_X + activeIndex * columnWidth + (columnWidth - PILL_WIDTH) / 2;
      pillX.value = withTiming(target, { duration: 220 });
    }
  }, [activeIndex, columnWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  const handleRowLayout = (e: LayoutChangeEvent) => {
    setRowWidth(e.nativeEvent.layout.width);
  };

  return (
    <View className="absolute top-0 left-0 right-0" style={{ zIndex: 100 }}>
      <View className="bg-light dark:bg-dark pt-16 pb-3 rounded-b-3xl overflow-hidden border-b border-black/10 dark:border-white/10">
        <View className="flex-row items-center px-2" onLayout={handleRowLayout}>
          {TABS.map((tab, index) => {
            const isActive = index === activeIndex;
            const color = isActive ? theme.primary : theme.textMuted;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => router.navigate(tab.href as any)}
                className="flex-1 items-center py-1"
              >
                <IconSymbol name={tab.icon as any} size={tab.key === 'profile' ? 24 : 22} color={color} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {rowWidth > 0 && (
        <Animated.View
          className="bg-light dark:bg-dark"
          style={[
            {
              position: 'absolute',
              top: '100%',
              marginTop: -2,
              width: PILL_WIDTH,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 0,
              paddingBottom: 8,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderBottomWidth: 1,
              borderTopWidth: 0,
              borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            },
            pillStyle,
          ]}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary }}>
            {activeTab.label}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
