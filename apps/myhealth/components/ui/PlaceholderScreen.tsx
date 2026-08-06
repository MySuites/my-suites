import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BurgerMenu, BurgerMenuItem } from './BurgerMenu';
import { BottomActionBar } from './BottomNavBar';
import { DashboardButton } from './DashboardButton';
import { BottomNavButton } from './BottomNavButton';

// Shared "To be implemented" dashboard used by the not-yet-built tabs
// (Sleep, Mind, Nutrition). Each keeps its own route file so it can grow
// its own screen later. `menuItems` is passed in per caller (see
// utils/burgerMenuItems.ts) so each top-nav section's burger menu stays
// unique even though they currently render the same placeholder body.
export function PlaceholderScreen({ menuItems }: { menuItems: BurgerMenuItem[] }) {
    const [menuVisible, setMenuVisible] = useState(false);
    // Tabs stay mounted when you switch away — without this, leaving the
    // burger menu open and navigating elsewhere means it's still open when
    // you come back.
    useFocusEffect(useCallback(() => () => setMenuVisible(false), []));

    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <Text className="text-center text-lg font-semibold mt-36 mb-2 text-light dark:text-dark">To be implemented</Text>

            <BottomActionBar>
                <DashboardButton dimmed={menuVisible} />
                <BottomNavButton
                    icon="line.3.horizontal"
                    label="More"
                    active={menuVisible}
                    boldWhenActive={false}
                    onPress={() => setMenuVisible(!menuVisible)}
                />
            </BottomActionBar>

            <BurgerMenu
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                items={menuItems}
            />
        </View>
    );
}
