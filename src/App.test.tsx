import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from './test/render';

const path = () => screen.getByTestId('location').textContent;

describe('routes and redirects', () => {
  it.each([
    ['/dashboard', '/case/happy-path'],
    ['/hitl/compliance/rev-1', '/case/watchlist-hit'],
    ['/hitl/underwriting/rev-2', '/case/borderline-credit'],
    ['/workflow/wf-9', '/apply/wf-9'],
    ['/nowhere', '/'],
  ])('%s → %s', async (from, to) => {
    renderApp(from);
    await waitFor(() => expect(path()).toBe(to));
  });
});

describe('TopBar', () => {
  it('lens toggle keeps the current persona', async () => {
    const { user } = renderApp('/case/declined');
    await user.click(screen.getByRole('link', { name: 'Applicant' }));
    expect(path()).toBe('/apply/new');
    expect(localStorage.getItem('demoPersona')).toBe('declined');
    await user.click(screen.getByRole('link', { name: 'Reviewer' }));
    expect(path()).toBe('/case/declined');
  });
  it('switching persona on a case file opens that persona’s case', async () => {
    const { user } = renderApp('/case/happy-path');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Persona' }), 'counter-offer');
    expect(path()).toBe('/case/counter-offer');
  });
  it('switching persona mid-wizard restarts the wizard', async () => {
    const { user } = renderApp('/apply/wf-123');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Persona' }), 'blurry-docs');
    expect(path()).toBe('/apply/new');
    expect(localStorage.getItem('demoPersona')).toBe('blurry-docs');
  });
});
