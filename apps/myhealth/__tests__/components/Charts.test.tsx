import React from 'react';
import { render } from '@testing-library/react-native';
import { BodyWeightChart } from '../../components/bodyweight/BodyWeightChart';
import * as RN from 'react-native';

const mockRN = RN;

jest.mock('react-native-gifted-charts', () => ({
    LineChart: (props: any) => {
        return (
            <mockRN.View testID="line-chart">
                <mockRN.Text>Chart Data Length: {props.data?.length}</mockRN.Text>
                {props.data?.map((d: any, i: number) => (
                    <mockRN.Text key={i}>{d.label}: {d.value} (Real: {d.realValue})</mockRN.Text>
                ))}
            </mockRN.View>
        );
    }
}));

describe('BodyWeightChart', () => {
    it('renders no data state', () => {
        const { getByText } = render(<BodyWeightChart data={[]} />);
        expect(getByText('No data for this range')).toBeTruthy();
    });

    it('renders chart with processed data', () => {
        const mockData = [
            { value: 80, label: 'Jan 1', date: '2023-01-01' },
            { value: 82, label: 'Jan 2', date: '2023-01-02' }
        ];
        
        const { getByText, getByTestId } = render(<BodyWeightChart data={mockData} />);
        
        expect(getByTestId('line-chart')).toBeTruthy();
        
        // Check transformation:
        // The component calculates a minAxis to normalize data.
        // For [80, 82], avg=81. Target sections=4. Step=10? 
        // 81 +/- 20 = 61-101. minAxis might be 60.
        // Let's rely on checking that data is passed.
        // Data is transformed (minAxis subtracted).
        // We verifying that Real Value is passed correctly.
        expect(getByText(/Jan 1.*\(Real: 80\)/)).toBeTruthy();
        expect(getByText(/Jan 2.*\(Real: 82\)/)).toBeTruthy();
        // But `d.realValue` should be 80.
        // My mock prints `(Real: {d.realValue})`.
        
        expect(getByText(/Real: 80/)).toBeTruthy();
        expect(getByText(/Real: 82/)).toBeTruthy();
    });
});
