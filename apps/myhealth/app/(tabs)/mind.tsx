import React, {useState} from "react";
import {
    View,
    Text,
    TouchableOpacity,
} from "react-native";

import { useUITheme, IconSymbol } from '@mysuite/ui';

import { BurgerMenu } from '../../components/ui/BurgerMenu';
import { BottomActionBar } from '../../components/ui/BottomNavBar';
import { DashboardButton } from '../../components/ui/DashboardButton';

export default function MindScreen() {
    const theme = useUITheme();
    const [menuVisible, setMenuVisible] = useState(false);
    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <Text className="text-center text-lg font-semibold mt-36 mb-2 text-light dark:text-dark">To be implemented</Text>

            <BottomActionBar>
                <DashboardButton dimmed={menuVisible} />
                <TouchableOpacity
                    onPress={() => setMenuVisible(!menuVisible)}
                    className="items-center justify-center"
                    style={{ gap: 2 }}
                >
                    <IconSymbol
                        name="line.3.horizontal"
                        size={22}
                        color={menuVisible ? theme.primary : theme.textMuted}
                    />
                    <Text style={{ fontSize: 10, fontWeight: '600', color: menuVisible ? theme.primary : theme.textMuted }}>
                        Menu
                    </Text>
                </TouchableOpacity>
            </BottomActionBar>

            <BurgerMenu
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
            />
        </View>
    );
}
