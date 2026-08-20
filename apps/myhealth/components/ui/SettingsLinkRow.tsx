import React from 'react';
import { View, Text } from 'react-native';
import { RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';

interface SettingsLinkRowProps {
    label: string;
    onPress: () => void;
    icon?: string;
    iconColor?: string;
    danger?: boolean;
    labelBold?: boolean;
    testID?: string;
}

export function SettingsLinkRow({
    label,
    onPress,
    icon = 'chevron.right',
    iconColor,
    danger = false,
    labelBold = false,
    testID,
}: SettingsLinkRowProps) {
    const theme = useUITheme();
    const resolvedIconColor = iconColor || (danger ? theme.danger : theme.primary);
    const labelClassName = `text-base ${danger ? 'text-danger' : 'text-light dark:text-dark'} ${labelBold ? 'font-medium' : ''}`;

    return (
        <View className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark">
            <Text className={labelClassName}>{label}</Text>
            <RaisedCard
                testID={testID}
                onPress={onPress}
                className="w-10 h-10 active:h-9 p-0 rounded-full items-center justify-center"
                style={{ borderRadius: 9999 }}
            >
                <IconSymbol name={icon as any} size={20} color={resolvedIconColor} />
            </RaisedCard>
        </View>
    );
}
