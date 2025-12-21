import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SavedWorkout } from '../../types';

interface WorkoutPreviewModalProps {
    visible: boolean;
    workout: SavedWorkout | null;
    onClose: () => void;
}

export const WorkoutPreviewModal = ({ visible, workout, onClose }: WorkoutPreviewModalProps) => {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
             <View className="flex-1 justify-end bg-black/50">
                 <View className="bg-background dark:bg-background_dark h-[60%] rounded-t-3xl overflow-hidden">
                     <View className="p-4 border-b border-border dark:border-border_dark flex-row justify-between items-center">
                         <Text className="text-xl font-bold text-apptext dark:text-apptext_dark">
                             {workout?.name || "Workout Details"}
                         </Text>
                         <TouchableOpacity 
                             onPress={onClose}
                             className="bg-surface dark:bg-surface_dark p-2 rounded-full"
                         >
                             <Text className="text-apptext dark:text-apptext_dark font-bold">Close</Text>
                         </TouchableOpacity>
                     </View>
                     <ScrollView className="p-4">
                         {workout?.exercises?.map((ex, idx) => (
                             <View key={idx} className="mb-4 bg-surface dark:bg-surface_dark p-3 rounded-xl">
                                 <Text className="text-lg font-semibold text-apptext dark:text-apptext_dark">
                                     {ex.name}
                                 </Text>
                                 <Text className="text-gray-500">
                                     {ex.sets} Sets
                                 </Text>
                                 {ex.setTargets && ex.setTargets.length > 0 ? (
                                     <View className="mt-2 pl-2 border-l-2 border-primary dark:border-primary_dark">
                                         {ex.setTargets.map((set, sIdx) => (
                                             <Text key={sIdx} className="text-apptext dark:text-apptext_dark">
                                                 Set {sIdx + 1}: {set.weight ? `${set.weight}lbs x ` : ""}{set.reps || 0} reps
                                             </Text>
                                         ))}
                                     </View>
                                 ) : (
                                      <Text className="text-gray-500 mt-1">Target: {ex.reps} reps</Text>
                                 )}
                             </View>
                         ))}
                         <View className="h-10" />
                     </ScrollView>
                 </View>
             </View>
         </Modal>
    );
};
