import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';
import { NumberField } from './NumberField';
import { EmptyState, InsightRow, KpiTile, Section, StatusBadge } from './primitives';
import { SegmentedControl } from './SegmentedControl';

describe('primitives', () => {
  it('KpiTile shows label, value and sub', () => {
    render(<KpiTile kpi={{ label: 'Monthly payment', value: '€462.47', sub: '6.9% APR' }} />);
    expect(screen.getByText('Monthly payment')).toBeInTheDocument();
    expect(screen.getByText('€462.47')).toHaveClass('num');
  });
  it('StatusBadge renders text with tone class', () => {
    render(<StatusBadge tone="bad">Declined</StatusBadge>);
    expect(screen.getByText('Declined')).toHaveClass('text-bad');
  });
  it('InsightRow shows tag, headline and detail', () => {
    render(<InsightRow insight={{ tag: 'AML', tone: 'bad', headline: 'PEP match needs a human.', detail: 'Similarity 0.87.' }} />);
    expect(screen.getByText('AML')).toBeInTheDocument();
    expect(screen.getByText('PEP match needs a human.')).toBeInTheDocument();
  });
  it('Section renders eyebrow and heading', () => {
    render(<Section eyebrow="Section 1" title="Verification evidence"><p>x</p></Section>);
    expect(screen.getByRole('heading', { name: 'Verification evidence' })).toBeInTheDocument();
  });
  it('EmptyState links back', () => {
    render(<MemoryRouter><EmptyState title="Not found" body="No such case." actionHref="/" actionLabel="Back" /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/');
  });
  it('DataTable wraps tables in a horizontal scroller', () => {
    render(<DataTable caption="t"><tbody><tr><td>1</td></tr></tbody></DataTable>);
    expect(screen.getByRole('table').parentElement).toHaveClass('overflow-x-auto');
  });
});

describe('SegmentedControl', () => {
  it('marks the active option and reports clicks', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="Preset" options={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]} value="a" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

describe('NumberField', () => {
  it('shows an inline error linked to the input', () => {
    render(<NumberField id="amt" label="Amount" value="" onChange={() => {}} error="Enter a number" />);
    const input = screen.getByLabelText('Amount');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter a number')).toHaveAttribute('id', 'amt-error');
  });
});
