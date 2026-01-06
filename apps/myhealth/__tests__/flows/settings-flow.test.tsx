import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useAuth, supabase } from '@mysuite/auth';
import SettingsScreen from '../../app/settings/index';

// Mock dependencies
jest.mock('@mysuite/auth', () => ({
    useAuth: jest.fn(),
    supabase: {
        auth: {
            signOut: jest.fn(() => Promise.resolve({ error: null })),
        },
        functions: {
            invoke: jest.fn(() => Promise.resolve({ data: null, error: null })),
        }
    }
}));

jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
    Stack: { Screen: () => null }
}));

// Mock Services
jest.mock('../../services/BodyWeightService', () => ({
    BodyWeightService: {
        getLatestWeight: jest.fn(() => Promise.resolve(75)),
        getWeightHistory: jest.fn(() => Promise.resolve([])),
    }
}));

// Mock Providers
jest.mock('../../providers/AppThemeProvider', () => ({
    useThemePreference: () => ({ preference: 'system', setPreference: jest.fn() })
}));

// Mock UI
jest.mock('@mysuite/ui', () => ({
    useUITheme: () => ({ primary: 'blue', textMuted: 'gray', danger: 'red', bg: 'white' }),
    ThemeToggle: () => null,
    IconSymbol: () => null,
    useToast: () => ({ showToast: jest.fn() }),
}));

// Mock Components
jest.mock('../../components/ui/ScreenHeader', () => ({
    ScreenHeader: () => null
}));
jest.mock('../../components/ui/BackButton', () => ({
    BackButton: () => null
}));
jest.mock('../../components/ui/ProfileButton', () => ({
    ProfileButton: () => null
}));
jest.mock('../../components/profile/BodyWeightCard', () => ({
    BodyWeightCard: () => null
}));
jest.mock('../../components/profile/WeightLogModal', () => ({
    WeightLogModal: () => null
}));

describe('Settings Flow', () => {

    it('renders settings and handles account deletion', async () => {
        const mockSignOut = supabase.auth.signOut as jest.Mock;
        const mockInvoke = supabase.functions.invoke as jest.Mock;
        
        (useAuth as jest.Mock).mockReturnValue({ 
            user: { id: 'test-user-id' }
        });

        // Spy on Alert
        jest.spyOn(Alert, 'alert');

        const { getByText } = render(<SettingsScreen />);

        // Check if Delete Account button is present
        const deleteButton = getByText('Delete Account');
        expect(deleteButton).toBeTruthy();

        // Press Delete Account
        fireEvent.press(deleteButton);

        // Expect Alert to be shown
        expect(Alert.alert).toHaveBeenCalledWith(
            "Delete Account?",
            expect.any(String),
            expect.any(Array)
        );

        // Simulate confirming deletion
        // @ts-ignore
        const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
        const deleteAction = alertButtons.find((b: any) => b.text === 'Delete');
        
        await act(async () => {
            await deleteAction.onPress();
        });

        // Verify API calls
        expect(mockInvoke).toHaveBeenCalledWith('delete-account', {
            body: { user_id: 'test-user-id' }
        });
        expect(mockSignOut).toHaveBeenCalled();
    });
});
