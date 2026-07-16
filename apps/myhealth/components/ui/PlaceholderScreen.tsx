import React, { useState } from 'react';
import { View, Text } from 'react-native';

import { BurgerMenu } from './BurgerMenu';
import { BottomActionBar } from './BottomNavBar';
import { DashboardButton } from './DashboardButton';
import { BottomNavButton } from './BottomNavButton';

// Shared "To be implemented" dashboard used by the not-yet-built tabs
// (Sleep, Mind, Nutrition). Each keeps its own route file so it can grow
// its own screen later.
export function PlaceholderScreen() {
    const [menuVisible, setMenuVisible] = useState(false);

    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <Text className="text-center text-lg font-semibold mt-36 mb-2 text-light dark:text-dark">To be implemented</Text>

            <BottomActionBar>
                <DashboardButton dimmed={menuVisible} />
                <BottomNavButton
                    icon="line.3.horizontal"
                    label="Menu"
                    active={menuVisible}
                    boldWhenActive={false}
                    onPress={() => setMenuVisible(!menuVisible)}
                />
            </BottomActionBar>

            <BurgerMenu
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
            />
        </View>
    );
}
