import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';
import { BodyWeightChart } from './BodyWeightChart';

// Defined locally to avoid circular dependencies if any
type DateRange = 'Day' | 'Week' | 'Month' | 'All';

interface BodyWeightCardProps {
  weight: number | null;
  history: { value: number; label: string; date: string; spineIndex?: number }[];
  onLogWeight: () => void;
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  primaryColor?: string;
  textColor?: string;
}

export function BodyWeightCard({ 
  weight, 
  history, 
  onLogWeight,
  selectedRange,
  onRangeChange,
  primaryColor,
  textColor,
}: BodyWeightCardProps) {

  return (
    <View className="p-4 rounded-xl mb-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center mr-3">
                 <IconSymbol name="scalemass.fill" size={18} color="#3b82f6" />
            </View>
            <Text className="font-semibold text-base text-gray-900 dark:text-white">Body Weight</Text>
        </View>
        <Pressable 
            onPress={onLogWeight}
            className="bg-blue-500 rounded-full p-1.5"
        >
          <IconSymbol name="plus" size={16} color="white" />
        </Pressable>
      </View>
      
      <View className="mt-2">
        {weight ? (
            <View>
                <View className="flex-row justify-between items-end mb-4">
                    <View className="flex-row items-baseline">
                        <Text className="text-3xl font-bold mr-1 text-gray-900 dark:text-white">{weight}</Text>
                        <Text className="text-gray-500 text-sm">lbs</Text>
                    </View>
                    
                    <View className="flex-row bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5">
                        <Pressable
                            onPress={() => onRangeChange('Day')}
                            className="px-3 py-1 rounded-md"
                            style={{ 
                                backgroundColor: selectedRange === 'Day' ? 'white' : 'transparent',
                                shadowOpacity: selectedRange === 'Day' ? 0.1 : 0,
                                shadowOffset: { width: 0, height: 1 },
                                shadowRadius: 2,
                                elevation: selectedRange === 'Day' ? 2 : 0,
                            }}
                        >
                            <Text 
                                className="text-xs font-medium"
                                style={{ color: selectedRange === 'Day' ? '#111827' : '#6b7280' }}
                            >
                                Day
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => onRangeChange('Week')}
                            className="px-3 py-1 rounded-md"
                            style={{ 
                                backgroundColor: selectedRange === 'Week' ? 'white' : 'transparent',
                                shadowOpacity: selectedRange === 'Week' ? 0.1 : 0,
                                shadowOffset: { width: 0, height: 1 },
                                shadowRadius: 2,
                                elevation: selectedRange === 'Week' ? 2 : 0,
                            }}
                        >
                            <Text 
                                className="text-xs font-medium"
                                style={{ color: selectedRange === 'Week' ? '#111827' : '#6b7280' }}
                            >
                                Week
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => onRangeChange('Month')}
                            className="px-3 py-1 rounded-md"
                            style={{ 
                                backgroundColor: selectedRange === 'Month' ? 'white' : 'transparent',
                                shadowOpacity: selectedRange === 'Month' ? 0.1 : 0,
                                shadowOffset: { width: 0, height: 1 },
                                shadowRadius: 2,
                                elevation: selectedRange === 'Month' ? 2 : 0,
                            }}
                        >
                            <Text 
                                className="text-xs font-medium"
                                style={{ color: selectedRange === 'Month' ? '#111827' : '#6b7280' }}
                            >
                                Month
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => onRangeChange('All')}
                            className="px-3 py-1 rounded-md"
                            style={{ 
                                backgroundColor: selectedRange === 'All' ? 'white' : 'transparent',
                                shadowOpacity: selectedRange === 'All' ? 0.1 : 0,
                                shadowOffset: { width: 0, height: 1 },
                                shadowRadius: 2,
                                elevation: selectedRange === 'All' ? 2 : 0,
                            }}
                        >
                            <Text 
                                className="text-xs font-medium"
                                style={{ color: selectedRange === 'All' ? '#111827' : '#6b7280' }}
                            >
                                All
                            </Text>
                        </Pressable>
                    </View>
                </View>
                <BodyWeightChart 
                    data={history} 
                    color={primaryColor}
                    textColor={textColor}
                    maxPoints={selectedRange === 'Day' ? 17 : selectedRange === 'Week' ? 13 : selectedRange === 'Month' ? 13 : undefined}
                    selectedRange={selectedRange}
                />
            </View>
        ) : (
            <Text className="text-gray-400 text-sm italic">No weight recorded</Text>
        )}
      </View>
    </View>
  );
}
