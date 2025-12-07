import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUITheme as useTheme } from '@mycsuite/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatSeconds } from '../utils/formatting';

// Mock data for the template
const MOCK_HISTORY = [
  { id: '1', date: '2023-10-27T10:00:00Z', name: 'Upper Body Power', duration: 3600, exercises: 5 },
  { id: '2', date: '2023-10-25T09:30:00Z', name: 'Leg Day', duration: 2700, exercises: 4 },
  { id: '3', date: '2023-10-23T18:15:00Z', name: 'Full Body HIIT', duration: 1800, exercises: 6 },
  { id: '4', date: '2023-10-20T07:00:00Z', name: 'Morning Cardio', duration: 1200, exercises: 1 },
];

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'History', headerBackTitle: 'Back' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Workout History</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_HISTORY}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.name || 'Untitled Workout'}</Text>
              <Text style={styles.itemDate}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.detailText}>Duration: {formatSeconds(item.duration)}</Text>
              <Text style={styles.detailText}>•</Text>
              <Text style={styles.detailText}>{item.exercises} Exercises</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workout history found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.surface,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    listContent: {
      padding: 16,
    },
    historyItem: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.surface, // Subtle border if needed
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    itemName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    itemDate: {
      fontSize: 14,
      color: theme.icon,
    },
    itemDetails: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailText: {
      fontSize: 14,
      color: theme.icon,
      marginRight: 8,
    },
    emptyContainer: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.icon,
      fontSize: 16,
    },
  });
