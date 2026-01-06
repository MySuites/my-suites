import React, { useState, useEffect } from 'react';
import { TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUITheme, RaisedButton, IconSymbol } from '@mysuite/ui';
import { SelectionModal } from '../../components/ui/SelectionModal';
import { useWorkoutManager, fetchMuscleGroups } from '../../providers/WorkoutManagerProvider';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';

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
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader
        title="New Exercise"
        leftAction={<BackButton />}
        rightAction={
            <RaisedButton 
                onPress={handleCreate} 
                disabled={isSubmitting} 
                className="w-10 h-10 p-0 rounded-full bg-light-lighter dark:bg-dark-lighter" 
                variant="default"
                borderRadius={20}
            >
                {isSubmitting ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                    <IconSymbol name="checkmark" size={24} color={theme.primary} />
                )}
            </RaisedButton>
        }
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 p-6"
      >
        <View className="mt-28 mb-6">
            <Text className="text-base leading-6 font-semibold mb-2 text-light dark:text-dark">Name</Text>
            <TextInput 
                className="bg-light-lighter dark:bg-dark-lighter text-light dark:text-dark p-4 rounded-xl text-base border border-transparent dark:border-highlight-dark"
                placeholder="e.g. Bench Press" 
                placeholderTextColor={theme.textMuted || '#888'}
                value={name}
                onChangeText={setName}
            />
        </View>

        <View className="mb-6">
            <Text className="text-base leading-6 font-semibold mb-2 text-light dark:text-dark">Properties</Text>
            <TouchableOpacity 
                onPress={() => setShowTypeModal(true)}
                className="bg-light-lighter dark:bg-dark-lighter p-4 rounded-xl border border-transparent dark:border-highlight-dark flex-row justify-between items-center"
            >
                <Text numberOfLines={1} className="text-base leading-6 text-light dark:text-dark">
                    {properties.length > 0 
                        ? properties.map(p => p.label).join(', ') 
                        : 'Select Properties'}
                </Text>
                <IconSymbol name="chevron.right" size={16} color={theme.textMuted || '#888'} />
            </TouchableOpacity>
        </View>

        <View className="mb-6">
            <Text className="text-base leading-6 font-semibold mb-2 text-light dark:text-dark">Primary Muscle Group</Text>
            <TouchableOpacity 
                onPress={() => setShowPrimaryModal(true)}
                className="bg-light-lighter dark:bg-dark-lighter p-4 rounded-xl border border-transparent dark:border-highlight-dark flex-row justify-between items-center"
            >
                <Text className="text-base leading-6 text-light dark:text-dark">{primaryMuscle ? primaryMuscle.name : 'Select Primary Muscle'}</Text>
                <IconSymbol name="chevron.right" size={16} color={theme.textMuted || '#888'} />
            </TouchableOpacity>
        </View>

        <View className="mb-6">
            <Text className="text-base leading-6 font-semibold mb-2 text-light dark:text-dark">Secondary Muscle Groups</Text>
            <TouchableOpacity 
                onPress={() => setShowSecondaryModal(true)}
                className="bg-light-lighter dark:bg-dark-lighter p-4 rounded-xl border border-transparent dark:border-highlight-dark flex-row justify-between items-center"
            >
                <Text numberOfLines={1} className="text-base leading-6 text-light dark:text-dark">
                    {secondaryMuscles.length > 0 
                        ? secondaryMuscles.map(m => m.name).join(', ') 
                        : 'Select Secondary Muscles (Optional)'}
                </Text>
                <IconSymbol name="chevron.right" size={16} color={theme.textMuted || '#888'} />
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

    </View>
  );
}
