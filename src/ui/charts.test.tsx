import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LineChart } from './LineChart';
import { StackedBar } from './StackedBar';

const fmt = (n: number) => `€${Math.round(n)}`;

describe('StackedBar', () => {
  it('draws one segment per positive value with a legend', () => {
    const { container } = render(
      <StackedBar
        ariaLabel="Budget"
        format={fmt}
        segments={[{ label: 'Rent', value: 1200, color: 'red' }, { label: 'Zero', value: 0, color: 'blue' }, { label: 'Left', value: 800, color: 'green' }]}
      />,
    );
    expect(screen.getByRole('img', { name: 'Budget' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-segment]')).toHaveLength(2);
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('€1200')).toBeInTheDocument();
  });
});

describe('LineChart', () => {
  it('draws one path per series and labels the axis', () => {
    const { container } = render(
      <LineChart
        ariaLabel="Balance"
        format={fmt}
        xLabels={[{ index: 0, label: 'Start' }, { index: 2, label: 'Yr 1' }]}
        series={[
          { id: 'a', label: 'Balance', color: 'red', values: [100, 50, 0] },
          { id: 'b', label: 'Residual', color: 'blue', values: [-10, 20, 30], dashed: true },
        ]}
      />,
    );
    expect(screen.getByRole('img', { name: 'Balance' })).toBeInTheDocument();
    expect(container.querySelectorAll('path[data-series]')).toHaveLength(2);
    expect(screen.getByText('Yr 1')).toBeInTheDocument();
  });
  it('survives a single flat series', () => {
    const { container } = render(<LineChart ariaLabel="Flat" format={fmt} xLabels={[]} series={[{ id: 'a', label: 'A', color: 'red', values: [5, 5] }]} />);
    expect(container.querySelector('path[data-series]')!.getAttribute('d')).not.toContain('NaN');
  });
});
