import React from 'react';
import { View, Text } from 'react-native';

import { BottomActionBar, BottomNavButton, DashboardButton, BurgerMenuItem } from './BottomNavBar';

// Shared "To be implemented" dashboard used by the not-yet-built tabs
// (Sleep, Mind, Nutrition). Each keeps its own route file so it can grow
// its own screen later. `menuItems` is passed in per caller (see
// utils/burgerMenuItems.ts) so each top-nav section's menu row stays
// unique even though they currently render the same placeholder body.
export function PlaceholderScreen({ menuItems }: { menuItems: BurgerMenuItem[] }) {
    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <Text className="text-center text-lg font-semibold mt-36 mb-2 text-light dark:text-dark">To be implemented</Text>

            <BottomActionBar menuItems={menuItems}>
                {(menuVisible, toggleMenu) => (
                    <>
                        <DashboardButton dimmed={menuVisible} />
                        <BottomNavButton
                            icon="line.3.horizontal"
                            label="More"
                            active={menuVisible}
                            boldWhenActive={false}
                            onPress={toggleMenu}
                        />
                    </>
                )}
            </BottomActionBar>
        </View>
    );
}
