import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useRouter, usePathname, useFocusEffect } from 'expo-router';
import { IconSymbol, useUITheme, RaisedCard } from '@mysuite/ui';
import { NAV_TABS as TABS } from '../../utils/navTabs';

// Top nav banner replacing the OS bottom tab bar: switches between the 5 main
// screens. Sits above every (tabs) screen, outside the Tabs navigator, so it
// persists across tab switches instead of remounting per screen.
//
// Single word + chevron instead of a 5-icon row — tapping it drops down the
// other 4 sections as a list, rather than showing every destination at once.
export function TopNavBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useUITheme();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Tabs stay mounted when you switch away — without this, leaving the
  // dropdown open and navigating elsewhere means it's still open when you
  // come back.
  useFocusEffect(useCallback(() => () => setDropdownVisible(false), []));

  const activeIndex = Math.max(0, TABS.findIndex((tab) => tab.match.some((m) => pathname === m)));
  const activeTab = TABS[activeIndex];

  const goTo = (tab: (typeof TABS)[number]) => {
    console.log(`[TopNavBanner] switched to: ${tab.label}`);
    setDropdownVisible(false);
    router.navigate(tab.href as any);
  };

  return (
    <View className="absolute top-0 left-0 right-0" style={{ zIndex: 100 }}>
      <View className="bg-light dark:bg-dark pt-16 pb-3 rounded-b-3xl overflow-hidden border-b border-black/10 dark:border-white/10">
        <TouchableOpacity
          onPress={() => setDropdownVisible(true)}
          className="flex-row items-center self-start"
          style={{ gap: 4, paddingVertical: 4, paddingLeft: 20 }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: theme.primary }}>
            {activeTab.label}
          </Text>
          <IconSymbol name="chevron.down" size={16} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <Modal visible={dropdownVisible} transparent animationType="fade" onRequestClose={() => setDropdownVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
          className="absolute top-0 bottom-0 left-0 right-0 bg-black/20"
        />
        <View className="flex-1 items-start" style={{ paddingTop: 112, paddingLeft: 20 }} pointerEvents="box-none">
          <RaisedCard
            className="w-48 p-2 bg-light dark:bg-dark-lighter rounded-xl"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => goTo(tab)}
                className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
              >
                <IconSymbol
                  name={tab.icon as any}
                  size={20}
                  color={tab.key === activeTab.key ? theme.primary : theme.text}
                  style={{ marginRight: 12 }}
                />
                <Text
                  className={tab.key === activeTab.key ? 'font-semibold' : 'font-medium'}
                  style={{ color: tab.key === activeTab.key ? theme.primary : theme.text }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </RaisedCard>
        </View>
      </Modal>
    </View>
  );
}
