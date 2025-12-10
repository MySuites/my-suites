import { StyleSheet, FlatList, TouchableOpacity, View } from 'react-native'; // ID: 2225d6a8-644c-49dc-874e-ef431dd7ddcf, 19dc8f02-b90c-4e07-9dad-1191f01d8f5a
import { useRouter } from 'expo-router';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedView } from '../components/ui/ThemedView';
import { useUITheme } from '@mycsuite/ui';
import { IconSymbol } from '../components/ui/icon-symbol';

export default function ExercisesScreen() {
  const router = useRouter();
  const theme = useUITheme();
    
  // TODO: In the future, this should fetch from a global exercise database
  const allExercises = [
      { id: 'pushups', name: 'Push Ups', category: 'Chest' },
      { id: 'squats', name: 'Squats', category: 'Legs' },
      { id: 'pullups', name: 'Pull Ups', category: 'Back' },
      { id: 'bench', name: 'Bench Press', category: 'Chest' },
      { id: 'deadlift', name: 'Deadlift', category: 'Back' },
      { id: 'lunges', name: 'Lunges', category: 'Legs' },
      { id: 'plank', name: 'Plank', category: 'Core' },
      { id: 'crunches', name: 'Crunches', category: 'Core' },
  ];

  const styles = makeStyles(theme);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
           <ThemedText type="link">Close</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle">Exercises</ThemedText>
        <View style={{width: 50}} /> 
      </ThemedView>
      
      <FlatList
        data={allExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item}>
            <View>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={{color: theme.icon ?? '#888', fontSize: 12}}>{item.category}</ThemedText> 
            </View>
            <IconSymbol name="chevron.right" size={20} color={theme.icon ?? '#888'} />
          </TouchableOpacity>
        )}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </ThemedView>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.surface,
  },
  closeButton: {
      padding: 8,
  },
  list: {
      flex: 1,
  },
  item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.surface,
  }
});
