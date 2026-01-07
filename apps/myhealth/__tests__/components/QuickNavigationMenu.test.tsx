import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickNavigationButton } from '../../components/ui/QuickNavigationMenu';
import { usePathname, useRouter } from 'expo-router';
import { useFloatingButton } from '../../providers/FloatingButtonContext';
import * as RN from 'react-native';

const mockRN = RN;

// Mocks
jest.mock('@mysuite/ui', () => ({
    useUITheme: () => ({ bgDark: 'black' }),
    RaisedCard: (props: any) => { 
        const { TouchableOpacity } = require('react-native');
        return <TouchableOpacity {...props} />;
    },
    IconSymbol: () => null
}));

jest.mock('expo-router', () => ({
    usePathname: jest.fn(),
    useRouter: jest.fn(),
}));

jest.mock('../../providers/FloatingButtonContext', () => ({
    useFloatingButton: jest.fn()
}));

jest.mock('../../components/ui/radial-menu/RadialMenu', () => ({
    RadialMenu: ({ items, onMenuStateChange }: any) => {
        return (
            <mockRN.View testID="radial-menu">
                <mockRN.Button title="Open Menu" onPress={() => onMenuStateChange(true)} />
                <mockRN.Button title="Close Menu" onPress={() => onMenuStateChange(false)} />
                {items.map((item: any) => (
                    <mockRN.Button key={item.id} title={item.label} onPress={item.onPress} />
                ))}
            </mockRN.View>
        );
    }
}));

describe('QuickNavigationButton', () => {
    const mockNavigate = jest.fn();
    const mockSetActiveButtonId = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ navigate: mockNavigate });
        (useFloatingButton as jest.Mock).mockReturnValue({
            activeButtonId: null,
            setActiveButtonId: mockSetActiveButtonId,
            isHidden: false
        });
    });

    it('renders correctly', () => {
        (usePathname as jest.Mock).mockReturnValue('/');
        const { getByTestId } = render(<QuickNavigationButton />);
        expect(getByTestId('radial-menu')).toBeTruthy();
    });

    it('navigates to workout', () => {
        (usePathname as jest.Mock).mockReturnValue('/');
        const { getByText } = render(<QuickNavigationButton />);
        
        fireEvent.press(getByText('Workout'));
        expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/workout');
    });

    it('navigates to home', () => {
         (usePathname as jest.Mock).mockReturnValue('/');
        const { getByText } = render(<QuickNavigationButton />);
        
        fireEvent.press(getByText('Home'));
        expect(mockNavigate).toHaveBeenCalledWith('/(tabs)');
    });

    it('opens menu', () => {
        (usePathname as jest.Mock).mockReturnValue('/');
        const { getByText } = render(<QuickNavigationButton />);
        
        fireEvent.press(getByText('Open Menu'));
        expect(mockSetActiveButtonId).toHaveBeenCalledWith('nav');
    });

    it('closes menu when active', () => {
         (usePathname as jest.Mock).mockReturnValue('/');
         // Simulate that we are already active
         (useFloatingButton as jest.Mock).mockReturnValue({
            activeButtonId: 'nav',
            setActiveButtonId: mockSetActiveButtonId,
            isHidden: false
        });

        const { getByText } = render(<QuickNavigationButton />);
        
        fireEvent.press(getByText('Close Menu'));
        expect(mockSetActiveButtonId).toHaveBeenCalledWith(null);
    });
});
