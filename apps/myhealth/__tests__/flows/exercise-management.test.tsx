import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ExercisesScreen from '../../app/exercises/index';
import CreateExerciseScreen from '../../app/exercises/create';
import { useWorkoutManager, fetchExercises, fetchMuscleGroups } from '../../providers/WorkoutManagerProvider';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as RN from 'react-native';

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

jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
    useLocalSearchParams: jest.fn(),
    usePathname: jest.fn()
}));

jest.mock('@mysuite/auth', () => ({
    useAuth: () => ({ user: { id: 'test-user' } })
}));

jest.mock('@mysuite/ui', () => {
    return {
        useUITheme: () => ({ primary: 'blue', textMuted: 'gray' }),

        RaisedCard: (props: any) => {
            const { TouchableOpacity } = require('react-native');
            return <TouchableOpacity {...props} />;
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
            const { getByText, getByPlaceholderText, queryByText } = render(<ExercisesScreen />);
            
            // Wait for initial load
            await waitFor(() => expect(fetchExercises).toHaveBeenCalled());
            
            await waitFor(() => {
                expect(getByText('Bench Press')).toBeTruthy();
                expect(getByText('Squat')).toBeTruthy();
            });

            fireEvent.changeText(getByPlaceholderText('Search exercises...'), 'Bench');
            
            expect(getByText('Bench Press')).toBeTruthy();
            expect(queryByText('Squat')).toBeNull();
        });

        it('navigates to create when pencil clicked', async () => {
             const { getByText } = render(<ExercisesScreen />);
             fireEvent.press(getByText('Icon:square.and.pencil'));
             expect(mockRouter.push).toHaveBeenCalledWith('/exercises/create');
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
            // Wait for muscle groups to load (fetched in useEffect)
            await waitFor(() => expect(fetchMuscleGroups).toHaveBeenCalled());
            
            fireEvent.press(getByText('Select Primary Muscle'));
            
            await waitFor(() => expect(queryByTestId('selection-modal')).toBeTruthy());
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
