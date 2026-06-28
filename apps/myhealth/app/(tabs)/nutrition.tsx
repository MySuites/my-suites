import React, {useState} from "react";
import {
 	View,
 	Text,
} from "react-native";

import { RaisedCard, useUITheme, IconSymbol } from '@mysuite/ui';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SettingsButton } from '../../components/ui/SettingsButton';
import { BurgerMenu } from '../../components/ui/BurgerMenu';

export default function NutritionScreen() {
    const theme = useUITheme();
    const [menuVisible, setMenuVisible] = useState(false);
    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <ScreenHeader 
                            title="Nutrition" 
                            leftAction={<SettingsButton />} 
                            rightAction={
                                <RaisedCard 
                                    onPress={() => setMenuVisible(!menuVisible)}
                                    style={{ borderRadius: 9999 }}
                                    className="w-12 p-0 items-center justify-center"
                                >
                                    <IconSymbol 
                                        name="line.3.horizontal" 
                                        size={24} 
                                        color={theme.primary} 
                                />
                            </RaisedCard>} />
            <Text className="text-center text-lg font-semibold mt-36 mb-2 text-light dark:text-dark">To be implemented</Text>
            
            <BurgerMenu
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
            />
        </View>
    );
}