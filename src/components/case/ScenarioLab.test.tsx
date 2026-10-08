import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getPersona } from '../../data/personas';
import { ScenarioLab } from './ScenarioLab';

const sarah = getPersona('borderline-credit')!;
const outcome = () => screen.getByTestId('scenario-outcome');

describe('ScenarioLab', () => {
  it('recomputes the outcome when presets change', async () => {
    const user = userEvent.setup();
    render(<ScenarioLab persona={sarah} />);
    expect(outcome()).toHaveTextContent('Referred to underwriting');
    await user.click(screen.getByRole('button', { name: 'Longer term (60 mo)' }));
    expect(outcome()).toHaveTextContent('Approved');
    await user.click(screen.getByRole('button', { name: 'Income −20%' }));
    expect(outcome()).toHaveTextContent('Counter-offer');
    expect(outcome()).toHaveTextContent('€5,000');
  });
  it('switches to Custom on edit and keeps the last valid result on bad input', async () => {
    const user = userEvent.setup();
    render(<ScenarioLab persona={sarah} />);
    const amount = screen.getByLabelText(/^Amount/);
    await user.clear(amount);
    expect(screen.getByRole('button', { name: 'Custom' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Enter a number')).toBeInTheDocument();
    expect(outcome()).toHaveTextContent('Referred to underwriting');
    expect(document.body.textContent).not.toContain('NaN');
    await user.type(amount, '8000');
    expect(outcome()).toHaveTextContent('Approved');
  });
  it('shows every preset in the at-a-glance table', () => {
    render(<ScenarioLab persona={sarah} />);
    const table = screen.getByRole('table', { name: 'Every scenario at a glance' });
    expect(within(table).getAllByRole('row')).toHaveLength(1 + 7);
  });
});
