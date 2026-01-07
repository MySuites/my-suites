import React from 'react';
import { render } from '@testing-library/react-native';
import ExerciseDetailsScreen from '../../app/exercises/details';
import { useExerciseStats } from '../../hooks/workouts/useExerciseStats';
import { useLocalSearchParams } from 'expo-router';
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

jest.mock('@mysuite/ui', () => ({
    useUITheme: () => ({ primary: 'blue', text: 'black' }),
    IconSymbol: () => null,
    RaisedCard: (props: any) => { 
        const { TouchableOpacity } = require('react-native');
        return <TouchableOpacity {...props} />;
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

jest.mock('../../components/exercises/ExerciseProperties', () => {
    return {
        ExerciseProperties: ({ properties }: any) => (
            <mockRN.View>
                 {properties?.map((p: string) => <mockRN.Text key={p}>{p}</mockRN.Text>)}
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

describe('Exercise Details Integration', () => {
    const mockExercise = { id: 'ex1', name: 'Handstand Pushup', category: 'Shoulders', properties: ['Bodyweight', 'Reps'] };

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
    });

    it('renders exercise details and chart', () => {
        const { getByText } = render(<ExerciseDetailsScreen />);
        
        expect(getByText('Handstand Pushup')).toBeTruthy();
        expect(getByText('Shoulders')).toBeTruthy();
        expect(getByText('Chart:Max Weight')).toBeTruthy();
        expect(getByText('Bodyweight')).toBeTruthy();
        expect(getByText('Reps')).toBeTruthy();
    });

    it('renders placeholder when exercise not found', () => {
        (useLocalSearchParams as jest.Mock).mockReturnValue({ exercise: 'invalid' });
        const { getByText } = render(<ExerciseDetailsScreen />);
        expect(getByText('Exercise not found.')).toBeTruthy();
    });
});
