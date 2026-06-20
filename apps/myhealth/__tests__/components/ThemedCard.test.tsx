
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedCard } from '../../../../packages/ui/examples/ThemedCard';

jest.mock('../../../../packages/ui', () => ({
    useUITheme: () => ({
        bgLight: 'white',
        'border-dark': 'black',
        text: 'black',
        'text-dark': 'white',
    }),
}));

describe('ThemedCard', () => {
    it('renders correctly with title', () => {
        const tree = render(<ThemedCard title="Test Card" />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with title and subtitle', () => {
        const tree = render(<ThemedCard title="Test Card" subtitle="Subtitle" />).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
