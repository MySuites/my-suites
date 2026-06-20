import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SelectionModal } from '../../components/ui/SelectionModal';
import * as RN from 'react-native';

const mockRN = RN;

jest.mock('@mysuite/ui', () => ({
    useUITheme: () => ({ primary: 'blue' }),
    IconSymbol: ({ name }: any) => {
        return name === 'checkmark' ? <mockRN.Text testID="checkmark">Check</mockRN.Text> : <mockRN.Text>Icon:{name}</mockRN.Text>;
    },
    RaisedCard: (props: any) => {
        return <mockRN.TouchableOpacity {...props} />;
    }
}));

describe('SelectionModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSelect = jest.fn();
    const mockItems = [
        { id: '1', label: 'Item 1' },
        { id: '2', label: 'Item 2' }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly when visible', () => {
        const { getByText } = render(
            <SelectionModal
                visible={true}
                onClose={mockOnClose}
                title="Select Items"
                items={mockItems}
                onSelect={mockOnSelect}
                isSelected={() => false}
            />
        );

        expect(getByText('Select Items')).toBeTruthy();
        expect(getByText('Item 1')).toBeTruthy();
        expect(getByText('Item 2')).toBeTruthy();
    });

    it('handles selection and closes on single selection', () => {
        const { getByText } = render(
            <SelectionModal
                visible={true}
                onClose={mockOnClose}
                title="Select Items"
                items={mockItems}
                onSelect={mockOnSelect}
                isSelected={() => false}
                multiSelect={false}
            />
        );

        fireEvent.press(getByText('Item 1'));
        expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0]);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles selection and DOES NOT close on multi selection', () => {
        const { getByText } = render(
            <SelectionModal
                visible={true}
                onClose={mockOnClose}
                title="Select Items"
                items={mockItems}
                onSelect={mockOnSelect}
                isSelected={() => false}
                multiSelect={true}
            />
        );

        fireEvent.press(getByText('Item 1'));
        expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0]);
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('shows checkmark for selected items', () => {
        const { getAllByTestId } = render(
            <SelectionModal
                visible={true}
                onClose={mockOnClose}
                title="Select Items"
                items={mockItems}
                onSelect={mockOnSelect}
                isSelected={(item) => item.id === '1'}
            />
        );

        expect(getAllByTestId('checkmark').length).toBe(1);
    });

    it('handles close button', () => {
         const { getByText } = render(
            <SelectionModal
                visible={true}
                onClose={mockOnClose}
                title="Select Items"
                items={mockItems}
                onSelect={mockOnSelect}
                isSelected={() => false}
            />
        );
        
        fireEvent.press(getByText('Done'));
        expect(mockOnClose).toHaveBeenCalled();
    });
});
