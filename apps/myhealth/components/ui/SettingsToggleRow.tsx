import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useUITheme } from '@mysuite/ui';

interface SettingsToggleRowProps {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void | Promise<void>;
    disabled?: boolean;
    bordered?: boolean;
    indented?: boolean;
    labelBold?: boolean;
    testID?: string;
}

export function SettingsToggleRow({
    label,
    value,
    onValueChange,
    disabled = false,
    bordered = true,
    indented = false,
    labelBold = false,
    testID,
}: SettingsToggleRowProps) {
    const theme = useUITheme();

    return (
        <View
            className={`flex-row justify-between items-center py-3 ${bordered ? 'border-b border-light dark:border-dark' : ''} ${indented ? 'pl-6' : ''}`}
            style={{ opacity: disabled ? 0.5 : 1 }}
        >
            <Text className={`text-base text-light dark:text-dark ${labelBold ? 'font-medium' : ''}`}>{label}</Text>
            <Switch
                testID={testID}
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={{ false: theme.card, true: theme.primary }}
                thumbColor={value ? "#ffffff" : "#f4f3f4"}
            />
        </View>
    );
}
