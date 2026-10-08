import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';

describe('ComparePage', () => {
  it('has one column per persona and filters to human-reviewed cases', async () => {
    const { user } = renderApp('/compare');
    const table = screen.getByRole('table', { name: 'Applications compared' });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(7);
    await user.click(screen.getByRole('button', { name: 'Needed a human' }));
    expect(within(screen.getByRole('table', { name: 'Applications compared' })).getAllByRole('columnheader')).toHaveLength(3);
  });
  it('compares Lisa’s request with the counter-offer', () => {
    renderApp('/compare');
    const t = screen.getByRole('table', { name: 'Requested versus counter-offer' });
    expect(within(t).getByText('€8,000')).toBeInTheDocument();
    expect(within(t).getByText('€365.11')).toBeInTheDocument();
  });
});
