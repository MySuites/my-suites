import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WorkoutHistoryScreen from '../../app/workouts/history';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import * as RN from 'react-native';

const mockRN = RN;

// Mocks
jest.mock('../../providers/WorkoutManagerProvider', () => ({
    useWorkoutManager: jest.fn()
}));

jest.mock('@mysuite/ui', () => {
    return {
        useUITheme: () => ({ primary: 'blue' }),

        RaisedCard: (props: any) => { 
            const { TouchableOpacity } = require('react-native');
            return <TouchableOpacity {...props} />;
        },
        ActionCard: ({ children, onPress, onDelete, className }: any) => (
            <mockRN.View className={className}>
                <mockRN.TouchableOpacity onPress={onPress}>
                    {children}
                </mockRN.TouchableOpacity>
                <mockRN.TouchableOpacity onPress={onDelete}>
                    <mockRN.Text>Delete</mockRN.Text>
                </mockRN.TouchableOpacity>
            </mockRN.View>
        ),
        HollowedCard: ({ children }: any) => <mockRN.View>{children}</mockRN.View>,
        Skeleton: () => <mockRN.View />,
        IconSymbol: ({ name }: any) => <mockRN.Text>Icon:{name}</mockRN.Text>,
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

describe('Workout History Integration', () => {
    const mockDeleteWorkoutLog = jest.fn();
    const mockFetchWorkoutLogDetails = jest.fn();
    
    const mockHistory = [
        { id: 'log1', workoutName: 'Leg Day', workoutTime: new Date().toISOString(), notes: 'Hard session' },
        { id: 'log2', workoutName: 'Push Day', workoutTime: new Date().toISOString() }
    ];

    const mockDetails = [
        { 
            name: 'Squat', 
            properties: ['Weighted', 'Reps'],
            sets: [
                { setNumber: 1, details: { weight: 100, reps: 5 } },
                { setNumber: 2, details: { weight: 100, reps: 5 } }
            ]
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (useWorkoutManager as jest.Mock).mockReturnValue({
            workoutHistory: mockHistory,
            deleteWorkoutLog: mockDeleteWorkoutLog,
            fetchWorkoutLogDetails: mockFetchWorkoutLogDetails,
            isLoading: false
        });
    });

    it('renders history list', () => {
        const { getByText } = render(<WorkoutHistoryScreen />);
        expect(getByText('Leg Day')).toBeTruthy();
        expect(getByText('Push Day')).toBeTruthy();
        expect(getByText('Hard session')).toBeTruthy();
    });

    it('deletes a workout log', () => {
        const { getAllByText } = render(<WorkoutHistoryScreen />);
        fireEvent.press(getAllByText('Delete')[0]);
        expect(mockDeleteWorkoutLog).toHaveBeenCalledWith('log1', { skipConfirmation: true });
    });

    it('opens details modal and displays set info', async () => {
        mockFetchWorkoutLogDetails.mockResolvedValue({ data: mockDetails, error: null });
        
        const { getByText, findByText, findAllByText, queryByText } = render(<WorkoutHistoryScreen />);
        
        // Tap Leg Day
        fireEvent.press(getByText('Leg Day'));
        
        // Modal should open and call fetch
        expect(mockFetchWorkoutLogDetails).toHaveBeenCalledWith('log1');
        
        // Check details content
        expect(await findByText('Workout Details')).toBeTruthy();
        expect(await findByText('Squat')).toBeTruthy();
        expect((await findAllByText(/100 lbs/)).length).toBe(2);
        expect((await findAllByText(/5 reps/)).length).toBe(2);
        
        // Close modal
        fireEvent.press(getByText('Close'));
        await waitFor(() => {
            expect(queryByText('Workout Details')).toBeNull();
        });
    });

    it('renders empty state', () => {
        (useWorkoutManager as jest.Mock).mockReturnValue({
            workoutHistory: [],
            isLoading: false
        });
        const { getByText } = render(<WorkoutHistoryScreen />);
        expect(getByText(/There are currently no past workouts/)).toBeTruthy();
    });
});
