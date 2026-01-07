import React, { useState } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, View, Button, FlatList, TextInput } from 'react-native';
import { useRoutineManager } from '../../hooks/routines/useRoutineManager';

// Mock dependencies
// We can test the hook directly or test a component that uses it.
// Here we simulate the Routines Screen logic using the hook.

// Mock @mysuite/ui
// (Global mock in simple form, but we might want specific behavior here if we tested the full screen)
// For flow test, we'll build a TestComponent that assumes the context/providers are working 
// (or we wrap it, but useRoutineManager is a hook).
// Actually, `useRoutineManager` requires `routines` array as input. 
// It is used INSIDE `WorkoutManagerProvider`. 
// So we should test the interaction via `WorkoutManagerContext` or just test the hook logic?
// The prompt asked for "flows/routine-management.test.tsx".
// This implies UI/Integrations.
// `app/routines/index.tsx` uses `useWorkoutManager` (which provides routines) and renders list.

import { WorkoutManagerProvider, useWorkoutManager } from '../../providers/WorkoutManagerProvider';

// We need to mock the API calls again or use the existing mock structure


const testUser = { id: 'test-user' };
jest.mock('@mysuite/auth', () => ({
    useAuth: () => ({ user: testUser }),
    supabase: {
        from: jest.fn(), 
        auth: { getSession: jest.fn() }
    }
}));

// Mock API
// We need to mock the DataRepository
import { DataRepository } from '../../providers/DataRepository';
import { ProfileRepository } from '../../providers/ProfileRepository';

jest.mock('../../providers/DataRepository', () => ({
    DataRepository: {
        getRoutines: jest.fn(),
        saveRoutine: jest.fn(),
        deleteRoutine: jest.fn(),
        getWorkouts: jest.fn(() => Promise.resolve([])),
        getHistory: jest.fn(() => Promise.resolve([])),
    }
}));

jest.mock('../../providers/ProfileRepository', () => ({
    ProfileRepository: {
        getProfile: jest.fn(() => Promise.resolve(null))
    }
}));

const RoutineFlowTestComponent = () => {
    const { routines, activeRoutine, saveRoutineDraft, startActiveRoutine } = useWorkoutManager();
    const [newRoutineName, setNewRoutineName] = useState('');

    const activeRoutineName = activeRoutine 
        ? routines.find((r: any) => r.id === activeRoutine.id)?.name 
        : 'None';

    return (
        <View>
            <Text testID="routine-count">{routines.length}</Text>
            <Text testID="active-routine">{activeRoutineName}</Text>
            {routines.map(r => (
                <View key={r.id}>
                    <Text>{r.name}</Text>
                    <Button title={`Start ${r.name}`} onPress={() => startActiveRoutine(r.id)} />
                </View>
            ))}
            
            <TextInput 
                testID="new-routine-input"
                value={newRoutineName}
                onChangeText={setNewRoutineName}
            />
            <Button 
                title="Create Routine" 
                onPress={() => saveRoutineDraft(newRoutineName, [{ dayName: 'Day 1' }], () => {})}
            />
        </View>
    );
};

describe('Routine Management Flow', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        (DataRepository.getRoutines as jest.Mock).mockResolvedValue([]);
        (DataRepository.getWorkouts as jest.Mock).mockResolvedValue([]);
        (DataRepository.getHistory as jest.Mock).mockResolvedValue([]);
    });

    it('displays existing routines', async () => {
        const mockRoutines = [
            { id: 'r1', name: 'PPL', created_at: '2023-01-01', sequence: [] },
            { id: 'r2', name: 'Bro Split', created_at: '2023-01-02', sequence: [] }
        ];
        (DataRepository.getRoutines as jest.Mock).mockResolvedValue(mockRoutines);

        const { getByText, getByTestId } = render(
            <WorkoutManagerProvider>
                <RoutineFlowTestComponent />
            </WorkoutManagerProvider>
        );

        await waitFor(() => {
            expect(getByTestId('routine-count').children[0]).toBe('2');
            expect(getByText('PPL')).toBeTruthy();
            expect(getByText('Bro Split')).toBeTruthy();
        });
    });

    it('creates a new routine', async () => {
        // Mutable mock database
        const mockRoutines: any[] = [];
        
        // Mock fetch to return current state
        (DataRepository.getRoutines as jest.Mock).mockImplementation(() => {
            return Promise.resolve([...mockRoutines]);
        });

        // Mock creation success: update state
        (DataRepository.saveRoutine as jest.Mock).mockImplementation((routine) => {
            mockRoutines.unshift(routine);
            return Promise.resolve();
        });

        const { getByText, getByTestId } = render(
            <WorkoutManagerProvider>
                <RoutineFlowTestComponent />
            </WorkoutManagerProvider>
        );

        // Wait for initial load
        await waitFor(() => {
            expect(getByTestId('routine-count').children[0]).toBe('0');
        });

        // Input name
        fireEvent.changeText(getByTestId('new-routine-input'), 'Full Body');
        fireEvent.press(getByText('Create Routine'));

        await waitFor(() => {
            expect(DataRepository.saveRoutine).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Full Body', sequence: [{ dayName: 'Day 1' }] })
            );
            expect(getByTestId('routine-count').children[0]).toBe('1');
            expect(getByText('Full Body')).toBeTruthy();
        });
    });

    it('starts a routine', async () => {
        const mockRoutines = [{ id: 'r1', name: 'PPL', created_at: '2023-01-01', sequence: [] }];
        
        (DataRepository.getRoutines as jest.Mock).mockImplementation(() => {
             return Promise.resolve(mockRoutines);
        });

        const { getByText, getByTestId } = render(
            <WorkoutManagerProvider>
                <RoutineFlowTestComponent />
            </WorkoutManagerProvider>
        );

        await waitFor(() => {
            expect(getByTestId('routine-count').children[0]).toBe('1');
        });

        fireEvent.press(getByText('Start PPL'));

        await waitFor(() => {
            expect(getByTestId('active-routine').children[0]).toBe('PPL');
        });
    });
});
