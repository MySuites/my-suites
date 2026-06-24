import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ExercisesScreen from '../../app/exercises/index';
import CreateExerciseScreen from '../../app/exercises/create';
import { useWorkoutManager, fetchExercises, fetchMuscleGroups } from '../../providers/WorkoutManagerProvider';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as RN from 'react-native';
import { DataRepository } from '../../providers/DataRepository';

const mockRN = RN;

// Mocks
jest.mock('../../providers/WorkoutManagerProvider', () => ({
    useWorkoutManager: jest.fn(),
    fetchExercises: jest.fn(),
    fetchMuscleGroups: jest.fn(),
}));

jest.mock('../../providers/ActiveWorkoutProvider', () => ({
    useActiveWorkout: jest.fn()
}));

jest.mock('../../providers/DataRepository', () => ({
    DataRepository: {
        getExercises: jest.fn(() => Promise.resolve([])),
    },
    inferEquipment: jest.fn(),
    inferMovementType: jest.fn()
}));

jest.mock('../../hooks/workouts/useExerciseStats', () => ({
    useExerciseStats: jest.fn(() => ({
        chartData: [],
        loadingChart: false,
        selectedMetric: 'weight',
        setSelectedMetric: jest.fn(),
        availableMetrics: ['weight']
    }))
}));

jest.mock('../../components/exercises/VariationTree', () => {
    return {
        VariationTree: ({ exercises, onSelect }: any) => (
            <mockRN.View testID="variation-tree">
                {exercises.map((e: any) => (
                    <mockRN.TouchableOpacity key={e.id} onPress={() => onSelect(e)}>
                        <mockRN.Text>{e.name}</mockRN.Text>
                    </mockRN.TouchableOpacity>
                ))}
            </mockRN.View>
        )
    };
});

jest.mock('expo-router', () => {
    const React = jest.requireActual('react');
    const mockStack = ({ children }: any) => <>{children}</>;
    const Screen = () => null;
    Screen.displayName = 'Screen';
    mockStack.Screen = Screen;
    return {
        useRouter: jest.fn(),
        useLocalSearchParams: jest.fn(),
        usePathname: jest.fn(),
        useFocusEffect: (callback: any) => {
            React.useEffect(() => {
                callback();
            }, [callback]);
        },
        Stack: mockStack
    };
});

jest.mock('@mysuite/auth', () => ({
    useAuth: () => ({ user: { id: 'test-user' } })
}));

jest.mock('@mysuite/ui', () => {
    return {
        useUITheme: () => ({ primary: 'blue', textMuted: 'gray' }),

        RaisedCard: (props: any) => {
            return <mockRN.TouchableOpacity {...props} />;
        },

        HollowedCard: ({ children }: any) => <mockRN.View>{children}</mockRN.View>,
        Skeleton: () => <mockRN.View />,
        useToast: () => ({ showToast: jest.fn() }),
        IconSymbol: ({ name }: any) => <mockRN.Text>Icon:{name}</mockRN.Text>,
        ScreenHeader: ({ title, rightAction }: any) => (
            <mockRN.View>
                <mockRN.Text>{title}</mockRN.Text>
                {rightAction}
            </mockRN.View>
        ),
        BackButton: () => <mockRN.View />
    };
});

// Mock SelectionModal (it's in components/ui/SelectionModal)
jest.mock('../../components/ui/SelectionModal', () => {
    return {
        SelectionModal: ({ visible, title, items, onSelect, onClose, multiSelect }: any) => visible ? (
            <mockRN.View testID="selection-modal">
                <mockRN.Text>{title}</mockRN.Text>
                {items.map((item: any) => (
                    <mockRN.TouchableOpacity key={item.id || item.value} onPress={() => { onSelect(item); if(!multiSelect) onClose(); }}>
                        <mockRN.Text>{item.name || item.label}</mockRN.Text>
                    </mockRN.TouchableOpacity>
                ))}
                <mockRN.TouchableOpacity onPress={onClose}><mockRN.Text>Done</mockRN.Text></mockRN.TouchableOpacity>
            </mockRN.View>
        ) : null
    };
});

describe('Exercise Management Integration', () => {
    const mockRouter = { push: jest.fn(), back: jest.fn() };
    
    beforeEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useLocalSearchParams as jest.Mock).mockReturnValue({});
        (useActiveWorkout as jest.Mock).mockReturnValue({
            hasActiveSession: false,
            addExercise: jest.fn()
        });
        (useWorkoutManager as jest.Mock).mockReturnValue({
            createCustomExercise: jest.fn().mockResolvedValue({ error: null })
        });
        (fetchExercises as jest.Mock).mockResolvedValue({ data: [
            { id: '1', name: 'Bench Press', category: 'Chest', properties: ['Weighted', 'Reps'] },
            { id: '2', name: 'Squat', category: 'Legs', properties: ['Weighted', 'Reps'] }
        ] });
        (fetchMuscleGroups as jest.Mock).mockResolvedValue({ data: [
            { id: 'm1', name: 'Chest' },
            { id: 'm2', name: 'Back' }
        ] });
    });

    describe('ExercisesScreen', () => {
        it('renders list and filters by search', async () => {
            jest.useFakeTimers();
            const { getByText, getByPlaceholderText, queryByText } = render(<ExercisesScreen />);
            
            // Wait for initial load to finish and render the exercises
            await waitFor(() => {
                expect(getByText('Bench Press')).toBeTruthy();
                expect(getByText('Squat')).toBeTruthy();
            });

            fireEvent.changeText(getByPlaceholderText('Search exercises...'), 'Bench');
            
            act(() => {
                jest.advanceTimersByTime(50);
            });
            
            await waitFor(() => {
                expect(getByText('Bench Press')).toBeTruthy();
                expect(queryByText('Squat')).toBeNull();
            });
            
            jest.useRealTimers();
        });

        it('normalizes spaces, dashes, and underscores in search filter', async () => {
            (fetchExercises as jest.Mock).mockResolvedValue({ data: [
                { id: '3', name: 'Push-up', category: 'Chest', properties: ['Bodyweight', 'Reps'] },
                { id: '2', name: 'Squat', category: 'Legs', properties: ['Weighted', 'Reps'] }
            ] });

            jest.useFakeTimers();
            const { getByText, getByPlaceholderText, queryByText } = render(<ExercisesScreen />);
            
            await waitFor(() => {
                expect(getByText('Push-up')).toBeTruthy();
                expect(getByText('Squat')).toBeTruthy();
            });

            // Search by "push up"
            fireEvent.changeText(getByPlaceholderText('Search exercises...'), 'push up');
            act(() => {
                jest.advanceTimersByTime(50);
            });
            expect(getByText('Push-up')).toBeTruthy();
            expect(queryByText('Squat')).toBeNull();

            // Search by "push_up"
            fireEvent.changeText(getByPlaceholderText('Search exercises...'), 'push_up');
            act(() => {
                jest.advanceTimersByTime(50);
            });
            expect(getByText('Push-up')).toBeTruthy();
            expect(queryByText('Squat')).toBeNull();

            // Search by "push-up"
            fireEvent.changeText(getByPlaceholderText('Search exercises...'), 'push-up');
            act(() => {
                jest.advanceTimersByTime(50);
            });
            expect(getByText('Push-up')).toBeTruthy();
            expect(queryByText('Squat')).toBeNull();
            
            jest.useRealTimers();
        });

        it('navigates to create when pencil clicked', async () => {
             const { getByText } = render(<ExercisesScreen />);
             await waitFor(() => {
                 expect(getByText('Bench Press')).toBeTruthy();
             });
             fireEvent.press(getByText('Icon:square.and.pencil'));
             expect(mockRouter.push).toHaveBeenCalledWith('/exercises/create');
        });

        it('groups default exercises forming a connected component and navigates to details on press', async () => {
            const mockDefaultExercises = [
                {
                    id: 'bodyweight_squat',
                    name: 'Bodyweight Squat',
                    muscle_groups: ['Legs'],
                    difficulty: 3.0,
                    equipment: 'bodyweight',
                    movementType: 'uniform',
                    nextVariations: ['sissy_squat']
                },
                {
                    id: 'sissy_squat',
                    name: 'Sissy Squat',
                    muscle_groups: ['Legs'],
                    difficulty: 3.5,
                    equipment: 'bodyweight',
                    movementType: 'uniform',
                    nextVariations: []
                }
            ];

            (fetchExercises as jest.Mock).mockResolvedValue({ data: mockDefaultExercises });

            const { getByText } = render(<ExercisesScreen />);

            // Wait for list to load and verify "Squat" group row is rendered
            await waitFor(() => {
                expect(getByText('Squat')).toBeTruthy();
            });

            // Press on the "Squat" group row
            fireEvent.press(getByText('Squat'));

            // Verify it navigated to details with the representative exercise
            expect(mockRouter.push).toHaveBeenCalledWith({
                pathname: '/exercises/details',
                params: { exercise: JSON.stringify(mockDefaultExercises[0]) }
            });
        });

        it('supports inline details overlay in select mode when group is pressed', async () => {
            const mockDefaultExercises = [
                {
                    id: 'bodyweight_squat',
                    name: 'Bodyweight Squat',
                    muscle_groups: ['Legs'],
                    difficulty: 3.0,
                    equipment: 'bodyweight',
                    movementType: 'uniform',
                    nextVariations: ['sissy_squat']
                },
                {
                    id: 'sissy_squat',
                    name: 'Sissy Squat',
                    muscle_groups: ['Legs'],
                    difficulty: 3.5,
                    equipment: 'bodyweight',
                    movementType: 'uniform',
                    nextVariations: []
                }
            ];

            const mockOnSelect = jest.fn();
            const mockOnClose = jest.fn();

            (fetchExercises as jest.Mock).mockResolvedValue({ data: mockDefaultExercises });
            (DataRepository.getExercises as jest.Mock).mockResolvedValue(mockDefaultExercises);

            const { getByText } = render(
                <ExercisesScreen mode="select" onSelect={mockOnSelect} onClose={mockOnClose} />
            );

            // Wait for list to load and verify "Squat" group is rendered
            await waitFor(() => {
                expect(getByText('Squat')).toBeTruthy();
            });

            // Pressing "Squat" should open ExerciseDetailsScreen inline for the representative exercise
            fireEvent.press(getByText('Squat'));

            // Wait for any async/load effects
            await act(async () => {
                await Promise.resolve();
            });

            // Since it rendered inline Details screen, the title should change/show bodyweight squat
            expect(getByText('Bodyweight Squat')).toBeTruthy();

            // And since mode === 'select', the sticky bottom button "Select Bodyweight Squat" should be rendered
            expect(getByText('Select Bodyweight Squat')).toBeTruthy();

            // Clicking select button should call mockOnSelect with the exercise, and mockOnClose
            fireEvent.press(getByText('Select Bodyweight Squat'));
            expect(mockOnSelect).toHaveBeenCalledWith([mockDefaultExercises[0]]);
            expect(mockOnClose).toHaveBeenCalled();
        });

        it('groups default exercises correctly without blending squats and lunges', async () => {
            const mockDefaultExercises = [
                // Squats component
                {
                    id: 'bodyweight_squat',
                    name: 'Bodyweight Squat',
                    muscle_groups: ['Quadriceps'],
                    difficulty: 3.0,
                    nextVariations: ['sissy_squat']
                },
                {
                    id: 'sissy_squat',
                    name: 'Sissy Squat',
                    muscle_groups: ['Quadriceps'],
                    difficulty: 2.0,
                    nextVariations: []
                },
                {
                    id: 'weighted_squat',
                    name: 'Weighted Squat',
                    muscle_groups: ['Quadriceps'],
                    difficulty: 3.0,
                    nextVariations: []
                },
                // Lunges component
                {
                    id: 'lunges',
                    name: 'Lunges',
                    muscle_groups: ['Quadriceps'],
                    difficulty: 7.5,
                    nextVariations: []
                },
                {
                    id: 'split_squat',
                    name: 'Split Squat',
                    muscle_groups: ['Quadriceps'],
                    difficulty: 2.5,
                    nextVariations: []
                },
                {
                    id: 'weighted_lunges',
                    name: 'Weighted Lunges',
                    muscle_groups: ['Quadriceps'],
                    difficulty: 4.5,
                    nextVariations: []
                },
                {
                    id: 'bulgarian_split_squat',
                    name: 'Bulgarian Split Squat',
                    muscle_groups: ['Quadriceps'],
                    difficulty: 5.0,
                    nextVariations: []
                }
            ];

            (fetchExercises as jest.Mock).mockResolvedValue({ data: mockDefaultExercises });

            const { getByText } = render(<ExercisesScreen />);

            await waitFor(() => {
                expect(getByText('Squat')).toBeTruthy();
                expect(getByText('Weighted Squat')).toBeTruthy();
                expect(getByText('Lunges')).toBeTruthy();
                expect(getByText('Weighted Lunges')).toBeTruthy();
                expect(getByText('Split Squat')).toBeTruthy();
                expect(getByText('Bulgarian Split Squat')).toBeTruthy();
            });
        });

        it('groups default exercises correctly without blending back lever and pull-ups', async () => {
            const mockDefaultExercises = [
                // Back lever component
                {
                    id: 'tuck_back_lever',
                    name: 'Tuck Back Lever',
                    muscle_groups: ['Abdominals'],
                    difficulty: 1.0,
                    nextVariations: ['advanced_tuck_back_lever']
                },
                {
                    id: 'advanced_tuck_back_lever',
                    name: 'Advanced Tuck Back Lever',
                    muscle_groups: ['Abdominals'],
                    difficulty: 2.0,
                    nextVariations: ['back_lever']
                },
                {
                    id: 'back_lever',
                    name: 'Back Lever',
                    muscle_groups: ['Abdominals'],
                    difficulty: 1.5,
                    nextVariations: ['back_lever_pull_up']
                },
                {
                    id: 'back_lever_pull_up',
                    name: 'Back Lever Pull-up',
                    muscle_groups: ['Other'],
                    difficulty: 3.5,
                    nextVariations: []
                },
                // Pull-ups component
                {
                    id: 'pull_up',
                    name: 'Pull-up',
                    muscle_groups: ['Lats'],
                    difficulty: 6.5,
                    nextVariations: []
                },
                {
                    id: 'weighted_pull_up',
                    name: 'Weighted Pull-up',
                    muscle_groups: ['Lats'],
                    difficulty: 7.0,
                    nextVariations: []
                }
            ];

            (fetchExercises as jest.Mock).mockResolvedValue({ data: mockDefaultExercises });

            const { getByText } = render(<ExercisesScreen />);

            await waitFor(() => {
                expect(getByText('Back Lever')).toBeTruthy();
                expect(getByText('Pull-up')).toBeTruthy();
                expect(getByText('Weighted Pull-up')).toBeTruthy();
            });
        });

        it('groups default exercises correctly without blending planche and push-ups', async () => {
            const mockDefaultExercises = [
                // Planche component
                {
                    id: 'tuck_planche',
                    name: 'Tuck Planche',
                    muscle_groups: ['Shoulders'],
                    difficulty: 4.5,
                    nextVariations: ['advanced_tuck_planche']
                },
                {
                    id: 'advanced_tuck_planche',
                    name: 'Advanced Tuck Planche',
                    muscle_groups: ['Shoulders'],
                    difficulty: 6.5,
                    nextVariations: ['planche_push_up']
                },
                {
                    id: 'planche_push_up',
                    name: 'Planche Push-up',
                    muscle_groups: ['Shoulders'],
                    difficulty: 8.5,
                    nextVariations: []
                },
                // Push-up component
                {
                    id: 'push_up',
                    name: 'Push-up',
                    muscle_groups: ['Chest'],
                    difficulty: 1.0,
                    nextVariations: ['incline_push_up']
                },
                {
                    id: 'incline_push_up',
                    name: 'Incline Push-up',
                    muscle_groups: ['Chest'],
                    difficulty: 0.5,
                    nextVariations: []
                }
            ];

            (fetchExercises as jest.Mock).mockResolvedValue({ data: mockDefaultExercises });

            const { getByText } = render(<ExercisesScreen />);

            await waitFor(() => {
                expect(getByText('Planche')).toBeTruthy();
                expect(getByText('Push-up')).toBeTruthy();
            });
        });

        it('does not group chest fly exercises anymore', async () => {
            const mockDefaultExercises = [
                {
                    id: 'dumbbell_fly',
                    name: 'Dumbbell Fly',
                    muscle_groups: ['Chest'],
                    difficulty: 5.5,
                    nextVariations: []
                },
                {
                    id: 'cable_fly',
                    name: 'Cable Fly',
                    muscle_groups: ['Chest'],
                    difficulty: 8.0,
                    nextVariations: []
                },
                {
                    id: 'machine_chest_fly',
                    name: 'Machine Chest Fly',
                    muscle_groups: ['Chest'],
                    difficulty: 4.5,
                    nextVariations: []
                }
            ];

            (fetchExercises as jest.Mock).mockResolvedValue({ data: mockDefaultExercises });

            const { getByText, queryByText } = render(<ExercisesScreen />);

            await waitFor(() => {
                expect(queryByText('Chest Fly')).toBeNull();
                expect(getByText('Dumbbell Fly')).toBeTruthy();
                expect(getByText('Cable Fly')).toBeTruthy();
                expect(getByText('Machine Chest Fly')).toBeTruthy();
            });
        });
    });

    describe('CreateExerciseScreen', () => {
        it('completes full creation flow', async () => {
            const mockCreateCustomExercise = jest.fn().mockResolvedValue({ error: null });
            (useWorkoutManager as jest.Mock).mockReturnValue({
                createCustomExercise: mockCreateCustomExercise
            });

            const { getByPlaceholderText, getByText, queryByTestId } = render(<CreateExerciseScreen />);
            
            // 1. Enter name
            fireEvent.changeText(getByPlaceholderText('e.g. Bench Press'), 'Custom Pushup');
            
            // 2. Select primary muscle
            fireEvent.press(getByText('Select Primary Muscle'));
            
            await waitFor(() => {
                expect(queryByTestId('selection-modal')).toBeTruthy();
                expect(getByText('Chest')).toBeTruthy();
            });
            fireEvent.press(getByText('Chest'));
            
            await waitFor(() => {
                expect(queryByTestId('selection-modal')).toBeNull();
                expect(getByText('Chest')).toBeTruthy(); // Should show selected muscle on button
            });

            // 3. Select secondary muscles (multi-select)
            fireEvent.press(getByText('Select Secondary Muscles (Optional)'));
            fireEvent.press(getByText('Back'));
            fireEvent.press(getByText('Done'));
            
            await waitFor(() => {
                expect(getByText('Back')).toBeTruthy();
            });

            // 4. Submit
            fireEvent.press(getByText('Icon:checkmark'));
            
            await waitFor(() => {
                expect(mockCreateCustomExercise).toHaveBeenCalledWith(
                    'Custom Pushup',
                    'Weighted, Reps', // default properties
                    'm1', // Chest id
                    ['m2'] // Back id
                );
                expect(mockRouter.back).toHaveBeenCalled();
            });
        });
    });
});
