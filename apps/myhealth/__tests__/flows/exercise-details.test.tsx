import React from 'react';
import { render, fireEvent, act, within } from '@testing-library/react-native';
import ExerciseDetailsScreen from '../../app/exercises/details';
import { useExerciseStats } from '../../hooks/workouts/useExerciseStats';
import { useLocalSearchParams } from 'expo-router';
import { DataRepository } from '../../providers/DataRepository';
import * as RN from 'react-native';

const mockRN = RN;

// Mocks
jest.mock('../../hooks/workouts/useExerciseStats', () => ({
    useExerciseStats: jest.fn()
}));

jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
    useLocalSearchParams: jest.fn()
}));

jest.mock('@mysuite/auth', () => ({
    useAuth: () => ({ user: { id: 'test-user' } })
}));

jest.mock('../../providers/WorkoutManagerProvider', () => ({
    useWorkoutManager: () => ({
        deleteCustomExercise: jest.fn()
    })
}));

jest.mock('../../providers/DataRepository', () => ({
    DataRepository: {
        getExercises: jest.fn(() => Promise.resolve([])),
    }
}));

jest.mock('@mysuite/ui', () => ({
    useUITheme: () => ({ primary: 'blue', text: 'black' }),
    IconSymbol: () => null,
    RaisedCard: (props: any) => { 
        return <mockRN.TouchableOpacity {...props} />;
    },
}));

jest.mock('../../components/exercises/ExerciseChart', () => {
    return {
        ExerciseChart: ({ selectedMetric }: any) => (
            <mockRN.View>
                <mockRN.Text>Chart:{selectedMetric}</mockRN.Text>
            </mockRN.View>
        )
    };
});

jest.mock('../../components/ui/ScreenHeader', () => {
    return {
        ScreenHeader: ({ title }: any) => (
            <mockRN.View>
                <mockRN.Text>{title}</mockRN.Text>
            </mockRN.View>
        )
    };
});

jest.mock('../../components/ui/BackButton', () => {
    return {
        BackButton: () => <mockRN.View />
    };
});

// Mock VariationTree for testing inside the screen
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

describe('Exercise Details Integration', () => {
    const mockExercise = {
        id: 'ex1',
        name: 'Handstand Pushup',
        muscle_groups: ['Shoulders'],
        properties: ['Bodyweight', 'Reps'],
        sets: 3,
        reps: 10,
        completedSets: 0
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useLocalSearchParams as jest.Mock).mockReturnValue({ exercise: JSON.stringify(mockExercise) });
        (useExerciseStats as jest.Mock).mockReturnValue({
            chartData: [],
            loadingChart: false,
            selectedMetric: 'Max Weight',
            setSelectedMetric: jest.fn(),
            availableMetrics: ['Max Weight']
        });
        (DataRepository.getExercises as jest.Mock).mockResolvedValue([]);
    });

    it('renders exercise details and chart', () => {
        const { getByText } = render(<ExerciseDetailsScreen />);
        
        expect(getByText('Handstand Pushup')).toBeTruthy();
        expect(getByText('Shoulders', { includeHiddenElements: true })).toBeTruthy();
        expect(getByText('Chart:Max Weight')).toBeTruthy();
        expect(getByText('Bodyweight', { includeHiddenElements: true })).toBeTruthy();
        expect(getByText('Reps', { includeHiddenElements: true })).toBeTruthy();
    });

    it('renders placeholder when exercise not found', () => {
        (useLocalSearchParams as jest.Mock).mockReturnValue({ exercise: 'invalid' });
        const { getByText } = render(<ExerciseDetailsScreen />);
        expect(getByText('Exercise not found.')).toBeTruthy();
    });

    it('renders variations tab and filters list correctly', async () => {
        const mockExercises = [
            {
                id: 'dumbbell_curl',
                name: 'Dumbbell Curl',
                muscle_groups: ['Biceps'],
                properties: ['Weighted', 'Reps'],
                equipment: 'dumbbell',
                movementType: 'unilateral',
                nextVariations: ['barbell_curl']
            },
            {
                id: 'barbell_curl',
                name: 'Barbell Curl',
                muscle_groups: ['Biceps'],
                properties: ['Weighted', 'Reps'],
                equipment: 'barbell',
                movementType: 'uniform',
                nextVariations: []
            }
        ];

        (useLocalSearchParams as jest.Mock).mockReturnValue({ exercise: JSON.stringify(mockExercises[0]) });
        (DataRepository.getExercises as jest.Mock).mockResolvedValue(mockExercises);

        const { getByText, getByTestId, queryByTestId } = render(<ExerciseDetailsScreen />);

        // Wait for async load of variations
        await act(async () => {
            await Promise.resolve();
        });

        // Click on Variations tab
        const variationsTab = getByText('Variations');
        expect(variationsTab).toBeTruthy();
        fireEvent.press(variationsTab);

        // Initially both Dumbbell Curl and Barbell Curl are rendered
        const tree = getByTestId('variation-tree');
        expect(within(tree).getByText('Dumbbell Curl')).toBeTruthy();
        expect(within(tree).getByText('Barbell Curl')).toBeTruthy();
    });

    it('supports select mode and handles onSelect', async () => {
        const mockOnSelect = jest.fn();
        const { getByText } = render(
            <ExerciseDetailsScreen mode="select" onSelect={mockOnSelect} exercise={mockExercise} />
        );

        // Verify primary select button is rendered at bottom
        const selectBtn = getByText('Select Handstand Pushup');
        expect(selectBtn).toBeTruthy();

        // Tap select button
        fireEvent.press(selectBtn);
        expect(mockOnSelect).toHaveBeenCalledWith(mockExercise);
    });

    it('opens variation action modal and selects variation in select mode', async () => {
        const mockExercises = [
            {
                id: 'dumbbell_curl',
                name: 'Dumbbell Curl',
                muscle_groups: ['Biceps'],
                properties: ['Weighted', 'Reps'],
                equipment: 'dumbbell',
                movementType: 'unilateral',
                nextVariations: ['barbell_curl']
            },
            {
                id: 'barbell_curl',
                name: 'Barbell Curl',
                muscle_groups: ['Biceps'],
                properties: ['Weighted', 'Reps'],
                equipment: 'barbell',
                movementType: 'uniform',
                nextVariations: []
            }
        ];

        const mockOnSelect = jest.fn();
        (useLocalSearchParams as jest.Mock).mockReturnValue({ exercise: JSON.stringify(mockExercises[0]) });
        (DataRepository.getExercises as jest.Mock).mockResolvedValue(mockExercises);

        const { getByText, getByTestId } = render(
            <ExerciseDetailsScreen mode="select" onSelect={mockOnSelect} />
        );

        // Wait for async load of variations
        await act(async () => {
            await Promise.resolve();
        });

        // Click on Variations tab
        fireEvent.press(getByText('Variations'));

        // Tap on Barbell Curl variation
        const tree = getByTestId('variation-tree');
        const varNode = within(tree).getByText('Barbell Curl');
        fireEvent.press(varNode);

        // Modal should open, and should have a select button for the variation
        const selectVarBtn = getByText('Select Barbell Curl');
        expect(selectVarBtn).toBeTruthy();

        // Click select on the variation modal
        fireEvent.press(selectVarBtn);
        expect(mockOnSelect).toHaveBeenCalledWith(mockExercises[1]);
    });


    it('filters variations by attachment correctly', async () => {
        const mockExercises = [
            {
                id: 'lat_pulldown',
                name: 'Lat Pulldown (Lat Bar)',
                muscle_groups: ['Lats'],
                properties: ['Weighted', 'Reps'],
                equipment: 'cable',
                movementType: 'uniform',
                attachment: 'Lat Bar',
                nextVariations: ['close_grip_lat_pulldown', 'neutral_grip_lat_pulldown']
            },
            {
                id: 'close_grip_lat_pulldown',
                name: 'Lat Pulldown (Close-Grip V-Bar)',
                muscle_groups: ['Lats'],
                properties: ['Weighted', 'Reps'],
                equipment: 'cable',
                movementType: 'uniform',
                attachment: 'Close-Grip V-Bar',
                nextVariations: []
            },
            {
                id: 'neutral_grip_lat_pulldown',
                name: 'Lat Pulldown (Neutral-Grip Handles)',
                muscle_groups: ['Lats'],
                properties: ['Weighted', 'Reps'],
                equipment: 'cable',
                movementType: 'uniform',
                attachment: 'Neutral-Grip Handles',
                nextVariations: []
            }
        ];

        (useLocalSearchParams as jest.Mock).mockReturnValue({ exercise: JSON.stringify(mockExercises[0]) });
        (DataRepository.getExercises as jest.Mock).mockResolvedValue(mockExercises);

        const { getByText, getByTestId } = render(<ExerciseDetailsScreen />);

        // Wait for async load
        await act(async () => {
            await Promise.resolve();
        });

        // Click on Variations tab
        fireEvent.press(getByText('Variations'));

        // Verify Attachment filter header is rendered
        expect(getByText('Attachment')).toBeTruthy();

        const tree = getByTestId('variation-tree');
        // Initially all are shown
        expect(within(tree).getByText('Lat Pulldown (Lat Bar)')).toBeTruthy();
        expect(within(tree).getByText('Lat Pulldown (Close-Grip V-Bar)')).toBeTruthy();
        expect(within(tree).getByText('Lat Pulldown (Neutral-Grip Handles)')).toBeTruthy();

        // Click Close-Grip V-Bar filter
        fireEvent.press(getByText('Close-Grip V-Bar'));

        // Now only Close-Grip V-Bar variation should show
        expect(within(tree).queryByText('Lat Pulldown (Lat Bar)')).toBeNull();
        expect(within(tree).getByText('Lat Pulldown (Close-Grip V-Bar)')).toBeTruthy();
        expect(within(tree).queryByText('Lat Pulldown (Neutral-Grip Handles)')).toBeNull();
    });
});
