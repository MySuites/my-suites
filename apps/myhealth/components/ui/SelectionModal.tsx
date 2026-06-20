import { View, Modal, FlatList, Text, TouchableOpacity } from 'react-native';
import { RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';

interface SelectionModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    items: any[];
    onSelect: (item: any) => void;
    isSelected: (item: any) => boolean;
    multiSelect?: boolean;
}

export const SelectionModal = ({
    visible,
    onClose,
    title,
    items,
    onSelect,
    isSelected,
    multiSelect = false
}: SelectionModalProps) => {
    const theme = useUITheme();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-light dark:bg-dark">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-4">
                    <TouchableOpacity onPress={onClose} className="p-2">
                        <IconSymbol name="xmark" size={24} color={theme.textMuted || '#888'} />
                    </TouchableOpacity>
                    
                    <Text className="text-xl font-bold text-light dark:text-dark">{title}</Text>
                    
                    <TouchableOpacity onPress={onClose} className="px-3 py-1">
                        <Text style={{ color: theme.primary }} className="font-semibold text-base">Done</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={items}
                    keyExtractor={(item) => item.value || item.id}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => {
                        const selected = isSelected(item);
                        return (
                            <RaisedCard 
                                onPress={() => {
                                    onSelect(item);
                                    if (!multiSelect) {
                                        onClose();
                                    }
                                }}
                                className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl ${
                                    selected 
                                        ? 'bg-light dark:bg-dark border-t-2 border-black/20 dark:border-white/20 border-b-0 dark:border-b-0' 
                                        : 'bg-lighter dark:bg-dark-lighter'
                                }`}
                            >
                                <Text className={`text-base font-semibold ${selected ? 'text-primary dark:text-primary-dark' : 'text-light dark:text-dark'}`}>
                                    {item.label || item.name}
                                </Text>
                                {selected && (
                                    <IconSymbol name="checkmark" size={20} color={theme.primary} />
                                )}
                            </RaisedCard>
                        );
                    }}
                />
            </View>
        </Modal>
    );
};
