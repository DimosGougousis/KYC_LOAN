import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';

describe('CaseFilePage', () => {
  it('renders header, outcome, KPIs and insights for Maria', async () => {
    renderApp('/case/happy-path');
    expect(await screen.findByRole('heading', { level: 1, name: /Maria Santos — €15,000 personal loan/ })).toBeInTheDocument();
    expect(screen.getByTestId('outcome-badge')).toHaveTextContent('Approved');
    expect(screen.getAllByText('€462.47').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'What stands out' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Reviewer decision' })).not.toBeInTheDocument();
  });
  it('shows an empty state for an unknown persona', async () => {
    renderApp('/case/nobody');
    expect(await screen.findByText('Case not found')).toBeInTheDocument();
  });
  it('lists every verification check', async () => {
    renderApp('/case/watchlist-hit');
    const table = await screen.findByRole('table', { name: 'Verification evidence' });
    for (const label of ['Liveness', 'Identity register', 'Sanctions', 'PEP', 'Adverse media', 'Device & behaviour', 'Passport']) {
      expect(within(table).getAllByText(label).length).toBeGreaterThan(0);
    }
  });
  it('reviewer decision appends an audit event and updates the badge; reset restores it', async () => {
    const { user } = renderApp('/case/borderline-credit');
    const panel = await screen.findByRole('region', { name: 'Reviewer decision' });
    expect(screen.getByTestId('outcome-badge')).toHaveTextContent('Referred to underwriting');

    await user.click(within(panel).getByRole('radio', { name: 'Approve with conditions' }));
    await user.click(within(panel).getByRole('button', { name: 'Record decision' }));
    expect(within(panel).getByText('Give a rationale of at least 10 characters')).toBeInTheDocument();

    await user.type(within(panel).getByLabelText('Rationale'), 'Four years stable employment offsets the margin');
    await user.type(within(panel).getByLabelText('Conditions'), '12-month review');
    await user.click(within(panel).getByRole('button', { name: 'Record decision' }));

    await waitFor(() => expect(screen.getByTestId('outcome-badge')).toHaveTextContent('Approved with conditions'));
    expect(screen.getByText(/Conditions: 12-month review/)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Reviewer decision' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset demo' }));
    await waitFor(() => expect(screen.getByTestId('outcome-badge')).toHaveTextContent('Referred to underwriting'));
    expect(screen.getByRole('region', { name: 'Reviewer decision' })).toBeInTheDocument();
  });
});
