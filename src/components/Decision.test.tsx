import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DemoProvider } from '../lib/DemoContext';
import Decision from './Decision';

function renderDecision() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DemoProvider>
          <Decision workflowId="wf-decision" onStateChange={() => {}} />
        </DemoProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Decision step', () => {
  it('shows the computed counter-offer and links to the case file', async () => {
    localStorage.setItem('demoPersona', 'counter-offer');
    renderDecision();
    expect(await screen.findByText('€8,000', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('€365.11')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /See how the bank decided/ })).toHaveAttribute('href', '/case/counter-offer');
  }, 10000);
});
