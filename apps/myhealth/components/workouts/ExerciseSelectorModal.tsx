import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, ScrollView } from 'react-native';
import { useUITheme, RaisedButton, HollowedCard, Skeleton } from '@mysuite/ui';
import { IconSymbol } from '../ui/icon-symbol';


interface ExerciseSelectorModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (exercise: any) => void;
    exercises: any[];
    isLoading: boolean;
}

export const ExerciseSelectorModal = ({
    visible,
    onClose,
    onSelect,
    exercises,
    isLoading
}: ExerciseSelectorModalProps) => {
    const theme = useUITheme();
    const [exerciseSearchQuery, setExerciseSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const uniqueCategories = ["All", ...Array.from(new Set(exercises.map(e => e.category))).filter(Boolean).sort()];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-light dark:bg-dark">
                <View className="flex-row items-center justify-between p-4 border-b border-light dark:border-white/10 pt-4 android:pt-10">
                    <TouchableOpacity onPress={onClose} className="p-2">
                            <Text className="text-base leading-[30px] text-[#0a7ea4]">Cancel</Text>
                    </TouchableOpacity>
                    <Text className="text-xl font-bold">Add Exercise</Text>
                    <View style={{ width: 50 }} />
                </View>
                
                <View className="flex-1 p-4">
                    {/* Filter Chips */}
                    <View className="mb-4">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {uniqueCategories.map((category) => (
                                <TouchableOpacity 
                                    key={category} 
                                    onPress={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-full mr-2 border ${selectedCategory === category ? 'bg-primary dark:bg-primary-dark border-transparent' : 'bg-transparent border-light dark:border-white/10'}`}
                                >
                                    <Text className={`font-semibold ${selectedCategory === category ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                    
                    <View className="flex-row items-center bg-light-lighter dark:bg-border-dark rounded-lg px-2.5 h-12 mb-4 border border-black/5 dark:border-white/10">
                        <IconSymbol name="magnifyingglass" size={20} color={theme.icon || '#888'} />
                        <TextInput
                            className="flex-1 ml-2 text-base h-full text-light dark:text-dark"
                            placeholder="Search exercises..."
                            placeholderTextColor={theme.icon || '#888'}
                            value={exerciseSearchQuery}
                            onChangeText={setExerciseSearchQuery}
                            autoCorrect={false}
                        />
                        {exerciseSearchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setExerciseSearchQuery('')}>
                                    <IconSymbol name="xmark.circle.fill" size={20} color={theme.icon || '#888'} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {isLoading ? (
                        <View className="mt-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <View key={i} className="flex-row items-center justify-between py-3 border-b border-light dark:border-dark">
                                    <View className="flex-1">
                                        <Skeleton height={22} width="55%" className="mb-2" />
                                        <Skeleton height={14} width="35%" />
                                    </View>
                                    <View className="w-10 h-10 rounded-full bg-light-darker/10 dark:bg-highlight-dark/10" />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <FlatList
                            data={exercises.filter(ex => {
                                const matchesSearch = ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase());
                                const matchesCategory = selectedCategory === "All" || ex.category === selectedCategory;
                                return matchesSearch && matchesCategory;
                            })}
                            keyExtractor={(item) => item.id}
                            className="flex-1"
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    className="flex-row items-center justify-between py-3 border-b border-light dark:border-dark"
                                    onPress={() => {
                                        onSelect(item);
                                        setExerciseSearchQuery(""); // Clear search on select
                                    }}
                                >
                                    <View>
                                        <Text className="text-base leading-6 font-semibold" style={{ fontSize: 18 }}>{item.name}</Text>
                                        <Text className="text-gray-500 dark:text-gray-400 text-sm">
                                            {item.category} • {item.properties?.join(', ') || item.type || item.rawType}
                                        </Text> 
                                    </View>
                                    <RaisedButton
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onSelect(item);
                                            setExerciseSearchQuery(""); // Clear search on select
                                        }}
                                        className="w-10 h-10 p-0 rounded-full bg-light-lighter dark:bg-dark-lighter"
                                        borderRadius={20}
                                    >
                                        <IconSymbol name="plus" size={24} color={theme.primary} />
                                    </RaisedButton>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View className="py-8">
                                    <HollowedCard className="p-8">
                                        <Text className="text-center text-light-muted dark:text-dark-muted">
                                            No exercises found. Try a different search.
                                        </Text>
                                    </HollowedCard>
                                </View>
                            }
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};
