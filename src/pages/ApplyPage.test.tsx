import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';

describe('ApplyPage', () => {
  it('starts a workflow, shows step 1 with persona prefill and the live sidebar', async () => {
    localStorage.setItem('demoPersona', 'counter-offer');
    renderApp('/apply/new');
    expect(await screen.findByText(/Step 1 of 6/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/First name/)).toHaveValue('Lisa');
    const side = screen.getByRole('complementary', { name: 'Live case file' });
    expect(within(side).getByText('Not assessed yet')).toBeInTheDocument();
    expect(within(side).getByRole('link', { name: /Open full case file/ })).toHaveAttribute('href', '/case/counter-offer');
  });

  it('an unknown workflow id renders step 1 instead of crashing', async () => {
    renderApp('/apply/wf-missing');
    expect(await screen.findByText(/Step 1 of 6/i)).toBeInTheDocument();
  });

  it('product step shows a live repayment preview at the persona APR and the sidebar reveals checks', async () => {
    localStorage.setItem('demoPersona', 'happy-path');
    const { user } = renderApp('/apply/new');
    await screen.findByText(/Step 1 of 6/i);
    await user.click(screen.getByRole('button', { name: /Continue/ }));
    await waitFor(() => expect(screen.getByText(/Step 3 of 6/i)).toBeInTheDocument(), { timeout: 8000 });
    expect(screen.getByText('€462.47')).toBeInTheDocument();
    expect(screen.getByText(/6\.9% APR/)).toBeInTheDocument();
    const side = screen.getByRole('complementary', { name: 'Live case file' });
    expect(within(side).getByText('KYC clear')).toBeInTheDocument();
  }, 15000);

  it('a blurry scan asks for a re-upload, then verification completes', async () => {
    localStorage.setItem('demoPersona', 'blurry-docs');
    const { user } = renderApp('/apply/new');
    await screen.findByText(/Step 1 of 6/i);
    await user.click(screen.getByRole('button', { name: /Continue/ }));
    const reupload = await screen.findByRole('button', { name: /Re-upload passport/ }, { timeout: 8000 });
    expect(screen.getByText(/62% — below our threshold/)).toBeInTheDocument();
    await user.click(reupload);
    await waitFor(() => expect(screen.getByText(/Step 3 of 6/i)).toBeInTheDocument(), { timeout: 8000 });
  }, 20000);
});
