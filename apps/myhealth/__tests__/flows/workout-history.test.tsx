import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WorkoutHistoryScreen from '../../app/history/index';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';
import * as RN from 'react-native';

const mockRN = RN;

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => {
    const mockStack = ({ children }: any) => <>{children}</>;
    const Screen = () => null;
    Screen.displayName = 'Screen';
    mockStack.Screen = Screen;
    return {
        useRouter: () => ({ push: mockRouterPush, navigate: mockRouterPush }),
        usePathname: () => '/history',
        Stack: mockStack
    };
});

// Mocks
jest.mock('../../providers/WorkoutManagerProvider', () => ({
    useWorkoutManager: jest.fn()
}));

jest.mock('@mysuite/ui', () => {
    return {
        useUITheme: () => ({ primary: 'blue' }),

        RaisedCard: (props: any) => { 
            return <mockRN.TouchableOpacity {...props} />;
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
        { id: 'log1', workoutName: 'Leg Day', workoutDate: new Date().toISOString(), notes: 'Hard session' },
        { id: 'log2', workoutName: 'Push Day', workoutDate: new Date().toISOString() }
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

    it('navigates to details view on press', () => {
        const { getByText } = render(<WorkoutHistoryScreen />);
        
        // Tap Leg Day
        fireEvent.press(getByText('Leg Day'));
        
        // Router push should be called with correct path and params
        expect(mockRouterPush).toHaveBeenCalledWith({
            pathname: '/workouts/details',
            params: { logId: 'log1' }
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
