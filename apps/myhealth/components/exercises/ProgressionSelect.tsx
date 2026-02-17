import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Exercise } from '../../utils/workout-api/types';
import { useUITheme, RaisedCard, IconSymbol } from '@mysuite/ui';

interface Props {
  currentExercise: Exercise;
  progressionExercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  onSetActive: (exercise: Exercise) => void;
}

export function ProgressionSelect({ currentExercise, progressionExercises, onSelect, onSetActive }: Props) {
  const theme = useUITheme();

  if (!progressionExercises || progressionExercises.length === 0) return null;

  // Find active progression



  // Sort by level
  const sortedExercises = [...progressionExercises].sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0));

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ 
          fontSize: 18, 
          fontWeight: '600', 
          color: theme.text, 
          marginBottom: 12 
      }}>
        Difficulty
      </Text>
      
      <RaisedCard style={{ padding: 0, overflow: 'hidden' }}>
        {sortedExercises.map((ex, index) => {
          const isCurrent = ex.id === currentExercise.id;
          const isActive = ex.isActiveProgression;

          
          return (
            <Pressable
              key={ex.id}
              onPress={() => onSelect(ex)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: isCurrent ? (theme.bgLight || '#FFF5F5') : (theme.card || '#EAD4D4'),
                borderBottomWidth: index < sortedExercises.length - 1 ? 1 : 0,
                borderBottomColor: theme.border || 'rgba(0,0,0,0.05)',
                opacity: pressed ? 0.7 : 1
              })}
            >
              {/* Level Indicator */}
              <View style={{ 
                width: 28, 
                height: 28, 
                borderRadius: 14, 
                backgroundColor: isActive ? (theme.primary || '#FF6F61') : (isCurrent ? 'rgba(0,0,0,0.1)' : 'transparent'),
                borderWidth: isActive ? 0 : 1,
                borderColor: theme.text,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                opacity: isActive ? 1 : 0.5
              }}>
                {isActive ? (
                   <IconSymbol name="checkmark" size={16} color="#FFF" />
                ) : (
                   <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.text }}>{ex.difficulty}</Text>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ 
                    fontSize: 16, 
                    fontWeight: isCurrent || isActive ? '600' : '400',
                    color: theme.text,
                    opacity: isCurrent || isActive ? 1 : 0.8
                }}>
                  {ex.name}
                </Text>
              </View>

              {isCurrent && !isActive && (
                  <Pressable 
                    onPress={() => {
                        Alert.alert(
                            "Set Active Level", 
                            `Do you want to set ${ex.name} as your current level for this progression?`,
                            [
                                { text: "Cancel", style: "cancel" },
                                { text: "Set Active", onPress: () => onSetActive(ex) }
                            ]
                        );
                    }}
                    style={{ padding: 8 }}
                  >
                     <Text style={{ color: theme.primary || '#FF6F61', fontWeight: '600', fontSize: 14 }}>Set Active</Text>
                  </Pressable>
              )}
              
              {isActive && (
                  <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '600' }}>Current</Text>
              )}

            </Pressable>
          );
        })}
      </RaisedCard>
    </View>
  );
}
