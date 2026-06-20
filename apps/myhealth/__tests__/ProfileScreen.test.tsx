import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileScreen from '../app/profile/index';
import * as RN from 'react-native';

const mockRN = RN;

// Mocks
jest.mock('@mysuite/ui', () => {
  return {
    useUITheme: jest.fn(() => ({ primary: 'blue', danger: 'red', placeholder: 'gray', textMuted: 'gray', bg: 'white' })),

    RaisedCard: (props: any) => { 
        return <mockRN.TouchableOpacity {...props} />;
    },
    IconSymbol: () => null,
  };
});

jest.mock('../components/ui/ScreenHeader', () => ({
  ScreenHeader: 'ScreenHeader'
}));

jest.mock('../components/ui/BackButton', () => ({
  BackButton: 'BackButton'
}));

describe('ProfileScreen', () => {
  it('renders Profile screen correctly', () => {
    const { getByText } = render(<ProfileScreen />);
    
    expect(getByText('Guest')).toBeTruthy();
    expect(getByText('Local mode — data saved on this device')).toBeTruthy();
    expect(getByText('All data is local')).toBeTruthy();
  });
});
