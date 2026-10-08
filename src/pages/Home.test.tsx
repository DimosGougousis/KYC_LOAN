import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';

describe('Home', () => {
  it('lists six cases with outcomes and actions', async () => {
    const { user } = renderApp('/');
    const table = screen.getByRole('table', { name: 'Demo applications' });
    expect(within(table).getAllByRole('row')).toHaveLength(7);
    expect(within(table).getByText('Counter-offer')).toBeInTheDocument();
    await user.click(within(table).getAllByRole('link', { name: /Open case file/ })[2]);
    expect(screen.getByTestId('location')).toHaveTextContent('/case/watchlist-hit');
  });
  it('"Apply as" sets the persona and starts the wizard', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getByRole('button', { name: 'Apply as Lisa Wang' }));
    expect(localStorage.getItem('demoPersona')).toBe('counter-offer');
    expect(screen.getByTestId('location')).toHaveTextContent('/apply/new');
  });
});
