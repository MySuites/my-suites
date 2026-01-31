import { View, Modal, TouchableOpacity, FlatList, Text } from 'react-native';
import { useUITheme, IconSymbol, RaisedCard } from '@mysuite/ui';

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
                <View className="flex-row items-center justify-between px-4 py-4 border-b border-light-darker/10 dark:border-highlight-dark/10">
                    <TouchableOpacity onPress={onClose} className="p-2 -ml-2">
                         <Text className="text-base font-semibold text-primary dark:text-primary-dark">Cancel</Text>
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-light dark:text-dark">{title}</Text>
                    <TouchableOpacity onPress={onClose} className="p-2 -mr-2">
                        <Text className="text-base font-bold text-primary dark:text-primary-dark">Done</Text>
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
                                    if (!multiSelect) onClose();
                                }}
                                className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl ${
                                    selected 
                                        ? 'bg-primary/5 dark:bg-primary/20 border-t-primary border-t-1 border-l-primary border-l-1' 
                                        : 'bg-light-lighter dark:bg-dark-lighter'
                                }`}
                            >
                                <Text className={`text-base font-semibold ${selected ? 'text-primary dark:text-primary-dark' : 'text-light dark:text-dark'}`}>
                                    {item.label || item.name}
                                </Text>
                            </RaisedCard>
                        );
                    }}
                />
            </View>
        </Modal>
    );
};
