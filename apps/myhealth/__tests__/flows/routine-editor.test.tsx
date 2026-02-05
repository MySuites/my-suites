import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import CreateRoutineScreen from '../../app/routines/details';
import * as RN from 'react-native';

const mockRN = RN;
const { Alert } = RN;

// Mocks
const mockSaveRoutineDraft = jest.fn();
const mockUpdateRoutine = jest.fn();
const mockDeleteRoutine = jest.fn();
const mockRouterBack = jest.fn();

let mockUseLocalSearchParams: any = { id: undefined };
let mockRoutines: any[] = [];
const mockSavedWorkouts = [{ id: 'w1', name: 'Leg Workout' }];

jest.mock('expo-router', () => ({
    useLocalSearchParams: () => mockUseLocalSearchParams,
    useRouter: () => ({ back: mockRouterBack }),
    Stack: { Screen: () => null },
}));

jest.mock('../../components/ui/BackButton', () => ({
    BackButton: () => <mockRN.Text>Back</mockRN.Text>
}));

jest.mock('../../providers/FloatingButtonContext', () => ({
    useFloatingButton: () => ({ setIsHidden: jest.fn() })
}));

jest.mock('../../providers/WorkoutManagerProvider', () => ({
    useWorkoutManager: () => ({
        routines: mockRoutines,
        savedWorkouts: mockSavedWorkouts,
        saveRoutineDraft: mockSaveRoutineDraft,
        updateRoutine: mockUpdateRoutine,
        deleteRoutine: mockDeleteRoutine,
    })
}));

jest.mock('react-native-draggable-flatlist', () => {
    const MockList = (props: any) => (
        <mockRN.View testID="draggable-list">
            <mockRN.FlatList {...props} />
        </mockRN.View>
    );
    const ScaleDecorator = ({ children }: any) => <>{children}</>;
    ScaleDecorator.displayName = 'ScaleDecorator';
    MockList.ScaleDecorator = ScaleDecorator;
    return {
        __esModule: true,
        default: MockList,
        ScaleDecorator: ScaleDecorator,
        RenderItemParams: {},
    };
});

jest.mock('../../components/routines/AddDay', () => {
    // Mock to simulate adding
    return {
        AddDay: ({ visible, onAddRestDay, onAddWorkout }: any) => visible ? (
            <mockRN.View testID="add-day-modal">
                <mockRN.Button title="Add Rest Day" onPress={onAddRestDay} />
                <mockRN.Button title="Add Leg Workout" onPress={() => onAddWorkout(mockSavedWorkouts[0])} />
            </mockRN.View>
        ) : null
    };
});

jest.mock('@mysuite/ui', () => {
    return {

        RaisedCard: (props: any) => { 
            return <mockRN.TouchableOpacity {...props} />;
        },
        IconSymbol: (props: any) => <mockRN.View {...props} testID="icon-symbol" />,
        useUITheme: () => ({ primary: 'blue', textMuted: 'gray', danger: 'red', bg: 'white' }),
    };
});

// Mock util since useRoutineManager imports it
jest.mock('../../utils/workout-logic', () => ({
    createSequenceItem: (item: any) => {
        if (item === 'rest') return { id: 'rest-' + Math.random(), type: 'rest', name: 'Rest Day' };
        return { id: 'work-' + Math.random(), type: 'workout', name: item.name };
    }
}));

describe('Routine Editor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseLocalSearchParams = { id: undefined };
        mockRoutines = [];
        jest.spyOn(Alert, 'alert');
    });

    it('renders create mode correctly', () => {
        const { getByPlaceholderText, getByText } = render(<CreateRoutineScreen />);
        expect(getByPlaceholderText('Routine Name')).toBeTruthy();
        expect(getByText('No days added yet')).toBeTruthy();
    });

    it('can add a rest day and a workout day', async () => {
        const { getByText, getByTestId, getAllByTestId, getAllByText } = render(<CreateRoutineScreen />);
        
        // Open Modal
        fireEvent.press(getByText('Add Day'));
        expect(getByTestId('add-day-modal')).toBeTruthy();
        
        // Add Rest
        fireEvent.press(getByText('Add Rest Day'));
        // Modal closes automatically, list updates
        
        await waitFor(() => {
             const elements = getAllByTestId('draggable-list');
             expect(elements.length).toBeGreaterThan(0);
        });
        
        // Check if Rest Day text exists in general (button or list item)
        expect(getAllByText('Rest Day').length).toBeGreaterThan(0);

        // Add Workout
        fireEvent.press(getByText('Add Day'));
        fireEvent.press(getByText('Add Leg Workout'));
        
        expect(getByText('Leg Workout')).toBeTruthy();
    });

    it('validates empty name and sequence on save', async () => {
        const { getByPlaceholderText, getAllByTestId } = render(<CreateRoutineScreen />);
        
        const icons = getAllByTestId('icon-symbol');
        const checkmarkIcon = icons.find(i => i.props.name === 'checkmark');
        
        // 1. Empty Name & Sequence
        fireEvent.press(checkmarkIcon.parent);
        expect(Alert.alert).toHaveBeenCalledWith("Required", "Please enter a routine name");
        
        // 2. Empty Sequence (but name filled)
        fireEvent.changeText(getByPlaceholderText('Routine Name'), 'Data');
        fireEvent.press(checkmarkIcon.parent);
        expect(Alert.alert).toHaveBeenCalledWith("Empty Routine", "Please add at least one day to the routine");
    });

    it('loads edit mode correctly and updates', async () => {
        mockUseLocalSearchParams = { id: 'r1' };
        mockRoutines = [{ 
            id: 'r1', 
            name: 'Existing Routine', 
            sequence: [{ id: 's1', type: 'rest', name: 'Rest Day' }] 
        }];
        mockUpdateRoutine.mockImplementation((id, name, seq, cb) => cb());

        const { getByPlaceholderText, getByText, getAllByText, getAllByTestId } = render(<CreateRoutineScreen />);
        
        // Wait for load - initially in View Mode
        await waitFor(() => expect(getByText('Existing Routine')).toBeTruthy());
        expect(getAllByText('Rest Day').length).toBeGreaterThan(0);

        // Click Edit Button
        const icons = getAllByTestId('icon-symbol');
        const pencilIcon = icons.find(i => i.props.name === 'pencil');
        expect(pencilIcon).toBeTruthy();
        fireEvent.press(pencilIcon.parent);

        // Now in Edit Mode
        expect(getByPlaceholderText('Routine Name').props.value).toBe('Existing Routine');

        // Save
        const updatedIcons = getAllByTestId('icon-symbol');
        const checkmarkIcon = updatedIcons.find(i => i.props.name === 'checkmark');
        fireEvent.press(checkmarkIcon.parent);

        await waitFor(() => {
            expect(mockUpdateRoutine).toHaveBeenCalledWith('r1', 'Existing Routine', expect.any(Array), expect.any(Function));
            expect(mockRouterBack).toHaveBeenCalled();
        });
    });

    it('can delete routine in edit mode', async () => {
        mockUseLocalSearchParams = { id: 'r1' };
        mockRoutines = [{ id: 'r1', name: 'To Delete', sequence: [] }];
        mockDeleteRoutine.mockImplementation((id, opts) => opts.onSuccess());

        const { getByText, findByText, getAllByTestId } = render(<CreateRoutineScreen />);
        
        // Wait for load
        await findByText('To Delete');

        // Enter Edit Mode
        const icons = getAllByTestId('icon-symbol');
        const pencilIcon = icons.find(i => i.props.name === 'pencil');
        fireEvent.press(pencilIcon.parent);

        // Now Delete Button should be visible
        await findByText('Delete Routine');
        fireEvent.press(getByText('Delete Routine'));

        expect(Alert.alert).toHaveBeenCalledWith('Delete Routine', 'Are you sure?', expect.any(Array));
        
        // Simulate Confirm
        const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
        const deleteBtn = buttons.find((b: any) => b.text === 'Delete');
        
        act(() => {
            deleteBtn.onPress();
        });

        expect(mockDeleteRoutine).toHaveBeenCalledWith('r1', expect.objectContaining({ onSuccess: expect.any(Function) }));
        expect(mockRouterBack).toHaveBeenCalled();
    });

    it('cancels edit mode and reverts changes', async () => {
        mockUseLocalSearchParams = { id: 'r1' };
        mockRoutines = [{ 
            id: 'r1', 
            name: 'Original Name', 
            sequence: [] 
        }];

        const { getByPlaceholderText, getByText, getAllByTestId } = render(<CreateRoutineScreen />);
        
        // Wait for load
        await waitFor(() => expect(getByText('Original Name')).toBeTruthy());

        // Enter Edit Mode
        let icons = getAllByTestId('icon-symbol');
        const pencilIcon = icons.find(i => i.props.name === 'pencil');
        fireEvent.press(pencilIcon.parent);

        // Change Name
        const input = getByPlaceholderText('Routine Name');
        fireEvent.changeText(input, 'Changed Name');
        expect(input.props.value).toBe('Changed Name');

        // Click Cancel (XMark)
        icons = getAllByTestId('icon-symbol');
        const cancelIcon = icons.find(i => i.props.name === 'xmark');
        expect(cancelIcon).toBeTruthy();
        fireEvent.press(cancelIcon.parent);

        // Verify reverted to View Mode and Original Name
        await waitFor(() => expect(getByText('Original Name')).toBeTruthy());
        // Should not see input anymore (or at least check that view mode text is back)
    });
});
