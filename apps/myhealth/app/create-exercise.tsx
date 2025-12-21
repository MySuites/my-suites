import React, { useState, useEffect } from 'react';
import { TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../components/ui/ThemedView';
import { ThemedText } from '../components/ui/ThemedText';
import { IconSymbol } from '../components/ui/icon-symbol';
import { SelectionModal } from '../components/ui/SelectionModal';
import { useUITheme } from '@mycsuite/ui';
import { useWorkoutManager, fetchMuscleGroups } from '../hooks/useWorkoutManager';

const EXERCISE_PROPERTIES = [
    { label: 'Weighted', value: 'Weighted' },
    { label: 'Bodyweight', value: 'Bodyweight' },
    { label: 'Reps', value: 'Reps' },
    { label: 'Duration', value: 'Duration' },
    { label: 'Distance', value: 'Distance' },
];

export default function CreateExerciseScreen() {
  const router = useRouter();
  const theme = useUITheme();
  const { createCustomExercise } = useWorkoutManager();
  
  const [name, setName] = useState('');
  const [properties, setProperties] = useState<any[]>([EXERCISE_PROPERTIES[0], EXERCISE_PROPERTIES[2]]); // Default Weighted, Reps
  const [muscleGroups, setMuscleGroups] = useState<any[]>([]);
  const [primaryMuscle, setPrimaryMuscle] = useState<any>(null);
  const [secondaryMuscles, setSecondaryMuscles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showPrimaryModal, setShowPrimaryModal] = useState(false);
  const [showSecondaryModal, setShowSecondaryModal] = useState(false);

  useEffect(() => {
    loadMuscleGroups();
  }, []);

  const loadMuscleGroups = async () => {
    const { data } = await fetchMuscleGroups();
    if (data) {
        setMuscleGroups(data);
        // Default primary to something if available, or keep null
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
        Alert.alert('Error', 'Please enter an exercise name');
        return;
    }
    if (!primaryMuscle) {
        Alert.alert('Error', 'Please select a primary muscle group');
        return;
    }

    setIsSubmitting(true);
    try {
        const secondaryIds = secondaryMuscles.map(m => m.id);
        const typeString = properties.map(p => p.value).join(', ');
        const { error } = await createCustomExercise(name, typeString, primaryMuscle.id, secondaryIds);
        if (error) {
            Alert.alert('Error', 'Failed to create exercise');
            console.error(error);
        } else {
            router.back();
        }
    } catch (e) {
        Alert.alert('Error', 'An unexpected error occurred');
        console.error(e);
    } finally {
        setIsSubmitting(false);
    }
  };

  const toggleSecondaryMuscle = (muscle: any) => {
    if (secondaryMuscles.some(m => m.id === muscle.id)) {
        setSecondaryMuscles(prev => prev.filter(m => m.id !== muscle.id));
    } else {
        setSecondaryMuscles(prev => [...prev, muscle]);
    }
  };

  const toggleProperty = (prop: any) => {
    if (properties.some(p => p.value === prop.value)) {
        setProperties(prev => prev.filter(p => p.value !== prop.value));
    } else {
        setProperties(prev => [...prev, prop]);
    }
  };

  return (
    <ThemedView className="flex-1">
      <View className="flex-row items-center justify-between p-4 border-b border-surface dark:border-white/10 pt-4 android:pt-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ThemedText type="link">Cancel</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle">New Exercise</ThemedText>
        <TouchableOpacity onPress={handleCreate} disabled={isSubmitting} className="p-2">
            <ThemedText type="link" style={{ fontWeight: 'bold', opacity: isSubmitting ? 0.5 : 1 }}>Save</ThemedText>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 p-6"
      >
        <View className="mb-6">
            <ThemedText type="defaultSemiBold" className="mb-2">Name</ThemedText>
            <TextInput 
                className="bg-surface dark:bg-surface_dark text-apptext dark:text-apptext_dark p-4 rounded-xl text-base border border-transparent dark:border-white/10"
                placeholder="e.g. Bench Press" 
                placeholderTextColor={theme.icon}
                value={name}
                onChangeText={setName}
            />
        </View>

        <View className="mb-6">
            <ThemedText type="defaultSemiBold" className="mb-2">Properties</ThemedText>
            <TouchableOpacity 
                onPress={() => setShowTypeModal(true)}
                className="bg-surface dark:bg-surface_dark p-4 rounded-xl border border-transparent dark:border-white/10 flex-row justify-between items-center"
            >
                <ThemedText numberOfLines={1}>
                    {properties.length > 0 
                        ? properties.map(p => p.label).join(', ') 
                        : 'Select Properties'}
                </ThemedText>
                <IconSymbol name="chevron.right" size={16} color={theme.icon || '#888'} />
            </TouchableOpacity>
        </View>

        <View className="mb-6">
            <ThemedText type="defaultSemiBold" className="mb-2">Primary Muscle Group</ThemedText>
            <TouchableOpacity 
                onPress={() => setShowPrimaryModal(true)}
                className="bg-surface dark:bg-surface_dark p-4 rounded-xl border border-transparent dark:border-white/10 flex-row justify-between items-center"
            >
                <ThemedText>{primaryMuscle ? primaryMuscle.name : 'Select Primary Muscle'}</ThemedText>
                <IconSymbol name="chevron.right" size={16} color={theme.icon || '#888'} />
            </TouchableOpacity>
        </View>

        <View className="mb-6">
            <ThemedText type="defaultSemiBold" className="mb-2">Secondary Muscle Groups</ThemedText>
            <TouchableOpacity 
                onPress={() => setShowSecondaryModal(true)}
                className="bg-surface dark:bg-surface_dark p-4 rounded-xl border border-transparent dark:border-white/10 flex-row justify-between items-center"
            >
                <ThemedText numberOfLines={1}>
                    {secondaryMuscles.length > 0 
                        ? secondaryMuscles.map(m => m.name).join(', ') 
                        : 'Select Secondary Muscles (Optional)'}
                </ThemedText>
                <IconSymbol name="chevron.right" size={16} color={theme.icon || '#888'} />
            </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* Modals */}
      <SelectionModal
          visible={showTypeModal}
          onClose={() => setShowTypeModal(false)}
          title="Select Properties"
          items={EXERCISE_PROPERTIES}
          onSelect={toggleProperty}
          isSelected={(item) => properties.some(p => p.value === item.value)}
          multiSelect={true}
      />

      <SelectionModal
          visible={showPrimaryModal}
          onClose={() => setShowPrimaryModal(false)}
          title="Select Primary Muscle"
          items={muscleGroups}
          onSelect={setPrimaryMuscle}
          isSelected={(item) => item.id === primaryMuscle?.id}
      />

      <SelectionModal
          visible={showSecondaryModal}
          onClose={() => setShowSecondaryModal(false)}
          title="Select Secondary Muscles"
          items={muscleGroups.filter(m => m.id !== primaryMuscle?.id)} // Exclude primary
          onSelect={toggleSecondaryMuscle}
          isSelected={(item) => secondaryMuscles.some(m => m.id === item.id)}
          multiSelect={true}
      />

    </ThemedView>
  );
}
