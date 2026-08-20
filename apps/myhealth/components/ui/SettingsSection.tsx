import React from 'react';
import { View, Text } from 'react-native';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
    return (
        <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">{title}</Text>
            {children}
        </View>
    );
}
